# Black Hole Rendering

## User Story
View realistic black holes with gravitational lensing and accretion disks.

## Acceptance Criteria
- Renders black holes with gravitational lensing on background stars/nebulae.
- Renders accretion disk with Doppler/redshift effects.
- Performant and visually convincing rendering.

## High-Level Implementation Strategy
- Custom `BlackHoleMaterial` and `BlackHoleRenderer`.
- Sphere geometry with world-space ray calculation for 3D rotation/lensing.
- Procedural textures/shaders for accretion disk and background starfield.

## High-Level Testing Approach
- Unit tests for `BlackHoleMaterial`/`BlackHoleRenderer` (lensing calculations, material properties).
- Visual regression tests (lensing, accretion disk appearance).
- Performance tests (rendering efficiency). 