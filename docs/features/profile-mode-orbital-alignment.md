# Profile Mode Orbital Alignment

## User Story
View star systems in a top-down, diagrammatic format with planets aligned on a single plane with equidistant orbits, for easier understanding of relationships.

## Acceptance Criteria
- Profile mode: Camera positioned top-down (0, 0, 1000).
- Profile mode: Orbital paths drawn with equidistant spacing (not astronomical distances).
- Profile mode: Orbits visible and clearly distinct.
- Profile mode: All planets visible, even if previously hidden.
- Realistic/Navigational modes: Original 3D perspective maintained.
- Realistic mode: Actual astronomical distances for orbital paths.
- Navigational mode: Equidistant orbital paths in 3D perspective.

## Implementation Strategy
1. Implement `ProfileCameraController` to position camera directly above system.
2. Use orthographic camera in profile mode to eliminate perspective distortion.
3. Disable camera rotation in profile mode to maintain top-down view.
4. Calculate equidistant orbital paths in both navigational and profile modes.
5. Show all planets and stars regardless of selection.
6. Adjust orthographic frustum size to frame system.

## Testing Approach
1. Unit tests: Verify camera properties (profile vs. other modes).
2. Unit tests: Verify orbital spacing (profile vs. other modes).
3. Visual tests: Demonstrate view mode differences.
4. Ensure all tests pass.

## Implementation Notes
- Profile mode replaces previous "game" mode, improving visualization.
- Equidistant orbital spacing: orbital radius based on planet index, not semi-major axis.
- Top-down view: orthographic camera for true "flat" diagram.
- Smooth animations/transitions between view modes maintain context. 