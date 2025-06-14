# Moon System Feature

## User Story
As a user exploring a star system, I want to be able to view, navigate to, and select moons that orbit planets, so that I can examine these celestial bodies in detail and understand their relationship to their parent planets.

## Acceptance Criteria

### Navigation Panel Integration
- [ ] **AC1**: When viewing a star system, planets with moons display an expand/collapse button in the navigation bar
- [ ] **AC2**: Clicking the expand button reveals all moons belonging to that planet in a dropdown menu
- [ ] **AC3**: Each moon entry shows its name and can be clicked to focus on that moon
- [ ] **AC4**: When a moon is selected, the parent planet is highlighted to show the relationship
- [ ] **AC5**: Moon navigation updates dynamically when switching between planets

### Orbital Mechanics and Rendering
- [ ] **AC6**: Moons properly orbit their parent planets, not stars or other celestial bodies
- [ ] **AC7**: Moon orbital paths are visible and accurately represent their semi-major axis
- [ ] **AC8**: Moons maintain proper distance from their parent planets (never appearing inside the planet)
- [ ] **AC9**: Moon orbits scale appropriately across different view modes (realistic, navigational, profile)
- [ ] **AC10**: Orbital periods and eccentricity are respected in the animation

### Selection and Focus System
- [ ] **AC11**: Selecting a moon focuses the camera on that moon
- [ ] **AC12**: The target panel (object details panel) displays moon-specific information when a moon is selected
- [ ] **AC13**: Moon selection works consistently with the existing camera system
- [ ] **AC14**: Time controls affect moon orbital motion appropriately

### Data Integrity and Error Handling
- [ ] **AC15**: Moons with missing or invalid parent references are handled gracefully (logged and skipped)
- [ ] **AC16**: System validates that parent planets exist before rendering moons
- [ ] **AC17**: No crashes or rendering issues occur with malformed moon data

## High-Level Implementation Strategy

### 1. Navigation Bar Enhancement
- **Component**: `system-navigation-bar.tsx`
- **Approach**: Extend existing navigation to support hierarchical display
- **Key Features**:
  - Group moons by parent planet ID
  - Implement expand/collapse state management
  - Create dropdown UI for moon selection
  - Add visual indicators for parent-child relationships

### 2. Moon Rendering Overhaul
- **Component**: `system-objects-renderer.tsx`
- **Approach**: Complete rewrite of moon rendering logic
- **Key Improvements**:
  - Parent planet validation before rendering
  - Intelligent orbital radius calculation
  - View mode-specific scaling logic
  - Proper orbital mechanics integration

### 3. Integration with Existing Systems
- **Camera System**: Ensure moon selection works with unified camera controller
- **Object Details Panel**: Display moon-specific information
- **Time Controls**: Integrate moon orbital motion with time multiplier

## High-Level Testing Approach

### Unit Tests
- Test moon grouping logic by parent planet
- Validate orbital radius calculations across view modes
- Test error handling for invalid moon data
- Verify expand/collapse state management

### Integration Tests
- Test moon selection with camera focusing
- Verify object details panel updates for moons
- Test view mode switching with moons present
- Validate time control integration

### Visual Tests
- Verify moons orbit correct parent planets
- Check proper spacing and collision avoidance
- Validate orbital path rendering
- Test UI responsiveness of navigation dropdowns

### Performance Tests
- Ensure no performance degradation with many moons
- Test memory usage with large moon datasets
- Validate rendering performance across view modes

## Technical Implementation Details

### Moon Data Structure
Moons are defined in system JSON files with:
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
1. **SystemNavigationBar**: Added hierarchical moon display
2. **SystemObjectsRenderer**: Completely restructured moon rendering as children of planets
3. **ObjectDetailsPanel**: Enhanced to display moon information  
4. **UnifiedCameraController**: Integrated moon focusing capabilities
5. **OrbitalPath**: Enhanced parent-following logic for nested orbital systems

### Validation Logic
- Parent planet existence check before moon rendering
- Orbital parameter validation and fallback values
- Comprehensive error logging for debugging

## Dependencies
- Existing camera system (unified-camera-controller)
- Object selection hooks (use-object-selection)
- Orbital path rendering components
- Object details panel system

## Risks and Mitigations
- **Risk**: Performance impact with many moons
  - **Mitigation**: Efficient memoization and conditional rendering
- **Risk**: Complex parent-child relationships
  - **Mitigation**: Clear validation and error handling
- **Risk**: UI complexity in navigation
  - **Mitigation**: Progressive disclosure with expand/collapse 