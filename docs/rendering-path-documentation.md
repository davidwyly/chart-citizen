# Celestial System Rendering Path Documentation

## Overview

This document traces the complete rendering path for each view mode in the Chart Citizen celestial system explorer, from raw system data through scaling, orbital positioning, object placement, camera setup, and collision avoidance.

## Core Architecture

### Key Components

1. **View Mode Definitions** (`/engine/core/view-modes/modes/`)
   - Define scaling parameters, camera settings, and features for each mode
   - Each mode has unique visual and orbital scaling configurations
   - Includes optional `objectScaling` property for fine-tuned size control
   - `fixedSizes` includes star, planet, moon, asteroid, belt, and barycenter

2. **Orbital Mechanics Calculator** (`/engine/utils/orbital-mechanics-calculator.ts`)
   - Multi-pass algorithm for resolving circular dependencies
   - Comprehensive collision avoidance system
   - View-mode specific scaling logic

3. **System Objects Renderer** (`/engine/components/system-viewer/system-objects-renderer.tsx`)
   - Orchestrates rendering of all celestial objects
   - Applies calculated positions and scales
   - Manages object hierarchy

4. **Orbital Path Component** (`/engine/components/system-viewer/components/orbital-path/orbital-path.tsx`)
   - Positions objects on their orbits
   - Handles orbital motion animation
   - View-mode specific orbital mechanics

5. **Camera Controller** (`/engine/components/system-viewer/unified-camera-controller.tsx`)
   - Manages camera positioning and animation
   - View-mode specific framing logic

## Rendering Path by View Mode

### 1. Explorational View Mode

**Purpose**: Educational content with real astronomical data, optimized for exploration and learning.

**Configuration** (`explorational-mode.ts:18-26`):
```typescript
scaling: {
  maxVisualSize: 8.0,     // Allow gas giants while keeping UI manageable
  minVisualSize: 0.1,     // Use optimal Three.js range minimum
  orbitScaling: 50.0,     // Scaled with visual sizes
  safetyMultiplier: 2.5,  // Buffer for educational content spacing
  minDistance: 0.1,       // Allow closer inspection
}
```

**Rendering Path**:

1. **Visual Size Calculation** (`orbital-mechanics-calculator.ts:1044-1056`)
   - Uses logarithmic scaling for realistic proportions
   - Earth as reference point for all scaling
   - Moons scale proportionally to parent planets

2. **Orbital Position Calculation** (`orbital-mechanics-calculator.ts:685-704`)
   - Uses scaled astronomical distances (AU × 50)
   - Maintains realistic orbital relationships
   - Enforces minimum safe distances

3. **Object Positioning** (`orbital-path.tsx:75-90`)
   - Full elliptical orbits with eccentricity
   - Kepler's equation for realistic orbital mechanics
   - Variable orbital velocity (faster at periapsis)

4. **Camera Setup** (`explorational-mode.ts:28-45`)
   - Default 30° elevation for good perspective
   - 4x radius multiplier for comfortable viewing
   - Smooth "leap" easing for focus transitions

### 2. Navigational View Mode

**Purpose**: Optimized for navigation with equidistant orbital paths and consistent object sizes.

**Configuration** (`navigational-mode.ts:18-32`):
```typescript
scaling: {
  maxVisualSize: 6.0,
  minVisualSize: 0.2,
  orbitScaling: 40.0,     // Tighter than explorational
  safetyMultiplier: 3.0,  // Large buffer for clarity
  minDistance: 1.0,
  fixedSizes: {           // Fixed sizes for consistency
    star: 2.0,
    planet: 1.2,
    moon: 0.6,
    asteroid: 0.3,
    belt: 1.0,           // Asteroid belt visualization
    barycenter: 0.0,     // Invisible reference point
  }
}
```

**Rendering Path**:

1. **Visual Size Calculation** (`orbital-mechanics-calculator.ts:167-197`)
   - Fixed sizes for each object type
   - Gas giants use Earth ratio but capped at 3x base size
   - Consistent sizing for easy navigation

2. **Orbital Position Calculation**
   - Same as explorational but with tighter spacing
   - 40x orbital scaling for more compact layout

3. **Object Positioning** (`orbital-path.tsx:68-73`)
   - Circular orbits only (no eccentricity)
   - All objects in same plane (y = 0)
   - Clean, predictable motion

4. **Camera Setup** (`navigational-mode.ts:34-51`)
   - 35° elevation for overview perspective
   - Quick 600ms focus animations
   - Minimal UI distractions

