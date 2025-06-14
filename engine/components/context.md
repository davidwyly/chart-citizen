# Components Directory Context

This directory contains all React components used throughout the application. Components are organized by their functional area and complexity.

## Key Subdirectories

- `system-viewer/`: Components for rendering and interacting with the 3D system visualization
- `celestial-viewer/`: Directory containing the celestial viewer components for inspecting and customizing 3D objects with real-time shader editing
- `3d-ui/`: Three.js and React Three Fiber components for 3D user interface elements
- `ui/`: Reusable UI components and primitives
- `__tests__/`: Test files for components in this directory

## Key Components

- `orbital-path.tsx`: **Orbital animation component** that handles the movement of celestial objects along their calculated orbits. Manages orbital visualization, time-based position updates, and parent-child object relationships for moons orbiting planets. **Features pause-fix** that ensures orbital positions update immediately when switching view modes while paused, preventing incorrect positioning until unpause.

## File Organization Rules

1. Each component should be in its own file with a `.tsx` extension
2. Complex components should have their own subdirectory with related files
3. Shared types and utilities should be in a `types.ts` or `utils.ts` file within the component's directory
4. Test files should be in a `__tests__` directory at the same level as the component

## Component Guidelines

1. Use TypeScript for all components
2. Include proper type definitions for props
3. Document complex logic with comments
4. Follow the project's component naming conventions
5. Keep components focused and single-responsibility 