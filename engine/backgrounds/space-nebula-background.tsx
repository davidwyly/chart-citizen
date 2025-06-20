import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Import shader content
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
// Space Nebula Background Shader
// Based on "Type 2 Supernova" by Duke and otaviogood's spiral noise
// Adapted for Three.js and Chart Citizen starmap background

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec3 cameraPosition;
uniform vec3 cameraDirection;
uniform float intensity;
uniform vec4 nebulaParams; // x: noise amount, y: frequency, z: height, w: scale

varying vec2 vUv;

#define SPIRAL_NOISE_ITER 8

// Simple hash function for noise
float hash(const in vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 758.5))) * 43758.54);
}

// Simplified perlin noise (without texture lookup)
float pn(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(
            mix(hash(p + vec3(0, 0, 0)), hash(p + vec3(1, 0, 0)), f.x),
            mix(hash(p + vec3(0, 1, 0)), hash(p + vec3(1, 1, 0)), f.x), f.y),
        mix(
            mix(hash(p + vec3(0, 0, 1)), hash(p + vec3(1, 0, 1)), f.x),
            mix(hash(p + vec3(0, 1, 1)), hash(p + vec3(1, 1, 1)), f.x), f.y), f.z) * 2.0 - 1.0;
}

// Spiral noise from otaviogood
const float nudge = 20.0;
float normalizer = 1.0 / sqrt(1.0 + nudge * nudge);

float SpiralNoiseC(vec3 p, vec4 id) {
    float iter = 2.0;
    float n = 2.0 - id.x; // noise amount
    
    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {
        // Add sin and cos scaled inverse with the frequency
        n += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
        
        // Rotate by adding perpendicular and scaling down
        p.xy += vec2(p.y, -p.x) * nudge;
        p.xy *= normalizer;
        
        // Rotate on other axis
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;
        
        // Increase the frequency
        iter *= id.y + 0.733733;
    }
    return n;
}

// Distance field function for the nebula structure
float map(vec3 p, vec4 id) {
    float k = 2.0 * id.w + 0.1;
    return k * (0.5 + SpiralNoiseC(p.zxy * 0.4132 + 333.0, id) * 3.0 + pn(p * 8.5) * 0.12);
}

// HSV to RGB conversion
vec3 hsv2rgb(float h, float s, float v) {
    return v + v * s * (clamp(abs(mod(h * 6.0 + vec3(0, 4, 2), 6.0) - 3.0) - 1.0, 0.0, 1.0) - 1.0);
}

// Main rendering function for the nebula
vec4 renderSuperstructure(vec3 ro, vec3 rd, const vec4 id) {
    const float max_dist = 20.0;
    float ld, td = 0.0, w, d, t, noi, lDist, a;
    float rRef = 2.0 * id.x;
    float h = 0.05 + 0.25 * id.z;
    
    vec3 pos, lightColor;
    vec4 sum = vec4(0.0);
    
    t = 0.3 * hash(vec3(hash(rd)) + time);
    
    for (int i = 0; i < 100; i++) { // Reduced iterations for performance
        // Loop break conditions
        if (td > 0.9 || sum.a > 0.99 || t > max_dist) break;
        
        // Color attenuation according to distance
        a = smoothstep(max_dist, 0.0, t);
        
        // Evaluate distance function
        d = abs(map(pos = ro + t * rd, id)) + 0.07;
        
        // Light calculations
        lDist = max(length(mod(pos + 2.5, 5.0) - 2.5), 0.001);
        noi = pn(0.03 * pos);
        
        // Create dynamic color based on noise and distance
        lightColor = mix(
            hsv2rgb(noi, 0.5, 0.6),
            hsv2rgb(noi + 0.3, 0.5, 0.6),
            smoothstep(rRef * 0.5, rRef * 2.0, lDist)
        );
        
        sum.rgb += a * lightColor / exp(lDist * lDist * lDist * 0.08) / 30.0;
        
        if (d < h) {
            td += (1.0 - td) * (h - d) + 0.005;
            sum.rgb += sum.a * sum.rgb * 0.25 / lDist;
            sum += (1.0 - sum.a) * 0.05 * td * a;
        }
        
        td += 0.015;
        t += max(d * 0.08 * max(min(lDist, d), 2.0), 0.01);
    }
    
    // Simple scattering
    sum *= 1.0 / exp(ld * 0.2) * 0.9;
    sum = clamp(sum, 0.0, 1.0);
    sum.xyz *= sum.xyz * (3.0 - sum.xyz - sum.xyz);
    
    return sum;
}

void main() {
    vec2 fragCoord = vUv * resolution;
    
    // Create ray from camera through this pixel
    vec3 ro = cameraPosition + vec3(15.0 + time, cos(0.1 * time), 15.0 + time);
    vec3 rd = normalize(vec3((fragCoord.xy - 0.5 * resolution.xy) / resolution.y, 1.0));
    
    // Apply camera rotation based on mouse or automatic rotation
    float mx = mouse.x * 3.0;
    float my = mouse.y * 1.5;
    
    // Rotate ray direction
    float c1 = cos(mx), s1 = sin(mx);
    rd.xz = mat2(c1, -s1, s1, c1) * rd.xz;
    
    float c2 = cos(my), s2 = sin(my);
    rd.yx = mat2(c2, -s2, s2, c2) * rd.yx;
    
    float c3 = cos(time * 0.1), s3 = sin(time * 0.1);
    rd.xz = mat2(c3, -s3, s3, c3) * rd.xz;
    
    // Render the nebula with parameters
    vec4 col = renderSuperstructure(ro, rd, nebulaParams);
    
    // Apply intensity and add subtle blue tint for space
    col.rgb = mix(col.rgb, col.rgb + 0.5 * vec3(0.1, 0.2, 0.3), 0.3);
    col.rgb *= intensity;
    
    gl_FragColor = vec4(col.rgb, col.a);
}
`

interface SpaceNebulaBackgroundProps {
  intensity?: number
  mouseInfluence?: number
  nebulaParams?: [number, number, number, number] // [noise amount, frequency, height, scale]
}

export function SpaceNebulaBackground({ 
  intensity = 0.8,
  mouseInfluence = 1.0,
  nebulaParams = [1.2, 1.8, 0.3, 0.8]
}: SpaceNebulaBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, size, mouse } = useThree()
  
  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
        mouse: { value: new THREE.Vector2(0, 0) },
        cameraPosition: { value: new THREE.Vector3() },
        cameraDirection: { value: new THREE.Vector3() },
        intensity: { value: intensity },
        nebulaParams: { value: new THREE.Vector4(...nebulaParams) }
      },
      side: THREE.BackSide, // Render on inside of sphere
      transparent: true,
      depthWrite: false,
    })
  }, [intensity, nebulaParams])

  // Update uniforms every frame
  useFrame((state) => {
    if (!meshRef.current || !material) return

    const { clock } = state
    
    // Update time
    material.uniforms.time.value = clock.elapsedTime * 0.5

    // Update resolution
    material.uniforms.resolution.value.set(size.width, size.height)
    
    // Update mouse position (normalized)
    material.uniforms.mouse.value.set(
      mouse.x * mouseInfluence, 
      mouse.y * mouseInfluence
    )
    
    // Update camera position and direction
    material.uniforms.cameraPosition.value.copy(camera.position)
    camera.getWorldDirection(material.uniforms.cameraDirection.value)
  })

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1000, 60, 40]} />
    </mesh>
  )
}

export default SpaceNebulaBackground