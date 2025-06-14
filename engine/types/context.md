# Engine Types Directory Context

This directory contains type definitions and configuration systems for the engine layer.

## Files

- `view-mode-config.ts`: Unified view mode configuration system that defines how objects should be rendered and how the camera should behave across all view modes (realistic, navigational, profile), using PURELY radius-based camera positioning that eliminates all object-type-based hardcoded logic.

## Key Features

### Unified View Mode System
The `view-mode-config.ts` file implements a comprehensive configuration system that:

- **Dual Properties**: Tracks both "real" and "visual" properties for celestial objects (realRadius vs visualRadius, realOrbitRadius vs visualOrbitRadius)
- **View Mode Profiles**: Defines specific configurations for each view mode (realistic, navigational, profile) with object scaling, orbit scaling, and camera behavior
- **Object Classification**: Intelligently determines object types (star, planet, moon, gasGiant, asteroid) from names and properties
- **Radius-Based Camera**: Camera distances are calculated PURELY based on visible radius using configurable multipliers, completely eliminating object-type-based distance logic
- **Configuration-Driven**: Replaces hardcoded multipliers and constraints with flexible, maintainable configuration objects

### Benefits
- **Consistent Behavior**: All view modes use the same underlying system with different configuration profiles
- **Maintainable**: Camera distances, scaling factors, and animations are centralized in configuration objects
- **Extensible**: New view modes can be added by creating new configuration profiles
- **Predictable**: No more hardcoded name-based logic or arbitrary multipliers
- **Testable**: Configuration-driven system is easier to test and validate

This system eliminates the fragmented approach of having separate camera controllers and hardcoded logic scattered throughout the codebase. 