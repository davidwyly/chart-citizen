/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { HabitablePlanetMaterial } from '../habitable-planet-material'

describe('Shader Compilation Tests', () => {
  describe('HabitablePlanetMaterial', () => {
    it('should create material without errors', () => {
      expect(() => {
        const material = new HabitablePlanetMaterial({
          time: 0,
          humidity: 50,
          temperature: 50,
          population: 30
        })
        expect(material).toBeDefined()
        expect(material.type).toBe('ShaderMaterial')
      }).not.toThrow()
    })

    it('should have all required uniforms', () => {
      const material = new HabitablePlanetMaterial({
        time: 0,
        humidity: 50,
        temperature: 50,
        population: 30
      })

      const requiredUniforms = [
        'time',
        'landColor',
        'seaColor',
        'sandColor',
        'snowColor',
        'atmosphereColor',
        'cloudColor',
        'cityLightColor',
        'lightDirection',
        'humidity',
        'temperature',
        'population'
      ]

      requiredUniforms.forEach(uniform => {
        expect(material.uniforms[uniform]).toBeDefined()
      })
    })

    it('should accept habitability parameter updates', () => {
      const material = new HabitablePlanetMaterial({})

      // Set initial values
      material.uniforms.humidity.value = 25
      material.uniforms.temperature.value = 75
      material.uniforms.population.value = 90

      expect(material.uniforms.humidity.value).toBe(25)
      expect(material.uniforms.temperature.value).toBe(75)
      expect(material.uniforms.population.value).toBe(90)

      // Update values
      material.uniforms.humidity.value = 80
      material.uniforms.temperature.value = 20
      material.uniforms.population.value = 10

      expect(material.uniforms.humidity.value).toBe(80)
      expect(material.uniforms.temperature.value).toBe(20)
      expect(material.uniforms.population.value).toBe(10)
    })

    it('should have valid vertex shader', () => {
      const material = new HabitablePlanetMaterial({})
      
      expect(material.vertexShader).toBeDefined()
      expect(material.vertexShader.length).toBeGreaterThan(0)
      
      // Check for essential vertex shader components
      expect(material.vertexShader).toContain('void main()')
      expect(material.vertexShader).toContain('gl_Position')
      expect(material.vertexShader).toContain('vNormal')
      expect(material.vertexShader).toContain('vUv')
    })

    it('should have valid fragment shader', () => {
      const material = new HabitablePlanetMaterial({})
      
      expect(material.fragmentShader).toBeDefined()
      expect(material.fragmentShader.length).toBeGreaterThan(0)
      
      // Check for essential fragment shader components
      expect(material.fragmentShader).toContain('void main()')
      expect(material.fragmentShader).toContain('gl_FragColor')
      
      // Check for our custom functions
      expect(material.fragmentShader).toContain('perlin_noise3')
      expect(material.fragmentShader).toContain('hash3_3')
      expect(material.fragmentShader).toContain('sdWeirdSphere')
      expect(material.fragmentShader).toContain('mountainRanges')
      expect(material.fragmentShader).toContain('getElevationAdjustedClimate')
      expect(material.fragmentShader).toContain('getWaterLevel')
      expect(material.fragmentShader).toContain('getTopographicLines')
      expect(material.fragmentShader).toContain('height')
      expect(material.fragmentShader).toContain('terrain')
      expect(material.fragmentShader).toContain('color')
      expect(material.fragmentShader).toContain('cloud')
      expect(material.fragmentShader).toContain('nightLight')
      expect(material.fragmentShader).toContain('earth')
    })

    it('should not contain problematic shader declarations', () => {
      const material = new HabitablePlanetMaterial({})
      
      // Should not redeclare built-in uniforms
      expect(material.fragmentShader).not.toContain('uniform vec3 cameraPosition;')
      expect(material.fragmentShader).not.toContain('uniform mat4 modelMatrix;')
      expect(material.fragmentShader).not.toContain('uniform mat4 viewMatrix;')
      expect(material.fragmentShader).not.toContain('uniform mat4 projectionMatrix;')
    })

    it('should work with different quality levels', () => {
      const lowQuality = new HabitablePlanetMaterial({})
      const highQuality = new HabitablePlanetMaterial({})

      // Set quality levels manually
      lowQuality.uniforms.qualityLevel.value = 2
      lowQuality.uniforms.showClouds.value = false
      lowQuality.uniforms.showNightLights.value = false

      highQuality.uniforms.qualityLevel.value = 8
      highQuality.uniforms.showClouds.value = true
      highQuality.uniforms.showNightLights.value = true

      expect(lowQuality.uniforms.qualityLevel.value).toBe(2)
      expect(lowQuality.uniforms.showClouds.value).toBe(false)
      expect(lowQuality.uniforms.showNightLights.value).toBe(false)

      expect(highQuality.uniforms.qualityLevel.value).toBe(8)
      expect(highQuality.uniforms.showClouds.value).toBe(true)
      expect(highQuality.uniforms.showNightLights.value).toBe(true)
    })

    it('should support topographic lines debug mode', () => {
      const material = new HabitablePlanetMaterial({})
      
      // Test default state
      expect(material.uniforms.showTopographicLines.value).toBe(false)
      
      // Test enabling topographic lines
      material.uniforms.showTopographicLines.value = true
      expect(material.uniforms.showTopographicLines.value).toBe(true)
      
      // Check that topographic function exists in shader
      expect(material.fragmentShader).toContain('getTopographicLines')
      expect(material.fragmentShader).toContain('showTopographicLines')
      expect(material.fragmentShader).toContain('contourInterval')
      expect(material.fragmentShader).toContain('majorInterval')
    })
  })

  describe('Shader Syntax Validation', () => {
    it('should have balanced braces in fragment shader', () => {
      const material = new HabitablePlanetMaterial({})
      const shader = material.fragmentShader
      
      const openBraces = (shader.match(/{/g) || []).length
      const closeBraces = (shader.match(/}/g) || []).length
      
      expect(openBraces).toBe(closeBraces)
    })

    it('should have balanced parentheses in fragment shader', () => {
      const material = new HabitablePlanetMaterial({})
      const shader = material.fragmentShader
      
      const openParens = (shader.match(/\(/g) || []).length
      const closeParens = (shader.match(/\)/g) || []).length
      
      expect(openParens).toBe(closeParens)
    })

    it('should not have common GLSL syntax errors', () => {
      const material = new HabitablePlanetMaterial({})
      const shader = material.fragmentShader
      
      // Check for common errors
      expect(shader).not.toContain(';;') // Double semicolons
      expect(shader).not.toContain('uniform uniform') // Duplicate keywords
      expect(shader).not.toContain('varying varying') // Duplicate keywords
      expect(shader).not.toMatch(/\bfloat\s+float\b/) // Duplicate types
      expect(shader).not.toMatch(/\bvec3\s+vec3\b/) // Duplicate types
    })

    it('should have proper function declarations', () => {
      const material = new HabitablePlanetMaterial({})
      const shader = material.fragmentShader
      
      // Check that all functions have proper signatures
      const functionDeclarations = [
        /vec3\s+hash3_3\s*\(\s*vec3\s+\w+\s*\)/,
        /float\s+perlin_noise3\s*\(\s*vec3\s+\w+\s*\)/,
        /float\s+sdSphere\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*\)/,
        /float\s+sdWeirdSphere\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*\)/,
        /float\s+mountainRanges\s*\(\s*vec3\s+\w+\s*\)/,
        /vec2\s+getElevationAdjustedClimate\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*\)/,
        /float\s+getWaterLevel\s*\(\s*\)/,
        /float\s+getTopographicLines\s*\(\s*float\s+\w+\s*\)/,
        /float\s+height\s*\(\s*vec3\s+\w+\s*\)/,
        /vec2\s+terrain\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*\)/,
        /vec3\s+color\s*\(\s*vec3\s+\w+\s*,\s*vec2\s+\w+\s*,\s*float\s+\w+\s*\)/,
        /float\s+cloud\s*\(\s*vec3\s+\w+\s*\)/,
        /float\s+nightLight\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*,\s*vec2\s+\w+\s*\)/,
        /vec3\s+earth\s*\(\s*vec2\s+\w+\s*\)/
      ]

      functionDeclarations.forEach(pattern => {
        expect(shader).toMatch(pattern)
      })
    })

    it('should have proper uniform declarations', () => {
      const material = new HabitablePlanetMaterial({})
      const shader = material.fragmentShader
      
      // Check for required uniform declarations
      expect(shader).toMatch(/uniform\s+float\s+time;/)
      expect(shader).toMatch(/uniform\s+float\s+humidity;/)
      expect(shader).toMatch(/uniform\s+float\s+temperature;/)
      expect(shader).toMatch(/uniform\s+float\s+population;/)
      expect(shader).toMatch(/uniform\s+vec3\s+lightDirection;/)
      expect(shader).toMatch(/uniform\s+bool\s+showClouds;/)
      expect(shader).toMatch(/uniform\s+bool\s+showNightLights;/)
      expect(shader).toMatch(/uniform\s+bool\s+showTopographicLines;/)
      expect(shader).toMatch(/uniform\s+float\s+volcanism;/)
    })

    it('should have proper varying declarations', () => {
      const material = new HabitablePlanetMaterial({})
      const vertexShader = material.vertexShader
      const fragmentShader = material.fragmentShader
      
      // Check that varyings are declared in both shaders with correct types
      const vec3Varyings = ['vNormal', 'vPosition', 'vWorldPosition']
      const vec2Varyings = ['vUv']
      
      vec3Varyings.forEach(varying => {
        expect(vertexShader).toMatch(new RegExp(`varying\\s+vec3\\s+${varying};`))
        expect(fragmentShader).toMatch(new RegExp(`varying\\s+vec3\\s+${varying};`))
      })

      vec2Varyings.forEach(varying => {
        expect(vertexShader).toMatch(new RegExp(`varying\\s+vec2\\s+${varying};`))
        expect(fragmentShader).toMatch(new RegExp(`varying\\s+vec2\\s+${varying};`))
      })
    })
  })
}) 