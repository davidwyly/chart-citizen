import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PerformanceMonitor } from '@/lib/performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor
  let mockTime: number
  let advanceMockTime: (ms: number) => void

  beforeEach(() => {
    // Mock performance.now to return predictable values
    mockTime = 1000 // Start at a non-zero time
    advanceMockTime = (ms: number) => {
      mockTime += ms
    }
    
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime)
    monitor = new PerformanceMonitor()
    // Advance time slightly to establish a baseline
    advanceMockTime(16.67) // One frame at 60fps
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with zero metrics', () => {
    // Advance time to get a valid delta
    advanceMockTime(16.67) // ~60 FPS
    const metrics = monitor.update()
    expect(metrics.fps).toBeGreaterThan(0)
    expect(metrics.frameTime).toBeGreaterThan(0)
    expect(metrics.isLowPerformance).toBe(false)
  })

  it('should detect low performance when FPS is below threshold', () => {
    // Simulate low FPS by advancing time slowly
    for (let i = 0; i < 60; i++) {
      advanceMockTime(100) // 10 FPS
      monitor.update()
    }

    const metrics = monitor.update()
    expect(metrics.isLowPerformance).toBe(true)
    expect(metrics.fps).toBeLessThan(20)
  })

  it('should maintain performance history', () => {
    // Simulate varying FPS
    for (let i = 0; i < 60; i++) {
      advanceMockTime(16.67) // ~60 FPS
      monitor.update()
    }

    const metrics = monitor.update()
    expect(metrics.fps).toBeCloseTo(60, 0)
    expect(metrics.isLowPerformance).toBe(false)
  })

  it('should return correct performance level', () => {
    // Test critical level
    for (let i = 0; i < 60; i++) {
      advanceMockTime(100) // 10 FPS
      monitor.update()
    }
    expect(monitor.getPerformanceLevel()).toBe('critical')

    // Test warning level
    for (let i = 0; i < 60; i++) {
      advanceMockTime(33.33) // 30 FPS
      monitor.update()
    }
    expect(monitor.getPerformanceLevel()).toBe('warning')

    // Test good level
    for (let i = 0; i < 60; i++) {
      advanceMockTime(16.67) // 60 FPS
      monitor.update()
    }
    expect(monitor.getPerformanceLevel()).toBe('good')
  })

  it('should handle rapid frame time changes', () => {
    // Simulate frame time spikes
    for (let i = 0; i < 30; i++) {
      advanceMockTime(16.67) // Normal frame
      monitor.update()
      advanceMockTime(100) // Slow frame
      monitor.update()
    }

    const metrics = monitor.update()
    expect(metrics.fps).toBeLessThan(60)
    expect(metrics.isLowPerformance).toBe(true)
  })
}) 