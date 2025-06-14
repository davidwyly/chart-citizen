# System Viewer Components Context

This directory contains components for rendering and interacting with the 3D system visualization.

## Core Components

- `system-objects-renderer.tsx`: Main renderer component that manages the rendering of all celestial objects in the system with intelligent orbital scaling
- `catalog-object-wrapper.tsx`: Wrapper component for individual catalog objects, handling their rendering and interactions
- `view-mode-calculator.ts`: Utility for calculating scaling and positioning based on the current view mode
- `camera-controller.tsx`: Manages camera behavior and interactions in the main view, including birds-eye view functionality and orbit radius tracking
- `profile-camera-controller.tsx`: Specialized camera controller for profile view mode

## UI Components

- `system-breadcrumb.tsx`: Navigation breadcrumb showing the current system hierarchy with clickable system name for birds-eye view
- `object-details-panel.tsx`: Left-side panel displaying detailed information about selected objects or system-level information with camera details
- `system-info-overlay.tsx`: Overlay component displaying information about the current system
- `loading-states.tsx`: Loading state components for the system viewer

## Key Features

### System Selection and Camera Information
The system now supports system-level selection in addition to individual object selection:

- **System Selection**: Clicking the system name in the breadcrumb selects the entire system and shows system-level information
- **Camera Details**: When system is selected, displays current camera orbit radius and view mode information
- **Seamless Switching**: Selecting individual objects automatically clears system selection and vice versa

### Orbital Scaling Intelligence
The system now includes intelligent orbital scaling that ensures navigational and profile modes maintain the same overall system size as realistic mode while preserving their equidistant orbital spacing logic:

- **Realistic Mode**: Uses actual astronomical semi-major axis values from system data
- **Navigational Mode**: Uses equidistant spacing but scales the entire system to match realistic mode's outermost orbital radius
- **Profile Mode**: Similar scaling logic as navigational mode for consistent system sizing

This ensures that users can switch between view modes without losing the sense of scale and spatial relationships within the system.

## Subdirectories

- `hooks/`: Custom hooks for system viewer functionality
- `components/`: Additional UI components specific to the system viewer
- `__tests__/`: Test files for system viewer components

## Component Relationships

1. `system-objects-renderer` is the parent component that:
   - Manages the overall scene
   - Coordinates between different view modes
   - Handles object loading and rendering
   - Calculates adaptive orbital scaling for consistent system sizes

2. `catalog-object-wrapper` is used by `system-objects-renderer` to:
   - Wrap individual celestial objects
   - Handle object-specific rendering
   - Manage object interactions

3. Camera controllers work together to:
   - `camera-controller` handles general navigation, birds-eye view positioning, and orbit radius tracking
   - `profile-camera-controller` provides specialized behavior for profile view

4. `object-details-panel` now supports dual modes:
   - Individual object details when an object is selected
   - System-level information and camera details when the system is selected

## Development Guidelines

1. Keep rendering logic in the appropriate renderer components
2. Use the view mode calculator for all scaling calculations
3. Maintain clear separation between UI and rendering logic
4. Follow the established patterns for component organization
5. Keep components focused on their specific responsibilities
6. When modifying orbital calculations, ensure all three view modes maintain consistent system scaling
7. Ensure system selection and object selection states are mutually exclusive and properly managed 