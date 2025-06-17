# Chart-Citizen Features Summary

Overview of key Chart-Citizen features and links to detailed documentation.

## View Modes
- **Explorational Mode**: Proportional astronomical scaling modified for human interpretation
- **Navigational Mode**: Equidistant orbital paths with standardized object sizes for easy navigation
- **Profile Mode**: Top-down diagrammatic view with equidistant orbital paths and orthographic projection. [profile-mode-orbital-alignment.md](./profile-mode-orbital-alignment.md)
- **Scientific Mode**: True-to-life astronomical scale representation with authentic size ratios and orbital distances
- **Star Citizen Mode**: Displays Star Citizen-inspired star systems with unique visuals/navigation. [star-citizen-mode.md](./star-citizen-mode.md)
- **View Modes**: Comprehensive view mode system documentation. [view-modes.md](./view-modes.md)

## Camera System
- **Unified Camera System**: Configuration-driven camera controller for consistent behavior across view modes, with dual properties for real vs. visual object representation. [unified-camera-system.md](./unified-camera-system.md)

## Visualization Features
- **Orbital Path Consolidation**: Consolidated orbital path component architecture. [orbital-path-consolidation.md](./orbital-path-consolidation.md)
- **Orbital Path Pause Fix**: Enhanced orbital path pause functionality. [orbital-path-pause-fix.md](./orbital-path-pause-fix.md)
- **Star Rendering**: Realistic star rendering with custom shaders for atmospheric effects. [star-rendering.md](./star-rendering.md)
- **Planet Rendering**: High-detail planet rendering with custom textures and atmosphere effects. [planet-rendering.md](./planet-rendering.md)
- **Stellar Zones**: Visualizes habitable zones (green) and frost lines around stars. [stellar-zones.md](./stellar-zones.md)
- **Shader Lab**: Interactive tool for experimenting with and crafting custom shaders. [shader-lab.md](./shader-lab.md)

## Navigation Features
- **Moon System**: Hierarchical moon navigation with improved orbital mechanics and parent-child relationships. [moon-system.md](./moon-system.md)
- **Time Progression System**: Simulate the movement of celestial bodies over time with controls for speed and pause. [time-progression-system.md](./time-progression-system.md)

## Core Features
- **System Viewer**: Robust, unified component for rendering and interacting with celestial systems across view modes. [system-viewer.md](./system-viewer.md)
- **Engine State Management**: Centralized, predictable 3D engine state management. [engine-state.md](./engine-state.md)
- **Mode System**: Switches between Reality and Star Citizen modes with separate states, features, and data sources. [mode-system.md](./mode-system.md)

## Data Structures
- **System Data Loading and Catalog Management**: Manages efficient loading and caching of celestial system data and object catalogs. [system-data-and-catalog.md](./system-data-and-catalog.md)

## Debug Tools
- **Celestial Viewer**: Real-time 3D celestial object inspector and property editor with shader preview. [celestial-viewer.md](./celestial-viewer.md)
- **Debug Tools**: Comprehensive debugging tools for monitoring and analyzing 3D scene, shader performance, and object properties. [debug-tools.md](./debug-tools.md)

## UI Components
- **Toast Notifications**: Temporary, non-intrusive notification messages for user feedback. [toast-notifications.md](./toast-notifications.md)
- **Interaction System**: Intuitive, responsive interaction with celestial objects. [interaction-system.md](./interaction-system.md)
- **Object Viewer**: Object viewing and inspection capabilities. [object-viewer.md](./object-viewer.md)

## Planet Rendering
- **Terrestrial Planet**: Shader-based terrestrial planets with quality variants and dynamic lava flows. [terrestrial-planet.md](./terrestrial-planet.md)
- **Gas Giant Rendering**: Renders realistic gas giants with atmospheric bands and storm systems. [gas-giant-rendering.md](./gas-giant-rendering.md)
- **Planet Rings**: Renders realistic planetary ring systems with dynamic lighting and density. [planet-rings.md](./planet-rings.md)
- **Black Hole Rendering**: Renders realistic black holes with gravitational lensing and accretion disks. [black-hole-rendering.md](./black-hole-rendering.md)

## Performance Monitoring
- **Performance Optimizations**: Performance optimization strategies and implementations. [performance-optimizations.md](./performance-optimizations.md)

## Scaling and Orbital Mechanics
- **Orbital Mechanics System**: Ensures safe orbital positioning and proper scaling across all view modes. [orbital-mechanics-system.md](./orbital-mechanics-system.md)
- **Effective Orbit Clearing for Moons**: Enhanced orbit clearing that uses outermost moon orbit radius instead of planet radius to prevent orbital line intersections. [effective-orbit-clearing-for-moons.md](./effective-orbit-clearing-for-moons.md)
- **Unified Logarithmic Scaling**: Mathematical scaling system using logarithmic normalization for celestial object sizes (fixes Jupiter-bigger-than-Sun problem). [unified-scaling-explanation.md](./unified-scaling-explanation.md)
- **Proportional Parent-Child Scaling**: Enhanced scaling system for parent-child object relationships. [proportional-parent-child-scaling.md](./proportional-parent-child-scaling.md)

## Starmap
- **Starmap View**: Interactive 2-D/3-D galaxy map with jump-route planning and system drill-down. [starmap-view.md](./starmap-view.md) 