# System Viewer Components Context

This directory contains components for rendering and interacting with the 3D system visualization.

## Core Components

- `system-objects-renderer.tsx`: Main renderer component that manages the rendering of all celestial objects in the system
- `catalog-object-wrapper.tsx`: Wrapper component for individual catalog objects, handling their rendering and interactions
- `view-mode-calculator.ts`: Utility for calculating scaling and positioning based on the current view mode
- `camera-controller.tsx`: Manages camera behavior and interactions in the main view
- `profile-camera-controller.tsx`: Specialized camera controller for profile view mode

## UI Components

- `system-breadcrumb.tsx`: Navigation breadcrumb showing the current system hierarchy
- `object-details-panel.tsx`: Left-side panel displaying detailed information about the currently selected celestial object
- `system-info-overlay.tsx`: Overlay component displaying information about the current system
- `loading-states.tsx`: Loading state components for the system viewer

## Subdirectories

- `hooks/`: Custom hooks for system viewer functionality
- `components/`: Additional UI components specific to the system viewer
- `__tests__/`: Test files for system viewer components

## Component Relationships

1. `system-objects-renderer` is the parent component that:
   - Manages the overall scene
   - Coordinates between different view modes
   - Handles object loading and rendering

2. `catalog-object-wrapper` is used by `system-objects-renderer` to:
   - Wrap individual celestial objects
   - Handle object-specific rendering
   - Manage object interactions

3. Camera controllers work together to:
   - `camera-controller` handles general navigation
   - `profile-camera-controller` provides specialized behavior for profile view

## Development Guidelines

1. Keep rendering logic in the appropriate renderer components
2. Use the view mode calculator for all scaling calculations
3. Maintain clear separation between UI and rendering logic
4. Follow the established patterns for component organization
5. Keep components focused on their specific responsibilities 