# Stellar Zones Feature

## User Story
See habitable zones (green) and frost lines around stars to understand liquid water/ice formation, assessing habitability.

## Acceptance Criteria

### Must Have
1. **Habitable Zone Visualization**: Green-tinted ring around stars (liquid water area).
2. **Frost Line Visualization**: Blue line/ring around stars (water ice formation distance).
3. **Spectral Type Calculation**: Auto-calculate zones based on star's spectral type/luminosity.
4. **View Mode Adaptation**: Zones scale appropriately with view modes (explorational, navigational, profile).
5. **Performance Optimization**: Efficient zone rendering without performance impact.

### Should Have
6. **Multiple Star Support**: Calculate combined zones for binary systems.
7. **Dynamic Visibility**: Allow zones to be shown/hidden (view mode/user preference).
8. **Proper Layering**: Zones render behind celestial objects (avoid visual interference).

### Could Have
9. **Zone Labels**: Optional text labels.
10. **Customizable Opacity**: Adjustable transparency.
11. **Animation**: Subtle animations/effects.

## Implementation Strategy

### High-Level Architecture
1. **Stellar Zone Calculations**: Use existing `stellar-zones.ts` utility.
2. **Zone Renderer Component**: Create `StellarZones` React component for 3D visualization.
3. **Integration**: Embed zones into main system renderer with proper ordering.
4. **Material System**: Use Three.js materials with appropriate transparency/colors.

### Key Components
- `StellarZones` component: Main visualization.
- `stellar-zones.ts`: Calculation utilities (exists).
- Integration in `SystemObjectsRenderer`: Proper rendering order/scaling.

### Rendering Strategy
- Use Three.js `RingGeometry` for frost lines.
- Use `ShapeGeometry` with holes for habitable zone rings.
- Apply proper opacity/blending.
- Render zones first (behind objects) with `renderOrder = -1`.

## Testing Approach

### Unit Tests
- Zone calculation accuracy for different spectral types.
- Proper scaling with orbital scale factors.
- Component rendering with various props.

### Integration Tests
- Zones appear correctly in different systems.
- View mode transitions and zone scaling.
- Zones don't interfere with object selection/interaction.

### Visual Tests
- Zones render with correct colors/transparency.
- Proper layering behind celestial objects.
- Performance with multiple star systems.

## Technical Notes

### Performance Considerations
- Zone geometries memoized (prevent recalculation).
- Simple materials with basic transparency for optimal performance.
- Zones conditionally rendered based on view mode.

### Scientific Accuracy
- Habitable zone calculations: Kopparapu model.
- Frost line calculations: Empirical stellar physics formulas.
- Support for spectral types O5 to M8.

### Browser Compatibility
- Uses standard Three.js features.
- No experimental/cutting-edge graphics features. 