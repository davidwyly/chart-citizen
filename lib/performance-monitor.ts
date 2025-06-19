import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  isLowPerformance: boolean
  memory: {
    used: number
    total: number
  }
}

export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fpsHistory: number[] = []
  private readonly historySize = 60 // Keep 1 second of history at 60fps
  private readonly lowFpsThreshold = 20
  private readonly warningThreshold = 30

  update(): PerformanceMetrics {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Calculate FPS
    const fps = 1000 / deltaTime
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift()
    }

    // Calculate average FPS
    const averageFps = this.fpsHistory.reduce((sum, value) => sum + value, 0) / this.fpsHistory.length

    // Get memory info if available
    interface PerformanceMemory {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    
    const memory = (performance as Performance & { memory?: PerformanceMemory }).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    }

    return {
      fps: averageFps,
      frameTime: deltaTime,
      isLowPerformance: averageFps < this.lowFpsThreshold,
      memory: {
        used: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(memory.totalJSHeapSize / (1024 * 1024))
      }
    }
  }

  getPerformanceLevel(): 'good' | 'warning' | 'critical' {
    if (this.fpsHistory.length === 0) {
      return 'good' // Default to good if no history
    }
    
    const averageFps = this.fpsHistory.reduce((sum, value) => sum + value, 0) / this.fpsHistory.length

    if (averageFps < this.lowFpsThreshold) {
      return 'critical'
    } else if (averageFps < this.warningThreshold) {
      return 'warning'
    }
    return 'good'
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePerformanceMonitor(_interval = 1000): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    isLowPerformance: false,
    memory: {
      used: 0,
      total: 0
    }
  })
  const monitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor())

  useEffect(() => {
    let animationFrameId: number

    const updateMetrics = () => {
      const newMetrics = monitorRef.current.update()
      setMetrics(newMetrics)
      animationFrameId = requestAnimationFrame(updateMetrics)
    }

    animationFrameId = requestAnimationFrame(updateMetrics)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return metrics
} 