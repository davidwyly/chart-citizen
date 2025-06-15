import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ChartCitizenError, 
  SystemLoadError, 
  NetworkError, 
  ValidationError, 
  RenderingError,
  UserInputError,
  DataParsingError,
  WebGLError,
  isChartCitizenError,
  isSystemError,
  isNetworkError,
  isValidationError,
  isRenderingError
} from '../engine/types/errors';
import { ErrorReporter } from '../engine/services/error-reporter';
import { 
  Validator, 
  Sanitizer, 
  assertValidSystemId, 
  assertValidSystemData, 
  assertValidViewMode 
} from '../engine/validation/validators';
import { EnhancedSystemLoader } from '../engine/system-loader-enhanced';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Error Handling System', () => {
  describe('Custom Error Types', () => {
    it('should create SystemLoadError with proper properties', () => {
      const context = { mode: 'star-citizen', systemId: 'stanton' };
      const error = new SystemLoadError('Failed to load system', context);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ChartCitizenError);
      expect(error).toBeInstanceOf(SystemLoadError);
      expect(error.name).toBe('SystemLoadError');
      expect(error.code).toBe('SYSTEM_LOAD_FAILED');
      expect(error.category).toBe('SYSTEM');
      expect(error.message).toBe('Failed to load system');
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create NetworkError with proper properties', () => {
      const error = new NetworkError('Connection timeout');
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('NETWORK');
      expect(error.message).toBe('Connection timeout');
    });

    it('should create ValidationError with proper properties', () => {
      const error = new ValidationError('Invalid input data');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('VALIDATION');
    });

    it('should serialize to JSON properly', () => {
      const context = { field: 'test' };
      const error = new SystemLoadError('Test error', context);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'SystemLoadError',
        message: 'Test error',
        code: 'SYSTEM_LOAD_FAILED',
        category: 'SYSTEM',
        timestamp: error.timestamp.toISOString(),
        context,
        stack: error.stack
      });
    });

    it('should maintain proper prototype chain for instanceof checks', () => {
      const error = new SystemLoadError('Test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ChartCitizenError).toBe(true);
      expect(error instanceof SystemLoadError).toBe(true);
    });
  });

  describe('Error Type Guards', () => {
    it('should correctly identify ChartCitizenError', () => {
      const customError = new SystemLoadError('Test');
      const regularError = new Error('Test');

      expect(isChartCitizenError(customError)).toBe(true);
      expect(isChartCitizenError(regularError)).toBe(false);
      expect(isChartCitizenError('not an error')).toBe(false);
    });

    it('should correctly identify system errors', () => {
      const systemError = new SystemLoadError('Test');
      const networkError = new NetworkError('Test');

      expect(isSystemError(systemError)).toBe(true);
      expect(isSystemError(networkError)).toBe(false);
    });

    it('should correctly identify network errors', () => {
      const networkError = new NetworkError('Test');
      const systemError = new SystemLoadError('Test');

      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(systemError)).toBe(false);
    });

    it('should correctly identify validation errors', () => {
      const validationError = new ValidationError('Test');
      const dataParsingError = new DataParsingError('Test');
      const systemError = new SystemLoadError('Test');

      expect(isValidationError(validationError)).toBe(true);
      expect(isValidationError(dataParsingError)).toBe(true);
      expect(isValidationError(systemError)).toBe(false);
    });

    it('should correctly identify rendering errors', () => {
      const renderingError = new RenderingError('Test');
      const webglError = new WebGLError('Test');
      const systemError = new SystemLoadError('Test');

      expect(isRenderingError(renderingError)).toBe(true);
      expect(isRenderingError(webglError)).toBe(true);
      expect(isRenderingError(systemError)).toBe(false);
    });
  });

  describe('Error Reporter', () => {
    let errorReporter: ErrorReporter;
    let consoleSpy: any;
    let fetchSpy: any;

    beforeEach(() => {
      // Set NODE_ENV to development to enable console logging
      vi.stubEnv('NODE_ENV', 'development');
      
      // Create a fresh instance for each test
      (ErrorReporter as any).instance = undefined;
      errorReporter = ErrorReporter.getInstance();
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy = vi.mocked(fetch).mockResolvedValue(new Response('', { status: 200 }));
      
      // Mock navigator.onLine as true by default
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    afterEach(() => {
      // Restore environment
      vi.unstubAllEnvs();
      
      consoleSpy.mockRestore();
      fetchSpy.mockClear();
    });

    it('should report errors with context', () => {
      const error = new SystemLoadError('Test error');
      const context = { systemId: 'stanton' };

      errorReporter.report(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error Report:',
        expect.objectContaining({
          message: 'Test error',
          name: 'SystemLoadError',
          code: 'SYSTEM_LOAD_FAILED',
          category: 'SYSTEM'
        })
      );
    });

    it('should set and use context', () => {
      errorReporter.setContext({ userId: 'test-user' });
      errorReporter.updateSystemContext('stanton', 'star-citizen');

      const error = new Error('Test error');
      errorReporter.report(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error Report:',
        expect.objectContaining({
          context: expect.objectContaining({
            userId: 'test-user',
            systemId: 'stanton',
            viewMode: 'star-citizen'
          })
        })
      );
    });

    it('should generate unique fingerprints for different errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      errorReporter.report(error1);
      errorReporter.report(error2);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const calls = consoleSpy.mock.calls;
      const fingerprint1 = calls[0][1].fingerprint;
      const fingerprint2 = calls[1][1].fingerprint;

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should queue reports when offline', () => {
      // Mock navigator.onLine as false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Create a new instance with offline status
      (ErrorReporter as any).instance = undefined;
      const offlineReporter = ErrorReporter.getInstance();

      const error = new Error('Test error');
      offlineReporter.report(error);

      expect(offlineReporter.getQueueSize()).toBeGreaterThan(0);
    });
  });

  describe('Validation Framework', () => {
    describe('System ID Validation', () => {
      it('should validate correct system IDs', () => {
        const result = Validator.validateSystemId('stanton');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid system IDs', () => {
        const result = Validator.validateSystemId('invalid@id');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('System ID contains invalid characters (only alphanumeric, hyphens, and underscores allowed)');
      });

      it('should reject empty system IDs', () => {
        const result = Validator.validateSystemId('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('System ID must be a non-empty string');
      });

      it('should reject too long system IDs', () => {
        const longId = 'a'.repeat(51);
        const result = Validator.validateSystemId(longId);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('System ID is too long (max 50 characters)');
      });

      it('should reject too short system IDs', () => {
        const result = Validator.validateSystemId('a');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('System ID is too short (min 2 characters)');
      });

      it('should warn about whitespace', () => {
        const result = Validator.validateSystemId(' stanton ');
        expect(result.warnings).toContain('System ID has leading or trailing whitespace');
      });
    });

    describe('System Data Validation', () => {
      it('should validate correct system data', () => {
        const systemData = {
          id: 'stanton',
          name: 'Stanton System',
          objects: [
            {
              id: 'stanton-star',
              name: 'Stanton',
              type: 'star',
              mass: 1.0,
              radius: 696000
            }
          ]
        };

        const result = Validator.validateSystemData(systemData);
        expect(result.isValid).toBe(true);
      });

      it('should reject system data without required fields', () => {
        const systemData = {
          name: 'Test System'
          // Missing id and objects
        };

        const result = Validator.validateSystemData(systemData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('System data must have a valid ID');
        expect(result.errors).toContain('System data must have an objects array');
      });

      it('should validate nested objects', () => {
        const systemData = {
          id: 'test',
          name: 'Test System',
          objects: [
            {
              // Missing required fields
              type: 'star'
            }
          ]
        };

        const result = Validator.validateSystemData(systemData);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Object 0:'))).toBe(true);
      });
    });

    describe('View Mode Validation', () => {
      it('should validate correct view modes', () => {
        expect(Validator.validateViewMode('star-citizen').isValid).toBe(true);
        expect(Validator.validateViewMode('profile').isValid).toBe(true);
      });

      it('should reject invalid view modes', () => {
        const result = Validator.validateViewMode('invalid-mode');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid view mode: invalid-mode. Valid modes are: star-citizen, profile');
      });
    });

    describe('Assertion Functions', () => {
      it('should throw UserInputError for invalid system ID', () => {
        expect(() => assertValidSystemId('invalid@id')).toThrow(UserInputError);
      });

      it('should throw DataParsingError for invalid system data', () => {
        expect(() => assertValidSystemData(null)).toThrow(DataParsingError);
      });

      it('should throw UserInputError for invalid view mode', () => {
        expect(() => assertValidViewMode('invalid')).toThrow(UserInputError);
      });

      it('should not throw for valid inputs', () => {
        expect(() => assertValidSystemId('stanton')).not.toThrow();
        expect(() => assertValidViewMode('star-citizen')).not.toThrow();
      });
    });
  });

  describe('Sanitization', () => {
    it('should sanitize system IDs', () => {
      expect(Sanitizer.sanitizeSystemId('  test@id!  ')).toBe('testid');
      expect(Sanitizer.sanitizeSystemId('a'.repeat(60))).toBe('a'.repeat(50));
      expect(Sanitizer.sanitizeSystemId(123 as any)).toBe('');
    });

    it('should sanitize strings', () => {
      expect(Sanitizer.sanitizeString('  hello world  ')).toBe('hello world');
      expect(Sanitizer.sanitizeString('hello\x00world')).toBe('helloworld');
      expect(Sanitizer.sanitizeString('a'.repeat(2000), 100)).toBe('a'.repeat(100));
    });

    it('should sanitize numbers', () => {
      expect(Sanitizer.sanitizeNumber(42)).toBe(42);
      expect(Sanitizer.sanitizeNumber('42')).toBe(42);
      expect(Sanitizer.sanitizeNumber('invalid')).toBe(0);
      expect(Sanitizer.sanitizeNumber(null, 10)).toBe(10);
    });

    it('should sanitize booleans', () => {
      expect(Sanitizer.sanitizeBoolean(true)).toBe(true);
      expect(Sanitizer.sanitizeBoolean('true')).toBe(true);
      expect(Sanitizer.sanitizeBoolean('false')).toBe(false);
      expect(Sanitizer.sanitizeBoolean(1)).toBe(true);
      expect(Sanitizer.sanitizeBoolean(0)).toBe(false);
      expect(Sanitizer.sanitizeBoolean('invalid')).toBe(false);
    });
  });

  describe('Enhanced System Loader', () => {
    let loader: EnhancedSystemLoader;
    let fetchSpy: any;

    beforeEach(() => {
      // Create loader with shorter delays for testing
      loader = new EnhancedSystemLoader({
        maxRetries: 3,
        baseDelay: 10, // Much shorter delay for tests
        maxDelay: 100,
        backoffMultiplier: 2
      });
      fetchSpy = vi.mocked(fetch);
    });

    afterEach(() => {
      fetchSpy.mockClear();
    });

    it('should validate inputs before loading', async () => {
      await expect(loader.loadSystemWithRetry('invalid-mode', 'stanton'))
        .rejects.toThrow(UserInputError);

      await expect(loader.loadSystemWithRetry('star-citizen', 'invalid@id'))
        .rejects.toThrow(UserInputError);
    });

    it('should retry on network errors', async () => {
      // Mock the base loadSystem method to simulate network errors then success
      const originalLoadSystem = loader.loadSystem;
      let callCount = 0;
      
      vi.spyOn(loader, 'loadSystem').mockImplementation(async (mode, systemId) => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Network error');
        }
        // Return a valid system on the third call
        return {
          id: 'stanton',
          name: 'Stanton',
          objects: [{ id: 'star', name: 'Stanton', type: 'star' }]
        } as any;
      });

      const result = await loader.loadSystemWithRetry('star-citizen', 'stanton');
      expect(result).toBeTruthy();
      expect(callCount).toBe(3); // 2 failures + 1 success
    });

    it('should not retry on validation errors', async () => {
      // Mock the base loadSystem method to return null (validation failure)
      vi.spyOn(loader, 'loadSystem').mockResolvedValue(null);

      await expect(loader.loadSystemWithRetry('star-citizen', 'stanton'))
        .rejects.toThrow();

      // Should only try once for validation errors (null return)
      expect(loader.loadSystem).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 errors', async () => {
      // Mock the base loadSystem method to throw a 404-like error
      vi.spyOn(loader, 'loadSystem').mockRejectedValue(new Error('System not found (HTTP 404)'));

      await expect(loader.loadSystemWithRetry('star-citizen', 'nonexistent'))
        .rejects.toThrow(SystemLoadError);

      expect(loader.loadSystem).toHaveBeenCalledTimes(1);
    });

    it('should track retry statistics', async () => {
      // Mock the base loadSystem method to fail once then succeed
      let callCount = 0;
      vi.spyOn(loader, 'loadSystem').mockImplementation(async (mode, systemId) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error');
        }
        return {
          id: 'stanton',
          name: 'Stanton',
          objects: [{ id: 'star', name: 'Stanton', type: 'star' }]
        } as any;
      });

      await loader.loadSystemWithRetry('star-citizen', 'stanton');

      const stats = loader.getRetryStatistics();
      expect(stats.totalAttempts).toBe(2);
      expect(stats.systemsWithRetries).toBe(1);
    });

    it('should mark systems as permanently failed after max retries', async () => {
      // Mock the base loadSystem method to always fail
      vi.spyOn(loader, 'loadSystem').mockRejectedValue(new Error('Persistent network error'));

      await expect(loader.loadSystemWithRetry('star-citizen', 'stanton'))
        .rejects.toThrow(SystemLoadError);

      expect(loader.isSystemPermanentlyFailed('star-citizen', 'stanton')).toBe(true);

      // Subsequent calls should fail immediately
      await expect(loader.loadSystemWithRetry('star-citizen', 'stanton'))
        .rejects.toThrow('permanently failed');
    });

    it('should provide attempt history', async () => {
      // Mock the base loadSystem method to always fail
      vi.spyOn(loader, 'loadSystem').mockRejectedValue(new Error('Network error'));

      try {
        await loader.loadSystemWithRetry('star-citizen', 'stanton');
      } catch {
        // Expected to fail
      }

      const history = loader.getAttemptHistory('star-citizen', 'stanton');
      expect(history).toHaveLength(4); // 1 initial + 3 retries
      expect(history[0].attempt).toBe(0);
      expect(history[0].error).toBeDefined();
    });
  });
}); 