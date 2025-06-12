import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMProviderType } from '../api/types';

interface ValidationState {
  isValid: boolean | undefined;
  error?: string;
}

interface SettingsState {
  apiKeys: Record<LLMProviderType, string>;
  selectedProvider: LLMProviderType;
  validationStates: Record<LLMProviderType, ValidationState>;
  setApiKey: (provider: LLMProviderType, key: string) => void;
  setSelectedProvider: (provider: LLMProviderType) => void;
  setValidationState: (provider: LLMProviderType, validation: ValidationState) => void;
  clearApiKey: (provider: LLMProviderType) => void;
  clearAllApiKeys: () => void;
}

// Create the settings store with persistence
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      apiKeys: {
        openai: '',
        anthropic: '',
        openrouter: ''
      },
      selectedProvider: 'openai' as LLMProviderType,
      validationStates: {
        openai: { isValid: undefined },
        anthropic: { isValid: undefined },
        openrouter: { isValid: undefined }
      },

      // Actions
      setApiKey: (provider, key) => 
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key
          }
        })),

      setSelectedProvider: (provider) =>
        set({ selectedProvider: provider }),

      setValidationState: (provider, validation) =>
        set((state) => ({
          validationStates: {
            ...state.validationStates,
            [provider]: validation
          }
        })),

      clearApiKey: (provider) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: ''
          },
          validationStates: {
            ...state.validationStates,
            [provider]: { isValid: undefined, error: '' }
          }
        })),

      clearAllApiKeys: () =>
        set((state) => ({
          apiKeys: Object.keys(state.apiKeys).reduce((acc, key) => ({
            ...acc,
            [key]: ''
          }), {} as Record<LLMProviderType, string>),
          validationStates: Object.keys(state.validationStates).reduce((acc, key) => ({
            ...acc,
            [key]: { isValid: undefined, error: '' }
          }), {} as Record<LLMProviderType, ValidationState>)
        }))
    }),
    {
      name: 'visual-learn-settings',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        selectedProvider: state.selectedProvider,
        validationStates: state.validationStates
      })
    }
  )
); 