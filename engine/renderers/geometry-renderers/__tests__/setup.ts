import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import * as THREE from 'three'
import React from 'react'
import { clearOrbitalMechanicsCache } from '@/engine/utils/orbital-mechanics-calculator'

// Make THREE available globally for direct instantiation in tests
;(global as any).THREE = THREE

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Enhanced test isolation
beforeEach(() => {
  // Clear all caches
  clearOrbitalMechanicsCache()
  
  // Reset all mocks to ensure fresh state
  vi.clearAllMocks()
  
  // Clear any timers that might interfere
  vi.clearAllTimers()
})

// Comprehensive cleanup after each test
afterEach(() => {
  // DOM cleanup
  cleanup()
  
  // Clear caches again
  clearOrbitalMechanicsCache()
  
  // Restore all mocks
  vi.restoreAllMocks()
  
  // Clear all timers
  vi.clearAllTimers()
  
  // Force garbage collection hint (if available)
  if (global.gc) {
    global.gc()
  }
})

export {} 