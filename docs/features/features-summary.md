# Chart-Citizen Features Summary

Overview of key Chart-Citizen features and links to detailed documentation.

## View Modes
- **Realistic Mode**: Displays star systems with accurate astronomical distances and 3D perspective. [realistic-mode.md](./realistic-mode.md)
- **Star Citizen Mode**: Displays Star Citizen-inspired star systems with unique visuals/navigation. [star-citizen-mode.md](./star-citizen-mode.md)
- **Navigational Mode**: Provides equidistant orbital paths in 3D perspective for easier navigation. [navigational-mode.md](./navigational-mode.md)
- **Profile Mode**: Top-down diagrammatic view with equidistant orbital paths and orthographic projection. [profile-mode-orbital-alignment.md](./profile-mode-orbital-alignment.md)

## Camera System
- **Unified Camera System**: Configuration-driven camera controller for consistent behavior across view modes, with dual properties for real vs. visual object representation. [unified-camera-system.md](./unified-camera-system.md)

## Visualization Features
- **Orbital Path Visualization**: Displays celestial body paths, adjusted for current view mode. [orbital-paths.md](./orbital-paths.md)
- **Star Shaders**: Realistic star rendering with custom shaders for atmospheric effects. [star-shaders.md](./star-shaders.md)
- **Planetary Detail**: High-detail planet rendering with custom textures and atmosphere effects. [planetary-detail.md](./planetary-detail.md)
- **Stellar Zones**: Visualizes habitable zones (green) and frost lines around stars. [stellar-zones.md](./stellar-zones.md)
- **Shader Lab**: Interactive tool for experimenting with and crafting custom shaders. [shader-lab.md](./shader-lab.md)

## Navigation Features
- **System Selection**: Select and view different star systems. [system-selection.md](./system-selection.md)
- **Object Focus**: Focus on specific celestial bodies. [object-focus.md](./object-focus.md)
- **Zoom Control**: Dynamic zoom with appropriate level of detail changes. [zoom-control.md](./zoom-control.md)
- **Moon System**: Hierarchical moon navigation with improved orbital mechanics and parent-child relationships. [moon-system.md](./moon-system.md)
- **Time Progression System**: Simulate the movement of celestial bodies over time with controls for speed and pause. [time-progression-system.md](./time-progression-system.md)

## Core Features
- **System Viewer**: Robust, unified component for rendering and interacting with celestial systems across view modes. [system-viewer.md](./system-viewer.md)
- **Engine State Management**: Centralized, predictable 3D engine state management. [engine-state-management.md](./engine-state-management.md)

### Mode System
- **File**: mode-system.md
- **Summary**: Switches between Reality and Star Citizen modes with separate states, features, and data sources.

## Data Structures
- **Orbital System JSON Specification**: Defines structure, schema, and rules for orbital bodies. [orbital-system-json-spec.md](./orbital-system-json-spec.md)
- **System Data Loading and Catalog Management**: Manages efficient loading and caching of celestial system data and object catalogs. [system-data-and-catalog.md](./system-data-and-catalog.md)

## Debug Tools
- **Celestial Viewer**: Real-time 3D celestial object inspector and property editor with shader preview. [celestial-viewer.md](./celestial-viewer.md)
- **Shader Performance View**: Debug panel for monitoring shader performance metrics and quality levels. [shader-performance-view.md](./shader-performance-view.md)

## UI Components
- **Toast Notifications**: Temporary, non-intrusive notification messages for user feedback. [toast-notifications.md](./toast-notifications.md)

## Planet Rendering
- **Data Contract**: Defines JSON structure for orbital systems, including celestial body properties. [orbital-system-json-spec.md](../../architecture/orbital-system-json-spec.md)
- **Terrestrial Planet**: Shader-based terrestrial planets with quality variants and dynamic lava flows. [terrestrial-planet.md](./terrestrial-planet.md)
- **Gas Giant Rendering**: Renders realistic gas giants with atmospheric bands and storm systems. [gas-giant-rendering.md](./gas-giant-rendering.md)
- **Planet Rings**: Renders realistic planetary ring systems with dynamic lighting and density. [planet-rings.md](./planet-rings.md)
- **Terrestrial Planet Simulator**: Design document for terrestrial planet simulator features and implementation. [terrestrial-planet-simulator-design-document.md](./terrestrial-planet-simulator-design-document.md)
- **Black Hole Rendering**: Renders realistic black holes with gravitational lensing and accretion disks. [black-hole-rendering.md](./black-hole-rendering.md)

## Performance Monitoring
- **Performance Monitor**: Tracks and reports performance metrics with quality recommendations. [performance-monitor.md](./performance-monitor.md)
- **Performance Warning**: Displays warnings for low performance. [performance-warning.md](./performance-warning.md)

## Scaling and Orbital Mechanics
- **View Mode Calculator**: Calculates scaling and sizing for different view modes. [view-mode-calculator.md](./view-mode-calculator.md)
- **Orbital Mechanics System**: Ensures safe orbital positioning and proper scaling across all view modes. [orbital-mechanics-system.md](./orbital-mechanics-system.md)
- **Unified Logarithmic Scaling**: Mathematical scaling system using logarithmic normalization for celestial object sizes (fixes Jupiter-bigger-than-Sun problem). [unified-scaling-explanation.md](./unified-scaling-explanation.md)

## Starmap
- **Starmap View**: Interactive 2-D/3-D galaxy map with jump-route planning and system drill-down. [starmap-view.md](./starmap-view.md) 