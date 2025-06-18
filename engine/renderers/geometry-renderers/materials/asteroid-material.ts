"use client"

import * as THREE from "three"

// Custom asteroid material with surface variation
export class AsteroidMaterial extends THREE.ShaderMaterial {
  constructor(baseColor: string = "#666666", options: {
    metalness?: number
    roughness?: number
    emissiveIntensity?: number
  } = {}) {
    const {
      metalness = 0.3,
      roughness = 0.9,
      emissiveIntensity = 0.05
    } = options

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      // Simple noise function for surface variation
      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        
        // Add subtle surface displacement for irregular asteroid shape
        vec3 displaced = position + normal * noise(position * 10.0) * 0.02;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `

    const fragmentShader = `
      uniform vec3 baseColor;
      uniform float metalness;
      uniform float roughness;
      uniform float emissiveIntensity;
      uniform vec3 lightDirection;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      // Simple noise function
      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      void main() {
        vec3 normal = normalize(vNormal);
        
        // Create surface variation using noise
        float surfaceNoise = noise(vPosition * 20.0);
        float metallicVeins = noise(vPosition * 50.0);
        
        // Vary the base color based on surface composition
        vec3 rockColor = baseColor * (0.8 + surfaceNoise * 0.4);
        vec3 metalColor = mix(rockColor, vec3(0.6, 0.5, 0.4), metallicVeins * metalness);
        
        // Simple lighting calculation
        float NdotL = max(dot(normal, normalize(lightDirection)), 0.1);
        
        // Apply Fresnel-like effect for realism
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
        
        // Combine lighting
        vec3 finalColor = metalColor * NdotL;
        finalColor += metalColor * emissiveIntensity; // Self-illumination
        finalColor += fresnel * 0.1; // Subtle rim lighting
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        metalness: { value: metalness },
        roughness: { value: roughness },
        emissiveIntensity: { value: emissiveIntensity },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() }
      }
    })
  }

  // Method to update the light direction based on star position
  updateLightDirection(starPosition: THREE.Vector3) {
    this.uniforms.lightDirection.value.copy(starPosition).normalize()
  }

  // Method to update base color
  updateBaseColor(color: string) {
    this.uniforms.baseColor.value.set(color)
  }
} 