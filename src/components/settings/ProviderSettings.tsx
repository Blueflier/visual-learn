import { useState } from 'react';
import { useSettingsStore } from '../../store/settings';
import type { LLMProviderType } from '../../api/types';
import { ApiKeyManager } from '../../utils/apiKeyManager';
import { defaultLLMManager } from '../../api/llm';

const ProviderSettings = () => {
  const { apiKeys, selectedProvider, setApiKey, setSelectedProvider, validationStates, setValidationState } = useSettingsStore();
  const [isValidating, setIsValidating] = useState<Partial<Record<LLMProviderType, boolean>>>({});

  const handleProviderChange = (provider: LLMProviderType) => {
    setSelectedProvider(provider);
  };

  const handleApiKeyChange = (provider: LLMProviderType, key: string) => {
    setApiKey(provider, key);
    ApiKeyManager.storeKey(provider, key);
    // Reset validation state on key change
    setValidationState(provider, { isValid: undefined, error: '' });
  };

  const validateApiKey = async (provider: LLMProviderType) => {
    setIsValidating(prev => ({ ...prev, [provider]: true }));
    
    try {
      const key = apiKeys[provider];
      if (!key) {
        setValidationState(provider, { isValid: false, error: 'Please enter an API key' });
        return;
      }
      
      const isValid = await defaultLLMManager.validateApiKey(provider, key);
      
      if (isValid) {
        setValidationState(provider, { isValid: true, error: '' });
      } else {
        setValidationState(provider, { isValid: false, error: 'Invalid API key' });
      }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        setValidationState(provider, { isValid: false, error: message });
        console.error(`API key validation error for ${provider}:`, error);
    } finally {
        setIsValidating(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <>
      <div className="setting-group">
        <h4>LLM Provider</h4>
        <div className="provider-selection">
          {(['openai', 'anthropic', 'openrouter'] as LLMProviderType[]).map((provider) => (
            <label key={provider} className={`provider-option ${selectedProvider === provider ? 'selected' : ''}`}>
              <input
                type="radio"
                name="provider"
                value={provider}
                checked={selectedProvider === provider}
                onChange={() => handleProviderChange(provider)}
              />
              <span>{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h4>API Key Management</h4>
        <div className="api-key-section">
          {(['openai', 'anthropic', 'openrouter'] as LLMProviderType[]).map((provider) => (
            <div key={provider} className="api-key-input-group">
              <label>
                {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key:
              </label>
              <div className="api-key-input-wrapper">
                <input
                  type="password"
                  value={apiKeys[provider] || ''}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={`Enter ${provider} API key`}
                  className={validationStates[provider]?.isValid === false ? 'invalid' : ''}
                />
                <button
                  onClick={() => validateApiKey(provider)}
                  disabled={isValidating[provider] || !apiKeys[provider]}
                  className="validate-button"
                >
                  {isValidating[provider] ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <div className="validation-status">
                {validationStates[provider]?.isValid === true && <span className="valid-indicator">✓ Valid</span>}
                {validationStates[provider]?.isValid === false && <span className="error-message">{validationStates[provider]?.error}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProviderSettings; 