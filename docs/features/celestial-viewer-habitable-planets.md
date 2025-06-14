# Celestial Viewer - Habitable Planet Controls

## Overview

The celestial viewer now supports real-time manipulation of habitable planet characteristics through interactive sliders. This feature allows users to dynamically adjust habitability parameters and see the changes reflected immediately in the 3D rendering.

## User Story

As a user exploring celestial objects, I want to be able to adjust the habitability parameters of planets in real-time so that I can understand how different environmental conditions affect a planet's appearance and characteristics.

## Acceptance Criteria

- [x] Habitable planets appear in a dedicated "Habitable Planets" category in the object catalog
- [x] When a habitable planet is selected, habitability parameter sliders are displayed
- [x] Three sliders control: Humidity (0-100%), Temperature (0-100°), Population (0-100%)
- [x] Slider changes update the planet rendering in real-time
- [x] Parameter values are displayed with appropriate units (%, °)
- [x] Generic shader controls are hidden for habitable planets to avoid confusion
- [x] Four different habitable planet types are available: Earth-like, Desert World, Ocean World, Ice World

## Implementation Strategy

### Architecture
- **Object Catalog**: Extended with "Habitable Planets" category containing four planet variants
- **Object Controls**: Enhanced to detect habitable planets and show specialized controls
- **Parameter Flow**: Celestial Viewer → Object Controls → Catalog Object Wrapper → Object Factory → Habitable Planet Renderer
- **Real-time Updates**: Parameters flow through React state and props to update shader uniforms

### Components Modified
1. `object-catalog.tsx` - Added habitable planet entries
2. `object-controls.tsx` - Added habitability parameter sliders
3. `celestial-viewer.tsx` - Added habitability state management
4. `object-factory.tsx` - Added customizations support
5. `catalog-object-wrapper.tsx` - Pass customizations to factory
6. `habitable-planet-renderer.tsx` - Accept dynamic parameters

### Catalog Objects Created
Added to `public/data/engine/object-catalog/planets.json`:
- `earth-like` - Balanced habitable world (Humidity: 70%, Temperature: 60%, Population: 80%)
- `desert-world` - Arid planet (Humidity: 15%, Temperature: 75%, Population: 25%)
- `ocean-world-habitable` - Water-dominated (Humidity: 90%, Temperature: 55%, Population: 60%)
- `ice-world` - Cold polar world (Humidity: 40%, Temperature: 15%, Population: 35%)

## Testing Approach

### Unit Tests
- **Habitability Controls**: 6 tests covering slider visibility, parameter handling, and UI behavior
- **Parameter Flow**: Verification that slider changes trigger correct callbacks
- **Conditional Rendering**: Ensures controls only appear for habitable planets

### Test Coverage
- ✅ Slider visibility for different planet types
- ✅ Parameter value display with units
- ✅ Event handling for slider changes
- ✅ Conditional UI rendering logic
- ✅ Integration with existing object controls

## Usage Instructions

1. **Access the Celestial Viewer**: Navigate to `/viewer` in the application
2. **Select Habitable Planets**: Expand the "Habitable Planets" category in the left panel
3. **Choose a Planet**: Click on any of the four available habitable worlds
4. **Adjust Parameters**: Use the sliders in the right panel under "Habitability Parameters"
   - **Humidity**: Controls ocean coverage and vegetation distribution
   - **Temperature**: Affects ice caps and climate zones
   - **Population**: Determines night light intensity and distribution
5. **Observe Changes**: The planet rendering updates in real-time as you move the sliders

## Technical Details

### Parameter Effects
- **Humidity (0-100%)**: 
  - Controls sea level (-0.2 to 0.0)
  - Affects ocean coverage and desert vs vegetation distribution
- **Temperature (0-100°)**:
  - Affects ice cap threshold (0.2 to 0.5)
  - Influences climate zones and surface conditions
- **Population (0-100%)**:
  - Controls night light intensity and distribution
  - Only affects areas above sea level

### Quality Levels
The habitable planet renderer supports different quality levels:
- **Low**: Basic land/ocean rendering (2 noise iterations)
- **Medium**: Adds animated cloud systems (4 iterations)  
- **High**: Adds night-time city lights (8 iterations)

Currently defaults to high quality for optimal visual experience.

## Future Enhancements

- Quality level selector in the UI
- Additional habitability parameters (atmospheric composition, magnetic field strength)
- Preset configurations for known exoplanets
- Export/import of custom planet configurations
- Animation controls for day/night cycles 