# Orbital Path Component Context

This directory contains the orbital path component that handles orbital mechanics and visualization for celestial objects.

## Files

- `orbital-path.tsx`: Main component that renders orbital paths and handles object movement along orbits
- `index.ts`: Export file for the component
- `__tests__/orbital-path.test.tsx`: Tests for the orbital path component

## Component Purpose

The `OrbitalPath` component is responsible for:

1. **Orbital Visualization**: Rendering the visual orbital path lines for celestial objects
2. **Orbital Mechanics**: Calculating and updating object positions along their orbits
3. **Time Progression**: Handling time-based animation and pause/resume functionality
4. **Parent-Child Relationships**: Managing orbital relationships between objects (e.g., moons orbiting planets)
5. **View Mode Adaptation**: Adjusting orbital appearance and behavior based on view mode (realistic, navigational, profile)

## Key Features

- **Elliptical Orbits**: Supports realistic elliptical orbits with eccentricity and inclination
- **Time Control**: Respects time multiplier and pause state for consistent animation
- **Parent Following**: Objects can orbit around moving parent objects
- **View Mode Styling**: Different colors and opacity based on view mode
- **Performance Optimized**: Uses memoization and efficient update patterns

## Integration

This component is tightly integrated with the system viewer and is used by:
- `system-objects-renderer.tsx` for rendering planetary and moon orbits
- Various celestial object components that need orbital motion

## Architecture Decision

The orbital path component was moved under `system-viewer/components/` because:
1. It's primarily used by the system viewer
2. It's tightly coupled with system rendering logic
3. It benefits from being co-located with other system viewer components
4. It maintains better architectural organization and dependency management 