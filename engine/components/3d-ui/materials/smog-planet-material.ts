import * as THREE from 'three'
import { extend } from '@react-three/fiber'

// Noise functions
const noiseFunctions = `
float hash(float p) { 
    p = fract(p * 0.011); 
    p *= p + 7.5; 
    p *= p + p; 
    return fract(p); 
}

float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 10; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}
`

// Main shader code
const vertexShader = `
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
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

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

${noiseFunctions}

void main() {
    // Calculate rotation based on time
    float theta = time * speed;
    mat3 rot = mat3(
        cos(theta), 0.0, sin(theta),
        0.0, 1.0, 0.0,
        -sin(theta), 0.0, cos(theta)
    );

    // Apply rotation to position
    vec3 rotatedPos = rot * vPosition;

    // Calculate noise values
    vec3 q = vec3(
        fbm(rotatedPos + 0.025 * time),
        fbm(rotatedPos),
        fbm(rotatedPos)
    );
    
    vec3 r = vec3(
        fbm(rotatedPos + 1.0 * q + 0.01 * time),
        fbm(rotatedPos + q),
        fbm(rotatedPos + q)
    );
    
    float v = fbm(rotatedPos + 5.0 * r + time * 0.005);

    // Mix colors based on noise
    vec3 col_mid = mix(midColor1, midColor2, clamp(r, 0.0, 1.0));
    col_mid = mix(col_mid, midColor3, clamp(q, 0.0, 1.0));

    // Calculate vertical position for color mixing
    float pos = v * 2.0 - 1.0;
    vec3 color = mix(col_mid, topColor, clamp(pos, 0.0, 1.0));
    color = mix(color, bottomColor, clamp(-pos, 0.0, 1.0));

    // Apply intensity and lighting
    float diffuse = max(0.0, dot(vNormal, vec3(1.0, sqrt(0.5), 1.0)));
    float ambient = 0.1;
    color *= clamp((diffuse + ambient), 0.0, 1.0) * intensity;

    // Add distortion effect
    color += vec3(distortion * 0.1 * sin(time * 2.0 + vPosition.y * 10.0));

    gl_FragColor = vec4(color, 1.0);
}
`

class SmogPlanetMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1.0 },
                speed: { value: 0.15 },
                distortion: { value: 1.0 },
                topColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
                midColor1: { value: new THREE.Color(0.1, 0.2, 0.0) },
                midColor2: { value: new THREE.Color(0.7, 0.4, 0.3) },
                midColor3: { value: new THREE.Color(1.0, 0.4, 0.2) },
                bottomColor: { value: new THREE.Color(0.0, 0.0, 0.0) }
            }
        })
    }
}

// Extend R3F with our custom material
extend({ SmogPlanetMaterial })

export { SmogPlanetMaterial } 