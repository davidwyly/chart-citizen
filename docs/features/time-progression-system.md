# Time Progression System

## Overview
The Time Progression System allows users to simulate the movement of celestial bodies within a star system over time. This feature provides controls to adjust the simulation speed and pause/resume the progression, enabling observation of orbital mechanics, planning of future object positions, and visualization of historical alignments.

## Functionality
- **Simulation Speed Control**: Adjust the rate at which time passes in the simulation, from real-time to greatly accelerated speeds.
- **Pause/Resume**: Toggle the simulation to pause or resume the movement of celestial bodies. Importantly, when paused, orbital positions still update immediately upon view mode changes, preventing visual inconsistencies.
- **Orbital Mechanics Visualization**: Observe the dynamic movement of planets, moons, and other celestial objects along their orbital paths.

## Implementation Details
The time progression is managed by a `timeMultiplier` and `isPaused` property, typically passed down to components responsible for rendering and animating celestial objects. The orbital positions are calculated based on elapsed time and the orbital parameters (semi-major axis, eccentricity, inclination, orbital period) defined in the system data. The system ensures that objects update their positions when orbital parameters or view modes change, even if the time progression is paused, to maintain visual accuracy.

Key components involved:
- `SystemObjectsRenderer.tsx`: Manages the rendering of celestial objects and passes down `timeMultiplier` and `isPaused`.
- `OrbitalPath.tsx`: Utilizes `useFrame` hook to update the position of orbiting objects based on `timeMultiplier` and `isPaused`. It also includes specific `useEffect` hooks to ensure orbital positions are immediately re-calculated and applied when view modes or orbital parameters change, regardless of the paused state.
- `CelestialObject` and `OrbitData` interfaces: Define the data structure for celestial bodies and their orbital parameters. 