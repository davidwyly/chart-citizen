# Profile Mode Orbital Alignment

## User Story
As a user of the chart-citizen application, I want to be able to view star systems in a top-down, diagrammatic format where planets are aligned on a single plane with equidistant orbits, making it easier to understand the relationships between celestial bodies.

## Acceptance Criteria
- In profile mode, the camera should be positioned in a top-down orientation (0, 0, 1000)
- In profile mode, orbital paths should be drawn with equidistant spacing rather than actual astronomical distances
- In profile mode, orbits should be visible and clearly distinct from one another
- In profile mode, planets should be visible including any that were previously hidden
- In realistic and navigational modes, the original 3D perspective should be maintained
- In realistic mode, actual astronomical distances should be used for orbital paths
- In navigational mode, equidistant orbital paths should be used but in 3D perspective

## Implementation Strategy
1. Implement a ProfileCameraController that positions the camera directly above the system
2. Use an orthographic camera in profile mode to eliminate perspective distortion
3. Disable camera rotation in profile mode to maintain the top-down view
4. Calculate equidistant orbital paths in both navigational and profile modes
5. Show all planets and stars regardless of which celestial body is selected
6. Adjust the orthographic frustum size to properly frame the system

## Testing Approach
1. Create unit tests that verify the camera properties in profile mode vs. other modes
2. Create unit tests that verify orbital spacing in profile mode vs. other modes
3. Create visual tests that demonstrate the differences between view modes
4. Ensure all tests pass before considering the feature complete

## Implementation Notes
- The profile mode replaces the previous "game" mode, offering improved visualization
- The equidistant orbital spacing is achieved by calculating orbital radius based on planet index rather than actual semi-major axis
- The top-down view is implemented using an orthographic camera for a true "flat" diagram view
- Animations and transitions between view modes are smooth to maintain context 