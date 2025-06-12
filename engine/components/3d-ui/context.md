# 3D UI Components Context

This directory contains Three.js and React Three Fiber components for 3D user interface elements.

## Core Components

### `interactive-object.tsx`
- Base component for interactive 3D objects
- Handles hover, click, and focus interactions
- Manages object highlighting and selection
- Supports custom interaction behaviors
- Includes performance optimizations

### `space-curvature-effect.tsx`
- Visual effect for space-time curvature
- Uses custom shader for distortion
- Scales based on object mass and distance
- Includes animation for dynamic appearance
- Supports different intensity levels

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