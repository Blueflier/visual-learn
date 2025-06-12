// Main exports for the LLM provider system

// Core interfaces and types
export type {
  LLMProvider,
  LLMProviderType,
  LLMProviderConfig,
  LLMOptions,
  LLMResponse,
  ProviderError,
  LLMErrorType,
  RequestConfig,
} from './types';

// Base provider class for extending
export { BaseLLMProvider } from './base-provider';

// Concrete provider implementations
export {
  OpenAIProvider,
  AnthropicProvider,
  OpenRouterProvider,
} from './providers';

// Provider-specific types
export type {
  OpenAIMessage,
  OpenAIRequestBody,
  OpenAIResponse,
  AnthropicMessage,
  AnthropicRequestBody,
  AnthropicResponse,
  OpenRouterMessage,
  OpenRouterRequestBody,
  OpenRouterResponse,
  OpenRouterModel,
} from './providers';

// Main LLM manager and factory functions
export {
  LLMManager,
  defaultLLMManager,
  createProvider,
  createOpenAIProvider,
  createAnthropicProvider,
  createOpenRouterProvider,
  registerProvider,
  getRegisteredProviders,
  isProviderSupported,
  getProviderDisplayName,
  getProviderDefaultModels,
} from './llm';

// Error handling
export {
  LLMProviderError,
  classifyError,
  getUserFriendlyErrorMessage,
  withRetry,
  delay,
  calculateBackoffDelay,
} from './errors';

// HTTP utilities
export {
  HttpClient,
  defaultHttpClient,
  createAuthHeaders,
  validateApiKeyFormat,
} from './http'; 