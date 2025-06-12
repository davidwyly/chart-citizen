import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { EffectsLevel } from '@lib/types/effects-level'

// Noise functions
const hash = (n: number): number => {
  return Math.sin(n) * 43758.5453123
}

const noise = (p: THREE.Vector2): number => {
  const i = Math.floor(p.x)
  const f = p.x - i
  const u = f * f * (3.0 - 2.0 * f)
  const v = p.y
  const a = hash(i)
  const b = hash(i + 1.0)
  return mix(a, b, u) * v
}

const mix = (a: number, b: number, t: number): number => {
  return a + (b - a) * t
}

const fbm = (p: THREE.Vector2, iterations: number): number => {
  let value = 0.0
  let amplitude = 0.5
  let frequency = 1.0
  
  for (let i = 0; i < iterations; i++) {
    value += amplitude * noise(new THREE.Vector2(p.x * frequency, p.y * frequency))
    amplitude *= 0.5
    frequency *= 2.0
  }
  
  return value
}

// Vertex shader
const vertexShader = `
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

// Fragment shader with quality levels
const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform float speed;
  uniform float distortion;
  uniform vec3 topColor;
  uniform vec3 middleColor;
  uniform vec3 bottomColor;
  uniform int qualityLevel;
  
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
  
  float fbm(vec2 p, int iterations) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 8; i++) {
      if (i >= iterations) break;
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    // Base terrain
    vec2 uv = vUv;
    float terrain = fbm(uv * 4.0, qualityLevel);
    
    // Clouds
    float cloudNoise = fbm(uv * 2.0 + time * speed * 0.1, qualityLevel);
    float clouds = smoothstep(0.4, 0.6, cloudNoise);
    
    // Ocean mask
    float oceanMask = smoothstep(0.3, 0.7, terrain);
    
    // Color mixing
    vec3 color = mix(bottomColor, middleColor, terrain);
    color = mix(color, topColor, clouds * intensity);
    
    // Ocean effect
    float oceanFactor = 1.0 - oceanMask;
    vec3 oceanColor = mix(bottomColor, middleColor, 0.5);
    color = mix(color, oceanColor, oceanFactor);
    
    // Lighting
    float diffuse = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    color *= 0.5 + 0.5 * diffuse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export class TerrestrialPlanetMaterial extends THREE.ShaderMaterial {
  constructor(qualityLevel: EffectsLevel = 'high') {
    const iterations = qualityLevel === 'high' ? 8 : qualityLevel === 'medium' ? 4 : 2
    
    super({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: new THREE.Color(0.8, 0.8, 0.8) }, // Cloud color
        middleColor: { value: new THREE.Color(0.2, 0.5, 0.2) }, // Land color
        bottomColor: { value: new THREE.Color(0.1, 0.2, 0.5) }, // Ocean color
        qualityLevel: { value: iterations }
      },
      vertexShader,
      fragmentShader
    })
  }
}

// Extend React Three Fiber with the new material
extend({ TerrestrialPlanetMaterial }) 