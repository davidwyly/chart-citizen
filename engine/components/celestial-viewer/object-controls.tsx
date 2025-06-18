"use client"

import React, { useState, useEffect } from 'react'
import { TerrestrialControls, ShaderEditor } from './controls'
import type { CelestialObject } from '@/engine/types/orbital-system'

interface ObjectControlsProps {
  selectedObjectId: string
  celestialObject?: CelestialObject | null
  objectScale: number
  shaderScale: number
  shaderParams: {
    intensity: number
    speed: number
    distortion: number
    diskSpeed: number
    lensingStrength: number
    diskBrightness: number
  }
  habitabilityParams?: {
    humidity: number
    temperature: number
    population: number
    volcanism?: number
    rotationSpeed?: number
    showTopographicLines?: boolean
  }
  onObjectScaleChange: (scale: number) => void
  onShaderScaleChange: (scale: number) => void
  onShaderParamChange: (param: string, value: number) => void
  onHabitabilityParamChange?: (param: string, value: number) => void
  onPropertyChange?: (property: string, value: number) => void
  onShaderUpdate?: (vertexShader: string, fragmentShader: string) => void
  objectType?: string
  showStats: boolean
  onToggleStats: () => void
}

// Utility function to get existing shaders based on object type
const getExistingShaders = (celestialObject?: CelestialObject | null): { vertex: string, fragment: string } => {
  if (!celestialObject) {
    return { vertex: '', fragment: '' }
  }

  const objectType = celestialObject.geometry_type
  
  // Basic vertex shader used by most objects
  const basicVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

  // Terrestrial planet shader
  const terrestrialFragmentShader = `
uniform float time;
uniform vec3 landColor;
uniform vec3 seaColor;
uniform vec3 floraColor;
uniform vec3 atmosphereColor;
uniform vec3 nightLightColor;
uniform vec3 sandColor;
uniform float waterCoverage;
uniform float temperatureClass;
uniform float tectonics;
uniform float geomagnetism;
uniform float population;
uniform float flora;
uniform float soilTint;
uniform float seed;
uniform float rotationSpeed;
uniform float terrainScale;
uniform float cloudScale;
uniform float nightLightIntensity;
uniform float cloudOpacity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Noise functions
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(
    mix(hash(n), hash(n + 1.0), f.x),
    mix(hash(n + 57.0), hash(n + 58.0), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

void main() {
  // Base terrain with seed offset
  vec2 uv = vUv + time * 0.01;
  vec2 seedOffset = vec2(seed * 0.1, seed * 0.07);
  float terrain = fbm((uv + seedOffset) * terrainScale * (1.0 + tectonics));
  
  // Clouds with different seed offset
  vec2 cloudSeedOffset = vec2(seed * 0.13, seed * 0.11);
  float cloudNoise = fbm((uv + cloudSeedOffset) * cloudScale + time * 0.1);
  float clouds = smoothstep(0.4, 0.6, cloudNoise);
  
  // Water/land separation
  float waterLevel = 1.0 - waterCoverage;
  float isWater = step(waterLevel, terrain);
  
  // Base colors
  vec3 waterColor = mix(seaColor, landColor * 0.3, geomagnetism * 0.2);
  vec3 landBaseColor = mix(landColor, sandColor, soilTint);
  vec3 vegetationColor = mix(landBaseColor, floraColor, flora);
  
  // Temperature effects
  vec3 tempColor = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 0.5, 0.3), temperatureClass);
  vec3 surfaceColor = mix(waterColor, vegetationColor, isWater);
  surfaceColor = mix(surfaceColor, tempColor, 0.1 * temperatureClass);
  
  // Population lights (visible in darker areas)
  float populationGlow = population * smoothstep(0.6, 0.8, terrain) * (1.0 - isWater);
  surfaceColor += nightLightColor * populationGlow * nightLightIntensity * 0.3;
  
  // Cloud layer
  surfaceColor = mix(surfaceColor, vec3(0.9, 0.95, 1.0), clouds * cloudOpacity);
  
  // Ice caps at poles based on temperature
  float tempNorm = clamp(temperatureClass, 0.0, 1.0);
  float iceLatitudeThreshold = tempNorm * 0.9;
  vec2 iceSeedOffset = vec2(seed * 0.05, seed * 0.03);
  float iceEdgeNoise = fbm(vNormal.xz * 5.0 + iceSeedOffset + time * 0.1) * 0.05;
  float distanceFromPoles = 1.0 - abs(vNormal.y);
  float poleMask = smoothstep(iceLatitudeThreshold + 0.05 + iceEdgeNoise, iceLatitudeThreshold - 0.05 + iceEdgeNoise, distanceFromPoles);
  poleMask *= isWater;
  vec3 iceColor = vec3(0.92, 0.96, 1.0);
  surfaceColor = mix(surfaceColor, iceColor, poleMask);
  
  // Simple lighting
  float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
  
  gl_FragColor = vec4(surfaceColor * lighting, 1.0);
}
`

  // Gas giant shader
  const gasGiantFragmentShader = `
uniform float time;
uniform float intensity;
uniform float speed;
uniform float distortion;
uniform vec3 landColor;
uniform vec3 seaColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(
    mix(hash(n), hash(n + 1.0), f.x),
    mix(hash(n + 57.0), hash(n + 58.0), f.x),
    f.y
  );
}

void main() {
  vec2 uv = vUv;
  
  // Create horizontal bands
  float bands = sin(uv.y * 12.0 + time * speed * 0.5) * 0.5 + 0.5;
  
  // Add turbulence
  float turbulence = noise(uv * 8.0 + vec2(time * speed * 0.1, 0.0));
  bands += turbulence * 0.3;
  
  // Storm spots
  vec2 stormUv = uv * 4.0 + vec2(time * speed * 0.05, 0.0);
  float storms = smoothstep(0.7, 0.9, noise(stormUv));
  
  // Color mixing
  vec3 bandColor1 = landColor;
  vec3 bandColor2 = seaColor;
  vec3 stormColor = vec3(1.0, 0.8, 0.6);
  
  vec3 color = mix(bandColor1, bandColor2, bands);
  color = mix(color, stormColor, storms * 0.6);
  
  // Atmospheric glow
  float glow = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 2.0);
  color += vec3(0.3, 0.4, 0.6) * glow * 0.5;
  
  gl_FragColor = vec4(color * intensity, 1.0);
}
`

  // Star shader
  const starFragmentShader = `
uniform float time;
uniform float intensity;
uniform float speed;
uniform float distortion;
uniform vec3 landColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + 113.0 * i.z;
  return mix(
    mix(
      mix(hash(n), hash(n + 1.0), f.x),
      mix(hash(n + 57.0), hash(n + 58.0), f.x),
      f.y
    ),
    mix(
      mix(hash(n + 113.0), hash(n + 114.0), f.x),
      mix(hash(n + 170.0), hash(n + 171.0), f.x),
      f.y
    ),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  vec3 p = vPosition * 2.0 + vec3(0.0, 0.0, time * speed * 0.05);
  float n = fbm(p);
  
  // Solar flares
  float flares = fbm(p * 1.5 + vec3(time * speed * 0.1, 0.0, 0.0));
  flares = pow(max(0.0, flares), 2.0);
  
  // Core color
  vec3 coreColor = landColor * intensity;
  vec3 flareColor = vec3(1.5, 1.2, 1.0) * coreColor;
  
  vec3 color = mix(coreColor, flareColor, flares * 0.7);
  
  // Add surface variation
  color *= (0.8 + 0.4 * n);
  
  // Corona effect
  float corona = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 3.0);
  color += coreColor * corona * 0.5;
  
  gl_FragColor = vec4(color, 1.0);
}
`

  // Default/simple shader for other objects
  const defaultFragmentShader = `
uniform float time;
uniform float intensity;
uniform vec3 landColor;
uniform vec3 seaColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Simple procedural surface
  float pattern = sin(vUv.x * 10.0 + time) * sin(vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5;
  
  vec3 color = mix(seaColor, landColor, pattern);
  
  // Simple lighting
  float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
  
  gl_FragColor = vec4(color * lighting * intensity, 1.0);
}
`

  // Select shader based on object type
  switch (objectType) {
    case 'terrestrial':
      return { vertex: basicVertexShader, fragment: terrestrialFragmentShader }
    
    case 'gas_giant':
      return { vertex: basicVertexShader, fragment: gasGiantFragmentShader }
    
    case 'star':
      return { vertex: basicVertexShader, fragment: starFragmentShader }
    
    case 'rocky':
    case 'compact':
    case 'exotic':
    case 'ring':
    case 'belt':
    case 'none':
    default:
      return { vertex: basicVertexShader, fragment: defaultFragmentShader }
  }
}

