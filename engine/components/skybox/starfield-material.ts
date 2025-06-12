import * as THREE from "three";

const vertexShader = `
varying vec3 vDirection;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDirection = normalize(position);
  gl_Position = projectionMatrix * mvPosition;
}`;

const fragmentShader = `
precision highp float;
varying vec3 vDirection;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx11 = mix(n011, n111, f.x);

  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float f = 0.0;
  f += 0.5000 * noise(p); p = p * 2.02 + vec3(0.31, 0.47, 0.21);
  f += 0.2500 * noise(p); p = p * 2.03 + vec3(1.11, 0.37, -0.15);
  f += 0.1250 * noise(p); p = p * 2.01 + vec3(-0.21, 0.77, 0.07);
  f += 0.0625 * noise(p);
  return f;
}

float stableHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 dir = normalize(vDirection);

  // --- Tilted galactic band ---
  vec3 galacticAxis = normalize(vec3(0.5, 0.5, 0.707));
  float band = smoothstep(0.5, 0.0, abs(dot(dir, galacticAxis)));

  // --- Core brightness bias ---
  float coreBias = smoothstep(0.4, 1.0, dot(dir, normalize(vec3(1.0, 0.2, 0.1))));

  // --- Dust occlusion ---
  float dust = smoothstep(0.2, 0.6, fbm(dir * 10.0));
  float voidMask = smoothstep(0.1, 0.4, fbm(dir * 5.0 + 3.2));
  float occlusion = mix(1.0, 0.2, dust * voidMask * band);

  // --- Gas clouds ---
  float gasNoise = fbm(dir * 8.0 + 4.2);
  float edgeSoft = smoothstep(0.1, 0.9, band);
  float gasAlpha = smoothstep(0.25, 0.85, gasNoise) * 0.6 * edgeSoft;
  vec3 gasColor = mix(vec3(0.2, 0.1, 0.25), vec3(0.6, 0.4, 0.5), gasNoise);
  vec3 gasClouds = gasColor * gasAlpha;

  // --- Milky Way structure (FIXED - continuous and wispy) ---
  // Multi-scale wispy structure using continuous noise
  float wispyNoise1 = fbm(dir * 15.0 + vec3(2.1, 1.7, 3.3));
  float wispyNoise2 = fbm(dir * 25.0 + vec3(7.2, 4.8, 1.9));
  float wispyNoise3 = fbm(dir * 40.0 + vec3(5.5, 9.1, 6.7));
  
  // Combine multiple scales for complex structure
  float milkyStructure = wispyNoise1 * 0.6 + wispyNoise2 * 0.3 + wispyNoise3 * 0.1;
  float milkyMask = smoothstep(0.3, 0.8, milkyStructure) * band;
  
  // Rich color variation like real Milky Way
  vec3 warm = vec3(1.0, 0.95, 0.9);        // Warm core regions
  vec3 cool = vec3(0.6, 0.7, 1.0);         // Cool outer regions
  vec3 dusty = vec3(0.8, 0.6, 0.4);        // Dusty brown areas
  vec3 pink = vec3(1.0, 0.7, 0.8);         // Pink star-forming regions
  vec3 purple = vec3(0.7, 0.5, 0.9);       // Purple nebular regions
  
  // Color mixing based on different noise patterns
  float colorNoise1 = noise(dir * 12.0 + vec3(11.3, 7.7, 4.1));
  float colorNoise2 = noise(dir * 8.0 + vec3(3.8, 15.2, 9.6));
  float colorNoise3 = noise(dir * 20.0 + vec3(6.4, 2.9, 12.8));
  
  // Create complex color regions
  vec3 baseColor = mix(cool, warm, coreBias);
  vec3 dustyMix = mix(baseColor, dusty, smoothstep(0.4, 0.7, colorNoise1));
  vec3 pinkMix = mix(dustyMix, pink, smoothstep(0.6, 0.9, colorNoise2) * 0.6);
  vec3 milkyColor = mix(pinkMix, purple, smoothstep(0.5, 0.8, colorNoise3) * 0.4);
  
  // Vary brightness across the structure
  float brightVariation = noise(dir * 6.0 + vec3(8.2, 3.5, 11.7)) * 0.4 + 0.6;
  float milkyAlpha = milkyMask * occlusion * brightVariation * (0.3 + 0.7 * coreBias);
  
  vec3 milkyWay = milkyColor * milkyAlpha;

  // --- Starfield (restored original soft stars) ---
  float gridSize = 200.0;
  vec3 cell = floor(dir * gridSize);
  vec3 local = fract(dir * gridSize);
  float seed = stableHash(cell);
  float flicker = stableHash(cell + 1.0);
  float colorMix = stableHash(cell + 2.0);
  float radial = length(local - 0.5);
  float softness = pow(smoothstep(0.6, 0.0, radial), 2.0);
  float faint = smoothstep(0.94, 0.99, seed) * 0.1 * softness;
  float bright = smoothstep(0.985, 1.0, seed) * (0.6 + 0.4 * flicker) * softness;
  float star = faint + bright;
  vec3 starColor = mix(warm, cool, colorMix);

  // --- Final composite ---
  vec3 finalColor = milkyWay + gasClouds + starColor * star;
  gl_FragColor = vec4(finalColor, 1.0);
}`;

export function createStarfieldMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  });
}
