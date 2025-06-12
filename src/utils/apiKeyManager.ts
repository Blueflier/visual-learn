import type { LLMProviderType } from '../api/types';
import { validateApiKeyFormat } from '../api/http';

// Simple encryption/decryption using a session-based key
class CryptoManager {
  private static instance: CryptoManager;
  private encryptionKey: string;

  private constructor() {
    // Generate a random key for the session
    this.encryptionKey = window.crypto.getRandomValues(new Uint8Array(32))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  }

  public static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  // Simple XOR encryption/decryption
  private xorCipher(text: string, key: string): string {
    return text.split('').map((char, i) => {
      const keyChar = key[i % key.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
  }

  public encrypt(text: string): string {
    if (!text) return '';
    const encrypted = this.xorCipher(text, this.encryptionKey);
    return btoa(encrypted);
  }

  public decrypt(encryptedText: string): string {
    try {
      const decrypted = atob(encryptedText);
      return this.xorCipher(decrypted, this.encryptionKey);
    } catch {
      return '';
    }
  }
}

export class ApiKeyManager {
  private static crypto = CryptoManager.getInstance();

  /**
   * Validates an API key format for a specific provider
   */
  public static validateKeyFormat(provider: LLMProviderType, key: string): boolean {
    return validateApiKeyFormat(key, provider);
  }

  /**
   * Encrypts an API key for storage
   */
  public static encryptKey(key: string): string {
    return this.crypto.encrypt(key);
  }

  /**
   * Decrypts a stored API key
   */
  public static decryptKey(encryptedKey: string): string {
    return this.crypto.decrypt(encryptedKey);
  }

  /**
   * Safely stores an API key in localStorage with encryption
   */
  public static storeKey(provider: LLMProviderType, key: string): void {
    if (!key) {
      localStorage.removeItem(`api-key-${provider}`);
      return;
    }

    const encryptedKey = this.encryptKey(key);
    localStorage.setItem(`api-key-${provider}`, encryptedKey);
  }

  /**
   * Retrieves and decrypts an API key from localStorage
   */
  public static retrieveKey(provider: LLMProviderType): string {
    const encryptedKey = localStorage.getItem(`api-key-${provider}`);
    if (!encryptedKey) return '';
    
    return this.decryptKey(encryptedKey);
  }

  /**
   * Removes an API key from localStorage
   */
  public static removeKey(provider: LLMProviderType): void {
    localStorage.removeItem(`api-key-${provider}`);
  }

  /**
   * Removes all stored API keys
   */
  public static clearAllKeys(): void {
    const providers: LLMProviderType[] = ['openai', 'anthropic', 'openrouter'];
    providers.forEach(provider => this.removeKey(provider));
  }
} 