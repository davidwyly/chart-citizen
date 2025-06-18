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
uniform float iTime;
uniform float nebulaIntensity;
uniform float nebulaParallax;
uniform float starParallax;
uniform mat3 cameraRotation;

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

// Enhanced fractal noise for more complex nebula structures
float fbmDetailed(vec3 p, int octaves) {
  float f = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    f += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.03;
    p += vec3(0.17, 0.23, 0.31);
  }
  return f;
}

// Turbulence function for more chaotic nebula patterns
float turbulence(vec3 p, int octaves) {
  float t = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    t += amplitude * abs(noise(p * frequency));
    amplitude *= 0.5;
    frequency *= 2.01;
    p += vec3(0.19, 0.27, 0.37);
  }
  return t;
}

float stableHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Generate nebula clouds with multiple colors and patterns
vec3 generateNebula(vec3 dir) {
  if(nebulaIntensity <= 0.0) return vec3(0.0);
  
  // Compute parallax shift vector once
  vec3 shiftVec = cameraRotation * dir - dir;

  // Define parallax multipliers for each color layer
  float blueShift   = nebulaParallax * 0.1;  // closest
  float purpleShift = nebulaParallax * 0.08;
  float yellowShift = nebulaParallax * 0.06;
  float greenShift  = nebulaParallax * 0.04;
  float redShift    = nebulaParallax * 0.02;  // farthest

  // Shifted directions per color
  vec3 dirBlue   = normalize(dir + shiftVec * blueShift);
  vec3 dirPurple = normalize(dir + shiftVec * purpleShift);
  vec3 dirYellow = normalize(dir + shiftVec * yellowShift);
  vec3 dirGreen  = normalize(dir + shiftVec * greenShift);
  vec3 dirRed    = normalize(dir + shiftVec * redShift);

  // Sample noise fields with respective shifted dirs
  float nebula1 = fbmDetailed(dirBlue   * 3.0 + vec3(1.7, 2.3, 4.1), 6);
  float nebula2 = fbmDetailed(dirPurple * 5.0 + vec3(7.2, 1.8, 6.9), 5);
  float nebula3 = fbmDetailed(dirYellow * 8.0 + vec3(3.4, 9.1, 2.7), 4);
  float nebula4 = turbulence( dirGreen  * 12.0 + vec3(5.8, 4.6, 8.3), 4);
  
  float blueNebula   = smoothstep(0.3, 0.8, nebula1) * smoothstep(0.2, 0.7, nebula2);
  float purpleNebula = smoothstep(0.4, 0.9, nebula2) * smoothstep(0.1, 0.6, turbulence(dirPurple * 6.0 + vec3(11.2, 3.7, 9.8), 3));
  float yellowNebula = smoothstep(0.5, 0.85, nebula3) * smoothstep(0.3, 0.8, noise(dirYellow * 4.0 + vec3(2.9, 8.4, 5.1)));
  float greenNebula  = smoothstep(0.35, 0.75, nebula4) * smoothstep(0.2, 0.9, fbm(dirGreen * 7.0 + vec3(6.6, 1.3, 7.7)));
  float timeOffset = iTime * 0.02;
  float animNoise = noise(dirBlue * 2.0 + vec3(timeOffset, timeOffset * 0.7, timeOffset * 1.3));
  float animation = sin(timeOffset + animNoise * 6.28) * 0.1 + 0.9;
  vec3 blueColor   = vec3(0.2, 0.5, 1.0) * 0.8;
  vec3 purpleColor = vec3(0.6, 0.3, 0.9) * 0.7;
  vec3 yellowColor = vec3(1.0, 0.8, 0.3) * 0.6;
  vec3 greenColor  = vec3(0.3, 0.8, 0.4) * 0.5;
  vec3 redColor    = vec3(0.9, 0.3, 0.2) * 0.4;
  float redNebula = smoothstep(0.25, 0.7, fbm(dirRed * 9.0 + vec3(4.7, 7.8, 3.2)));
  vec3 finalNebula = vec3(0.0);
  finalNebula += blueColor * blueNebula   * (0.8 + 0.4 * noise(dirBlue   * 15.0 + vec3(12.1, 5.4, 8.9)));
  finalNebula += purpleColor * purpleNebula * (0.9 + 0.3 * noise(dirPurple * 11.0 + vec3(3.8, 14.2, 6.5)));
  finalNebula += yellowColor * yellowNebula * (0.7 + 0.5 * noise(dirYellow * 13.0 + vec3(9.3, 2.7, 11.8)));
  finalNebula += greenColor * greenNebula  * (0.6 + 0.4 * noise(dirGreen  * 17.0 + vec3(7.1, 8.8, 4.3)));
  finalNebula += redColor * redNebula     * (0.8 + 0.6 * noise(dirRed    * 19.0 + vec3(5.9, 12.4, 9.7)));
  float wispyPattern = fbm(dirBlue * 20.0 + vec3(8.2, 3.9, 14.6));
  vec3 wispyColor = mix(vec3(0.4, 0.6, 0.9), vec3(0.8, 0.4, 0.7), wispyPattern);
  float wispyMask = smoothstep(0.2, 0.6, wispyPattern) * 0.3;
  finalNebula += wispyColor * wispyMask;
  finalNebula *= animation * nebulaIntensity * 0.4;
  float depthVariation = noise(dirBlue * 1.5 + vec3(13.7, 6.8, 10.2)) * 0.3 + 0.7;
  finalNebula *= depthVariation;
  return finalNebula;
}

