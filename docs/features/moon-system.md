# Moon System Feature

## User Story
View, navigate to, and select moons orbiting planets to examine details and parent relationships.

## Acceptance Criteria

### Navigation Panel Integration
- [ ] **AC1**: Planets with moons display expand/collapse button in navigation bar.
- [ ] **AC2**: Expanding reveals moons in dropdown menu.
- [ ] **AC3**: Each moon entry shows name and is clickable to focus.
- [ ] **AC4**: Selecting moon highlights parent planet.
- [ ] **AC5**: Moon navigation updates dynamically when switching planets.

### Orbital Mechanics and Rendering
- [ ] **AC6**: Moons orbit parent planets (not stars/other bodies).
- [ ] **AC7**: Moon orbital paths are visible and accurately represent semi-major axis.
- [ ] **AC8**: Moons maintain proper distance from parent planets (never inside).
- [ ] **AC9**: Moon orbits scale appropriately across view modes (realistic, navigational, profile).
- [ ] **AC10**: Orbital periods/eccentricity respected in animation.

### Selection and Focus System
- [ ] **AC11**: Selecting a moon focuses camera on it.
- [ ] **AC12**: Target panel displays moon-specific information.
- [ ] **AC13**: Moon selection works consistently with existing camera system.
- [ ] **AC14**: Time controls affect moon orbital motion.

### Data Integrity and Error Handling
- [ ] **AC15**: Moons with missing/invalid parent references handled gracefully (logged/skipped).
- [ ] **AC16**: System validates parent planets exist before rendering moons.
- [ ] **AC17**: No crashes/rendering issues with malformed moon data.

## High-Level Implementation Strategy

### 1. Navigation Bar Enhancement
- **Component**: `system-navigation-bar.tsx`
- **Approach**: Extend existing navigation for hierarchical display.
- **Key Features**:
  - Group moons by parent planet ID.
  - Implement expand/collapse state management.
  - Create dropdown UI for moon selection.
  - Add visual indicators for parent-child relationships.

### 2. Moon Rendering Overhaul
- **Component**: `system-objects-renderer.tsx`
- **Approach**: Complete rewrite of moon rendering logic.
- **Key Improvements**:
  - Parent planet validation before rendering.
  - Intelligent orbital radius calculation.
  - View mode-specific scaling logic.
  - Proper orbital mechanics integration.

### 3. Integration with Existing Systems
- **Camera System**: Ensure moon selection works with unified camera controller.
- **Object Details Panel**: Display moon-specific information.
- **Time Controls**: Integrate moon orbital motion with time multiplier.

## High-Level Testing Approach

### Unit Tests
- Moon grouping logic by parent planet.
- Orbital radius calculations across view modes.
- Error handling for invalid moon data.
- Expand/collapse state management.

### Integration Tests
- Moon selection with camera focusing.
- Object details panel updates for moons.
- View mode switching with moons present.
- Time control integration.

### Visual Tests
- Moons orbit correct parent planets.
- Proper spacing and collision avoidance.
- Orbital path rendering.
- UI responsiveness of navigation dropdowns.

### Performance Tests
- No performance degradation with many moons.
- Memory usage with large moon datasets.
- Rendering performance across view modes.

## Technical Implementation Details

### Moon Data Structure
Moons are defined in system JSON files:
```json
{
  "id": "luna",
  "catalog_ref": "rocky-moon",
  "name": "Luna",
  "orbit": {
    "parent": "earth",
    "semi_major_axis": 0.00257,
    "eccentricity": 0.0549,
    "inclination": 5.145,
    "orbital_period": 27.322
  }
}
```

### Key Components Modified
1. **SystemNavigationBar**: Hierarchical moon display added.
2. **SystemObjectsRenderer**: Moon rendering restructured as children of planets.
3. **ObjectDetailsPanel**: Enhanced to display moon information.
4. **UnifiedCameraController**: Moon focusing capabilities integrated.
5. **OrbitalPath**: Parent-following logic enhanced for nested orbital systems.

### Validation Logic
- Parent planet existence check before moon rendering.
- Orbital parameter validation and fallback values.
- Comprehensive error logging.

## Dependencies
- Existing camera system (unified-camera-controller).
- Object selection hooks (use-object-selection).
- Orbital path rendering components.
- Object details panel system.

## Risks and Mitigations
- **Risk**: Performance impact with many moons.
  - **Mitigation**: Efficient memoization and conditional rendering.
- **Risk**: Complex parent-child relationships.
  - **Mitigation**: Clear validation and error handling.
- **Risk**: UI complexity in navigation.
  - **Mitigation**: Progressive disclosure with expand/collapse. 