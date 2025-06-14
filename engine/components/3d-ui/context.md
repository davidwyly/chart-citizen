# 3D UI Components Context

This directory contains Three.js and React Three Fiber components for 3D user interface elements.

## Core Components

### `interactive-object.tsx`
- Base component for interactive 3D objects
- Handles hover, click, and focus interactions
- Manages object highlighting and selection, including logic for showing moon labels when their parent planet or the moon itself is selected.
- Supports custom interaction behaviors
- Includes performance optimizations

### `space-curvature-effect.tsx`
- Visual effect for space-time curvature
- Uses custom shader for distortion
- Scales based on object mass and distance
- Includes animation for dynamic appearance
- Supports different intensity levels

### `black-hole.tsx`
- Advanced 3D black hole shader component with gravitational lensing
- Uses sphere geometry with world-space ray calculation for proper 3D rotation
- Simulates realistic accretion disk with Doppler shift and redshift effects
- Includes procedural nebula texture and starfield background
- Features NaN/Infinity protection and robust coordinate transforms

### `protostar.tsx`
- 3D protostar shader component with volumetric nebula rendering
- Uses spiral noise functions for realistic dusty nebula appearance
- Features central star light source with bloom and scattering effects
- Includes rotation animation and transparent background for skybox integration
- Adapted from "Dusty nebula 4" Shadertoy shader by Duke

## Implementation Guidelines

1. Keep UI logic separate from rendering logic
2. Use appropriate event handling
3. Implement proper cleanup
4. Handle performance considerations
5. Support different view modes

## Performance Considerations

1. Use instancing for similar objects
2. Implement proper event debouncing
3. Optimize shader calculations
4. Handle distance-based interactions
5. Consider view mode when calculating effects

## Interaction Patterns

1. Hover effects for object highlighting
2. Click handling for selection
3. Focus management for navigation
4. Custom interaction behaviors
5. Event propagation control 