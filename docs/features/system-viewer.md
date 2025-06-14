# System Viewer

## User Story
Robust, unified viewer for celestial systems, seamlessly exploring different star systems/bodies across various viewing modes.

## Acceptance Criteria
- Integrates into different view modes (realistic, navigational, profile, Star Citizen).
- Correctly renders celestial bodies and orbital paths based on active mode.
- Supports dynamic data loading and updates for different star systems.
- Provides context for focused objects and allows navigation within the system.

## High-Level Implementation Strategy
- Develop `SystemViewer` as central component for orchestrating celestial object rendering.
- Utilize React context (`SystemViewerContext`) for system-wide data/state to child components.
- Implement logic to adapt rendering/interaction based on `mode` prop.
- Integrate with data fetching mechanisms for dynamic system details loading.

## High-Level Testing Approach
- Unit tests for `SystemViewer` (state management, prop handling).
- Integration tests to verify behavior within different mode views (e.g., `RealisticModeView`, `StarCitizenModeView`).
- Snapshot tests to confirm consistent rendering of celestial objects across modes.
- Performance tests for efficient rendering of large systems. 