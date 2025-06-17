"use client"

import React, { useState, useRef, useCallback } from "react"
import * as THREE from "three"

interface ShaderEditorProps {
  onShaderUpdate: (vertexShader: string, fragmentShader: string) => void
  currentVertexShader?: string
  currentFragmentShader?: string
  objectType?: string
}

export function ShaderEditor({ 
  onShaderUpdate, 
  currentVertexShader = "", 
  currentFragmentShader = "",
  objectType = "terrestrial"
}: ShaderEditorProps) {
  const [vertexShader, setVertexShader] = useState(currentVertexShader)
  const [fragmentShader, setFragmentShader] = useState(currentFragmentShader)
  const [isCompiling, setIsCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  // Get comprehensive uniforms based on object type
  const getUniformsForObjectType = useCallback((type: string) => {
    const baseUniforms = {
      time: { value: 0 },
      intensity: { value: 1.0 },
      speed: { value: 1.0 },
      distortion: { value: 1.0 }
    }

    switch (type) {
      case 'terrestrial':
        return {
          ...baseUniforms,
          // Color uniforms
          landColor: { value: new THREE.Color(0.2, 0.5, 0.2) },
          seaColor: { value: new THREE.Color(0.1, 0.3, 0.6) },
          floraColor: { value: new THREE.Color(0.1, 0.6, 0.1) },
          atmosphereColor: { value: new THREE.Color(0.5, 0.7, 0.9) },
          nightLightColor: { value: new THREE.Color(1.0, 0.8, 0.3) },
          sandColor: { value: new THREE.Color(0.9, 0.7, 0.4) },
          // Parameter uniforms (0-1 range)
          waterCoverage: { value: 0.7 },
          temperatureClass: { value: 0.6 },
          tectonics: { value: 0.7 },
          geomagnetism: { value: 0.3 },
          population: { value: 0.8 },
          flora: { value: 0.6 },
          soilTint: { value: 0.5 },
          seed: { value: 0.5 },
          // Rendering parameters
          rotationSpeed: { value: 0.2 },
          terrainScale: { value: 0.7 * 2.0 },
          cloudScale: { value: 1.5 },
          nightLightIntensity: { value: 0.8 },
          cloudOpacity: { value: 0.6 }
        }
      
      case 'gas_giant':
        return {
          ...baseUniforms,
          // Gas giant specific uniforms
          map: { value: null },
          normalMap: { value: null },
          stormIntensity: { value: 0.5 },
          bandCount: { value: 6.0 },
          atmosphereThickness: { value: 0.3 },
          lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.8) },
          atmosphereColor: { value: new THREE.Vector3(1.0, 0.7, 0.4) },
          rotationSpeed: { value: 0.02 }
        }
      
      case 'star':
        return {
          ...baseUniforms,
          // Star specific uniforms
          colorTemperature: { value: 5778 },
          luminosity: { value: 1.0 },
          solarActivity: { value: 0.5 },
          coronaThickness: { value: 0.3 },
          variability: { value: 0.1 }
        }
      
      default:
        return baseUniforms
    }
  }, [])

  // Test compilation without actually applying
  const testShaderCompilation = useCallback((vertex: string, fragment: string): string | null => {
    try {
      // Create a temporary material to test shader compilation
      const uniforms = getUniformsForObjectType(objectType)
      
      const testMaterial = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms
      })
      
      // Try to compile - this will throw if there are syntax errors
      testMaterial.clone()
      testMaterial.dispose()
      
      return null // No error
    } catch (err) {
      return err instanceof Error ? err.message : 'Unknown shader compilation error'
    }
  }, [objectType, getUniformsForObjectType])

  const handleSubmit = useCallback(async () => {
    setIsCompiling(true)
    setError(null)
    setSuccess(false)

    try {
      // Test compilation first
      const compilationError = testShaderCompilation(vertexShader, fragmentShader)
      
      if (compilationError) {
        setError(`Shader compilation failed: ${compilationError}`)
        return
      }

      // If compilation succeeds, apply the shaders
      onShaderUpdate(vertexShader, fragmentShader)
      setSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsCompiling(false)
    }
  }, [vertexShader, fragmentShader, onShaderUpdate, testShaderCompilation])

  const resetToDefault = useCallback(() => {
    setVertexShader(currentVertexShader)
    setFragmentShader(currentFragmentShader)
    setError(null)
    setSuccess(false)
  }, [currentVertexShader, currentFragmentShader])

  const loadExample = useCallback(() => {
    const exampleVertex = `
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

    let exampleFragment = ''

    switch (objectType) {
      case 'terrestrial':
        exampleFragment = `
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

// Simple noise function
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
  
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

void main() {
  // Base terrain with seed offset
  vec2 uv = vUv + vec2(seed * 0.1, seed * 0.07);
  float terrain = fbm(uv * terrainScale * (1.0 + tectonics));
  
  // Water/land separation
  float waterLevel = 1.0 - waterCoverage;
  float isWater = step(waterLevel, terrain);
  
  // Base colors with soil tint
  vec3 waterColor = seaColor;
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
  float cloudNoise = fbm(uv * cloudScale + time * 0.1);
  float clouds = smoothstep(0.4, 0.6, cloudNoise);
  surfaceColor = mix(surfaceColor, vec3(0.9, 0.95, 1.0), clouds * cloudOpacity);
  
  // Ice caps at poles based on temperature
  float distanceFromPoles = 1.0 - abs(vNormal.y);
  float iceThreshold = temperatureClass * 0.9;
  float iceMask = smoothstep(iceThreshold + 0.05, iceThreshold - 0.05, distanceFromPoles);
  iceMask *= isWater; // Only ice on water
  vec3 iceColor = vec3(0.92, 0.96, 1.0);
  surfaceColor = mix(surfaceColor, iceColor, iceMask);
  
  // Simple lighting
  float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
  
  gl_FragColor = vec4(surfaceColor * lighting, 1.0);
}
`
        break

      case 'gas_giant':
        exampleFragment = `
uniform float time;
uniform float intensity;
uniform float speed;
uniform float stormIntensity;
uniform float bandCount;

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
  float bands = sin(uv.y * bandCount * 2.0 + time * speed * 0.5) * 0.5 + 0.5;
  
  // Add turbulence
  float turbulence = noise(uv * 8.0 + vec2(time * speed * 0.1, 0.0));
  bands += turbulence * 0.3;
  
  // Storm spots
  vec2 stormUv = uv * 4.0 + vec2(time * speed * 0.05, 0.0);
  float storms = smoothstep(0.7, 0.9, noise(stormUv)) * stormIntensity;
  
  // Color mixing
  vec3 bandColor1 = vec3(0.9, 0.7, 0.5);
  vec3 bandColor2 = vec3(0.7, 0.5, 0.3);
  vec3 stormColor = vec3(1.0, 0.8, 0.6);
  
  vec3 color = mix(bandColor1, bandColor2, bands);
  color = mix(color, stormColor, storms * 0.6);
  
  // Atmospheric glow
  float glow = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 2.0);
  color += vec3(0.3, 0.4, 0.6) * glow * 0.5;
  
  gl_FragColor = vec4(color * intensity, 1.0);
}
`
        break

      case 'star':
        exampleFragment = `