void main() {
  vec3 dir = normalize(vDirection);

  // --- Parallax for stars (simple blend) ---
  vec3 starDir = normalize(mix(dir, cameraRotation * dir, starParallax));

  // --- Nebula: only far shell, no parallax ---
  vec3 nebula = generateNebula(dir);

  // --- Tilted galactic band ---
  vec3 galacticAxis = normalize(vec3(0.5, 0.5, 0.707));
  float band = smoothstep(0.5, 0.0, abs(dot(dir, galacticAxis)));

  // --- Core brightness bias ---
  float coreBias = smoothstep(0.4, 1.0, dot(dir, normalize(vec3(1.0, 0.2, 0.1))));

  // --- Dust occlusion ---
  float dust = smoothstep(0.2, 0.6, fbm(dir * 10.0));
  float voidMask = smoothstep(0.1, 0.4, fbm(dir * 5.0 + 3.2));
  float occlusion = mix(1.0, 0.2, dust * voidMask * band);

  // --- Gas clouds (original galactic band clouds) ---
  float gasNoise = fbm(dir * 8.0 + 4.2);
  float edgeSoft = smoothstep(0.1, 0.9, band);
  float gasAlpha = smoothstep(0.25, 0.85, gasNoise) * 0.6 * edgeSoft;
  vec3 gasColor = mix(vec3(0.2, 0.1, 0.25), vec3(0.6, 0.4, 0.5), gasNoise);
  vec3 gasClouds = gasColor * gasAlpha;

  // --- Milky Way structure (attached to stars) ---
  float wispyNoise1 = fbm(starDir * 15.0 + vec3(2.1, 1.7, 3.3));
  float wispyNoise2 = fbm(starDir * 25.0 + vec3(7.2, 4.8, 1.9));
  float wispyNoise3 = fbm(starDir * 40.0 + vec3(5.5, 9.1, 6.7));
  
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
  float colorNoise1 = noise(starDir * 12.0 + vec3(11.3, 7.7, 4.1));
  float colorNoise2 = noise(starDir * 8.0 + vec3(3.8, 15.2, 9.6));
  float colorNoise3 = noise(starDir * 20.0 + vec3(6.4, 2.9, 12.8));
  
  // Create complex color regions
  vec3 baseColor = mix(cool, warm, coreBias);
  vec3 dustyMix = mix(baseColor, dusty, smoothstep(0.4, 0.7, colorNoise1));
  vec3 pinkMix = mix(dustyMix, pink, smoothstep(0.6, 0.9, colorNoise2) * 0.6);
  vec3 milkyColor = mix(pinkMix, purple, smoothstep(0.5, 0.8, colorNoise3) * 0.4);
  
  // Vary brightness across the structure
  float brightVariation = noise(starDir * 6.0 + vec3(8.2, 3.5, 11.7)) * 0.4 + 0.6;
  float milkyAlpha = milkyMask * occlusion * brightVariation * (0.3 + 0.7 * coreBias);
  
  vec3 milkyWay = milkyColor * milkyAlpha;

  // --- Starfield (restored original soft stars) ---
  float gridSize = 200.0;
  vec3 cell = floor(starDir * gridSize);
  vec3 local = fract(starDir * gridSize);
  float seed = stableHash(cell);
  float flicker = stableHash(cell + 1.0);
  float colorMix = stableHash(cell + 2.0);
  float radial = length(local - 0.5);
  float softness = pow(smoothstep(0.6, 0.0, radial), 2.0);
  float faint = smoothstep(0.94, 0.99, seed) * 0.1 * softness;
  float bright = smoothstep(0.985, 1.0, seed) * (0.6 + 0.4 * flicker) * softness;
  float star = faint + bright;
  vec3 starColor = mix(warm, cool, colorMix);

  // --- Twinkling Stars (from user) ---
  float twinkleColor = 0.0;
  
  // Quantize the direction vector to stabilize hash for subtle rotations
  // This effectively snaps the direction to a very fine grid
  float quantizationFactor = 1000.0;
  vec3 quantizedDir = floor(starDir * quantizationFactor) / quantizationFactor;

  // Use stable hash for star positions (fixed in world space)
  float starSeed = stableHash(quantizedDir * 800.0);
  
  // Use a smoothstep to fade stars in/out instead of a hard cutoff
  // This avoids the "pop-in" effect during rotation
  float threshold = 0.998;
  float fade = smoothstep(threshold - 0.0005, threshold + 0.0005, starSeed);

  // Only create twinkling stars for a small percentage of positions and if faded in
  if (fade > 0.0) {
    // Use a different seed for flicker properties (also stable in space)
    float flickerSeed = stableHash(quantizedDir * 1200.0);
    
    // Much slower, more natural flicker rate
    float slowTime = iTime * 0.3; // Slow down the time significantly
    float flickerRate = flickerSeed * 2.0 + 1.0; // Vary flicker rate per star (1-3)
    
    // Gentle sine wave flicker with some randomness
    float baseFlicker = sin(slowTime * flickerRate + flickerSeed * 6.28) * 0.5 + 0.5;
    float randomFlicker = sin(slowTime * flickerRate * 1.7 + flickerSeed * 12.56) * 0.3 + 0.7;
    
    // Combine for natural-looking twinkle
    float twinkleIntensity = baseFlicker * randomFlicker;
    
    // Make the twinkle more subtle and vary brightness per star
    float starBrightness = flickerSeed * 0.4 + 0.3; // 0.3 to 0.7 brightness range
    twinkleColor = starBrightness * twinkleIntensity * 0.6 * fade; // Reduce overall intensity and apply fade
  }
  
  // --- Final composite ---
  vec3 finalColor = milkyWay + gasClouds + nebula + starColor * star + vec3(twinkleColor);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function createStarfieldMaterial(
  nebulaIntensity: number = 0.1,
  nebulaParallax: number = 0.0,
  starParallax: number = 0.015
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0.0 },
      nebulaIntensity: { value: nebulaIntensity },
      nebulaParallax: { value: nebulaParallax },
      starParallax: { value: starParallax },
      cameraRotation: { value: new THREE.Matrix3() },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  });
}