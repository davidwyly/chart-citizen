# Stellar Zones Feature

## User Story

As a user exploring star systems, I want to see the habitable zones (green zones) and frost lines around stars so that I can understand where liquid water might exist and where ice formation occurs, helping me assess planetary habitability and system characteristics.

## Acceptance Criteria

### Must Have
1. **Habitable Zone Visualization**: Display a green-tinted ring around stars representing the area where liquid water can exist on planetary surfaces
2. **Frost Line Visualization**: Display a blue line/ring around stars marking the distance where water ice can form
3. **Spectral Type Calculation**: Automatically calculate zones based on the star's spectral type and luminosity
4. **View Mode Adaptation**: Zones should scale appropriately with different view modes (realistic, navigational, profile)
5. **Performance Optimization**: Zones should render efficiently without impacting overall system performance

### Should Have
6. **Multiple Star Support**: Calculate combined zones for binary star systems
7. **Dynamic Visibility**: Allow zones to be shown/hidden based on view mode or user preference
8. **Proper Layering**: Zones should render behind celestial objects to avoid visual interference

### Could Have
9. **Zone Labels**: Optional text labels identifying the zones
10. **Customizable Opacity**: Adjustable transparency for better visual clarity
11. **Animation**: Subtle animations or effects to make zones more visually appealing

## Implementation Strategy

### High-Level Architecture
1. **Stellar Zone Calculations**: Utilize existing `stellar-zones.ts` utility for scientific calculations
2. **Zone Renderer Component**: Create `StellarZones` React component for 3D visualization
3. **Integration**: Embed zones into the main system renderer with proper ordering
4. **Material System**: Use Three.js materials with appropriate transparency and colors

### Key Components
- `StellarZones` component: Main visualization component
- `stellar-zones.ts`: Calculation utilities (already exists)
- Integration in `SystemObjectsRenderer`: Proper rendering order and scaling

### Rendering Strategy
- Use Three.js `RingGeometry` for frost lines
- Use `ShapeGeometry` with holes for habitable zone rings
- Apply proper opacity and blending for visual clarity
- Render zones first (behind other objects) with `renderOrder = -1`

## Testing Approach

### Unit Tests
- Test zone calculation accuracy for different spectral types
- Verify proper scaling with orbital scale factors
- Test component rendering with various props

### Integration Tests
- Verify zones appear correctly in different systems
- Test view mode transitions and zone scaling
- Ensure zones don't interfere with object selection/interaction

### Visual Tests
- Confirm zones render with correct colors and transparency
- Verify proper layering behind celestial objects
- Test performance with multiple star systems

## Technical Notes

### Performance Considerations
- Zone geometries are memoized to prevent unnecessary recalculation
- Simple materials with basic transparency for optimal performance
- Zones are conditionally rendered based on view mode

### Scientific Accuracy
- Habitable zone calculations based on Kopparapu model
- Frost line calculations use empirical stellar physics formulas
- Support for different spectral types from O5 to M8

### Browser Compatibility
- Uses standard Three.js features supported across all target browsers
- No experimental or cutting-edge graphics features required 