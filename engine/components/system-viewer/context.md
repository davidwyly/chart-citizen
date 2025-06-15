# System Viewer Components Context

This directory contains the core components and logic for rendering interactive 3D solar system views with different visualization modes.

## Files

- **unified-camera-controller.tsx** - Unified camera controller handling all view modes (realistic, navigational, profile) with configuration-driven behavior and dual properties system for consistent camera distances and animations across all object types
- **system-objects-renderer.tsx** - Main renderer for stars, planets, moons, and belts with interactive selection, focus capabilities, unified object sizing calculations, improved moon orbital mechanics with enhanced minimum distances, proper belt positioning and torus rendering, and refined gas giant scaling
- **system-navigation-bar.tsx** - Enhanced navigation bar with hierarchical moon display, showing moons as expandable child entries under their parent planets

- **catalog-object-wrapper.tsx** - Wrapper component for catalog objects that handles 3D rendering, texturing, and shading based on object type and properties
- **object-details-panel.tsx** - UI panel displaying detailed information about focused objects including real vs visual properties
- **system-breadcrumb.tsx** - Navigation breadcrumb showing current system and selected object hierarchy
- **loading-states.tsx** - Loading and error state components for system data loading
- **components/** - Sub-directory containing specialized components like stellar zones, scene lighting, orbital paths, and UI elements
- **hooks/** - Sub-directory containing React hooks for object selection, system data management, and other stateful logic

## Core Components

- `system-objects-renderer.tsx`: Main renderer component that manages the rendering of all celestial objects in the system with unified configuration-driven scaling
- `catalog-object-wrapper.tsx`: Wrapper component for individual catalog objects, handling their rendering and interactions

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

### Orbital Mechanics and Rendering Enhancements
The system includes significant improvements to orbital mechanics and object rendering:

#### Moon System Enhancements
- **Improved Orbital Mechanics**: Moons now properly orbit their parent planets with accurate positioning
- **Enhanced Minimum Distances**: Moons have a minimum orbital distance (0.02 AU after scaling) to ensure visibility outside parent planets
- **Parent Validation**: Comprehensive validation ensures moons only render when their parent planets exist
- **Intelligent Scaling**: Dynamic orbital radius calculation based on view mode and parent planet size
- **Hierarchical Navigation**: Navigation bar now shows moons as expandable child entries under planets

#### Belt System Implementation
- **Proper Belt Positioning**: Asteroid and Kuiper belts now render at their correct orbital distances using BeltOrbitData
- **Torus Rendering**: Belts render as proper torus shapes with accurate inner and outer radius dimensions
- **Realistic Proportions**: Belt width and position are calculated from actual inner/outer radius data
- **Interactive Elements**: Invisible interaction objects allow for belt selection and focus

#### Gas Giant Scaling Refinements
- **Proportional Scaling**: Gas giants use refined scaling (0.8x factor) to maintain proper size relationships relative to stars
- **Geometry-Based Scaling**: Objects with `geometry_type: 'gas_giant'` receive specialized scaling treatment
- **Visual Hierarchy**: Ensures stars remain visually larger than planets across all view modes

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

## Key Architectural Changes

**Scaling System**: Fixed critical double scaling issue where objects were being scaled twice - once by the unified view mode configuration and again by legacy scaling multipliers. Now uses single, consistent scaling from the unified system to maintain proper proportional relationships.

**Orbital Mechanics**: Removed hardcoded moon orbit adjustments that were breaking view mode scaling logic. All orbital distances now scale consistently through the view mode system.

**Object Rendering**: Unified celestial object rendering through CelestialObjectRenderer component that handles all geometry types (stars, planets, gas giants, belts) with appropriate materials and effects.

**View Mode Integration**: All components now properly integrate with the unified view mode configuration system for consistent scaling, orbital positioning, and camera behavior across realistic, navigational, and profile modes. 