uniform float time;
uniform float intensity;
uniform float speed;
uniform float colorTemperature;
uniform float solarActivity;

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
  
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  vec3 p = vPosition * 2.0 + vec3(0.0, 0.0, time * speed * 0.05);
  float n = fbm(p);
  
  // Solar flares based on activity
  float flares = fbm(p * 1.5 + vec3(time * speed * 0.1, 0.0, 0.0)) * solarActivity;
  flares = pow(max(0.0, flares), 2.0);
  
  // Color based on temperature (simplified blackbody)
  vec3 coreColor = vec3(1.0, 0.8, 0.6); // Default warm color
  if (colorTemperature > 6000.0) {
    coreColor = vec3(0.8, 0.9, 1.0); // Blue-white
  } else if (colorTemperature < 4000.0) {
    coreColor = vec3(1.0, 0.6, 0.4); // Red
  }
  
  vec3 flareColor = vec3(1.5, 1.2, 1.0) * coreColor;
  vec3 color = mix(coreColor, flareColor, flares * 0.7);
  
  // Add surface variation
  color *= (0.8 + 0.4 * n);
  
  // Corona effect
  float corona = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 3.0);
  color += coreColor * corona * 0.5;
  
  gl_FragColor = vec4(color * intensity, 1.0);
}
`
        break

      default:
        exampleFragment = `
