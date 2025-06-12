// LLM Provider Types and Interfaces

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProviderType;
  metadata?: Record<string, unknown>;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  systemPrompt?: string;
  timeoutMs?: number;
  retryAttempts?: number;
}

export type LLMProviderType = 'openai' | 'anthropic' | 'openrouter';

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface LLMProvider {
  readonly providerType: LLMProviderType;
  generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  validateApiKey(key: string): Promise<boolean>;
  getAvailableModels?(): Promise<string[]>;
  isConfigured(): boolean;
  updateConfig(config: Partial<LLMProviderConfig>): void;
}

export interface ProviderError {
  type: LLMErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: unknown;
}

export type LLMErrorType = 
  | 'network'
  | 'authentication'
  | 'quota_exceeded'
  | 'content_filter'
  | 'invalid_request'
  | 'timeout'
  | 'rate_limit'
  | 'server_error'
  | 'unknown';

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: unknown;
  timeout: number;
} 