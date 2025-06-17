import React from 'react'
import { usePerformanceMonitor } from '@/lib/performance-monitor'

export function PerformanceWarning() {
  const { fps } = usePerformanceMonitor()
  
  // Calculate if performance is low based on FPS
  const isLowPerformance = fps < 30

  if (!isLowPerformance) return null

  return (
    <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="font-semibold">Low Performance Detected</p>
          <p className="text-sm">Current FPS: {Math.round(fps)}</p>
          <p className="text-sm">Consider lowering effects quality</p>
        </div>
      </div>
    </div>
  )
} 