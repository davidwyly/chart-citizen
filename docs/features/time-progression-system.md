# Time Progression System

## Overview
The Time Progression System allows users to simulate the movement of celestial bodies within a star system over time. This feature provides controls to adjust the simulation speed and pause/resume the progression, enabling observation of orbital mechanics, planning of future object positions, and visualization of historical alignments.

## Functionality
- **Simulation Speed Control**: Adjust the rate at which time passes in the simulation, from real-time to greatly accelerated speeds.
- **Pause/Resume**: Toggle the simulation to pause or resume the movement of celestial bodies.
- **Orbital Mechanics Visualization**: Observe the dynamic movement of planets, moons, and other celestial objects along their orbital paths.

## Implementation Details
The time progression is managed by a `timeMultiplier` and `isPaused` property, typically passed down to components responsible for rendering and animating celestial objects. The orbital positions are calculated based on elapsed time and the orbital parameters (semi-major axis, eccentricity, inclination, orbital period) defined in the system data.

Key components involved:
- `SystemObjectsRenderer.tsx`: Manages the rendering of celestial objects and passes down `timeMultiplier` and `isPaused`.
- `OrbitalPath.tsx`: Utilizes `useFrame` hook to update the position of orbiting objects based on `timeMultiplier` and `isPaused`.
- `CelestialObject` and `OrbitData` interfaces: Define the data structure for celestial bodies and their orbital parameters. 