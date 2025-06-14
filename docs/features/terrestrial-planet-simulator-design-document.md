## Terrestrial Planet Simulator Design Document

### Planet Surface Structure

* **Sea Floor (Lowest Level):** Represents the absolute lowest elevation.
* **Mountain Peak (Highest Level):** Represents the absolute highest elevation.

### Humidity & Sea Level Relationship

* **Humidity at 0%:** Sea level is below the sea floor (no water).
* **Humidity at 100%:** Sea level covers all land, including the highest mountain peak (water planet).
* **Intermediate Humidity:** Sea level proportionally rises or falls between sea floor and mountain peaks.

### Cloud Coverage

* **0% Humidity:** No clouds.
* **100% Humidity:** Complete cloud coverage.
* **Intermediate Humidity:** Cloud coverage scales proportionally.

### Terrain Types based on Temperature and Humidity

| Temperature Level | Humidity Level | Terrain Type           | Color Palette                |
| ----------------- | -------------- | ---------------------- | ---------------------------- |
| Very High         | Very High      | **Barren Swamp**       | Spotted reddish-brown & blue |
| Very High         | High           | **Volcanic Plains**    | Dark reddish-black           |
| Very High         | Medium         | **Eroded Plateau**     | Yellowish-brown              |
| Very High         | Low            | **Red Rock Desert**    | Reddish-brown                |
| Very High         | Very Low       | **Desolate Wasteland** | Gray                         |
| High              | Very High      | **Tropical Swamp**     | Spotted dark green & blue    |
| High              | High           | **Dense Jungle**       | Dark green                   |
| High              | Medium         | **Temperate Forest**   | Green                        |
| High              | Low            | **Desert**             | Brown                        |
| High              | Very Low       | **Dry Savannah**       | Pale yellow-brown            |
| Medium            | Very High      | **Rainforest**         | Lush vibrant green           |
| Medium            | High           | **Mixed Forest**       | Medium green                 |
| Medium            | Medium         | **Grassland**          | Greenish-yellow              |
| Medium            | Low            | **Steppe**             | Pale brown                   |
| Medium            | Very Low       | **Dry Plains**         | Pale beige                   |
| Low               | Very High      | **Glacial Ice**        | Bright white & pale blue     |
| Low               | High           | **Snowfields**         | White                        |
| Low               | Medium         | **Tundra**             | Spotted brown & white        |
| Low               | Low            | **Cold Desert**        | Pale reddish-brown           |
| Low               | Very Low       | **Polar Wastes**       | Light grayish-white          |

### Implementation Notes

* Shaders will interpolate smoothly between these defined terrains.
* Elevation, humidity, and temperature maps will be generated procedurally to ensure realistic planet variations.
* Cloud density shader will adjust opacity and coverage based on humidity levels.
* Transition zones between terrains will blend colors and textures smoothly for visual realism.

### Water Level Dynamics

* **Desert Planet Transition (0% → 1%+ Humidity):** Starting from a completely dry desert planet at 0% humidity, water begins to visibly pool at the lowest sea floor points as humidity increases to 1% and beyond.
* **Water Planet Transition (100% → 99%- Humidity):** Starting from a complete water planet at 100% humidity, islands begin to visibly emerge at the highest mountain peaks as humidity decreases to 99% and below.
* **Gradual Water Level Changes:** Water level transitions should be smooth and continuous, creating realistic shoreline changes as humidity adjusts.

### Volcanism Effects

* **Minimum Variation (0% Volcanism):** Even at 0% volcanism, planets retain natural topographical variation - no planet is perfectly smooth.
* **Maximum Variation (100% Volcanism):** Extremely high mountains and extremely deep valleys, distributed across tectonic plate boundaries that separate continental masses.
* **Tectonic Distribution:** High volcanism creates isolated extreme terrain features across plate boundaries rather than uniform elevation changes.

### Temperature Distribution

* **Latitudinal Gradient:** Temperature varies by latitude - warmer at the equator, progressively colder toward the poles.
* **Equatorial Heat:** Maximum temperatures occur near the equatorial band.
* **Polar Cold:** Minimum temperatures occur at the polar regions.

### Population Distribution Rules

* **No Biome Impact:** Population levels do not affect terrain biome types or colors.
* **Habitat Preferences:** Population concentrates in areas with:
  - Hospitable temperatures (avoiding extreme hot/cold)
  - Lower elevations (avoiding high mountains)
  - Proximity to water sources
* **Water Exclusion:** Population cannot exist in water - no underwater cities or settlements.
* **Random Distribution:** Within suitable habitable zones, population distributes randomly rather than in predictable patterns.

### Additional Features

* Dynamic weather patterns simulated through shader-based animations.
* Real-time humidity and temperature changes affect visible terrain.
* Configurable parameters for planet size, temperature range, and humidity distribution.

This framework allows for visually distinctive and dynamically responsive planetary environments, creating an engaging simulation experience.

## Critical Bug Fix: Water Level Distribution

### Problem Discovered
During shader testing, we discovered that humidity was NOT creating linear water distribution as intended. Instead, land and water coexisted in a very narrow range around 4% humidity, making the humidity parameter essentially useless.

### Root Cause Analysis

**Problem 1: Terrain Scale Dependency on Humidity**
```glsl
// BROKEN: Terrain scale varied with humidity
float sc = terrainScale * (1.0 + humidity/200.0);
```

This meant:
- At 0% humidity: terrain scale = 4.0
- At 50% humidity: terrain scale = 5.0  
- At 100% humidity: terrain scale = 6.0

The terrain itself was becoming more varied as humidity increased, completely breaking water level calculations.

**Problem 2: Fixed Assumptions in Water Level Calculations**
```glsl
// BROKEN: Fixed assumptions that didn't match actual terrain
float medianHeight = 2.5;  // Wrong for varying terrain scales
float terrainRange = 40.0; // Wrong for varying terrain scales
```

### Solution Implemented

**Fix 1: Remove Humidity Dependency from Terrain Generation**
```glsl
// FIXED: Terrain scale is now consistent
float sc = terrainScale; // No humidity dependency
```

**Fix 2: Calibrate Water Levels to Actual Terrain Distribution**
```glsl
// FIXED: Based on actual terrain characteristics
float minTerrainHeight = -28.0; // 7 noise layers * -4.0 + 0 mountains
float maxTerrainHeight = 30.4;  // 7 noise layers * 4.0 + 2.4 mountains
float dryLevel = minTerrainHeight - 2.0;  // Well below all terrain
float wetLevel = maxTerrainHeight + 2.0;  // Well above all terrain
```

### Results After Fix
| Humidity | Water Level | Land % | Expected % |
|----------|-------------|--------|------------|
| 1%       | -29.4       | 100%   | 99%        |
| 25%      | -14.4       | 77%    | 75%        |
| 50%      | 1.2         | 50%    | 50%        |
| 75%      | 16.8        | 23%    | 25%        |
| 99%      | 31.8        | 0%     | 1%         |

### Why Tests Didn't Catch This Initially

1. **Isolated Testing**: Tests re-implemented shader functions in isolation without integration
2. **Fixed Assumptions**: Tests assumed terrain distribution was constant
3. **No Integration Tests**: No tests validated the relationship between terrain generation and water levels

### Prevention: Integration Tests Added

Added comprehensive integration tests that validate:
- Terrain distribution consistency across humidity values
- Water level calculations match actual terrain characteristics  
- Proper land/water percentages across humidity range
- Water level range spans full terrain range appropriately

These tests would have immediately caught the terrain scale dependency issue. 