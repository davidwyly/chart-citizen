"use client"

import React from "react"
import { Play, Pause, FastForward } from "lucide-react"

interface TimeControlsProps {
  timeMultiplier: number
  onTimeMultiplierChange: (multiplier: number) => void
  isPaused: boolean
  onPauseToggle: () => void
}

export function TimeControls({
  timeMultiplier,
  onTimeMultiplierChange,
  isPaused,
  onPauseToggle,
}: TimeControlsProps) {
  return (
    <div>
      <h4 className="font-medium mb-3 text-sm">Time Controls</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPauseToggle}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
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
        </div>
      </div>
    </div>
  )
}
