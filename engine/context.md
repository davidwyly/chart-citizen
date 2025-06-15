# Engine Directory Context

This directory contains the core rendering and simulation engine components. It handles the low-level Three.js integration and custom shaders for celestial objects.

## Visual Effects Policy

Object-specific effects (e.g. solar prominences, atmospheric storms) are allowed **inside each renderer's `effects/` sub-folder**.

**Global / full-screen post-processing passes are strictly forbidden** (chromatic aberration, bloom, depth-of-field, etc.). Any visual enhancement must be implemented at the material or object level.

## Key Subdirectories

- `renderers/`: Custom renderers for different types of celestial objects (stars, planets, etc.)
- `materials/`: Custom Three.js materials and shaders
- `utils/`: Engine-specific utility functions and helpers
- `object-factory.tsx`: Factory component that maps catalog objects to appropriate renderers, including special objects

## File Organization Rules

1. Each renderer should be in its own directory under `renderers/`
2. Shader files should be in the `materials/` directory
3. Effect files should reside in each renderer's `effects/` subdirectory (object-level only — no global post-processing pipeline)
4. Shared types should be in a `types.ts` file within each subdirectory

## Engine Guidelines

1. Keep rendering logic separate from component logic
2. Document shader code thoroughly
3. Use TypeScript for all engine code
4. Follow Three.js best practices for performance
5. Maintain clear separation between rendering and state management

## Core Files
- `engine-state.ts`: Centralized 3D engine state management with reactive updates
- `system-loader.ts`: Loads orbital system data from JSON files with caching and validation
- `system-loader-enhanced.ts`: Enhanced system loader with retry logic, better error handling, and comprehensive validation

## Types
- `types/orbital-system.ts`: Core data structures for celestial objects and orbital systems
- `types/view-mode-config.ts`: Configuration types for different view modes (star-citizen, profile)
- `types/catalog.ts`: Types for system catalogs and metadata
- `types/errors.ts`: Custom error type hierarchy for structured error handling

## Services
- `services/error-reporter.ts`: Centralized error reporting service with context management and offline queuing

## Validation
- `validation/validators.ts`: Comprehensive input validation framework with sanitization utilities

## Components
- `components/system-viewer/`: Main 3D system visualization component with hooks and utilities
- `components/error-boundary.tsx`: React error boundaries for component-level error handling

## Core Camera System
- `core/camera/`: Modular camera system with animations and position calculations

## Renderers
- `renderers/`: Specialized renderers for different celestial object types (stars, planets, moons, etc.)

## Performance
- `performance/`: Performance monitoring and optimization utilities 