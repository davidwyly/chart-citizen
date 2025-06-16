"use client"

import React from "react"

interface ParameterSliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
  description?: string
}

export function ParameterSlider({ 
  id, 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  unit, 
  description 
}: ParameterSliderProps) {
  return (
    <div className="space-y-2 mb-4">
      <label htmlFor={id} className="block text-sm text-gray-300">
        {label}: {value.toFixed(step < 1 ? 3 : 2)}{unit || ""}
      </label>
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 