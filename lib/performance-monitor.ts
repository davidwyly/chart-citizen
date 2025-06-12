import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
  }
}

export function usePerformanceMonitor(interval = 1000): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: {
      used: 0,
      total: 0
    }
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const measure = () => {
      const currentTime = performance.now()
      frameCount++

      if (currentTime - lastTime >= interval) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        // Get memory info if available
        const memory = (performance as any).memory || {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0
        }

        setMetrics({
          fps,
          memory: {
            used: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
            total: Math.round(memory.totalJSHeapSize / (1024 * 1024))
          }
        })

        frameCount = 0
        lastTime = currentTime
      }

      animationFrameId = requestAnimationFrame(measure)
    }

    measure()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [interval])

  return metrics
} 