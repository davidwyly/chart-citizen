import { describe, it, expect } from 'vitest'
import { basicNebulaVertexShader, basicNebulaFragmentShader } from '../services/basic-nebula-shader'

describe('Spiral Galaxy Shader', () => {
  describe('Shader Source Validation', () => {
    it('should have valid vertex shader source', () => {
      expect(basicNebulaVertexShader).toBeDefined()
      expect(typeof basicNebulaVertexShader).toBe('string')
      expect(basicNebulaVertexShader.length).toBeGreaterThan(0)
      
      // Check for required GLSL components
      expect(basicNebulaVertexShader).toContain('varying vec2 vUv')
      expect(basicNebulaVertexShader).toContain('varying vec3 vPosition')
      expect(basicNebulaVertexShader).toContain('void main()')
      expect(basicNebulaVertexShader).toContain('gl_Position')
      
      console.log('✅ Vertex shader source is valid')
    })

    it('should have valid fragment shader source', () => {
      expect(basicNebulaFragmentShader).toBeDefined()
      expect(typeof basicNebulaFragmentShader).toBe('string')
      expect(basicNebulaFragmentShader.length).toBeGreaterThan(0)
      
      // Check for required GLSL components
      expect(basicNebulaFragmentShader).toContain('precision mediump float')
      expect(basicNebulaFragmentShader).toContain('varying vec2 vUv')
      expect(basicNebulaFragmentShader).toContain('varying vec3 vPosition')
      expect(basicNebulaFragmentShader).toContain('void main()')
      expect(basicNebulaFragmentShader).toContain('gl_FragColor')
      
      console.log('✅ Fragment shader source is valid')
    })

    it('should contain spiral galaxy shader functions', () => {
      // Check for key spiral galaxy functions
      expect(basicNebulaFragmentShader).toContain('Galaxy(')
      expect(basicNebulaFragmentShader).toContain('voronoi_stars(')
      expect(basicNebulaFragmentShader).toContain('multiNoise(')
      expect(basicNebulaFragmentShader).toContain('RadialDistort(')
      expect(basicNebulaFragmentShader).toContain('rotate(')
      expect(basicNebulaFragmentShader).toContain('SelectSegment(')
      
      console.log('✅ Spiral galaxy shader functions are present')
    })

    it('should have required uniforms', () => {
      // Check for required uniform declarations
      expect(basicNebulaFragmentShader).toContain('uniform float time')
      expect(basicNebulaFragmentShader).toContain('uniform float intensity')
      expect(basicNebulaFragmentShader).toContain('uniform vec2 resolution')
      expect(basicNebulaFragmentShader).toContain('uniform vec3 cameraPosition')
      
      console.log('✅ Required uniforms are declared')
    })

    it('should use WebGL 1.0 compatible syntax', () => {
      // Check for WebGL 1.0 compatibility
      expect(basicNebulaFragmentShader).toContain('precision mediump float')
      
      // Should not use WebGL 2.0 specific features
      expect(basicNebulaFragmentShader).not.toContain('in ')
      expect(basicNebulaFragmentShader).not.toContain('out ')
      expect(basicNebulaFragmentShader).not.toContain('texture(')
      
      // Should use WebGL 1.0 loop syntax
      expect(basicNebulaFragmentShader).not.toContain('for (int i = 0; i < 6; ++i)')
      expect(basicNebulaFragmentShader).toContain('for (int i = 0; i < 6; i++)')
      
      console.log('✅ Shader uses WebGL 1.0 compatible syntax')
    })

    it('should have proper color output', () => {
      // Check that the shader outputs color properly
      expect(basicNebulaFragmentShader).toContain('gl_FragColor = vec4(col, 0.8)')
      
      // Check for color processing
      expect(basicNebulaFragmentShader).toContain('bluegrad(')
      expect(basicNebulaFragmentShader).toContain('orangegrad(')
      expect(basicNebulaFragmentShader).toContain('blackbody_grad(')
      
      console.log('✅ Shader has proper color output')
    })
  })

  describe('Shader Constants and Definitions', () => {
    it('should define mathematical constants', () => {
      expect(basicNebulaFragmentShader).toContain('#define PI 3.14159265')
      expect(basicNebulaFragmentShader).toContain('#define TWO_PI 6.2831853')
      
      console.log('✅ Mathematical constants are defined')
    })

    it('should have galaxy parameters', () => {
      // Check for galaxy configuration
      expect(basicNebulaFragmentShader).toContain('twist_amount = 10.0')
      expect(basicNebulaFragmentShader).toContain('centre = vec2(0.25, 0.25)')
      expect(basicNebulaFragmentShader).toContain('centre_radius = 0.18')
      expect(basicNebulaFragmentShader).toContain('radius = 1.3')
      
      console.log('✅ Galaxy parameters are configured')
    })

    it('should have star rendering configuration', () => {
      // Check for star rendering parameters
      expect(basicNebulaFragmentShader).toContain('starscale = 8.5')
      expect(basicNebulaFragmentShader).toContain('starbrightness')
      expect(basicNebulaFragmentShader).toContain('fadeout')
      
      console.log('✅ Star rendering is configured')
    })
  })

  describe('Shader Performance', () => {
    it('should have reasonable complexity', () => {
      const lines = basicNebulaFragmentShader.split('\n').length
      
      // Shader should be complex enough to be interesting but not too complex for performance
      expect(lines).toBeGreaterThan(100)
      expect(lines).toBeLessThan(500)
      
      console.log(`✅ Shader complexity is reasonable: ${lines} lines`)
    })

    it('should have limited loop iterations', () => {
      // Check that loops have reasonable iteration counts
      const loopMatches = basicNebulaFragmentShader.match(/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)/g)
      
      if (loopMatches) {
        loopMatches.forEach(match => {
          const iterationMatch = match.match(/< (\d+)/)
          if (iterationMatch) {
            const iterations = parseInt(iterationMatch[1])
            expect(iterations).toBeLessThanOrEqual(10) // Reasonable limit for real-time rendering
          }
        })
      }
      
      console.log('✅ Loop iterations are within reasonable limits')
    })
  })
}) 