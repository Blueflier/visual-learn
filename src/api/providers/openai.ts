// OpenAI Provider Implementation

import { BaseLLMProvider } from '../base-provider';
import type { 
  LLMProviderConfig, 
  LLMOptions, 
  LLMResponse, 
  LLMProviderType 
} from '../types';
import { LLMProviderError } from '../errors';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequestBody {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  [key: string]: unknown;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  [key: string]: unknown;
}

export class OpenAIProvider extends BaseLLMProvider {
  private static readonly DEFAULT_MODEL = 'gpt-3.5-turbo';
  private static readonly BASE_URL = '/api/openai/v1';

  constructor(config: LLMProviderConfig) {
    super('openai' as LLMProviderType, config);
  }

  public updateConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl || OpenAIProvider.BASE_URL;
  }

  protected getDefaultModel(): string {
    return this.config.defaultModel || OpenAIProvider.DEFAULT_MODEL;
  }

  async generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    this.validatePrompt(prompt);
    
    if (!this.isConfigured()) {
      throw new LLMProviderError({
        type: 'authentication',
        message: 'OpenAI API key is not configured or invalid',
        retryable: false,
      });
    }

    const mergedOptions = this.mergeOptions(options);
    const requestBody = this.prepareRequestBody(prompt, mergedOptions);

    try {
      const response = await this.makeApiRequest<OpenAIResponse>(
        '/chat/completions',
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
    if (!key || !key.startsWith('sk-')) {
      return false;
    }

    try {
      // Test the API key by making a minimal request
      const testConfig = { ...this.config, apiKey: key };
      const testProvider = new OpenAIProvider(testConfig);
      
      const response = await testProvider.makeApiRequest<{ data: unknown[], model: string }>(
        '/models',
        null
      );

      return Array.isArray(response.data) && response.data.length > 0;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      return [this.getDefaultModel()];
    }

    try {
      const response = await this.makeApiRequest<{ data: Array<{ id: string }>, model: string }>(
        '/models',
        null
      );

      return response.data
        .map(model => model.id)
        .filter(id => id.includes('gpt'))
        .sort();
    } catch {
      // Return default models if API call fails
      return [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4o-mini'
      ];
    }
  }

  protected prepareRequestBody(prompt: string, options: LLMOptions): OpenAIRequestBody {
    const messages: OpenAIMessage[] = [];
    
    // Add system message if provided
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: prompt,
    });

    const requestBody: OpenAIRequestBody = {
      model: this.getDefaultModel(),
      messages,
      stream: false, // We don't support streaming yet
    };

    // Add optional parameters
    if (options.maxTokens && options.maxTokens > 0) {
      requestBody.max_tokens = options.maxTokens;
    }
    if (options.temperature !== undefined) {
      requestBody.temperature = Math.max(0, Math.min(2, options.temperature));
    }
    if (options.topP !== undefined) {
      requestBody.top_p = Math.max(0, Math.min(1, options.topP));
    }
    if (options.frequencyPenalty !== undefined) {
      requestBody.frequency_penalty = Math.max(-2, Math.min(2, options.frequencyPenalty));
    }
    if (options.presencePenalty !== undefined) {
      requestBody.presence_penalty = Math.max(-2, Math.min(2, options.presencePenalty));
    }

    return requestBody;
  }

  protected parseResponse(response: OpenAIResponse): LLMResponse {
    if (!response.choices || response.choices.length === 0) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'No choices returned from OpenAI API',
        retryable: false,
      });
    }

    const choice = response.choices[0];
    const content = choice.message?.content || '';
    
    // Map OpenAI finish reason to our standard format
    let finishReason: LLMResponse['finishReason'] = 'stop';
    switch (choice.finish_reason) {
      case 'length':
        finishReason = 'length';
        break;
      case 'content_filter':
        finishReason = 'content_filter';
        break;
      case 'stop':
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
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      metadata: {
        id: response.id,
        created: response.created,
        object: response.object,
      },
    };
  }

  private handleProviderError(error: unknown): LLMProviderError {
    // Handle specific OpenAI error responses
    if (error && typeof error === 'object' && 'status' in error) {
      switch (error.status) {
        case 401:
          return new LLMProviderError({
            type: 'authentication',
            message: 'Invalid OpenAI API key',
            statusCode: 401,
            retryable: false,
            originalError: error,
          });
        case 429:
          return new LLMProviderError({
            type: 'rate_limit',
            message: 'OpenAI rate limit exceeded',
            statusCode: 429,
            retryable: true,
            originalError: error,
          });
        case 402:
          return new LLMProviderError({
            type: 'quota_exceeded',
            message: 'OpenAI quota exceeded',
            statusCode: 402,
            retryable: false,
            originalError: error,
          });
        case 400: {
          const errorData = 'data' in error && error.data && typeof error.data === 'object' && 'error' in error.data ? error.data.error : undefined;
          if (errorData && typeof errorData === 'object' && 'type' in errorData && errorData.type === 'content_filter') {
            return new LLMProviderError({
              type: 'content_filter',
              message: 'Content filtered by OpenAI safety systems',
              statusCode: 400,
              retryable: false,
              originalError: error,
            });
          }
          return new LLMProviderError({
            type: 'invalid_request',
            message: (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string' ? errorData.message : 'Invalid request to OpenAI API'),
            statusCode: 400,
            retryable: false,
            originalError: error,
          });
        }
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
        message: 'Request to OpenAI API timed out',
        retryable: true,
        originalError: error,
      });
    }
    
    // Fallback for other errors
    return new LLMProviderError({
      type: 'unknown',
      message: error instanceof Error ? error.message || 'Unknown error occurred with OpenAI API' : 'Unknown error occurred with OpenAI API',
      retryable: true,
      originalError: error,
    });
  }
} 