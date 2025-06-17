import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

export const GasGiantMaterial = shaderMaterial(
  {
    time: 0.0,
    map: null,
    normalMap: null,
    stormIntensity: 0.5,
    bandCount: 6.0,
    atmosphereThickness: 0.1,
    lightDirection: new THREE.Vector3(1.0, 1.0, 0.8),
    atmosphereColor: new THREE.Color(1.0, 0.7, 0.4),
    rotationSpeed: 0.02,
  },

  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // Fragment Shader
  `
    precision highp float;

    uniform float time;
    uniform sampler2D map;
    uniform sampler2D normalMap;
    uniform float stormIntensity;
    uniform float bandCount;
    uniform float atmosphereThickness;
    uniform vec3 lightDirection;
    uniform vec3 atmosphereColor;
    uniform float rotationSpeed;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    #define PI 3.14159265359

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;
      for (int i = 0; i < 6; i++) {
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    vec2 sphericalUV(vec3 normal, float spin) {
      float u = atan(normal.z, normal.x) / (2.0 * PI) + 0.5 + spin;
      float v = acos(clamp(normal.y, -1.0, 1.0)) / PI;
      return vec2(u, v);
    }

    vec4 atmosphere(vec3 normal, vec3 lightDir, vec3 atmColor, float falloff) {
      vec3 absorption = vec3(2.0, 3.0, 4.0);
      float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), falloff);
      float light = max((dot(normal, lightDir) + 0.3) / 1.3, 0.0);
      vec3 absorbed = vec3(
        pow(light, absorption.x),
        pow(light, absorption.y),
        pow(light, absorption.z)
      );
      vec3 scattered = absorbed * atmColor;
      return vec4(scattered, fresnel);
    }

    vec3 generateSwirlingClouds(vec2 uv, float time) {
      vec2 flow1 = vec2(cos(uv.y * 8.0 + time * 0.3), sin(uv.y * 6.0 + time * 0.2)) * 0.02;
      vec2 flow2 = vec2(cos(uv.y * 12.0 - time * 0.4), sin(uv.y * 10.0 - time * 0.3)) * 0.015;
      vec2 swirledUV = uv + flow1 + flow2;
      float clouds1 = fbm(vec3(swirledUV * 4.0, time * 0.1));
      float clouds2 = fbm(vec3(swirledUV * 8.0, time * 0.15));
      float cloudDensity = clouds1 * 0.6 + clouds2 * 0.4;
      vec3 cloudColor = mix(vec3(0.7, 0.5, 0.3), vec3(0.9, 0.8, 0.6), cloudDensity);
      return cloudColor;
    }

    vec3 sampleJupiterPalette(float bandIndex) {
      vec3 colors[4];
      colors[0] = vec3(0.906, 0.780, 0.678);
      colors[1] = vec3(0.655, 0.510, 0.451);
      colors[2] = vec3(0.796, 0.643, 0.557);
      colors[3] = vec3(1.000, 0.906, 0.808);
      float i = floor(bandIndex * 4.0);
      float j = mod(i + 1.0, 4.0);
      float t = fract(bandIndex * 4.0);
      return mix(colors[int(i)], colors[int(j)], t);
    }

    void main() {
      vec3 normal = normalize(vPosition); // world-space normal
      float angle = time * rotationSpeed;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec3 rotated = vec3(rot * normal.xz, normal.y).xzy;
      vec2 uv = sphericalUV(normalize(rotated), 0.0);

      // Band flow
      float latitude = uv.y * 2.0 - 1.0;
      float bandFlow = sin(latitude * PI * bandCount) * 0.002;
      vec2 flowOffset = vec2(bandFlow * time * 20.0, 0.0);
      uv += flowOffset;

      // Base color from palette
      vec3 baseColor = sampleJupiterPalette(uv.y);
      vec3 clouds = generateSwirlingClouds(uv, time);

      // Mix clouds with base color
      float bandPattern = sin(uv.y * bandCount * PI) * 0.5 + 0.5;
      bandPattern = smoothstep(0.3, 0.7, bandPattern);
      vec3 finalClouds = mix(baseColor, clouds, 0.6 + bandPattern * 0.2);

      // Great Red Spot
      vec2 stormCenter = vec2(0.3, 0.6);
      float stormDist = distance(uv, stormCenter);
      float stormMask = exp(-stormDist * 12.0) * stormIntensity;
      vec3 stormColor = vec3(0.8, 0.3, 0.1);
      finalClouds = mix(finalClouds, stormColor, stormMask);

      // Lighting
      float lightIntensity = max(dot(normal, normalize(lightDirection)), 0.0);
      vec4 atm = atmosphere(normal, normalize(lightDirection), atmosphereColor, 2.0);
      vec3 lit = finalClouds * (0.3 + pow(lightIntensity, 0.8) * 0.7);
      vec3 finalColor = mix(lit, atm.rgb * 1.5, atm.a * atmosphereThickness);

      // Fresnel
      float fresnel = 1.0 - abs(dot(normal, normalize(-vViewPosition)));
      finalColor += atmosphereColor * fresnel * fresnel * 0.2;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)
