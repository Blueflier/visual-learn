// Base abstract class for LLM providers

import type {
  LLMProvider,
  LLMProviderType,
  LLMProviderConfig,
  LLMOptions,
  LLMResponse,
} from './types';
import { HttpClient, validateApiKeyFormat } from './http';
import { withRetry, LLMProviderError } from './errors';

// Type for the base request body that all providers must implement
export interface BaseRequestBody {
  model: string;
  [key: string]: unknown;
}

// Type for the base response that all providers must implement
export interface BaseProviderResponse {
  model: string;
  [key: string]: unknown;
}

export abstract class BaseLLMProvider implements LLMProvider {
  public readonly providerType: LLMProviderType;
  protected config: LLMProviderConfig;
  protected httpClient: HttpClient;

  constructor(providerType: LLMProviderType, config: LLMProviderConfig) {
    this.providerType = providerType;
    this.config = config;
    this.httpClient = new HttpClient(config.timeout || 30000);
  }

  // Abstract methods that must be implemented by concrete providers
  abstract generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  abstract validateApiKey(key: string): Promise<boolean>;
  protected abstract getBaseUrl(): string;
  protected abstract getDefaultModel(): string;
  protected abstract prepareRequestBody(prompt: string, options?: LLMOptions): BaseRequestBody;
  protected abstract parseResponse(response: BaseProviderResponse): LLMResponse;

  // Common implementation
  public isConfigured(): boolean {
    return Boolean(
      this.config.apiKey && 
      this.config.apiKey.trim().length > 0 &&
      validateApiKeyFormat(this.config.apiKey, this.providerType)
    );
  }

  // Optional method with default implementation
  public async getAvailableModels(): Promise<string[]> {
    // Base implementation returns default model
    // Providers can override this to fetch actual model list
    return [this.getDefaultModel()];
  }

  // Protected helper methods for common functionality
  protected async makeApiRequest<T extends BaseProviderResponse>(
    endpoint: string,
    body: BaseRequestBody | null,
    options?: { timeout?: number; retryAttempts?: number }
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers = this.getAuthHeaders();
    const timeout = options?.timeout || this.config.timeout || 30000;
    const retryAttempts = options?.retryAttempts || this.config.retryAttempts || 3;

    return withRetry(
      () => this.httpClient.post<T>(url, body, headers, timeout),
      retryAttempts
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  protected mergeOptions(options?: LLMOptions): Required<LLMOptions> {
    const defaults: Required<LLMOptions> = {
      maxTokens: 1000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stream: false,
      systemPrompt: '',
      timeoutMs: 30000,
      retryAttempts: 3,
    };

    return {
      ...defaults,
      ...options,
    };
  }

  protected createBaseResponse(
    content: string,
    model: string,
    finishReason: LLMResponse['finishReason'] = 'stop'
  ): LLMResponse {
    return {
      content,
      finishReason,
      model,
      provider: this.providerType,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  protected validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'Prompt cannot be empty',
        retryable: false,
      });
    }

    // Basic length check (can be overridden by providers)
    if (prompt.length > 100000) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'Prompt is too long',
        retryable: false,
      });
    }
  }

  protected estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  // Update configuration
  public updateConfig(newConfig: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update HTTP client timeout if it changed
    if (newConfig.timeout) {
      this.httpClient = new HttpClient(newConfig.timeout);
    }
  }

  // Get current configuration (without exposing API key)
  public getConfig(): Omit<LLMProviderConfig, 'apiKey'> {
    // Use object destructuring to remove apiKey from the returned config
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey, ...configWithoutKey } = this.config;
    return configWithoutKey;
  }
} 