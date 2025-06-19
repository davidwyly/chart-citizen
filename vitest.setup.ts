import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as THREE from 'three';
import React from 'react';

// Extend Vitest's expect with jest-dom matchers
import { expect } from 'vitest';
expect.extend(matchers);

// Make THREE available globally for direct instantiation in tests
;(global as any).THREE = THREE;

// Mock ResizeObserver for tests that use @react-three/fiber or react-use-measure
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Mock WebGL context for Three.js tests
const mockWebGLContext = {
  canvas: {},
  drawingBufferWidth: 1024,
  drawingBufferHeight: 768,
  getParameter: vi.fn(() => 16),
  getExtension: vi.fn(() => ({})),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  drawArrays: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  viewport: vi.fn(),
};

beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.ResizeObserver = MockResizeObserver;
    
    // Mock WebGL context
    const originalCreateElement = document.createElement.bind(document);
    global.document.createElement = vi.fn((tagName) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas');
        canvas.getContext = vi.fn(() => mockWebGLContext) as any;
        return canvas;
      }
      return originalCreateElement(tagName);
    }) as any;
  }
});

beforeEach(() => {
  // Reset all mocks to ensure fresh state
  vi.clearAllMocks();
  
  // Clear any timers that might interfere
  vi.clearAllTimers();
});

afterEach(() => {
  // DOM cleanup
  cleanup();
  
  // Restore all mocks
  vi.restoreAllMocks();
  
  // Clear all timers
  vi.clearAllTimers();
  
  // Force garbage collection hint (if available)
  if (global.gc) {
    global.gc();
  }
});

afterAll(() => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete window.ResizeObserver;
  }
}); 