# System Viewer

## User Story
As a user, I want a robust and unified viewer for celestial systems, so I can seamlessly explore different star systems and celestial bodies across various viewing modes.

## Acceptance Criteria
- The System Viewer component can be integrated into different view modes (realistic, navigational, profile, Star Citizen).
- It correctly renders celestial bodies and their orbital paths based on the active mode.
- It supports dynamic data loading and updates for different star systems.
- It provides context for focused objects and allows for navigation within the system.

## High-Level Implementation Strategy
- Develop `SystemViewer` as a central component responsible for orchestrating the rendering of celestial objects.
- Utilize React context (`SystemViewerContext`) to provide system-wide data and state to child components.
- Implement logic to adapt rendering and interaction based on the `mode` prop.
- Integrate with data fetching mechanisms to load system details dynamically.

## High-Level Testing Approach
- Unit tests for `SystemViewer` to ensure correct state management and prop handling.
- Integration tests to verify its behavior when used within different mode views (e.g., `RealisticModeView`, `StarCitizenModeView`).
- Snapshot tests to confirm consistent rendering of celestial objects across modes.
- Performance tests to ensure efficient rendering of large systems. 