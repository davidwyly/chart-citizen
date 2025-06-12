import { shaderMaterial } from "@react-three/drei"

export const StormMaterial = shaderMaterial(
  {
    time: 0.0,
    intensity: 1.0,
    rotationSpeed: 1.0,
    stormType: 0.0, // 0.0 = minor, 1.0 = major
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision highp float;

    uniform float time;
    uniform float intensity;
    uniform float rotationSpeed;
    uniform float stormType;

    varying vec2 vUv;
    varying vec3 vNormal;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }

    float fbm(vec2 p) {
      float f = 0.0;
      float a = 0.5;
      for(int i = 0; i < 4; i++) {
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    void main() {
      vec2 uv = vUv - 0.5;
      float dist = length(uv);
      
      // Create spiral pattern
      float angle = atan(uv.y, uv.x) + time * rotationSpeed;
      float spiral = sin(angle * 3.0 + dist * 20.0 - time * 2.0) * 0.5 + 0.5;
      
      // Add turbulence
      vec2 turbulenceUV = uv * 8.0 + vec2(time * 0.1, time * 0.05);
      float turbulence = fbm(turbulenceUV);
      
      // Create storm eye
      float eye = 1.0 - smoothstep(0.0, 0.1, dist);
      float stormBody = smoothstep(0.1, 0.4, dist) * (1.0 - smoothstep(0.4, 0.5, dist));
      
      // Combine effects
      float stormPattern = spiral * stormBody + eye * 0.3;
      stormPattern *= turbulence;
      
      // Color based on storm type
      vec3 minorStormColor = vec3(0.8, 0.6, 0.4);
      vec3 majorStormColor = vec3(0.9, 0.3, 0.1);
      vec3 stormColor = mix(minorStormColor, majorStormColor, stormType);
      
      // Apply intensity and fade at edges
      float alpha = stormPattern * intensity * (1.0 - smoothstep(0.3, 0.5, dist));
      
      gl_FragColor = vec4(stormColor, alpha * 0.6);
    }
  `,
)
