import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

export const StarCoronaMaterial = shaderMaterial(
  {
    time: 0.0,
    intensity: 1.5,
    color: new THREE.Color(0.9, 0.3, 0.05),
    resolution: new THREE.Vector2(1, 1),
    viewDirection: new THREE.Vector2(0, 0),
    curvatureAmount: 0.3,
    rotation: 0.0, // ⭐️ NEW: star's Y-axis rotation in radians
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
  `,
  // Fragment Shader
  `
  precision highp float;

  uniform float time;
  uniform float intensity;
  uniform vec3 color;
  uniform vec2 resolution;
  uniform vec2 viewDirection;
  uniform float curvatureAmount;
  uniform float rotation;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  #define TAU 6.2831853

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += (noise(p) - 0.5) * 2.0 * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }
    return abs(value);
  }

  float dualfbm(vec2 p) {
    vec2 p2 = p * 0.7;
    vec2 basis = vec2(
      fbm(p2 - time * 1.6),
      fbm(p2 + time * 1.7)
    );
    basis = (basis - 0.5) * 0.76;
    p += basis;
    return fbm(p * rot(time * 0.72));
  }

  float circ(vec2 p) {
    float r = length(p);
    r = log(sqrt(r + 1e-4));
    return abs(mod(r * 5.1, TAU) - 3.14) * 3.0 + 0.2;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;

    vec2 sphericalOffset = viewDirection * curvatureAmount * (1.0 - dot(p, p));

    p += sphericalOffset;

    p.x *= resolution.x / resolution.y;
    p *= 4.0;

    float rz = dualfbm(p);

    vec2 chaosOffset = vec2(
      sin(p.y * 5.0 + time * 3.0) * 0.2,
      cos(p.x * 5.0 - time * 2.0) * 0.2
    );

    chaosOffset += vec2(
      fbm(p * 1.5 + time * 0.5),
      fbm(p * 2.0 - time * 0.8)
    ) * 0.3;

    float chaosScale = 0.8 + fbm(p + time * 1.3) * 2.5;
    p += chaosOffset;
    p /= chaosScale;

    rz *= pow(abs(0.1 - circ(p)), 0.9);

    float dist = length(uv - 0.5);
    float a = 1.0;
    if (dist > 0.4) {
      a = max(0.0, 1.0 - (dist - 0.4) / 0.1);
    }

    vec3 col = color / (rz + 0.1);
    col = pow(abs(col), vec3(0.99));
    col *= a * intensity;

    gl_FragColor = vec4(col, a);
  }
  `,
)
