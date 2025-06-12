// Test file to verify provider implementations
// This can be run manually or used as a reference for unit tests

import { 
  createOpenAIProvider, 
  createAnthropicProvider, 
  createOpenRouterProvider
} from '../llm';
import type { LLMProviderConfig } from '../llm';

// Test configuration (with dummy API keys)
const testConfigs: Record<string, LLMProviderConfig> = {
  openai: {
    apiKey: 'sk-test-key-for-openai',
    timeout: 30000,
  },
  anthropic: {
    apiKey: 'sk-ant-test-key-for-anthropic',
    timeout: 30000,
  },
  openrouter: {
    apiKey: 'sk-or-test-key-for-openrouter',
    timeout: 30000,
  },
};

export async function testProviderCreation() {
  console.log('Testing provider creation...');

  try {
    // Test OpenAI provider
    const openaiProvider = createOpenAIProvider(testConfigs.openai);
    console.log('✅ OpenAI provider created:', openaiProvider.providerType);
    console.log('   Configured:', openaiProvider.isConfigured());
    console.log('   Available models:', await openaiProvider.getAvailableModels());

    // Test Anthropic provider
    const anthropicProvider = createAnthropicProvider(testConfigs.anthropic);
    console.log('✅ Anthropic provider created:', anthropicProvider.providerType);
    console.log('   Configured:', anthropicProvider.isConfigured());
    console.log('   Available models:', await anthropicProvider.getAvailableModels());

    // Test OpenRouter provider
    const openrouterProvider = createOpenRouterProvider(testConfigs.openrouter);
    console.log('✅ OpenRouter provider created:', openrouterProvider.providerType);
    console.log('   Configured:', openrouterProvider.isConfigured());
    console.log('   Available models:', await openrouterProvider.getAvailableModels());

    console.log('\n🎉 All providers created successfully!');
    
    return {
      openaiProvider,
      anthropicProvider,
      openrouterProvider,
    };
  } catch (error) {
    console.error('❌ Error testing providers:', error);
    throw error;
  }
}

export async function testApiKeyValidation() {
  console.log('\nTesting API key validation...');

  const providers = await testProviderCreation();

  // Test valid format keys (but probably invalid actual keys)
  const validFormatKeys = {
    openai: 'sk-1234567890abcdef1234567890abcdef12345678',
    anthropic: 'sk-ant-api03-1234567890abcdef1234567890abcdef12345678',
    openrouter: 'sk-or-v1-1234567890abcdef1234567890abcdef12345678',
  };

  // Test invalid format keys
  const invalidKeys = {
    openai: 'invalid-key',
    anthropic: 'sk-wrong-prefix',
    openrouter: 'not-a-key',
  };

  for (const [providerType, provider] of Object.entries(providers)) {
    const validKey = validFormatKeys[providerType as keyof typeof validFormatKeys];
    const invalidKey = invalidKeys[providerType as keyof typeof invalidKeys];

    console.log(`\n${providerType.toUpperCase()} validation tests:`);
    
    // Note: These will likely fail with actual API calls since they're dummy keys
    // In a real implementation, you'd mock the HTTP requests for testing
    try {
      const validResult = await provider.validateApiKey(validKey);
      console.log(`   Valid format key: ${validResult ? '✅' : '❌'}`);
    } catch {
      console.log(`   Valid format key: ❌ (API call failed as expected with dummy key)`);
    }

    try {
      const invalidResult = await provider.validateApiKey(invalidKey);
      console.log(`   Invalid format key: ${invalidResult ? '❌' : '✅'}`);
    } catch {
      console.log(`   Invalid format key: ✅ (correctly rejected)`);
    }
  }
}

// Helper function to test with real API keys (if available)
export async function testWithRealApiKeys(apiKeys: Partial<Record<string, string>>) {
  console.log('\nTesting with real API keys...');

  for (const [providerType, apiKey] of Object.entries(apiKeys)) {
    if (!apiKey) continue;

    try {
      const config: LLMProviderConfig = {
        apiKey,
        timeout: 30000,
      };

      let provider;
      switch (providerType) {
        case 'openai':
          provider = createOpenAIProvider(config);
          break;
        case 'anthropic':
          provider = createAnthropicProvider(config);
          break;
        case 'openrouter':
          provider = createOpenRouterProvider(config);
          break;
        default:
          continue;
      }

      console.log(`\n${providerType.toUpperCase()} real API test:`);
      
      // Test API key validation
      const isValid = await provider.validateApiKey(apiKey);
      console.log(`   API key valid: ${isValid ? '✅' : '❌'}`);

      if (isValid) {
        // Test a simple content generation
        const response = await provider.generateContent('Say "Hello, World!"', {
          maxTokens: 10,
          temperature: 0.1,
        });
        console.log(`   Content generation: ✅`);
        console.log(`   Response: "${response.content.trim()}"`);
        console.log(`   Tokens: ${response.usage?.totalTokens || 'unknown'}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${providerType}:`, error instanceof Error ? error.message : error);
    }
  }
}

// Uncomment and run this to test manually:
// testProviderCreation().then(() => console.log('Provider creation test completed')); 