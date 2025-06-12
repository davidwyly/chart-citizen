import * as THREE from "three"
import { extend } from "@react-three/fiber"

// Noise functions
const noiseFunctions = `
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}
`

// Utility functions
const utilityFunctions = `
vec3 saturate(vec3 x) {
    return clamp(x, vec3(0.0), vec3(1.0));
}

vec4 cubic(float x) {
    float x2 = x * x;
    float x3 = x2 * x;
    vec4 w;
    w.x = -x3 + 3.0*x2 - 3.0*x + 1.0;
    w.y = 3.0*x3 - 6.0*x2 + 4.0;
    w.z = -3.0*x3 + 3.0*x2 + 3.0*x + 1.0;
    w.w = x3;
    return w / 6.0;
}

vec3 getAccretionDisk(vec2 uv, float time) {
    vec2 p = uv * 2.0 - 1.0;
    float dist = length(p);
    
    // Create swirling effect
    float angle = atan(p.y, p.x);
    float swirl = sin(angle * 8.0 + time * 0.5) * 0.5 + 0.5;
    
    // Create disk structure
    float disk = smoothstep(0.8, 0.2, dist) * smoothstep(0.0, 0.2, dist);
    
    // Add noise for texture
    float noise = fbm(p * 4.0 + time * 0.1);
    
    // Combine effects
    float final = disk * (swirl * 0.5 + 0.5) * (noise * 0.3 + 0.7);
    
    // Color the disk
    vec3 color = mix(
        vec3(1.0, 0.3, 0.1), // Inner hot color
        vec3(0.1, 0.1, 0.3), // Outer cool color
        dist
    );
    
    return color * final;
}

vec3 getEventHorizon(vec2 uv) {
    vec2 p = uv * 2.0 - 1.0;
    float dist = length(p);
    
    // Create the black hole effect
    float horizon = smoothstep(0.0, 0.1, dist) * smoothstep(0.2, 0.1, dist);
    
    // Add gravitational lensing effect
    float lensing = smoothstep(0.1, 0.2, dist) * (1.0 - smoothstep(0.2, 0.3, dist));
    
    return vec3(0.0) * horizon + vec3(0.1) * lensing;
}
`

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normal;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float time;
uniform float intensity;
uniform float speed;
uniform float distortion;
uniform vec3 topColor;
uniform vec3 midColor1;
uniform vec3 midColor2;
uniform vec3 midColor3;
uniform vec3 bottomColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

${noiseFunctions}
${utilityFunctions}

void main() {
    // Calculate base position and normal
    vec2 uv = vUv;
    vec3 normal = normalize(vNormal);
    
    // Get accretion disk
    vec3 disk = getAccretionDisk(uv, time * speed);
    
    // Get event horizon
    vec3 horizon = getEventHorizon(uv);
    
    // Combine effects
    vec3 color = mix(horizon, disk, intensity);
    
    // Add gravitational lensing
    float lensing = smoothstep(0.0, 0.5, length(uv - 0.5)) * (1.0 - smoothstep(0.5, 1.0, length(uv - 0.5)));
    color += vec3(0.1, 0.2, 0.3) * lensing * distortion;
    
    // Tonemapping
    color = pow(color, vec3(1.5));
    color = color / (1.0 + color);
    color = pow(color, vec3(1.0 / 1.5));
    
    // Color grading
    color = mix(color, color * color * (3.0 - 2.0 * color), vec3(1.0));
    color = pow(color, vec3(1.3, 1.20, 1.0));
    color = saturate(color * 1.01);
    color = pow(color, vec3(0.7 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
}
`

class BlackHoleMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        distortion: { value: 1.0 },
        topColor: { value: new THREE.Color(1.0, 0.3, 0.1) },
        midColor1: { value: new THREE.Color(0.8, 0.2, 0.1) },
        midColor2: { value: new THREE.Color(0.4, 0.1, 0.05) },
        midColor3: { value: new THREE.Color(0.2, 0.05, 0.02) },
        bottomColor: { value: new THREE.Color(0.1, 0.02, 0.01) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    })
  }
}

extend({ BlackHoleMaterial }) 