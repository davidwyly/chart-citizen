# System Viewer Components Context

This directory contains core React components for the system viewer functionality.

## Files

- `back-button.tsx`: Simple back navigation button component
- `scene-lighting.tsx`: Three.js lighting configuration for the system view
- `stellar-zones.tsx`: Renders habitable zones (green) and frost lines for stellar systems
- `system-info-overlay.tsx`: Information overlay displaying system details
- `zoom-tracker.tsx`: Component that tracks and displays current zoom level
- `orbital-path/`: Directory containing the orbital path component for celestial object orbital mechanics and visualization

## Component Guidelines

- All components should be lightweight and focused on a single responsibility
- Use React.memo for performance optimization where appropriate
- Follow Three.js best practices for 3D rendering components
- Ensure proper TypeScript typing for all props and state 