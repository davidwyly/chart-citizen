import { beforeAll, afterAll, vi } from 'vitest';
import React from 'react';

// Mock ResizeObserver for tests that use @react-three/fiber or react-use-measure
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.ResizeObserver = MockResizeObserver;
  }
});

afterAll(() => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete window.ResizeObserver;
  }
}); 