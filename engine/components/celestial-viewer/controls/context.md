# Controls Context

This directory contains control components for the celestial viewer.

## Files

- `parameter-slider.tsx`: Reusable slider component for parameter controls with real-time updates and custom styling
- `terrestrial-controls.tsx`: Parameter controls specific to terrestrial planets including soil tint, water coverage, temperature, tectonics, geomagnetism, population, and flora
- `shader-editor.tsx`: Live shader editor component allowing real-time compilation and application of custom vertex and fragment shaders with syntax validation and example loading
- `index.ts`: Export barrel for all control components

## Features

### Parameter Slider
- Real-time value updates with immediate visual feedback
- Custom CSS styling for consistent UI
- Configurable ranges, steps, and units
- Optional descriptions for user guidance

### Terrestrial Controls
- Eight parameter sliders for comprehensive planet customization
- Default values with fallbacks for missing properties
- Real-time shader parameter updates
- Temperature-based visual effects
- Terrain seed parameter for different distribution patterns

### Shader Editor
- Live syntax validation before compilation
- Real-time shader compilation and application
- Automatic loading of existing shaders based on object type (terrestrial, gas_giant, star, etc.)
- Example shader loading for learning
- Full uniform support for all planet parameters
- Error reporting with helpful messages

## Integration

All controls integrate with the main ObjectControls component and pass changes through to the geometry renderers via property overrides and custom shader support. 