### 3. Profile View Mode

**Purpose**: Top-down diagrammatic view with orthographic projection for orbital relationships.

**Configuration** (`profile-mode.ts:18-32`):
```typescript
scaling: {
  maxVisualSize: 1.5,     // Very compact
  minVisualSize: 0.03,
  orbitScaling: 0.3,      // Extremely tight spacing
  safetyMultiplier: 3.5,
  minDistance: 0.3,
  fixedSizes: {
    star: 1.5,
    planet: 0.8,
    moon: 0.4,
    belt: 0.6,
    barycenter: 0.0,
  }
}
```

**Rendering Path**:

1. **Visual Size Calculation**
   - Fixed small sizes for diagrammatic clarity
   - Minimal size variation between objects

2. **Orbital Position Calculation** (`orbital-mechanics-calculator.ts:686-688,772-786`)
   - Equidistant spacing ignoring astronomical distances
   - Sequential placement with minimal gaps
   - Belt objects use minimal width (0.5x minDistance)

3. **Object Positioning** (`orbital-path.tsx:62-68`)
   - Static circular positioning (no animation when paused)
   - Perfect circles for clean diagram
   - Objects start at 0° for alignment

4. **Special Layout Controller** (`profile-layout-controller.tsx`)
   - Focal object at x=-10
   - Orbiting bodies start at x=-2 with 4-unit spacing
   - 22.5° default elevation (softer angle for profile view)
   - Profile layout controller uses 45° for internal calculations
   - Automatic framing of visible objects

### 4. Scientific View Mode

**Purpose**: True-to-life astronomical scales and properties for scientific accuracy.

**Configuration** (`scientific-mode.ts:18-26`):
```typescript
scaling: {
  maxVisualSize: 40.0,    // Allow realistic gas giant sizes
  minVisualSize: 0.1,
  orbitScaling: 80.0,     // Scaled up to prevent cramping
  safetyMultiplier: 1.1,  // Minimal buffer for accuracy
  minDistance: 0.1,
}
```

**Rendering Path**:

1. **Safe Scaling Calculation** (`safe-scaling-calculator.ts:45-119`)
   - Mercury's orbit constrains maximum star size
   - Ensures Sol doesn't collide with inner planets
   - Maintains true astronomical proportions

2. **Visual Size Calculation** (`orbital-mechanics-calculator.ts:132-162`)
   - True proportional scaling from Earth reference
   - Stars constrained by safe scaling limits
   - Minimal size adjustments for visibility

3. **Orbital Position Calculation**
   - Uses safe orbital scaling (typically 80x)
   - Minimal safety multipliers (1.1x)
   - True astronomical distances preserved

4. **Camera Setup** (`scientific-mode.ts:28-45`)
   - Extreme zoom range (0.01 to 10000 units)
   - 15° default elevation for scale appreciation
   - Extended animation durations

## Collision Avoidance System

The system employs a sophisticated 5-step collision avoidance process:

### 1. Visual Radius Calculation (Two-Pass)

**Pass 1**: Calculate sizes for non-moon objects (`orbital-mechanics-calculator.ts:1041-1047`)
- Stars, planets, and belts sized first
- Required because moon sizes depend on parent sizes

**Pass 2**: Calculate moon sizes (`orbital-mechanics-calculator.ts:1051-1056`)
- Proportional to parent in explorational mode
- Fixed sizes in other modes

### 2. Orbital Position Calculation (Multi-Pass Algorithm)

**The Problem** (`orbital-mechanics-calculator.ts:50-64`):
- Earth's position needs its effective radius (including moons)
- Effective radius needs moon positions
- Moon positions need Earth's position (circular dependency!)

**The Solution**:

**Pass 1A**: Calculate sizes for non-moon objects
**Pass 1B**: Calculate sizes for moon objects

**Pass 2**: Calculate all moon orbits (`orbital-mechanics-calculator.ts:572-714`)
```typescript
// For each planet's moons:
let nextAvailableDistance = parentRadius * safetyMultiplier
for (const moon of moons) {
  const minSafeDistance = parentRadius + moonRadius + minDistance
  actualDistance = Math.max(desired, nextAvailable, minSafe)
  results.get(moon.id).orbitDistance = actualDistance
  nextAvailableDistance = actualDistance + moonRadius * 2 + minDistance
}
```