export function ObjectControls({
  selectedObjectId,
  celestialObject,
  objectScale,
  shaderScale,
  shaderParams,
  habitabilityParams,
  onObjectScaleChange,
  onShaderScaleChange,
  onShaderParamChange,
  onHabitabilityParamChange,
  onPropertyChange,
  onShaderUpdate
}: ObjectControlsProps) {
  const renderSlider = (
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    unit?: string
  ) => (
    <div key={id} className="space-y-2 mb-4">
      <label htmlFor={id} className="block text-sm text-gray-300">
        {label}: {value.toFixed(step < 1 ? 3 : 2)}{unit || ""}
      </label>
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
    </div>
  )

  // Geometry-specific controls based on celestial object type
  const getGeometryControls = () => {
    if (!celestialObject) return null

    switch (celestialObject.geometry_type) {
      case 'terrestrial':
        return onPropertyChange ? (
          <TerrestrialControls 
            properties={celestialObject.properties}
            onChange={onPropertyChange}
          />
        ) : null
      case 'rocky':
        // Rocky planets use similar controls to terrestrial planets
        return onPropertyChange ? (
          <TerrestrialControls 
            properties={celestialObject.properties}
            onChange={onPropertyChange}
          />
        ) : null
      case 'gas_giant':
        // Gas giants could have specific controls for atmospheric properties
        // For now, use basic property controls
        return (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
              Gas Giant Properties
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Gas giant-specific controls will be implemented in future updates.
            </p>
          </div>
        )
      case 'star':
        // Stars could have controls for stellar properties
        return (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
              Stellar Properties
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Stellar property controls will be implemented in future updates.
            </p>
          </div>
        )
      case 'exotic':
        // Exotic objects (black holes, neutron stars, etc.) could have special controls
        return (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
              Exotic Object Properties
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Exotic object controls will be implemented in future updates.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  // Legacy detection for backward compatibility during transition
  const isProtostar = selectedObjectId === 'protostar'
  const isBlackHole = selectedObjectId === 'black-hole'
  const isHabitablePlanet = ['earth', 'earth-like', 'desert-world', 'ocean-world-habitable', 'ice-world'].includes(selectedObjectId)

  return (
    <div className="flex h-full flex-col p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-semibold">Object Controls</h2>
      
      {/* General Properties */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
          General Properties
        </h3>
        {renderSlider(
          "objectScale",
          "Object Scale",
          objectScale,
          0.1,
          10,
          0.1,
          onObjectScaleChange
        )}
        {renderSlider(
          "shaderScale",
          "Shader Scale",
          shaderScale,
          0.1,
          5,
          0.1,
          onShaderScaleChange
        )}
      </div>

      {/* Geometry-specific Properties */}
      {getGeometryControls()}

      {/* Live Shader Editor */}
      {celestialObject && onShaderUpdate && (() => {
        const existingShaders = getExistingShaders(celestialObject)
        return (
          <ShaderEditor 
            onShaderUpdate={onShaderUpdate}
            currentVertexShader={existingShaders.vertex}
            currentFragmentShader={existingShaders.fragment}
            objectType={celestialObject.geometry_type}
          />
        )
      })()}

      {/* Protostar-specific Properties */}
      {isProtostar && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Protostar Properties
          </h3>
          {renderSlider(
            "intensity",
            "Nebula Density",
            shaderParams.intensity,
            0.01,
            2.0,
            0.01,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Rotation Speed",
            shaderParams.speed,
            0.0,
            2.0,
            0.01,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Star Brightness",
            shaderParams.distortion,
            0.1,
            5.0,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Star Hue",
            shaderParams.diskSpeed,
            0.0,
            1.0,
            0.01,
            (value) => onShaderParamChange("diskSpeed", value),
            " (0=red, 0.16=yellow, 0.66=blue)"
          )}
          {renderSlider(
            "lensingStrength",
            "Nebula Hue",
            shaderParams.lensingStrength,
            0.0,
            1.0,
            0.01,
            (value) => onShaderParamChange("lensingStrength", value),
            " (0=red, 0.16=yellow, 0.66=blue)"
          )}
        </div>
      )}

      {/* Black Hole-specific Properties */}
      {isBlackHole && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Black Hole Properties
          </h3>
          {renderSlider(
            "intensity",
            "Accretion Disk Intensity",
            shaderParams.intensity,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Disk Rotation Speed",
            shaderParams.speed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Gravitational Lensing",
            shaderParams.distortion,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Disk Speed",
            shaderParams.diskSpeed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("diskSpeed", value)
          )}
          {renderSlider(
            "lensingStrength",
            "Lensing Strength",
            shaderParams.lensingStrength,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("lensingStrength", value)
          )}
          {renderSlider(
            "diskBrightness",
            "Disk Brightness",
            shaderParams.diskBrightness,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("diskBrightness", value)
          )}
        </div>
      )}

      {/* Habitable Planet-specific Properties */}
      {isHabitablePlanet && habitabilityParams && onHabitabilityParamChange && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Habitability Parameters
          </h3>
          {renderSlider(
            "humidity",
            "Humidity",
            habitabilityParams.humidity,
            0,
            100,
            1,
            (value) => onHabitabilityParamChange("humidity", value),
            "%"
          )}
          {renderSlider(
            "temperature",
            "Temperature",
            habitabilityParams.temperature,
            0,
            200,
            1,
            (value) => onHabitabilityParamChange("temperature", value),
            "°C"
          )}
          {renderSlider(
            "population",
            "Population",
            habitabilityParams.population,
            0,
            100,
            1,
            (value) => onHabitabilityParamChange("population", value),
            "%"
          )}
          {renderSlider(
            "volcanism",
            "Volcanism",
            habitabilityParams.volcanism ?? 0,
            0,
            100,
            1,
            (value) => onHabitabilityParamChange("volcanism", value),
            "%"
          )}
          {renderSlider(
            "rotationSpeed",
            "Rotation Speed",
            habitabilityParams.rotationSpeed ?? 0.2,
            0.0,
            2.0,
            0.01,
            (value) => onHabitabilityParamChange("rotationSpeed", value),
            "x"
          )}
          <div className="space-y-2 mb-4">
            <label className="block text-sm text-gray-300">
              Debug Mode
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={habitabilityParams.showTopographicLines ?? false}
                onChange={(e) => onHabitabilityParamChange("showTopographicLines", e.target.checked ? 1 : 0)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                habitabilityParams.showTopographicLines ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  habitabilityParams.showTopographicLines ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="ml-3 text-sm text-gray-300">
                Show Topographic Lines{habitabilityParams.showTopographicLines ? ' (Clouds Off)' : ''}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Shader Properties for planets and other celestial objects */}
      {!isProtostar && !isBlackHole && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">
            Visual Effects
          </h3>
          {renderSlider(
            "intensity",
            "Surface Brightness",
            shaderParams.intensity,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("intensity", value)
          )}
          {renderSlider(
            "speed",
            "Rotation Speed",
            shaderParams.speed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("speed", value)
          )}
          {renderSlider(
            "distortion",
            "Atmospheric Effects",
            shaderParams.distortion,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("distortion", value)
          )}
          {renderSlider(
            "diskSpeed",
            "Cloud Movement",
            shaderParams.diskSpeed,
            0.1,
            5,
            0.1,
            (value) => onShaderParamChange("diskSpeed", value)
          )}
          {renderSlider(
            "lensingStrength",
            "Gravity Warp Effect",
            shaderParams.lensingStrength,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("lensingStrength", value)
          )}
          {renderSlider(
            "diskBrightness",
            "Overall Luminosity",
            shaderParams.diskBrightness,
            0.1,
            3,
            0.1,
            (value) => onShaderParamChange("diskBrightness", value)
          )}
        </div>
      )}

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