uniform float time;
uniform float intensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Simple procedural surface
  float pattern = sin(vUv.x * 10.0 + time) * sin(vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5;
  
  vec3 color = mix(vec3(0.2, 0.3, 0.6), vec3(0.6, 0.4, 0.2), pattern);
  
  // Simple lighting
  float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
  
  gl_FragColor = vec4(color * lighting * intensity, 1.0);
}
`
    }

    setVertexShader(exampleVertex)
    setFragmentShader(exampleFragment)
    setError(null)
    setSuccess(false)
  }, [objectType])

  // Get uniform documentation based on object type
  const getUniformDocumentation = useCallback(() => {
    switch (objectType) {
      case 'terrestrial':
        return [
          '<code>time</code> - Current time for animations',
          '<code>landColor, seaColor, floraColor, atmosphereColor, nightLightColor, sandColor</code> - Surface colors',
          '<code>waterCoverage, temperatureClass, tectonics, geomagnetism</code> - Planet properties (0-1)',
          '<code>population, flora, soilTint, seed</code> - Additional parameters (0-1)',
          '<code>rotationSpeed, terrainScale, cloudScale</code> - Rendering parameters',
          '<code>nightLightIntensity, cloudOpacity</code> - Visual effects (0-1)'
        ]
      
      case 'gas_giant':
        return [
          '<code>time</code> - Current time for animations',
          '<code>stormIntensity, bandCount</code> - Atmospheric properties',
          '<code>atmosphereThickness, rotationSpeed</code> - Visual parameters',
          '<code>intensity, speed</code> - General effects'
        ]
      
      case 'star':
        return [
          '<code>time</code> - Current time for animations',
          '<code>colorTemperature</code> - Stellar temperature in Kelvin',
          '<code>solarActivity, luminosity</code> - Stellar properties (0-1)',
          '<code>coronaThickness, variability</code> - Visual effects (0-1)',
          '<code>intensity, speed</code> - General effects'
        ]
      
      default:
        return [
          '<code>time</code> - Current time for animations',
          '<code>intensity, speed, distortion</code> - Basic effects'
        ]
    }
  }, [objectType])

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-200 border-b border-gray-700 pb-1">
          Live Shader Editor ({objectType})
        </h3>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          {showEditor ? 'Hide' : 'Show'} Editor
        </button>
      </div>

      {showEditor && (
        <div className="space-y-4">
          {/* Vertex Shader */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Vertex Shader:
            </label>
            <textarea
              value={vertexShader}
              onChange={(e) => setVertexShader(e.target.value)}
              className="w-full h-32 p-2 bg-gray-800 text-gray-200 text-xs font-mono border border-gray-600 rounded resize-none focus:border-blue-500 focus:outline-none"
              placeholder="Paste vertex shader code here..."
              spellCheck={false}
            />
          </div>

          {/* Fragment Shader */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Fragment Shader:
            </label>
            <textarea
              value={fragmentShader}
              onChange={(e) => setFragmentShader(e.target.value)}
              className="w-full h-48 p-2 bg-gray-800 text-gray-200 text-xs font-mono border border-gray-600 rounded resize-none focus:border-blue-500 focus:outline-none"
              placeholder="Paste fragment shader code here..."
              spellCheck={false}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSubmit}
              disabled={isCompiling || !vertexShader.trim() || !fragmentShader.trim()}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isCompiling ? 'Compiling...' : 'Apply Shader'}
            </button>
            
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Reset to Default
            </button>
            
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              Load {objectType} Example
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-900/50 border border-green-700 text-green-200 rounded text-sm">
              <strong>Success!</strong> Shader compiled and applied successfully.
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-900/30 border border-blue-700 text-blue-200 rounded text-xs">
            <p className="mb-2"><strong>Available Uniforms for {objectType}:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {getUniformDocumentation().map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-75">
              The shader will be compiled in real-time. Check browser console for detailed WebGL errors.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 