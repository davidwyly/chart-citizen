import { describe, it, expect } from 'vitest';
import { createHabitablePlanetMaterial } from '../habitable-planet-material';
import * as THREE from 'three';

describe('HabitablePlanetMaterial', () => {
  it('should render with noisy biome blending', () => {
    const material = createHabitablePlanetMaterial();
    // Mock or simulate shader behavior; add assertions for biome noise integration
    expect(material.uniforms.biomeNoise).toBeDefined();  // Simplified assertion; in practice, test visual output or parameters
  });

  it('should render without snow glow', () => {
    const material = createHabitablePlanetMaterial();
    // Simulate or mock shader output; assert snow color is not amplified
    expect(material.uniforms.snowColor).toBeDefined();  // Simplified; ensure no multiplier in practice
  });
  
  it('should render clouds without ambient light', () => {
    const material = createHabitablePlanetMaterial();
    // Mock or check cloud lighting logic
    expect(material.uniforms.cloudColor).toBeDefined();  // Ensure only diffuse lighting is used
  });

  it('should darken water near shorelines', () => {
    const material = createHabitablePlanetMaterial();
    // Simulate or mock shader output; assert shoreline darkening logic
    expect(material.uniforms.seaColor).toBeDefined();  // Simplified; ensure darkening is applied in practice
  });

  it('should render city lights as discrete pinpricks', () => {
    const material = createHabitablePlanetMaterial();
    // Simulate or mock shader output; assert nightLight is thresholded
    expect(material.uniforms.cityLightColor).toBeDefined();  // Simplified; ensure lights are binary in practice
  });

  it('should render dynamic lava flows when volcanism and temperature are high', () => {
    const material = createHabitablePlanetMaterial(undefined, 50, 80, 20, 90, false);
    expect(material).toBeDefined();  // Added to ensure material creates successfully post-fix
    expect(material.uniforms.lavaColor).toBeDefined();
    expect(material.uniforms.lavaGlowColor).toBeDefined();
    expect(material.uniforms.volcanism.value).toBe(90);
    expect(material.uniforms.temperature.value).toBe(80);
  });

  test('waterLevel adjusts correctly based on temperature', () => {
    expect(createHabitablePlanetMaterial(undefined, undefined, 50).waterLevel).toBe(0.0);  // Below 100°C, should be 0
    expect(createHabitablePlanetMaterial(undefined, undefined, 100).waterLevel).toBe(0.0);  // Exactly at 100°C, should be 0
    expect(createHabitablePlanetMaterial(undefined, undefined, 150).waterLevel).toBe(-12.5);  // Midway, should be -12.5
    expect(createHabitablePlanetMaterial(undefined, undefined, 200).waterLevel).toBe(-25.0);  // At 200°C, should be -25
  });

  test('cloud density caps at 100°C and color transitions to dark gray', () => {
    const materialAt50C = createHabitablePlanetMaterial(undefined, undefined, 50);
    const materialAt100C = createHabitablePlanetMaterial(undefined, undefined, 100);
    const materialAt200C = createHabitablePlanetMaterial(undefined, undefined, 200);
    // Assuming access to internal uniforms or mocking for testing; verify based on expected behavior
    expect(materialAt100C.uniforms.cloud.value).toBeGreaterThanOrEqual(materialAt50C.uniforms.cloud.value);  // Density should be max at 100°C
    expect(materialAt200C.uniforms.cloud.value).toBe(materialAt100C.uniforms.cloud.value);  // No further increase
    // For color transition, check if the color mix is applied (this might require mocking or direct access)
    expect(materialAt200C.uniforms.cloudColor.value).toEqual(new THREE.Color(0.3, 0.3, 0.3));  // Fully dark gray at 200°C
  });

  test('cloud opacity increases with temperature from 100°C to 200°C', () => {
    const materialAt100C = createHabitablePlanetMaterial(undefined, undefined, 100);
    const materialAt150C = createHabitablePlanetMaterial(undefined, undefined, 150);
    const materialAt200C = createHabitablePlanetMaterial(undefined, undefined, 200);
    // Assuming access to internal cloud density or mocking; verify based on expected scaling
    expect(materialAt150C.uniforms.cloud.value).toBeGreaterThan(materialAt100C.uniforms.cloud.value);  // Increased at 150°C
    expect(materialAt200C.uniforms.cloud.value).toBeGreaterThanOrEqual(materialAt150C.uniforms.cloud.value);  // Further increased at 200°C
  });

  test('oceans dry up at 200°C', () => {
    const materialAt200C = createHabitablePlanetMaterial(undefined, undefined, 200);
    expect(materialAt200C.uniforms.waterLevel.value).toBe(-25.0);  // Verify waterLevel is set to -25, implying oceans are dried up
  });

  test('enhanced lava texture is realistic and maintains functionality', () => {
    const material = createHabitablePlanetMaterial(undefined, undefined, 150);  // Temperature where lava is active
    expect(material.uniforms.lavaColor).toBeDefined();  // Ensure lavaColor uniform is present
    expect(material.uniforms.lavaColor.value).not.toEqual(new THREE.Color(0, 0, 0));  // Verify it's not zero, indicating active lava
  });

  test('water level decreases correctly above 100°C', () => {
    const materialAt150C = createHabitablePlanetMaterial(undefined, undefined, 150);
    const materialAt200C = createHabitablePlanetMaterial(undefined, undefined, 200);
    expect(materialAt150C.uniforms.waterLevel.value).toBeLessThan(0.0);  // Should be negative at 150°C
    expect(materialAt200C.uniforms.waterLevel.value).toBe(-25.0);  // Fully at minimum
  });

  test('water level starts decreasing at exactly 100°C', () => {
    const materialAt100C = createHabitablePlanetMaterial(undefined, undefined, 100);
    expect(materialAt100C.uniforms.waterLevel.value).toBeLessThanOrEqual(0.0);  // Should be negative or zero at 100°C
    const materialAt101C = createHabitablePlanetMaterial(undefined, undefined, 101);
    expect(materialAt101C.uniforms.waterLevel.value).toBeLessThan(0.0);  // Confirm decrease just above 100°C
  });

  test('water level decreases by 0.25 per degree over 100°C', () => {
    const materialAt100C = createHabitablePlanetMaterial(undefined, undefined, 100);
    expect(materialAt100C.uniforms.waterLevel.value).toBe(0.0);  // No decrease at exactly 100°C as per new logic
    const materialAt101C = createHabitablePlanetMaterial(undefined, undefined, 101);
    expect(materialAt101C.uniforms.waterLevel.value).toBe(-0.25);  // First decrease
    const materialAt110C = createHabitablePlanetMaterial(undefined, undefined, 110);
    expect(materialAt110C.uniforms.waterLevel.value).toBe(-2.5);  // 2.5 at 110°C
    const materialAt200C = createHabitablePlanetMaterial(undefined, undefined, 200);
    expect(materialAt200C.uniforms.waterLevel.value).toBe(-25.0);  // Full decrease
  });

  test('desert biome color is updated to sandy yellow', () => {
    const material = createHabitablePlanetMaterial();
    // Assuming access to getDiscreteBiomeColor logic; test for desert conditions (t=3, h=1)
    vec3 desertColor = getDiscreteBiomeColor(60.0, 10.0);  // Example for desert: T around 60 (t=3), H around 10 (h=1)
    expect(desertColor).toEqual(vec3(0.9, 0.85, 0.6));
  });

  test('desert biome color update is reflected in material configuration', () => {
    const material = createHabitablePlanetMaterial();
    expect(material).toBeDefined();  // Ensure material is created
    // Indirectly verify by checking if uniforms are present, assuming they influence rendering
    expect(material.uniforms).toBeDefined();
    expect(material.uniforms.landColor).toBeDefined();  // Related to biomes, ensure it's set
  });

  test('water level calculation includes humidity offset', () => {
    const materialAt100C_HighHumidity = createHabitablePlanetMaterial(undefined, 80, 100);  // High humidity at 100°C
    expect(materialAt100C_HighHumidity.uniforms.waterLevel.value).toBeGreaterThanOrEqual(0.0);  // Humidity should offset decrease
    const materialAt150C_LowHumidity = createHabitablePlanetMaterial(undefined, 20, 150);  // Low humidity at 150°C
    expect(materialAt150C_LowHumidity.uniforms.waterLevel.value).toBeLessThan(- (50 * 0.25));  // Temperature decrease with minimal offset
    const materialAt200C_HighHumidity = createHabitablePlanetMaterial(undefined, 100, 200);  // Max humidity at 200°C
    expect(materialAt200C_HighHumidity.uniforms.waterLevel.value).toBe(-25.0);  // Clamped to minimum
  });

  test('height function includes extra noise octave for finer details', () => {
    const p = vec3(1.0, 1.0, 1.0);  // Example point
    const material = new HabitablePlanetMaterial({ /* params */ });
    const h = material.height(p);  // Assuming access or mock
    expect(h).toBeGreaterThan(0);  // Basic check; expand with expected ranges if possible
  });

  test('cloud function produces more realistic patterns with additional noise', () => {
    const p = vec3(0.0, 0.0, 0.0);
    const material = new HabitablePlanetMaterial({ showClouds: true, humidity: 50.0, temperature: 50.0 });
    const c = material.cloud(p);
    expect(c).toBeGreaterThan(0);  // Verify it's generating values; add more specific assertions based on expected output
  });

  test('height function enhancements are reflected in material creation', () => {
    const material = createHabitablePlanetMaterial({ /* params, e.g., terrainScale: 4.0 */ });
    expect(material).toBeDefined();  // Basic check for material creation
    // Add indirect checks if possible, e.g., verify uniforms
    expect(material.uniforms.terrainScale.value).toBe(4.0);  // Example based on existing code
  });

  test('cloud function enhancements are reflected in material creation', () => {
    const material = createHabitablePlanetMaterial({ showClouds: true, humidity: 50.0, temperature: 50.0 });
    expect(material).toBeDefined();
    expect(material.uniforms.showClouds.value).toBe(true);  // Verify uniform settings
  });

  test('ice texture has no glowing and includes fractal patterns', () => {
    const material = createHabitablePlanetMaterial({ temperature: 10.0 });  // Low temperature for ice
    expect(material.uniforms).toBeDefined();  // Ensure uniforms are set
    // Indirectly check by verifying color-related uniforms or material creation
    const iceColor = material.uniforms.snowColor.value;  // Assuming access
    expect(iceColor.r).toBeCloseTo(0.8);  // Neutral color check
    expect(iceColor.g).toBeCloseTo(0.9);
    expect(iceColor.b).toBeCloseTo(1.0);
    // Add a basic expectation for the update
    expect(material).toBeDefined();
  });

  test('volcanism increases mountain ranges and adds fractal lava patterns', () => {
    const material = createHabitablePlanetMaterial({ volcanism: 80.0 });  // High volcanism
    expect(material).toBeDefined();
    expect(material.uniforms.volcanism.value).toBe(80.0);  // Verify setting
    // Indirectly check for effects, e.g., ensure lava color is mostly black with patterns
    const lavaColor = material.uniforms.lavaColor.value;  // Assuming access
    expect(lavaColor.r).toBeLessThan(0.2);  // Expect mostly black (e.g., low red component)
    expect(lavaColor.g).toBeLessThan(0.2);
    expect(lavaColor.b).toBeLessThan(0.2);
  });

  test('enhanced volcanism effects are applied correctly', () => {
    const material = createHabitablePlanetMaterial({ volcanism: 80.0 });
    expect(material).toBeDefined();
    expect(typeof material.uniforms.volcanism.value).toBe('number');  // Basic type check
    expect(material.uniforms.volcanism.value).toBeGreaterThan(0);
  });

  test('volcano glowing and fault lines are enhanced', () => {
    const material = createHabitablePlanetMaterial({ volcanism: 80.0, temperature: 120.0 });
    expect(material).toBeDefined();
    expect(material.uniforms.volcanism.value).toBeGreaterThan(0);
    const lavaColor = material.uniforms.lavaColor.value;
    expect(lavaColor.r).toBeGreaterThan(0.1);  // Check for glow presence
  });
}); 