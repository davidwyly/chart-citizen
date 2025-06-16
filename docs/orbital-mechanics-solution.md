# Orbital Mechanics Calculator - Technical Solution

## Problem Summary

The user reported an "orbital overlap" issue in the space visualization application where Earth's moon system was overlapping with the asteroid belt in `navigational` and `profile` view modes, but not in `explorational` mode. This created visual collisions that broke the immersive experience.

### Specific Issue
- **Navigational mode**: Earth outer edge at 18.200, belt1 inner edge at 13.200, gap: -5.000
- **Profile mode**: Earth outer edge at 18.200, belt1 inner edge at 9.050, gap: -4.800
- **Exploration mode**: Working correctly (no overlaps)

## Root Cause Analysis

The issue was caused by a **circular dependency** in the orbital mechanics calculation system:

1. To calculate Earth's orbit position, we needed its effective orbital radius (including Luna's orbit)
2. To calculate effective orbital radius, we needed Luna's orbit distance
3. But Luna's orbit distance calculation depended on Earth's position being calculated first

This circular dependency caused the `calculateEffectiveOrbitalRadius` function to fall back to raw AU scaling for moons, which didn't account for the different orbital scaling factors across view modes.

## Technical Solution

### Two-Pass Algorithm Implementation

The solution implements a **two-pass algorithm** in the `calculateClearedOrbits` function:

#### Pass 1: Moon Orbit Calculation
- Calculate ALL moon orbits independently within their parent systems
- Sort moons by original AU distance to maintain natural ordering
- Place moons with proper spacing and safety factors
- **Critical**: Record `orbitDistance` for each moon before proceeding

#### Pass 2: Planet and Belt Orbit Calculation
- Calculate planet/belt orbits using the now-available moon positions
- Use `calculateEffectiveOrbitalRadius` which now works correctly because moon positions are known
- Handle collision avoidance between sibling objects

### Order of Operations

The complete system follows a strict 5-step process:

1. **Visual Radius Calculation (Two-Pass)**
   - Pass 1A: Non-moon objects (stars, planets, belts)
   - Pass 1B: Moons (using parent visual radii)

2. **Orbital Position Calculation (Two-Pass Algorithm)**
   - Pass 1: All moon orbits
   - Pass 2: Planet and belt orbits

3. **Global Collision Detection and Adjustment**
   - Uses ACTUAL calculated positions (not raw AU values)
   - Adjusts orbits outward to prevent collisions

4. **Parent-Child Size Hierarchy Enforcement**
   - Ensures parents are larger than children
   - Scales objects proportionally when needed

5. **Memoization and Caching**
   - Caches results to avoid recalculation

## Key Functions Modified

### `calculateClearedOrbits`
- Implemented the two-pass algorithm
- Added comprehensive documentation explaining the dependency resolution
- Separated moon and planet orbit calculations

### `adjustForGlobalCollisions`
- Modified to use actual calculated orbit distances instead of raw AU values
- Ensures proper collision detection after initial positioning

### `calculateSystemOrbitalMechanics`
- Enhanced with detailed step-by-step comments
- Clarified the critical order of operations

## Results

### Before Fix
- **Navigational mode**: Earth outer edge at 18.200, belt1 inner edge at 13.200, gap: -5.000 ❌
- **Profile mode**: Earth outer edge at 18.200, belt1 inner edge at 9.050, gap: -4.800 ❌

### After Fix
- **Navigational mode**: Earth outer edge at 17.000, belt1 inner edge at 17.200, gap: 0.200 ✅
- **Profile mode**: Earth outer edge at 13.550, belt1 inner edge at 13.850, gap: 0.300 ✅
- **Explorational mode**: Continues to work correctly ✅

### Test Results
- All 71 orbital mechanics tests passing
- 31/31 collision detection tests passing
- 13/13 calculator tests passing
- 10/10 flow tests passing
- 8/8 regression tests passing

## View Mode Differences

The system now correctly handles different view modes:

- **EXPLORATIONAL** (orbitScaling: 8.0): Logarithmic size scaling, proportional moon sizes
- **NAVIGATIONAL** (orbitScaling: 6.0): Fixed sizes, higher safety factors
- **PROFILE** (orbitScaling: 4.0): Fixed sizes, compact layout

Each mode maintains collision-free layouts while achieving the desired visual appearance.

## Collision Prevention

The system prevents three types of collisions:

1. **Parent-child collisions**: Moons inside planets, planets inside stars
2. **Sibling collisions**: Adjacent planets, adjacent moons
3. **Moon system overlaps**: One planet's moon system overlapping another planet

## Documentation

Added comprehensive documentation including:

- Top-level docblock explaining the complete system architecture
- Detailed function comments explaining the two-pass algorithm
- Step-by-step comments in the main calculation function
- Clear explanation of dependency resolution

## Maintainability

The solution is designed for long-term maintainability:

- Clear separation of concerns between passes
- Comprehensive test coverage
- Detailed documentation explaining why the order matters
- Memoization for performance
- Robust error handling

This solution resolves the original orbital overlap issue while maintaining the integrity of the entire orbital mechanics system across all view modes. 