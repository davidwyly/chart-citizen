# Chart-Citizen Features Summary

This document provides a quick overview of the key features implemented in the Chart-Citizen application, along with links to their detailed documentation.

## View Modes
- **Realistic Mode** - Displays star systems with accurate astronomical distances and 3D perspective. [realistic-mode.md](./realistic-mode.md)
- **Navigational Mode** - Provides equidistant orbital paths in 3D perspective for easier navigation. [navigational-mode.md](./navigational-mode.md)
- **Profile Mode** - Offers a top-down diagrammatic view with equidistant orbital paths and orthographic projection. [profile-mode-orbital-alignment.md](./profile-mode-orbital-alignment.md)

## Visualization Features
- **Orbital Path Visualization** - Displays the paths that celestial bodies follow, adjusted for the current view mode. [orbital-paths.md](./orbital-paths.md)
- **Star Shaders** - Realistic rendering of stars with custom shaders for atmospheric effects. [star-shaders.md](./star-shaders.md)
- **Planetary Detail** - High-detail rendering of planets with custom textures and atmosphere effects. [planetary-detail.md](./planetary-detail.md)
- **Stellar Zones** - Visualizes habitable zones (green) and frost lines around stars for assessing planetary habitability. [stellar-zones.md](./stellar-zones.md)
- **Shader Lab** - Interactive tool for experimenting with and crafting custom shaders for celestial objects. [shader-lab.md](./shader-lab.md)

## Navigation Features
- **System Selection** - Ability to select and view different star systems. [system-selection.md](./system-selection.md)
- **Object Focus** - Focus on specific celestial bodies for detailed examination. [object-focus.md](./object-focus.md)
- **Zoom Control** - Dynamic zoom functionality with appropriate level of detail changes. [zoom-control.md](./zoom-control.md)

## Core Features

### Mode System
- **File**: mode-system.md
- **Summary**: Enables switching between Reality and Star Citizen viewing modes with separate states, features, and data sources for each mode.

## Debug Tools
- **Celestial Viewer** (`celestial-viewer.md`): A real-time 3D celestial object inspector and property editor with shader preview capabilities.
- **Shader Performance View** (`shader-performance-view.md`): A debug panel for monitoring shader performance metrics and quality levels.

## Planet Rendering
- **Terrestrial Planet** (`terrestrial-planet.md`): A shader-based implementation of terrestrial planets with quality level variants.
- **protostar** (`protostar.md`): A procedural shader for rendering protostarary disks and nebulae.

## Performance Monitoring
- **Performance Monitor** (`performance-monitor.md`): A system for tracking and reporting performance metrics with quality level recommendations.
- **Performance Warning** (`performance-warning.md`): A component that displays warnings when performance drops below acceptable levels.

## View Modes
- **View Mode Calculator** (`view-mode-calculator.md`): A system for calculating appropriate scaling and sizing for different view modes (realistic, navigational, profile).

## Starmap
- **Starmap View** (`starmap-view.md`): Interactive 2-D/3-D galaxy map with jump-route planning and system drill-down. 