import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

export const SunMaterial = shaderMaterial(
  {
    time: 0.0,
    coreColor: new THREE.Color(1.0, 0.6, 0.2),
    variableStar: false,
    variablePeriod: 4.0,
    variableAmplitude: 0.2,
    flowSpeed: 1.0,
  },
  // Vertex Shader
  `
    varying vec3 vPos;
    void main(){
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
  // Fragment Shader
  `
    precision highp float;
    uniform float time;
    uniform vec3 coreColor;
    uniform bool variableStar;
    uniform float variablePeriod;
    uniform float variableAmplitude;
    uniform float flowSpeed;

    varying vec3 vPos;

    vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.792842914 - 0.8537347209 * r; }

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g, l.zxy);
      vec3 i2 = max(g, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - 0.5;

      i = mod289(i);
      vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
          i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
          i.x + vec4(0.0, i1.x, i2.x, 1.0));

      vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
      vec4 x_ = floor(j * (1.0 / 7.0));
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * (1.0 / 7.0) + 0.5 / 7.0;
      vec4 y = y_ * (1.0 / 7.0) + 0.5 / 7.0;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(
        dot(p0, p0), dot(p1, p1),
        dot(p2, p2), dot(p3, p3)
      ));

      p0 *= norm.x; p1 *= norm.y;
      p2 *= norm.z; p3 *= norm.w;

      vec4 m = max(0.6 - vec4(
        dot(x0, x0), dot(x1, x1),
        dot(x2, x2), dot(x3, x3)
      ), 0.0);
      m *= m;

      return 42.0 * dot(m * m, vec4(
        dot(p0, x0), dot(p1, x1),
        dot(p2, x2), dot(p3, x3)
      ));
    }

    float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;
      for(int i = 0; i < 5; i++) {
        f += a * snoise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    void main() {
      float n = fbm(vPos * 2.0 + vec3(0.0, 0.0, time * 0.05 * flowSpeed));
      float brightness = 1.0;

      if (variableStar) {
        brightness = 1.0 + variableAmplitude * sin(time * 6.2831 / variablePeriod);
      }

      vec3 hotColor = coreColor * 1.3 * brightness;
      vec3 coolColor = vec3(
        min(1.0, coreColor.r * 1.6),
        min(1.0, coreColor.g * 1.2),
        min(1.0, coreColor.b * 0.8 + 0.2)
      ) * brightness;

      vec3 base = mix(hotColor, coolColor, clamp(n * 0.5 + 0.5, 0.0, 1.0));

      float s = fbm(vPos * 3.5 + vec3(0.0, time * 0.02 * flowSpeed, 0.0));
      float mB = pow(clamp(smoothstep(0.30, 0.38, s), 0.0, 1.0), 4.0);
      float mD = pow(clamp(smoothstep(-0.85, -0.15, s), 0.0, 1.0), 2.0);
      float s2 = fbm(vPos * 8.0 + vec3(time * 0.01 * flowSpeed, 0.0, time * 0.015 * flowSpeed));
      float darkVar = 0.5 + 0.5 * s2;

      vec3 flareColor = vec3(
        min(1.0, coreColor.r * 1.2),
        min(1.0, coreColor.g * 0.9),
        min(1.0, coreColor.b * 0.7)
      ) * brightness;

      vec3 color = base + mB * flareColor * 0.35;

      if (mD > 0.6) {
        float strength = smoothstep(0.6, 1.0, mD);
        float intensity = mix(0.4, 0.8, darkVar);
        color *= mix(1.0, intensity, strength);
      }

      float localFlicker = fbm(vPos * 3.0 + vec3(0.0, 0.0, time * 0.3));
      float flicker = 1.0 + 0.05 * sin((localFlicker + 0.5) * 10.0 + time * 3.0);
      color *= flicker;

      float flareZone = fbm(vPos * 1.0 + vec3(0.0, 0.0, time * 0.00025));
      float flareMask = smoothstep(0.3, 0.6, flareZone);
      float zoneTime = time * 4.0 + flareZone * 25.0 + sin(fbm(vPos * 4.0) * 6.28);
      float flarePulse = pow(max(sin(zoneTime), 0.0), 3.0);
      vec3 flareGlow = vec3(3.0, 2.5, 2.0);
      color += flareGlow * flareMask * flarePulse * 0.2;

      // Spiderweb-like crack network
      vec3 q = vPos * 1.2 + vec3(0.0, 0.0, time * 0.01);
      float n1 = fbm(q * 0.4);
      float n2 = fbm(q * 0.8);
      float n3 = fbm(q * 1.6);

      // Use difference between noise layers to create edge-like features
      float crackMask = abs(n1 - n2) + abs(n2 - n3);

      // Invert and sharpen to highlight edges between FBM layers
      crackMask = smoothstep(0.05, 0.65, crackMask);
      crackMask = pow(crackMask, 2.5); // focus brightness in core

      // Brighten rift regions
      vec3 highlight = color * 2.0;
      color = mix(color, highlight, crackMask);
      gl_FragColor = vec4(clamp(color, 0.0, 3.0), 1.0);
    }
  `,
)
