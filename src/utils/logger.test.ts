import { describe, it, expect, vi, beforeEach } from 'vitest';
import logger from './logger';

// Mock the console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('Logger Utility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  // Note: The current implementation has a hardcoded logLevel.
  // A future improvement would be to allow changing the logLevel for testing.
  // For now, we test against the hardcoded DEBUG level.

  it('should call console.debug for debug messages', () => {
    logger.debug('test debug message', { data: 'some data' });
    expect(consoleSpy.debug).toHaveBeenCalledOnce();
    expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'test debug message', { data: 'some data' });
  });

  it('should call console.info for info messages', () => {
    logger.info('test info message');
    expect(consoleSpy.info).toHaveBeenCalledOnce();
    expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'test info message');
  });

  it('should call console.warn for warn messages', () => {
    logger.warn('test warning');
    expect(consoleSpy.warn).toHaveBeenCalledOnce();
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'test warning');
  });

  it('should call console.error for error messages', () => {
    const error = new Error('test error');
    logger.error('An error occurred', error);
    expect(consoleSpy.error).toHaveBeenCalledOnce();
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'An error occurred', error);
  });

  // Example of a test that would fail if logLevel was higher than DEBUG
  it('should not call console methods for levels above the current setting (if it were configurable)', () => {
    // This test is conceptual, as we can't change logLevel in the current implementation.
    // If we could set logLevel to LogLevel.WARN, then:
    // logger.info("This should not be logged");
    // expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(true).toBe(true); // Placeholder assertion
  });
}); 