// HTTP utilities for LLM API requests

import type { RequestConfig } from './types';
import { CircuitBreaker } from '../utils/circuitBreaker';
import logger from '../utils/logger';

export class HttpClient {
  private defaultTimeout: number;
  private circuitBreaker: CircuitBreaker;

  constructor(defaultTimeout = 30000) {
    this.defaultTimeout = defaultTimeout;
    this.circuitBreaker = new CircuitBreaker();
  }

  async makeRequest<T = unknown>(config: RequestConfig): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        logger.warn(`Request to ${config.url} timed out after ${config.timeout || this.defaultTimeout}ms`);
        controller.abort();
      }, config.timeout || this.defaultTimeout);

      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorBody);
          } catch {
            errorData = { message: errorBody };
          }

          const error = new Error(errorData.message || `HTTP ${response.status}`);
          (error as Error & { status: number, data: unknown }).status = response.status;
          (error as Error & { status: number, data: unknown }).data = errorData;
          throw error;
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  async get<T = unknown>(url: string, headers: Record<string, string> = {}, timeout?: number): Promise<T> {
    return this.makeRequest<T>({
      url,
      method: 'GET',
      headers,
      timeout: timeout || this.defaultTimeout,
    });
  }

  async post<T = unknown>(
    url: string, 
    body: unknown, 
    headers: Record<string, string> = {}, 
    timeout?: number
  ): Promise<T> {
    return this.makeRequest<T>({
      url,
      method: 'POST',
      headers,
      body,
      timeout: timeout || this.defaultTimeout,
    });
  }
}

export const defaultHttpClient = new HttpClient();

export function createAuthHeaders(apiKey: string, authType: 'bearer' | 'api-key' = 'bearer'): Record<string, string> {
  switch (authType) {
    case 'bearer':
      return { Authorization: `Bearer ${apiKey}` };
    case 'api-key':
      return { 'x-api-key': apiKey };
    default:
      return { Authorization: `Bearer ${apiKey}` };
  }
}

export function validateApiKeyFormat(apiKey: string, provider: string): boolean {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return false;
  }

  // Basic format validation based on provider
  switch (provider.toLowerCase()) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    case 'openrouter':
      return apiKey.startsWith('sk-or-') && apiKey.length > 20;
    default:
      return apiKey.length > 10; // Generic minimum length check
  }
} 