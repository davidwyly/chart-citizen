import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import type { EffectsLevel } from '@lib/types/effects-level'

export const TerrestrialPlanetMaterial = shaderMaterial(
  {
    time: 0.0,
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
    qualityLevel: 8, // Number of noise iterations
  },
  // Vertex shader
  `
    uniform vec3 lightDirection;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDiffuse;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Calculate diffuse lighting in vertex shader
      vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vDiffuse = max(dot(worldNormal, normalize(lightDirection)), 0.0);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 landColor;
    uniform vec3 seaColor;
    uniform vec3 sandColor;
    uniform vec3 snowColor;
    uniform vec3 atmosphereColor;
    uniform float rotationSpeed;
    uniform float terrainScale;
    uniform float cloudScale;
    uniform float nightLightIntensity;
    uniform float cloudOpacity;
    uniform vec3 lightDirection;
    uniform int qualityLevel;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDiffuse;

    #define mod3_ vec3(.1031, .22369, .13787)
    #define PI 3.1415926359

    // Hash function for noise generation
    vec3 hash3_3(vec3 p3) {
      p3 = fract(p3 * mod3_);
      p3 += dot(p3, p3.yxz + 120.0);
      vec3 random3 = fract(vec3((p3.x + p3.y) * p3.z, (p3.x+p3.z) * p3.y, (p3.y+p3.z) * p3.x));
      return normalize(-1. + 2. * random3);
    }

    // 3D Perlin noise
    float perlin_noise3(vec3 p) {
      vec3 pi = floor(p);
      vec3 pf = p - pi;
      
      // 5th order interpolant from Improved Perlin Noise
      vec3 pf3 = pf * pf * pf;
      vec3 pf4 = pf3 * pf;
      vec3 pf5 = pf4 * pf;
      vec3 w = 6. * pf5 - 15. * pf4 + 10. * pf3;
      
      return mix(
        mix(
          mix(
            dot(pf - vec3(0, 0, 0), hash3_3(pi + vec3(0, 0, 0))), 
            dot(pf - vec3(1, 0, 0), hash3_3(pi + vec3(1, 0, 0))),
            w.x),
          mix(
            dot(pf - vec3(0, 0, 1), hash3_3(pi + vec3(0, 0, 1))), 
            dot(pf - vec3(1, 0, 1), hash3_3(pi + vec3(1, 0, 1))),
            w.x),
          w.z),
        mix(
          mix(
            dot(pf - vec3(0, 1, 0), hash3_3(pi + vec3(0, 1, 0))), 
            dot(pf - vec3(1, 1, 0), hash3_3(pi + vec3(1, 1, 0))),
            w.x),
          mix(
            dot(pf - vec3(0, 1, 1), hash3_3(pi + vec3(0, 1, 1))), 
            dot(pf - vec3(1, 1, 1), hash3_3(pi + vec3(1, 1, 1))),
            w.x),
          w.z),
        w.y);
    }

    // Distance to a sphere with perlin noise perturbations
    float sdWeirdSphere(vec3 pos, float frequency) {
      float noise = perlin_noise3(pos * frequency) / (1. * frequency * 1.32);
      return mix(length(pos) - 0.2, noise, 0.85);
    }

    // Generate terrain height with quality-based iterations
    float height(vec3 p) {
      float ret = 0.0;
      float amplitude = 1.0;
      float frequency = 128.0 * terrainScale;
      
      // High quality: 8 iterations
      // Medium quality: 4 iterations
      // Low quality: 2 iterations
      for (int i = 0; i < 8; i++) {
        if (i >= qualityLevel) break;
        ret += sdWeirdSphere(p, frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 0.5;
      }
      
      ret /= 2.0;
      ret -= 0.5;
      return ret;
    }

    // Generate terrain properties (temperature, snow factor)
    vec2 terrain(vec3 p, float h) {
      float col = 0.0;
      float amplitude = 1.0;
      float frequency = 32.0 * terrainScale;
      
      // Reduce iterations based on quality
      for (int i = 0; i < 3; i++) {
        if (i >= qualityLevel / 2) break;
        col += sdWeirdSphere(p, frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 0.5;
      }
      
      float t = 1.0 - (abs(p.y * 1.2) - max(h, 0.0) * 0.05);
      t = min((t + col) / 2.0, 1.0);
      t = pow(t, 0.5) - 0.15;
      
      float s = abs((abs(p.y) - 0.5) * 2.0);
      s = min((s + col) / 2.0, 1.0) + 0.25;
      
      return vec2(t, s);
    }

    // Generate terrain color
    vec3 getTerrainColor(vec3 p, vec2 th, float h) {
      // Snow caps
      if(th.x < 0.2)
        return snowColor * pow(1.0 - min(th.x / 0.2, 1.0), 0.125) * 2.0;
      
      // Ocean
      if(h < 0.0)
        return seaColor * (1.0 + h * 2.0);
      
      // Land - mix between sand and grass based on terrain properties
      float lp = (th.x + th.y * 3.0) / 3.0;
      lp = clamp(lp, 0.0, 1.0);
      
      return mix(sandColor, landColor, pow(lp, 8.0)) * (pow(h, 0.25) + 0.5);
    }

    // Spiral function for cloud distortion
    vec2 spiral(vec2 uv) {
      float reps = 2.0;
      vec2 uv2 = fract(uv * reps);
      vec2 center = floor(fract(uv * reps)) + 0.5;
      vec2 delta = uv2 - center;
      float dist = length(delta);
      
      vec2 offset = vec2(delta.y, -delta.x);
      float blend = clamp((0.5 - dist) * 2.0, 0.0, 1.0);
      blend = pow(blend, 1.5);
      offset *= clamp(blend, 0.0, 1.0);
      
      return uv + offset * vec2(1.0, 1.0) * 1.1 + vec2(time * -0.03, 0.0);
    }

    // Convert 3D position to 2D UV coordinates (spherical mapping)
    vec2 pos3to2(vec3 pos) {
      float r = length(pos);
      float Y = acos(pos.y / r) / PI;
      float X = atan(-pos.z / r, pos.x / r) / PI / 2.0;
      return vec2(X, Y);
    }

    // Convert 2D UV back to 3D position
    vec3 pos2to3(vec2 pos) {
      float X = sin(pos.y * PI) * cos(pos.x * PI * 2.0);
      float Y = cos(pos.y * PI);
      float Z = -sin(pos.y * PI) * sin(pos.x * PI * 2.0);
      return vec3(X, Y, Z);
    }

    // Generate cloud density with quality-based iterations
    float cloud(vec3 p) {
      // Rotate clouds independently for more dynamic effect
      vec3 t = p;
      float cloudRotation = time * 0.05;
      p.x = t.x * cos(cloudRotation) - t.z * sin(cloudRotation);
      p.z = t.x * sin(cloudRotation) + t.z * cos(cloudRotation);
      
      vec2 uv = pos3to2(p);
      vec3 cp = pos2to3(spiral(uv * 2.0 * cloudScale) + spiral(uv * 3.0 * cloudScale));
      
      float c = 0.0;
      float amplitude = 1.0;
      float frequency = 8.0;
      
      // Reduce iterations based on quality
      for (int i = 0; i < 4; i++) {
        if (i >= qualityLevel / 2) break;
        c += perlin_noise3(cp * vec3(frequency, frequency * 2.0, frequency)) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      // Reduce clouds near poles
      float latitudeFactor = abs((abs(p.y) - 0.5) * 2.0);
      c += latitudeFactor;
      
      return max(c, 0.0);
    }

    // Generate night lights with quality-based iterations
    float nightLight(vec3 pos, float h, vec2 th) {
      if (th.x < 0.2) return 0.0;  // Exclude ice/snow biomes (based on th.x threshold)
      float l = perlin_noise3(pos * vec3(128.0, 128.0, 128.0)) * 3.0;
      float p = 0.0;
      float amplitude = 1.0;
      float frequency = 32.0;
      for (int i = 0; i < 3; i++) {
        if (i >= qualityLevel / 2) break;
        p += perlin_noise3(pos * vec3(frequency, frequency, frequency)) * amplitude;
        amplitude *= 0.5;
        frequency *= 0.5;
      }
      l *= clamp(p, 0.0, 1.0) * max(th.x - 0.2, 0.0) * th.y * 2.0;
      return l * (h > 0.0 ? 1.0 : 0.0);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      
      // Use the surface normal for terrain generation (local space)
      vec3 surfaceNormal = normalize(vPosition);
      
      // Rotate position based on time for planet rotation
      float angle = time * rotationSpeed;
      vec3 rotatedPos = vec3(
        surfaceNormal.x * cos(angle) - surfaceNormal.z * sin(angle),
        surfaceNormal.y,
        surfaceNormal.x * sin(angle) + surfaceNormal.z * cos(angle)
      );
      
      // Generate terrain
      float h = height(rotatedPos);
      vec2 terrainProps = terrain(rotatedPos, h);
      vec3 terrainColor = getTerrainColor(rotatedPos, terrainProps, h);
      
      // Use diffuse lighting from vertex shader
      float diffuse = vDiffuse;
      float ambient = 0.15; // Slightly higher ambient for better visibility
      
      // Apply lighting to terrain
      vec3 color = terrainColor * (diffuse + ambient);
      
      // Add specular highlights for water bodies
      if (h < 0.0) {
        vec3 viewDir = normalize(-vPosition); // View direction in eye space
        vec3 lightDir = normalize(lightDirection);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
        color += vec3(1.0) * spec * diffuse * 0.8;
      }
      
      // Add night lights on dark side (when diffuse lighting is low)
      float nightLights = nightLight(rotatedPos, h, terrainProps);
      float nightFactor = 1.0 - smoothstep(0.0, 0.3, diffuse);
      color += vec3(1.0, 0.8, 0.3) * nightLights * nightFactor * nightLightIntensity;
      
      // Add animated clouds
      float cloudDensity = cloud(rotatedPos) * cloudOpacity;
      vec3 cloudColor = vec3(0.9, 0.95, 1.0) * (diffuse + ambient);
      color = mix(color, cloudColor, clamp(cloudDensity, 0.0, 0.8));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// Extend React Three Fiber with the material
extend({ TerrestrialPlanetMaterial })

// Helper function to create material with quality level
export function createTerrestrialPlanetMaterial(qualityLevel: EffectsLevel = 'high') {
  const iterations = qualityLevel === 'high' ? 8 : qualityLevel === 'medium' ? 4 : 2
  return new TerrestrialPlanetMaterial({
    qualityLevel: iterations
  })
}
