import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EngineSystemLoader } from '../system-loader';

describe('EngineSystemLoader', () => {
  let systemLoader: EngineSystemLoader;

  beforeEach(() => {
    // Reset any mocks and create a fresh instance
    vi.clearAllMocks();
    systemLoader = new EngineSystemLoader();
  });

  describe('initialization', () => {
    it('should create a new instance', () => {
      expect(systemLoader).toBeInstanceOf(EngineSystemLoader);
    });
  });

  describe('system loading', () => {
    it('should indicate when a system is not loaded', () => {
      expect(systemLoader.isSystemLoaded('test-mode', 'test-system')).toBe(false);
    });

    it('should return correct loading status', () => {
      expect(systemLoader.getLoadingStatus('test-mode', 'test-system')).toBe('not-loaded');
    });
  });

  describe('cache management', () => {
    it('should clear cache without errors', () => {
      expect(() => systemLoader.clearCache()).not.toThrow();
    });
  });

  // Add more test suites here as we implement them
}); 