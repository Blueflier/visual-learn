// Anthropic Provider Implementation

import { BaseLLMProvider } from '../base-provider';
import type { 
  LLMProviderConfig, 
  LLMOptions, 
  LLMResponse, 
  LLMProviderType 
} from '../types';
import { LLMProviderError } from '../errors';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  [key: string]: unknown;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  [key: string]: unknown;
}

export class AnthropicProvider extends BaseLLMProvider {
  private static readonly DEFAULT_MODEL = 'claude-3-haiku-20240307';
  private static readonly BASE_URL = '/api/anthropic';
  private static readonly API_VERSION = '2023-06-01';

  constructor(config: LLMProviderConfig) {
    super('anthropic' as LLMProviderType, config);
  }

  public updateConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl || AnthropicProvider.BASE_URL;
  }

  protected getDefaultModel(): string {
    return this.config.defaultModel || AnthropicProvider.DEFAULT_MODEL;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': AnthropicProvider.API_VERSION,
      'content-type': 'application/json',
    };
  }

  async generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    this.validatePrompt(prompt);
    
    if (!this.isConfigured()) {
      throw new LLMProviderError({
        type: 'authentication',
        message: 'Anthropic API key is not configured or invalid',
        retryable: false,
      });
    }

    const mergedOptions = this.mergeOptions(options);
    const requestBody = this.prepareRequestBody(prompt, mergedOptions);

    try {
      const response = await this.makeApiRequest<AnthropicResponse>(
        '/v1/messages',
        requestBody,
        {
          timeout: mergedOptions.timeoutMs,
          retryAttempts: mergedOptions.retryAttempts,
        }
      );

      return this.parseResponse(response);
    } catch (error) {
      throw this.handleProviderError(error);
    }
  }

  async validateApiKey(key: string): Promise<boolean> {
    if (!key || !key.startsWith('sk-ant-')) {
      return false;
    }

    try {
      // Test the API key by making a minimal request
      const testConfig = { ...this.config, apiKey: key };
      const testProvider = new AnthropicProvider(testConfig);
      
      // Make a simple request to validate
      await testProvider.makeApiRequest<AnthropicResponse>(
        '/v1/messages',
        {
          model: this.getDefaultModel(),
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }
      );

      return true;
    } catch (error: unknown) {
      console.error('Error validating Anthropic API key:', error);
      // Any error during validation means the key is invalid
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't provide a models endpoint like OpenAI
    // Return the known Claude models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022', 
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
    ];
  }

  protected prepareRequestBody(prompt: string, options: LLMOptions): AnthropicRequestBody {
    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: prompt,
      }
    ];

    const requestBody: AnthropicRequestBody = {
      model: this.getDefaultModel(),
      max_tokens: options.maxTokens || 1000,
      messages,
      stream: false, // We don't support streaming yet
    };

    // Add system prompt if provided
    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    // Add optional parameters
    if (options.temperature !== undefined) {
      requestBody.temperature = Math.max(0, Math.min(1, options.temperature));
    }
    if (options.topP !== undefined) {
      requestBody.top_p = Math.max(0, Math.min(1, options.topP));
    }

    return requestBody;
  }

  protected parseResponse(response: AnthropicResponse): LLMResponse {
    if (!response.content || response.content.length === 0) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'No content returned from Anthropic API',
        retryable: false,
      });
    }

    // Extract text content from the response
    const content = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');
    
    // Map Anthropic finish reason to our standard format
    let finishReason: LLMResponse['finishReason'] = 'stop';
    switch (response.stop_reason) {
      case 'max_tokens':
        finishReason = 'length';
        break;
      case 'end_turn':
      case 'stop_sequence':
      case null:
        finishReason = 'stop';
        break;
      default:
        finishReason = 'stop';
    }

    return {
      content,
      finishReason,
      model: response.model,
      provider: this.providerType,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      metadata: {
        id: response.id,
        type: response.type,
        stopReason: response.stop_reason,
        stopSequence: response.stop_sequence,
      },
    };
  }

  private handleProviderError(error: unknown): LLMProviderError {
    // Handle specific Anthropic error responses
    if (error && typeof error === 'object' && 'status' in error) {
      switch (error.status) {
        case 401:
          return new LLMProviderError({
            type: 'authentication',
            message: 'Invalid Anthropic API key',
            statusCode: 401,
            retryable: false,
            originalError: error,
          });
        case 429:
          return new LLMProviderError({
            type: 'rate_limit',
            message: 'Anthropic rate limit exceeded',
            statusCode: 429,
            retryable: true,
            originalError: error,
          });
        case 402:
          return new LLMProviderError({
            type: 'quota_exceeded',
            message: 'Anthropic quota exceeded',
            statusCode: 402,
            retryable: false,
            originalError: error,
          });
        case 400: {
          const errorData = 'data' in error && error.data && typeof error.data === 'object' && 'error' in error.data ? error.data.error : undefined;
          
          // Check for content policy violations
          if (errorData && typeof errorData === 'object' && 'type' in errorData && errorData.type === 'invalid_request_error' && 
              'message' in errorData && typeof errorData.message === 'string' && errorData.message.toLowerCase().includes('content')) {
            return new LLMProviderError({
              type: 'content_filter',
              message: 'Content filtered by Anthropic safety systems',
              statusCode: 400,
              retryable: false,
              originalError: error,
            });
          }
          
          return new LLMProviderError({
            type: 'invalid_request',
            message: (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string' ? errorData.message : 'Invalid request to Anthropic API'),
            statusCode: 400,
            retryable: false,
            originalError: error,
          });
        }
        case 422:
          return new LLMProviderError({
            type: 'invalid_request',
            message: 'Request validation failed',
            statusCode: 422,
            retryable: false,
            originalError: error,
          });
        case 500:
        case 502:
        case 503:
        case 504:
          return new LLMProviderError({
            type: 'server_error',
            message: 'Anthropic server error',
            statusCode: error.status,
            retryable: true,
            originalError: error,
          });
      }
    }

    // If it's already an LLMProviderError, just return it
    if (error instanceof LLMProviderError) {
      return error;
    }

    // Handle timeout and network errors
    if (error instanceof Error && error.name === 'AbortError') {
      return new LLMProviderError({
        type: 'timeout',
        message: 'Request to Anthropic API timed out',
        retryable: true,
        originalError: error,
      });
    }

    // Generic error
    return new LLMProviderError({
      type: 'unknown',
      message: error instanceof Error ? error.message || 'Unknown error occurred with Anthropic API' : 'Unknown error occurred with Anthropic API',
      retryable: true,
      originalError: error,
    });
  }

  protected validatePrompt(prompt: string): void {
    super.validatePrompt(prompt);
    
    // Anthropic has specific token limits
    const estimatedTokens = this.estimateTokens(prompt);
    if (estimatedTokens > 200000) { // Claude has ~200k context window
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'Prompt exceeds Anthropic context window limit',
        retryable: false,
      });
    }
  }
} 