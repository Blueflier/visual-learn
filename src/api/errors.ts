// Error handling utilities for LLM providers

import type { LLMErrorType, ProviderError } from './types';
import logger from '../utils/logger';

export class LLMProviderError extends Error {
  public readonly type: LLMErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(error: ProviderError) {
    super(error.message);
    this.name = 'LLMProviderError';
    this.type = error.type;
    this.statusCode = error.statusCode;
    this.retryable = error.retryable;
    this.originalError = error.originalError;
  }
}

export function classifyError(error: unknown): ProviderError {
  // Network errors
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        retryable: true,
        originalError: error,
      };
    }

    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your internet connection.',
        retryable: true,
        originalError: error,
      };
    }
  }

  // HTTP errors
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const statusCode = (err.status ?? err.statusCode) as number | undefined;

    if (typeof statusCode === 'number') {
      switch (statusCode) {
        case 401:
          return {
            type: 'authentication',
            message: 'Invalid API key. Please check your credentials.',
            statusCode,
            retryable: false,
            originalError: error,
          };

        case 403:
          return {
            type: 'authentication',
            message:
              'Access forbidden. Your API key may not have the required permissions.',
            statusCode,
            retryable: false,
            originalError: error,
          };

        case 429:
          return {
            type: 'rate_limit',
            message:
              'Rate limit exceeded. Please wait before making more requests.',
            statusCode,
            retryable: true,
            originalError: error,
          };

        case 400:
          return {
            type: 'invalid_request',
            message: 'Invalid request. Please check your input parameters.',
            statusCode,
            retryable: false,
            originalError: error,
          };

        case 402:
          return {
            type: 'quota_exceeded',
            message: 'API quota exceeded. Please check your billing.',
            statusCode,
            retryable: false,
            originalError: error,
          };

        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'server_error',
            message: 'Server error. Please try again later.',
            statusCode,
            retryable: true,
            originalError: error,
          };

        default:
          return {
            type: 'unknown',
            message: `Request failed with status ${statusCode}`,
            statusCode,
            retryable: statusCode >= 500,
            originalError: error,
          };
      }
    }
  }

  // Content filter errors
  if (
    error instanceof Error &&
    error.message?.toLowerCase().includes('content') &&
    error.message?.toLowerCase().includes('filter')
  ) {
    return {
      type: 'content_filter',
      message: 'Content was filtered due to policy violations.',
      retryable: false,
      originalError: error,
    };
  }

  // Default unknown error
  const message = error instanceof Error ? error.message : String(error);
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred.',
    retryable: false,
    originalError: error,
  };
}

export function getUserFriendlyErrorMessage(error: ProviderError): string {
  const baseMessages: Record<LLMErrorType, string> = {
    network: 'Connection failed. Please check your internet connection and try again.',
    authentication: 'Authentication failed. Please verify your API key is correct.',
    quota_exceeded: 'You have exceeded your API quota. Please check your billing or upgrade your plan.',
    content_filter: 'Your request was blocked by content filtering policies. Please modify your input.',
    invalid_request: 'Invalid request. Please check your input and try again.',
    timeout: 'Request timed out. The service may be busy, please try again.',
    rate_limit: 'Too many requests. Please wait a moment before trying again.',
    server_error: 'Service temporarily unavailable. Please try again in a few moments.',
    unknown: 'An unexpected error occurred. Please try again.'
  };

  return baseMessages[error.type] || error.message;
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateBackoffDelay(attempt: number, baseDelay = 1000): number {
  // Exponential backoff with jitter: baseDelay * 2^attempt + random(0-1000)ms
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  shouldRetry: (error: ProviderError) => boolean = (error) => error.retryable
): Promise<T> {
  let lastError: ProviderError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const classifiedError = classifyError(error);
      lastError = classifiedError;

      // Log the error
      logger.warn(
        `Attempt ${attempt + 1} failed for operation. Error: ${classifiedError.message}`,
        {
          type: classifiedError.type,
          retryable: classifiedError.retryable,
          statusCode: classifiedError.statusCode,
        }
      );

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxAttempts - 1 || !shouldRetry(classifiedError)) {
        logger.error(
          `Operation failed after ${attempt + 1} attempts.`,
          classifiedError
        );
        throw new LLMProviderError(classifiedError);
      }

      // Wait before retrying
      const delayMs = calculateBackoffDelay(attempt);
      logger.info(`Retrying in ${delayMs.toFixed(0)}ms...`);
      await delay(delayMs);
    }
  }

  logger.error('Operation failed unexpectedly after all retries.', lastError!);
  throw new LLMProviderError(lastError!);
} 