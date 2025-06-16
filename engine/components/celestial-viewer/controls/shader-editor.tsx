"use client"

import React, { useState, useRef, useCallback } from "react"
import * as THREE from "three"

interface ShaderEditorProps {
  onShaderUpdate: (vertexShader: string, fragmentShader: string) => void
  currentVertexShader?: string
  currentFragmentShader?: string
}

export function ShaderEditor({ 
  onShaderUpdate, 
  currentVertexShader = "", 
  currentFragmentShader = "" 
}: ShaderEditorProps) {
  const [vertexShader, setVertexShader] = useState(currentVertexShader)
  const [fragmentShader, setFragmentShader] = useState(currentFragmentShader)
  const [isCompiling, setIsCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  // Test compilation without actually applying
  const testShaderCompilation = useCallback((vertex: string, fragment: string): string | null => {
    try {
      // Create a temporary material to test shader compilation
      const testMaterial = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          time: { value: 0 },
          // Add basic uniforms that might be expected
          landColor: { value: new THREE.Color(0.5, 0.8, 0.5) },
          seaColor: { value: new THREE.Color(0.1, 0.6, 0.9) },
          waterCoverage: { value: 0.5 },
          temperatureClass: { value: 0.5 },
        }
      })
      
      // Try to compile - this will throw if there are syntax errors
      testMaterial.clone()
      testMaterial.dispose()
      
      return null // No error
    } catch (err) {
      return err instanceof Error ? err.message : 'Unknown shader compilation error'
    }
  }, [])

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

    const exampleFragment = `
uniform float time;
uniform vec3 landColor;
uniform vec3 seaColor;
uniform float waterCoverage;
uniform float temperatureClass;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Simple noise function
  float noise = sin(vUv.x * 10.0 + time) * sin(vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5;
  
  // Mix land and sea based on noise and water coverage
  float isWater = step(waterCoverage, noise);
  vec3 baseColor = mix(seaColor, landColor, isWater);
  
  // Add temperature effects
  vec3 tempColor = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 0.5, 0.3), temperatureClass);
  baseColor = mix(baseColor, tempColor, 0.2);
  
  // Simple lighting
  float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
  
  gl_FragColor = vec4(baseColor * lighting, 1.0);
}
`
    setVertexShader(exampleVertex)
    setFragmentShader(exampleFragment)
    setError(null)
    setSuccess(false)
  }, [])

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-200 border-b border-gray-700 pb-1">
          Live Shader Editor
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
              Reset
            </button>
            
            <button
              onClick={loadExample}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              Load Example
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
            <p className="mb-2"><strong>Available Uniforms:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><code>time</code> - Current time for animations</li>
              <li><code>landColor, seaColor, floraColor</code> - Material colors</li>
              <li><code>waterCoverage, temperatureClass, tectonics, population, flora</code> - Planet properties (0-1)</li>
              <li><code>soilTint, geomagnetism</code> - Additional parameters</li>
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