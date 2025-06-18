# View Modes System

## Overview
The view modes system provides different visualization perspectives for celestial objects, working in conjunction with the application's mode system (Reality and Star Citizen). Each view mode offers a unique way to visualize and interact with the data while maintaining consistency across different application modes.

## Core View Modes

### Explorational View
- Purpose: Accurate representation of celestial objects with proportional scaling
- Features:
  - Proportional object sizes based on actual dimensions
  - Dynamic scaling mechanism to maintain visibility:
    - Small objects are scaled up to remain visible
    - Large objects are scaled down to fit the view
  - Orbital distances proportional to actual values:
    - Smaller orbiting bodies have tighter orbits
    - Larger distances between major bodies
  - Natural lighting and effects
  - Detailed surface features
  - Atmospheric effects
- Use Cases:
  - Educational visualization
  - Scientific accuracy
  - Immersive experience

### Navigational View
- Purpose: Practical navigation and system overview with standardized visualization
- Features:
  - Standardized object sizes by class:
    - Stars: Uniform size for all stars
    - Rocky planets: Uniform size for all rocky planets
    - Gas giants: Uniform size for all gas giants
    - Moons: Uniform size for all moons
  - Equidistant orbital paths:
    - All orbits maintain equal spacing
    - Simplified orbital visualization
    - Clear hierarchy of objects
  - Enhanced UI elements
  - Optimized for system navigation
- Use Cases:
  - System navigation
  - Jump point planning
  - Quick system overview

### Profile View
- Purpose: Top-down analysis and navigation of system hierarchy
- Features:
  
  - Hierarchical navigation:
    - Selected object is focal point for framing the layout
    - Solar system default focal point is typically the parent star
    - Click into child orbiting bodies to make them the new focal point
    - Zooms into new focal point for framing the layout for its orbital bodies
    - Purpose: Maintains context while navigating
  - Standardized sizing:
    - Focal object: Large, prominent display
    - Orbiting bodies: Medium size regardless of actual dimensions [IMPORTANT]
    - Focal object on left, orbiting bodies on right
  - Standardized Alignment:
    - Focal object's orbiting bodies are aligned in a straight line
    - Equidistant orbital spacing between focal point's orbital bodies [IMPORTANT]
    - Time controls are paused while in profile view
    - Time controls are not accessible while in profile view
  - Standardized framing:
    - Camera framed appropriately [IMPORTANT]
    - Orthogonal camera view
    - Focal object framing the left, outermost orbiting body framing the right
    - Birds-eye-view perspective looking approximately 45 degrees down
- Use Cases:
  - System hierarchy exploration
  - Quick navigation to specific objects
  - Space station location
  - Educational system structure visualization

### Scientific View
- Purpose: True-to-life astronomical scale representation for scientific accuracy
- Features:
  - Authentic astronomical scaling:
    - Objects maintain true size ratios relative to each other
    - No artificial size inflation for visibility
    - Extremely small scaling factors (0.001 max visual size)
  - Accurate orbital distances:
    - 1.0 orbital scaling factor (no compression)
    - True astronomical unit distances
    - Minimal safety factors (1.1x) for scientific precision
  - Enhanced camera system:
    - 10x radius multiplier for proper viewing of vast scales
    - Extended zoom range (up to 1000x object radius)
    - Precise positioning for scientific observation
  - Scientific feature set:
    - Scientific information display
    - Educational content integration
    - Research-focused interface
- Use Cases:
  - Scientific research and education
  - Astronomical scale comprehension
  - Professional astronomy applications
  - Academic demonstrations
  - Understanding true cosmic scales

## Mode Integration

### Reality Mode Integration
- Explorational View:
  - Proportional astronomical scales
  - Scientific accuracy with visibility enhancements
  - Educational information
- Navigational View:
  - Simplified but accurate scales
  - Educational navigation
  - Scientific context
- Profile View:
  - Detailed scientific information
  - Educational focus
  - Research-oriented display
- Scientific View:
  - True astronomical scales
  - Maximum scientific accuracy
  - Professional research applications

### Star Citizen Mode Integration
- Explorational View:
  - Game-accurate proportional scales
  - Star Citizen universe accuracy
  - Game-specific effects
- Navigational View:
  - Game navigation focus
  - Jump point emphasis
  - Game-specific UI
- Profile View:
  - Game lore information
  - Game-specific details
  - Player-focused display
- Scientific View:
  - True-to-lore astronomical scales
  - Star Citizen universe scientific accuracy
  - Enhanced immersion for scale appreciation

## Implementation Details

### View Mode Switching
```typescript
// Mode-agnostic view switching
const handleViewModeChange = (newMode: ViewMode) => {
  // Update view mode in store
  useSystemStore.getState().setViewMode(newMode);
  
  // Apply mode-specific transformations
  applyViewModeTransformations(newMode);
};
```

## Performance Considerations

### View Mode Optimization
1. Distance-based detail levels
2. View-specific culling
3. Optimized shader usage
4. Efficient state updates
5. View-specific asset loading

### Mode-Specific Optimizations
1. Reality Mode:
   - Scientific data optimization
   - Educational content loading
   - Research-focused features
2. Star Citizen Mode:
   - Game data optimization
   - Jump point visualization
   - Game-specific features

## Future Enhancements

### View Mode Improvements
1. Additional view modes
2. Enhanced transitions
3. Custom view presets
4. View mode combinations
5. Advanced visualization options

### Mode-Specific Features
1. Reality Mode:
   - Enhanced scientific visualization
   - Additional educational features
   - Research tools
2. Star Citizen Mode:
   - Enhanced game integration
   - Additional game features
   - Player tools

## Best Practices

### Development
1. Keep view modes mode-agnostic
2. Document view-specific features
3. Test across all modes
4. Maintain performance
5. Consider user experience

### Testing
1. Test each view mode
2. Verify mode integration
3. Check performance
4. Validate transitions
5. Test edge cases

### Documentation
1. View mode documentation
2. Mode integration details
3. Performance guidelines
4. User guidelines
5. Known limitations 