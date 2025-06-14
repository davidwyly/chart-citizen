/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { TerrestrialPlanetMaterial } from '../terrestrial-planet-material'
import * as THREE from 'three'

describe('Shader Compilation Tests', () => {
  describe('TerrestrialPlanetMaterial', () => {
    it('should create material without errors', () => {
      expect(() => {
        const material = new TerrestrialPlanetMaterial({
          time: 0,
          planetRadius: 1.0,
          landColor: new THREE.Color(0.05, 0.4, 0.05),
          seaColor: new THREE.Color(0.0, 0.18, 0.45),
          sandColor: new THREE.Color(0.9, 0.66, 0.3),
          snowColor: new THREE.Color(1.0, 1.0, 1.0),
          atmosphereColor: new THREE.Color(0.05, 0.8, 1.0),
          lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
          rotationSpeed: 0.2,
          terrainScale: 2.0,
          cloudScale: 1.5,
          nightLightIntensity: 0.8,
          cloudOpacity: 0.6,
        })
        expect(material).toBeDefined()
        expect(material.type).toBe('ShaderMaterial')
      }).not.toThrow()
    })

    it('should have all required uniforms', () => {
      const material = new TerrestrialPlanetMaterial({})

      const requiredUniforms = [
        'time',
        'planetRadius',
        'landColor',
        'seaColor',
        'sandColor',
        'snowColor',
        'atmosphereColor',
        'lightDirection',
        'rotationSpeed',
        'terrainScale',
        'cloudScale',
        'nightLightIntensity',
        'cloudOpacity',
      ]

      requiredUniforms.forEach(uniform => {
        expect(material.uniforms[uniform]).toBeDefined()
      })
    })

    it('should accept parameter updates', () => {
      const material = new TerrestrialPlanetMaterial({})

      material.uniforms.rotationSpeed.value = 0.5
      material.uniforms.terrainScale.value = 3.0
      material.uniforms.cloudScale.value = 2.0
      material.uniforms.nightLightIntensity.value = 0.5
      material.uniforms.cloudOpacity.value = 0.7

      expect(material.uniforms.rotationSpeed.value).toBe(0.5)
      expect(material.uniforms.terrainScale.value).toBe(3.0)
      expect(material.uniforms.cloudScale.value).toBe(2.0)
      expect(material.uniforms.nightLightIntensity.value).toBe(0.5)
      expect(material.uniforms.cloudOpacity.value).toBe(0.7)
    })

    it('should have valid vertex shader', () => {
      const material = new TerrestrialPlanetMaterial({})
      
      expect(material.vertexShader).toBeDefined()
      expect(material.vertexShader.length).toBeGreaterThan(0)
      
      expect(material.vertexShader).toContain('void main()')
      expect(material.vertexShader).toContain('gl_Position')
      expect(material.vertexShader).toContain('vNormal')
      expect(material.vertexShader).toContain('vPosition')
    })

    it('should have valid fragment shader', () => {
      const material = new TerrestrialPlanetMaterial({})
      
      expect(material.fragmentShader).toBeDefined()
      expect(material.fragmentShader.length).toBeGreaterThan(0)
      
      expect(material.fragmentShader).toContain('void main()')
      expect(material.fragmentShader).toContain('gl_FragColor')
      
      expect(material.fragmentShader).toContain('perlin_noise3')
      expect(material.fragmentShader).toContain('hash3_3')
      expect(material.fragmentShader).toContain('sdWeirdSphere')
      expect(material.fragmentShader).toContain('height')
      expect(material.fragmentShader).toContain('terrain')
      expect(material.fragmentShader).toContain('getTerrainColor')
      expect(material.fragmentShader).toContain('cloud')
      expect(material.fragmentShader).toContain('nightLight')
    })

    it('should not contain problematic shader declarations', () => {
      const material = new TerrestrialPlanetMaterial({})
      
      expect(material.fragmentShader).not.toContain(';;')
      expect(material.fragmentShader).not.toContain('uniform uniform')
      expect(material.fragmentShader).not.toContain('varying varying')
      expect(material.fragmentShader).not.toMatch(/\bfloat\s+float\b/)
      expect(material.fragmentShader).not.toMatch(/\bvec3\s+vec3\b/)
    })
  })

  describe('Shader Syntax Validation', () => {
    it('should have balanced braces in fragment shader', () => {
      const material = new TerrestrialPlanetMaterial({})
      const shader = material.fragmentShader
      
      const openBraces = (shader.match(/{/g) || []).length
      const closeBraces = (shader.match(/}/g) || []).length
      
      expect(openBraces).toBe(closeBraces)
    })

    it('should have balanced parentheses in fragment shader', () => {
      const material = new TerrestrialPlanetMaterial({})
      const shader = material.fragmentShader
      
      const openParens = (shader.match(/\(/g) || []).length
      const closeParens = (shader.match(/\)/g) || []).length
      
      expect(openParens).toBe(closeParens)
    })

    it('should not have common GLSL syntax errors', () => {
      const material = new TerrestrialPlanetMaterial({})
      const shader = material.fragmentShader
      
      expect(shader).not.toContain(';;')
      expect(shader).not.toContain('uniform uniform')
      expect(shader).not.toContain('varying varying')
      expect(shader).not.toMatch(/\bfloat\s+float\b/)
      expect(shader).not.toMatch(/\bvec3\s+vec3\b/)
    })

    it('should have proper function declarations', () => {
      const material = new TerrestrialPlanetMaterial({})
      const shader = material.fragmentShader
      
      const functionDeclarations = [
        'hash3_3',
        'perlin_noise3',
        'sdWeirdSphere',
        'height',
        'terrain',
        'getTerrainColor',
        'spiral',
        'pos3to2',
        'pos2to3',
        'cloud',
        'nightLight',
      ]

      functionDeclarations.forEach(func => {
        expect(shader).toContain(`float ${func}(`)
      })
    })
  })
}) 