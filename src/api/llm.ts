// Main LLM provider interface and factory

import type {
  LLMProvider,
  LLMProviderType,
  LLMProviderConfig,
  LLMOptions,
  LLMResponse,
} from './types';
import { LLMProviderError } from './errors';
import { 
  OpenAIProvider, 
  AnthropicProvider, 
  OpenRouterProvider 
} from './providers';

// Provider registry - populated with concrete implementations
const providerRegistry: Map<LLMProviderType, new (config: LLMProviderConfig) => LLMProvider> = new Map();

// Register all available providers
function initializeProviders() {
  providerRegistry.set('openai', OpenAIProvider);
  providerRegistry.set('anthropic', AnthropicProvider);
  providerRegistry.set('openrouter', OpenRouterProvider);
}

// Initialize providers on module load
initializeProviders();

export function registerProvider(
  type: LLMProviderType,
  providerClass: new (config: LLMProviderConfig) => LLMProvider
): void {
  providerRegistry.set(type, providerClass);
}

export function createProvider(type: LLMProviderType, config: LLMProviderConfig): LLMProvider {
  const ProviderClass = providerRegistry.get(type);
  
  if (!ProviderClass) {
    throw new LLMProviderError({
      type: 'invalid_request',
      message: `Provider type '${type}' is not registered`,
      retryable: false,
    });
  }

  return new ProviderClass(config);
}

// Convenience factory functions for each provider
export function createOpenAIProvider(config: LLMProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}

export function createAnthropicProvider(config: LLMProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}

export function createOpenRouterProvider(config: LLMProviderConfig): OpenRouterProvider {
  return new OpenRouterProvider(config);
}

export function getRegisteredProviders(): LLMProviderType[] {
  return Array.from(providerRegistry.keys());
}

export class LLMManager {
  private providers: Map<LLMProviderType, LLMProvider> = new Map();
  private activeProvider: LLMProviderType | null = null;

  constructor() {
    this.initializeAllProviders();
  }

  private initializeAllProviders(): void {
    providerRegistry.forEach((ProviderClass, type) => {
      // Initialize with a default/empty config.
      // The API key will be set later during validation or from the store.
      const defaultConfig: LLMProviderConfig = {
        apiKey: '',
        // Add other default config properties if needed
      };
      const providerInstance = new ProviderClass(defaultConfig);
      this.providers.set(type, providerInstance);
    });

    // Set a default active provider
    if (this.providers.size > 0) {
      this.activeProvider = this.providers.keys().next().value ?? null;
    }
  }

  public addProvider(type: LLMProviderType, config: LLMProviderConfig): void {
    const provider = createProvider(type, config);
    this.providers.set(type, provider);
    
    // Set as active if it's the first provider or no active provider is set
    if (this.activeProvider === null) {
      this.activeProvider = type;
    }
  }

  public removeProvider(type: LLMProviderType): void {
    this.providers.delete(type);
    
    // If we removed the active provider, switch to another one or null
    if (this.activeProvider === type) {
      const remainingProviders = Array.from(this.providers.keys());
      this.activeProvider = remainingProviders.length > 0 ? remainingProviders[0] : null;
    }
  }

  public setActiveProvider(type: LLMProviderType): void {
    if (!this.providers.has(type)) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: `Provider '${type}' is not configured`,
        retryable: false,
      });
    }
    this.activeProvider = type;
  }

  public getActiveProvider(): LLMProvider | null {
    if (!this.activeProvider) return null;
    return this.providers.get(this.activeProvider) || null;
  }

  public getProvider(type: LLMProviderType): LLMProvider | null {
    return this.providers.get(type) || null;
  }

  public getConfiguredProviders(): LLMProviderType[] {
    return Array.from(this.providers.entries())
      .filter(([, provider]) => provider.isConfigured())
      .map(([type]) => type);
  }

  public getAllProviders(): { type: LLMProviderType; provider: LLMProvider }[] {
    return Array.from(this.providers.entries()).map(([type, provider]) => ({
      type,
      provider,
    }));
  }

  public async generateContent(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const provider = this.getActiveProvider();
    
    if (!provider) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: 'No active provider configured',
        retryable: false,
      });
    }

    if (!provider.isConfigured()) {
      throw new LLMProviderError({
        type: 'authentication',
        message: `Provider '${provider.providerType}' is not properly configured`,
        retryable: false,
      });
    }

    return provider.generateContent(prompt, options);
  }

  public async validateApiKey(type: LLMProviderType, apiKey: string): Promise<boolean> {
    const provider = this.providers.get(type);
    
    if (!provider) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: `Provider '${type}' is not configured`,
        retryable: false,
      });
    }

    // Temporarily update the config for validation
    provider.updateConfig({ apiKey });

    return provider.validateApiKey(apiKey);
  }

  public updateProviderConfig(type: LLMProviderType, config: Partial<LLMProviderConfig>): void {
    const provider = this.providers.get(type);
    
    if (!provider) {
      throw new LLMProviderError({
        type: 'invalid_request',
        message: `Provider '${type}' is not configured`,
        retryable: false,
      });
    }

    // Update the provider's configuration
    provider.updateConfig(config);
  }
}

// Default instance for convenience
export const defaultLLMManager = new LLMManager();

// Utility functions
export function isProviderSupported(type: string): type is LLMProviderType {
  return ['openai', 'anthropic', 'openrouter'].includes(type);
}

export function getProviderDisplayName(type: LLMProviderType): string {
  const displayNames: Record<LLMProviderType, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    openrouter: 'OpenRouter',
  };
  
  return displayNames[type] || type;
}

export function getProviderDefaultModels(): Record<LLMProviderType, string> {
  return {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307',
    openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
  };
}

// Re-export types and utilities
export type { LLMProvider, LLMProviderType, LLMProviderConfig, LLMOptions, LLMResponse };
export { LLMProviderError } from './errors'; 