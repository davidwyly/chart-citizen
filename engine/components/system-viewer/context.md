# System Viewer Components Context

This directory contains the core components and logic for rendering interactive 3D solar system views with different visualization modes.

## Files

- **unified-camera-controller.tsx** - Unified camera controller handling all view modes (realistic, navigational, profile) with configuration-driven behavior and dual properties system for consistent camera distances and animations across all object types
- **system-objects-renderer.tsx** - Main renderer for stars, planets, and moons with interactive selection, focus capabilities, and unified object sizing calculations using dual properties system
- **view-mode-calculator.ts** - Configuration-driven view mode calculations using unified dual properties system, replacing all legacy hardcoded scaling logic
- **catalog-object-wrapper.tsx** - Wrapper component for catalog objects that handles 3D rendering, texturing, and shading based on object type and properties
- **object-details-panel.tsx** - UI panel displaying detailed information about focused objects including real vs visual properties
- **system-breadcrumb.tsx** - Navigation breadcrumb showing current system and selected object hierarchy
- **loading-states.tsx** - Loading and error state components for system data loading
- **components/** - Sub-directory containing specialized components like stellar zones, scene lighting, and UI elements
- **hooks/** - Sub-directory containing React hooks for object selection, system data management, and other stateful logic

## Core Components

- `system-objects-renderer.tsx`: Main renderer component that manages the rendering of all celestial objects in the system with unified configuration-driven scaling
- `catalog-object-wrapper.tsx`: Wrapper component for individual catalog objects, handling their rendering and interactions
- `view-mode-calculator.ts`: Utility for calculating scaling and positioning based on the current view mode using the unified configuration system
- `unified-camera-controller.tsx`: Configuration-driven camera controller that handles all view modes with consistent behavior

## UI Components

- `system-breadcrumb.tsx`: Navigation breadcrumb showing the current system hierarchy with clickable system name for birds-eye view
- `object-details-panel.tsx`: Left-side panel displaying detailed information about selected objects or system-level information with camera details
- `system-info-overlay.tsx`: Overlay component displaying information about the current system
- `loading-states.tsx`: Loading state components for the system viewer

## Key Features

### Unified Camera System
The `unified-camera-controller.tsx` implements a configuration-driven approach that:

- **Configuration-Driven**: All camera behavior controlled by view mode configurations
- **Dual Properties System**: Uses real vs visual properties for consistent object representation across view modes
- **View Mode Profiles**: Each view mode (realistic, navigational, profile) has its own configuration profile
- **Consistent Behavior**: All camera operations (focus, birds-eye view, following) use the same underlying logic with mode-specific configurations
- **Object Type Intelligence**: Automatically classifies objects and applies appropriate camera distances and animations

### System Selection and Camera Information
The system supports system-level selection in addition to individual object selection:

- **System Selection**: Clicking the system name in the breadcrumb selects the entire system and shows system-level information
- **Camera Details**: When system is selected, displays current camera orbit radius and view mode information
- **Seamless Switching**: Selecting individual objects automatically clears system selection and vice versa

### Orbital Scaling Intelligence
The system includes intelligent orbital scaling that ensures all view modes maintain appropriate spatial relationships:

- **Realistic Mode**: Uses actual astronomical semi-major axis values from system data
- **Navigational Mode**: Uses equidistant spacing with intelligent scaling to maintain system coherence
- **Profile Mode**: Similar scaling logic as navigational mode for consistent system sizing

## Subdirectories

- `hooks/`: Custom hooks for system viewer functionality including object selection with dual properties support
- `components/`: Additional UI components specific to the system viewer
- `__tests__/`: Test files for system viewer components including unified camera controller tests

## Component Relationships

1. `system-objects-renderer` is the parent component that:
   - Manages the overall scene
   - Coordinates between different view modes using unified configurations
   - Handles object loading and rendering with dual properties
   - Passes object mass, radius, and orbit data to camera controller

2. `catalog-object-wrapper` is used by `system-objects-renderer` to:
   - Wrap individual celestial objects
   - Handle object-specific rendering
   - Manage object interactions

3. `unified-camera-controller` provides:
   - Consistent behavior across all view modes
   - Configuration-driven camera distances and animations
   - Automatic object type classification and appropriate camera behavior

4. `object-details-panel` supports dual modes:
   - Individual object details when an object is selected
   - System-level information and camera details when the system is selected

## Development Guidelines

1. **Use the Unified System**: All development uses `unified-camera-controller` and the configuration system in `engine/types/view-mode-config.ts`
2. **Configuration-Driven**: Add new behaviors by extending the view mode configurations, not by adding conditional logic
3. **No Hardcoded Logic**: The system eliminates hardcoded distance multipliers, object name checks, or view mode specific logic
4. Keep rendering logic in the appropriate renderer components
5. Use the view mode calculator for all scaling calculations
6. Maintain clear separation between UI and rendering logic
7. Follow the established patterns for component organization
8. Keep components focused on their specific responsibilities
9. Ensure all view modes maintain consistent system scaling through configuration
10. Ensure system selection and object selection states are mutually exclusive and properly managed 