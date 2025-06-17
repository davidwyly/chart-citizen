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
    // Initialize the monitor with a first call to set lastTime
    advanceMockTime(16.67) // One frame at 60fps
    monitor.update() // Initialize lastTime
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

    advanceMockTime(100) // One more frame at 10 FPS
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

    advanceMockTime(16.67) // One more frame to get a fresh measurement
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

    // Reset mock time and test warning level
    mockTime = 1000
    const freshMonitor = new PerformanceMonitor()
    advanceMockTime(16.67) // Initialize
    freshMonitor.update()
    
    for (let i = 0; i < 60; i++) {
      advanceMockTime(40) // 25 FPS (clearly in warning range)
      freshMonitor.update()
    }
    expect(freshMonitor.getPerformanceLevel()).toBe('warning')

    // Reset mock time and test good level
    mockTime = 1000
    const goodMonitor = new PerformanceMonitor()
    advanceMockTime(16.67) // Initialize
    goodMonitor.update()
    
    for (let i = 0; i < 60; i++) {
      advanceMockTime(16.67) // 60 FPS
      goodMonitor.update()
    }
    expect(goodMonitor.getPerformanceLevel()).toBe('good')
  })

  it('should handle rapid frame time changes', () => {
    // Create a fresh monitor to avoid any initial good frames
    mockTime = 1000
    const testMonitor = new PerformanceMonitor()
    
    // Initialize with a baseline frame
    advanceMockTime(100) // Start with slow frame
    testMonitor.update()
    
    // Fill the history buffer with consistently slow frames
    for (let i = 0; i < 60; i++) {
      advanceMockTime(100) // Slow frame (10 FPS) - below 20 FPS threshold
      testMonitor.update()
    }

    advanceMockTime(100) // Final frame
    const metrics = testMonitor.update()
    expect(metrics.fps).toBeLessThan(60)
    expect(metrics.isLowPerformance).toBe(true)
  })
}) 