import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"
import { extend } from "@react-three/fiber"

export const PlanetRingsMaterial = shaderMaterial(
  {
    time: 0.0,
    ringColor: new THREE.Color(0.8, 0.8, 0.8),
    ringTransparency: 0.7,
    innerRadius: 1.2,
    outerRadius: 2.0,
    noiseScale: 0.5,
    noiseStrength: 0.2,
    dustDensity: 0.7,
    ringDivisions: 6.0,
    lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
    shadowIntensity: 0.5,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec3 ringColor;
    uniform float ringTransparency;
    uniform float innerRadius;
    uniform float outerRadius;
    uniform float noiseScale;
    uniform float noiseStrength;
    uniform float dustDensity;
    uniform float ringDivisions;
    uniform vec3 lightDirection;
    uniform float shadowIntensity;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // Hash function for noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    // 2D noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      return mix(
        mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
        mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
        f.y
      );
    }
    
    // Fractional Brownian Motion
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    void main() {
      // Calculate distance from center
      float dist = length(vPosition.xy);
      
      // Normalize distance to ring range [0, 1]
      float normDist = (dist - innerRadius) / (outerRadius - innerRadius);
      
      // Early discard if outside ring boundaries
      if (normDist < 0.0 || normDist > 1.0) {
        discard;
      }
      
      // Angular coordinate for noise variation
      float angle = atan(vPosition.y, vPosition.x);
      
      // Noise coordinates based on distance and angle
      vec2 noiseCoord = vec2(
        angle * 3.0,
        normDist * 20.0 + time * 0.05
      );
      
      // Generate noise for ring structure
      float ringNoise = fbm(noiseCoord * noiseScale);
      
      // Create multiple ring divisions
      float rings = sin(normDist * ringDivisions * 3.14159 * 2.0) * 0.5 + 0.5;
      rings = smoothstep(0.4, 0.6, rings);
      
      // Combine noise with rings for natural variation
      float ringDensity = mix(0.6, 1.0, rings);
      ringDensity *= 1.0 - (ringNoise * noiseStrength);
      
      // Add dust density falloff toward edges
      float edgeFalloff = sin(normDist * 3.14159);
      ringDensity *= edgeFalloff * dustDensity;
      
      // Lighting - simple diffuse lighting
      vec3 lightDir = normalize(lightDirection);
      float lightIntensity = max(dot(vNormal, lightDir), 0.0) * 0.7 + 0.3;
      
      // Calculate final color
      vec3 color = ringColor * lightIntensity * ringDensity;
      
      // Calculate opacity with density variation
      float alpha = ringDensity * ringTransparency;
      
      // Add subtle motion to the rings
      float timeOffset = sin(time * 0.1 + dist * 0.5) * 0.1;
      color *= 1.0 + timeOffset;
      
      // Divisions between rings - create small gaps
      float ringGaps = smoothstep(0.48, 0.52, fract(normDist * ringDivisions));
      alpha *= ringGaps * 0.8 + 0.2;
      
      // Output final color
      gl_FragColor = vec4(color, alpha);
    }
  `
)

// Extend React Three Fiber with the material
extend({ PlanetRingsMaterial })

// Helper function to create ring material with custom properties
export function createPlanetRingsMaterial(params: {
  ringColor?: THREE.Color,
  transparency?: number,
  innerRadius?: number,
  outerRadius?: number,
  noiseScale?: number,
  noiseStrength?: number,
  dustDensity?: number,
  divisions?: number,
  shadowIntensity?: number
} = {}) {
  return new PlanetRingsMaterial({
    ringColor: params.ringColor || new THREE.Color(0.8, 0.8, 0.8),
    ringTransparency: params.transparency || 0.7,
    innerRadius: params.innerRadius || 1.2,
    outerRadius: params.outerRadius || 2.0,
    noiseScale: params.noiseScale || 0.5,
    noiseStrength: params.noiseStrength || 0.2,
    dustDensity: params.dustDensity || 0.7,
    ringDivisions: params.divisions || 6.0,
    shadowIntensity: params.shadowIntensity || 0.5
  })
} 