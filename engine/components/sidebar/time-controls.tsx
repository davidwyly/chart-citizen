"use client"

import React, { useEffect, useRef } from "react"
import { Play, Pause, FastForward, Clock, Zap } from "lucide-react"
import { CelestialObject, isOrbitData } from "@/engine/types/orbital-system"
import { calculateAdaptiveTimeMultiplier, DEFAULT_ADAPTIVE_SETTINGS, formatOrbitalPeriod } from "@/engine/utils/adaptive-time-scaling"

interface TimeControlsProps {
  timeMultiplier: number
  onTimeMultiplierChange: (multiplier: number) => void
  isPaused: boolean
  onPauseToggle: () => void
  selectedObjectData?: CelestialObject | null
  autoAdjustTime?: boolean
  onAutoAdjustToggle?: (enabled: boolean) => void
}

export function TimeControls({
  timeMultiplier,
  onTimeMultiplierChange,
  isPaused,
  onPauseToggle,
  selectedObjectData,
  autoAdjustTime = true,
  onAutoAdjustToggle,
}: TimeControlsProps) {
  // Track last object to prevent unnecessary auto-adjustments
  const lastObjectRef = useRef<string | null>(null)

  // Calculate adaptive time scaling information
  const adaptiveResult = selectedObjectData 
    ? calculateAdaptiveTimeMultiplier(selectedObjectData, DEFAULT_ADAPTIVE_SETTINGS)
    : null

  // Check if current multiplier matches adaptive suggestion (within tolerance)
  const isUsingAdaptiveSpeed = adaptiveResult && Math.abs(timeMultiplier - adaptiveResult.multiplier) < 0.1

  // Auto-adjust time when object changes and auto-adjust is enabled
  useEffect(() => {
    if (!autoAdjustTime || !selectedObjectData || !adaptiveResult?.isAdaptive) return

    const currentObjectId = selectedObjectData.id
    
    // Only auto-adjust when the object actually changes
    if (lastObjectRef.current !== currentObjectId) {
      lastObjectRef.current = currentObjectId
      onTimeMultiplierChange(adaptiveResult.multiplier)
    }
  }, [selectedObjectData?.id, autoAdjustTime, adaptiveResult, onTimeMultiplierChange])

  // Handle reset to adaptive speed
  const handleResetToAdaptive = () => {
    if (adaptiveResult && adaptiveResult.isAdaptive) {
      onTimeMultiplierChange(adaptiveResult.multiplier)
    }
  }

  // Handle auto-adjust toggle
  const handleAutoAdjustToggle = () => {
    const newValue = !autoAdjustTime
    onAutoAdjustToggle?.(newValue)
    
    // If enabling auto-adjust and we have adaptive data, apply it immediately
    if (newValue && adaptiveResult?.isAdaptive) {
      onTimeMultiplierChange(adaptiveResult.multiplier)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Time Controls</h4>
        {onAutoAdjustToggle && (
          <button
            onClick={handleAutoAdjustToggle}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              autoAdjustTime 
                ? 'bg-blue-600/40 text-blue-100 hover:bg-blue-600/60' 
                : 'bg-orange-600/40 text-orange-100 hover:bg-orange-600/60'
            }`}
            title={autoAdjustTime ? 'Switch to manual controls' : 'Switch to adaptive speed (recommended)'}
          >
            {autoAdjustTime ? (
              <>
                <Zap className="w-3 h-3" />
                Adaptive
              </>
            ) : (
              <>
                <FastForward className="w-3 h-3" />
                Manual
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPauseToggle}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          {/* Adaptive Mode: Simplified display */}
          {autoAdjustTime ? (
            <div className="flex-1 flex items-center justify-between">
              <div className="text-sm text-blue-300">
                {adaptiveResult ? `${adaptiveResult.multiplier.toFixed(1)}x` : `${timeMultiplier.toFixed(1)}x`}
                {adaptiveResult && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({adaptiveResult.category} orbit)
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Auto-adjusting
              </div>
            </div>
          ) : (
            /* Manual Mode: Full slider controls */
            <>
              <div className="flex-1">
                <input
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={timeMultiplier}
                  onChange={(e) => onTimeMultiplierChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="text-sm">{timeMultiplier.toFixed(1)}x</div>
            </>
          )}
        </div>

        {/* Orbital information display */}
        {adaptiveResult && adaptiveResult.isAdaptive && selectedObjectData?.orbit && isOrbitData(selectedObjectData.orbit) && (
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Orbital period: {formatOrbitalPeriod(selectedObjectData.orbit.orbital_period)}</span>
            </div>
            
            {/* Adaptive mode: Show current status */}
            {autoAdjustTime ? (
              <div className="flex items-center justify-between">
                <span className="text-green-400">
                  {adaptiveResult.category === 'fast' && '🌙 Fast orbit'}
                  {adaptiveResult.category === 'medium' && '🪐 Medium orbit'}
                  {adaptiveResult.category === 'slow' && '🌌 Slow orbit'}
                </span>
                <span className="text-blue-400 text-xs">
                  Optimal: {adaptiveResult.multiplier.toFixed(1)}x
                </span>
              </div>
            ) : (
              /* Manual mode: Show comparison with adaptive suggestion */
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`${isUsingAdaptiveSpeed ? 'text-green-400' : 'text-gray-400'}`}>
                    {adaptiveResult.category === 'fast' && '🌙 Fast orbit'}
                    {adaptiveResult.category === 'medium' && '🪐 Medium orbit'}
                    {adaptiveResult.category === 'slow' && '🌌 Slow orbit'}
                  </span>
                  {!isUsingAdaptiveSpeed && (
                    <button
                      onClick={handleResetToAdaptive}
                      className="text-blue-400 hover:text-blue-300 underline"
                      title={`Use recommended speed: ${adaptiveResult.multiplier.toFixed(1)}x`}
                    >
                      Suggested: {adaptiveResult.multiplier.toFixed(1)}x
                    </button>
                  )}
                </div>
                {isUsingAdaptiveSpeed && (
                  <div className="text-green-400 text-xs">✓ Using recommended speed</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
