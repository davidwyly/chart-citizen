"use client"

import React from "react"
import { ParameterSlider } from "./parameter-slider"
import type { CelestialObject } from "@/engine/types/orbital-system"

interface TerrestrialControlsProps {
  properties: CelestialObject['properties']
  onChange: (property: string, value: number) => void
}

export function TerrestrialControls({ properties, onChange }: TerrestrialControlsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
        Terrestrial Properties
      </h3>
      
      <ParameterSlider
        id="soil_tint"
        label="Soil Tint"
        value={properties.soil_tint || 45}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('soil_tint', value)}
        unit="%"
        description="Surface soil color variation (0=light, 100=dark)"
      />
      
      <ParameterSlider
        id="water"
        label="Water Coverage"
        value={properties.water || 50}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('water', value)}
        unit="%"
        description="Ocean/ice coverage (0=desert, 100=ocean world)"
      />
      
      <ParameterSlider
        id="temperature_class"
        label="Temperature"
        value={properties.temperature_class || 50}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('temperature_class', value)}
        unit=""
        description="0-33: Ice world, 34-66: Temperate, 67-100: Hot world"
      />
      
      <ParameterSlider
        id="tectonics"
        label="Tectonics"
        value={properties.tectonics || 50}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('tectonics', value)}
        unit="%"
        description="Surface height variation and roughness"
      />
      
      <ParameterSlider
        id="geomagnetism"
        label="Geomagnetism"
        value={properties.geomagnetism || 30}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('geomagnetism', value)}
        unit="%"
        description="Aurora effects at poles"
      />
      
      <ParameterSlider
        id="population"
        label="Population"
        value={properties.population || 0}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('population', value)}
        unit="%"
        description="City lights and urban sprawl"
      />
      
      <ParameterSlider
        id="flora"
        label="Flora"
        value={properties.flora || 30}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onChange('flora', value)}
        unit="%"
        description="Vegetation coverage and tint"
      />
    </div>
  )
} 