**Pass 3**: Calculate planet orbits (`orbital-mechanics-calculator.ts:722-884`)
```typescript
// Now moon positions are known, calculate effective radius:
const effectiveRadius = calculateEffectiveOrbitalRadius(planet)
// Place planet accounting for its entire moon system
actualDistance = Math.max(desired, previousObject + effectiveRadius)
```

**Pass 4**: Apply size hierarchy constraints

**Pass 4.5**: Re-check moon collisions after size hierarchy changes
- Ensures moons don't collide after parent size adjustments
- Critical for maintaining collision-free layouts

### 3. Effective Orbital Radius Calculation

**Function** (`orbital-mechanics-calculator.ts:261-326`):
- Finds outermost moon orbit
- Returns max(planetRadius, outermostMoonOrbit + moonRadius)
- Ensures entire moon system is accounted for

### 4. Global Collision Detection

**Function** (`orbital-mechanics-calculator.ts:386-410`):
- Checks all objects orbiting same parent
- Uses actual calculated positions, not raw AU values
- Adjusts orbits outward if collisions detected

### 5. Parent-Child Hierarchy Enforcement

**Function** (`orbital-mechanics-calculator.ts:889-976`):
- Ensures parents are visually larger than children
- Scales objects proportionally when needed
- Exempts belts and rings from hierarchy rules

## Special Cases

### Binary and Multiple Star Systems

**Detection** (`system-objects-renderer.tsx:270-287`):
- Objects with parent="barycenter" and classification="star"
- Sorted by semi_major_axis for consistent ordering
- Supports systems with more than 2 stars

**Positioning** (`orbital-path.tsx:115-118`):
- Primary star at 0° (binaryStarIndex=0)
- Secondary star at 180° (binaryStarIndex=1)
- Additional stars distributed evenly (e.g., tertiary at 90°)
- All orbit the invisible barycenter
- Example: Alpha Centauri system with Proxima Centauri

### Belt Objects

**Calculation** (`orbital-mechanics-calculator.ts:809-883`):
- Inner and outer radius define the belt
- Width limited to prevent massive gaps:
  - Explorational: 2x minDistance
  - Other modes: 0.5x orbitScaling
- Profile mode uses minimal 0.5x minDistance width

**Rendering** (`system-objects-renderer.tsx:325-363`):
- Calculated belt data passed to renderer
- Positioned at center radius
- Special volumetric rendering

### Objects with Non-Existent Parents

**Handling** (`orbital-mechanics-calculator.ts:576-649`):
- Detected when parent ID doesn't match any object
- Treated as root objects for rendering
- Common for binary systems with "barycenter" parent

## Camera and Viewing

### Focus Object Framing

**Process** (`unified-camera-controller.tsx`):
1. Calculate object's visual size and orbital radius
2. Apply view-mode specific radius multiplier
3. Position camera at calculated distance
4. Animate with view-mode specific easing

### Smart Distance Calculation for Extreme Systems

**Algorithm** (`unified-camera-controller.tsx:smartDistanceCalculation`):
- Detects systems with extreme orbital range ratios (>100:1)
- For larger systems (10+ objects): Uses 80th percentile distance
- For smaller extreme systems: Uses 2nd farthest object distance
- Prevents camera being too far out for systems with outlier objects
- Example: Systems with distant comets or captured objects

### Birds Eye View

**Calculation** (`unified-camera-controller.tsx:132-152`):
- Find maximum orbital radius in system
- Use view-mode specific elevation angle
- Frame entire system with smart distance calculation

### Profile Mode Special Camera

**Layout** (`profile-layout-controller.tsx:75-95`):
- 45° elevation angle
- Centers between focal object and outermost orbiter
- Automatic width-based distance calculation

## Performance Optimizations

1. **Memoization** (`orbital-mechanics-calculator.ts:1000-1006`)
   - Cache calculations by system + view mode
   - Avoid recalculation on every frame

2. **Hierarchical Rendering** (`system-objects-renderer.tsx:404-438`)
   - Build object hierarchy once
   - Render recursively for efficiency

3. **Selective Visibility** (`system-objects-renderer.tsx:181-234`)
   - Profile mode hides non-relevant objects
   - Reduces GPU load for complex systems

4. **Stable References** 
   - Memoized components prevent re-renders
   - Callback refs for object registration

## Summary

The rendering path ensures:
1. **No Collisions**: Comprehensive multi-pass algorithm
2. **View-Appropriate Scaling**: Each mode optimized for its purpose
3. **Smooth Navigation**: Proper camera framing and animation
4. **Scientific Accuracy**: True proportions in scientific mode
5. **Performance**: Efficient hierarchical rendering with caching