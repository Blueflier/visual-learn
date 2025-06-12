// OpenRouter Provider Implementation

import { BaseLLMProvider } from '../base-provider';
import type { 
  LLMProviderConfig, 
  LLMOptions, 
  LLMResponse, 
  LLMProviderType 
} from '../types';
import { LLMProviderError } from '../errors';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequestBody {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  transforms?: string[];
  [key: string]: unknown;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  object: string;
  created: number;
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

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens?: number;
  };
}

export class OpenRouterProvider extends BaseLLMProvider {
  private static readonly DEFAULT_MODEL = 'openai/gpt-3.5-turbo';
  private static readonly BASE_URL = '/api/openrouter/v1';

  constructor(config: LLMProviderConfig) {
    super('openrouter' as LLMProviderType, config);
  }

  public updateConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl || OpenRouterProvider.BASE_URL;
  }

  protected getDefaultModel(): string {
    return this.config.defaultModel || OpenRouterProvider.DEFAULT_MODEL;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://localhost:3000', // Required by OpenRouter
      'X-Title': 'Visual Learn App', // Optional: app identifier
    };
  }

  async generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    this.validatePrompt(prompt);
    
    if (!this.isConfigured()) {
      throw new LLMProviderError({
        type: 'authentication',
        message: 'OpenRouter API key is not configured or invalid',
        retryable: false,
      });
    }

    const mergedOptions = this.mergeOptions(options);
    const requestBody = this.prepareRequestBody(prompt, mergedOptions);

    try {
      const response = await this.makeApiRequest<OpenRouterResponse>(
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
    if (!key || !key.startsWith('sk-or-')) {
      return false;
    }

    try {
      // Test the API key by making a request to get models
      const testConfig = { ...this.config, apiKey: key };
      const testProvider = new OpenRouterProvider(testConfig);
      
      const response = await testProvider.makeApiRequest<{ data: OpenRouterModel[], model: string }>(
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
      // Return some popular OpenRouter models as fallback
      return [
        'openai/gpt-4',
        'openai/gpt-4-turbo',
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-opus',
        'meta-llama/llama-2-70b-chat',
        'mistralai/mixtral-8x7b-instruct',
      ];
    }

    try {
      const response = await this.makeApiRequest<{ data: OpenRouterModel[], model: string }>(
        '/models',
        null
      );

      return response.data
        .map(model => model.id)
        .sort();
    } catch {
      // Return fallback models if API call fails
      return [
        'openai/gpt-4',
        'openai/gpt-4-turbo',
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-opus',
      ];
    }
  }

  protected prepareRequestBody(prompt: string, options: LLMOptions): OpenRouterRequestBody {
    const messages: OpenRouterMessage[] = [];
    
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

    const requestBody: OpenRouterRequestBody = {
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

    // OpenRouter specific: add transforms for better compatibility
    requestBody.transforms = ['middle-out'];

    return requestBody;
  }

  protected parseResponse(response: OpenRouterResponse): LLMResponse {
    if (!response.choices || response.choices.length === 0) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'No choices returned from OpenRouter API',
        retryable: false,
      });
    }

    const choice = response.choices[0];
    const content = choice.message?.content || '';
    
    // Map OpenRouter finish reason to our standard format
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
    // Handle specific OpenRouter error responses
    if (error && typeof error === 'object' && 'status' in error) {
      switch (error.status) {
        case 401:
          return new LLMProviderError({
            type: 'authentication',
            message: 'Invalid OpenRouter API key',
            statusCode: 401,
            retryable: false,
            originalError: error,
          });
        case 402:
          return new LLMProviderError({
            type: 'quota_exceeded',
            message: 'OpenRouter credits exhausted',
            statusCode: 402,
            retryable: false,
            originalError: error,
          });
        case 429:
          return new LLMProviderError({
            type: 'rate_limit',
            message: 'OpenRouter rate limit exceeded',
            statusCode: 429,
            retryable: true,
            originalError: error,
          });
        case 400: {
          const errorData = 'data' in error && error.data && typeof error.data === 'object' && 'error' in error.data ? error.data.error : undefined;
          
          // Check for content policy violations
          if (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string' && (errorData.message.toLowerCase().includes('content policy') ||
              errorData.message.toLowerCase().includes('safety'))) {
            return new LLMProviderError({
              type: 'content_filter',
              message: 'Content filtered by model safety systems',
              statusCode: 400,
              retryable: false,
              originalError: error,
            });
          }
          
          return new LLMProviderError({
            type: 'invalid_request',
            message: (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string' ? errorData.message : 'Invalid request to OpenRouter API'),
            statusCode: 400,
            retryable: false,
            originalError: error,
          });
        }
        case 403:
          return new LLMProviderError({
            type: 'authentication',
            message: 'OpenRouter API access forbidden',
            statusCode: 403,
            retryable: false,
            originalError: error,
          });
        case 408:
          return new LLMProviderError({
            type: 'timeout',
            message: 'OpenRouter request timeout',
            statusCode: 408,
            retryable: true,
            originalError: error,
          });
        case 502:
          return new LLMProviderError({
            type: 'server_error',
            message: 'OpenRouter upstream provider error',
            statusCode: 502,
            retryable: true,
            originalError: error,
          });
        case 503:
          return new LLMProviderError({
            type: 'server_error',
            message: 'OpenRouter service unavailable',
            statusCode: 503,
            retryable: true,
            originalError: error,
          });
        case 504:
          return new LLMProviderError({
            type: 'timeout',
            message: 'OpenRouter gateway timeout',
            statusCode: 504,
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
        message: 'Request to OpenRouter API timed out',
        retryable: true,
        originalError: error,
      });
    }
    
    // Fallback for other errors
    return new LLMProviderError({
      type: 'unknown',
      message: error instanceof Error ? error.message || 'Unknown error occurred with OpenRouter API' : 'Unknown error occurred with OpenRouter API',
      retryable: true,
      originalError: error,
    });
  }

  // OpenRouter specific: Get model information including pricing
  async getModelInfo(modelId?: string): Promise<OpenRouterModel | null> {
    const models = await this.getAvailableModels();
    const modelToFind = modelId || this.getDefaultModel();
    
    if (!models.includes(modelToFind)) {
      return null;
    }
    
    try {
      const response = await this.makeApiRequest<{ data: OpenRouterModel[], model: string }>(
        `/models`,
        null
      );
      
      const model = response.data.find(m => m.id === modelToFind);
      return model || null;
      
    } catch {
      return null;
    }
  }

  // OpenRouter specific: Get pricing estimate for a request
  async estimateCost(prompt: string, options?: LLMOptions): Promise<{ promptCost: number; estimatedCompletionCost: number }> {
    const modelInfo = await this.getModelInfo();
    if (!modelInfo) {
      return { promptCost: 0, estimatedCompletionCost: 0 };
    }

    const promptTokens = this.estimateTokens(prompt + (options?.systemPrompt || ''));
    const estimatedCompletionTokens = Math.min(options?.maxTokens || 1000, 1000);

    return {
      promptCost: (promptTokens / 1000) * modelInfo.pricing.prompt,
      estimatedCompletionCost: (estimatedCompletionTokens / 1000) * modelInfo.pricing.completion,
    };
  }
} 