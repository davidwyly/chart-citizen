# Project Context

This is a Next.js application for visualizing and interacting with celestial systems using Three.js and React Three Fiber.

## Key Directories

- `app/`: Next.js application routes and pages
- `components/`: React components for the user interface
- `engine/`: Core rendering and simulation engine
- `lib/`: Shared utilities and types
- `__tests__/`: Test files
- `public/`: Static assets
- `styles/`: Global styles and CSS modules

## Project Structure Rules

1. Each directory should have its own `context.md` file
2. New files should be added to the appropriate directory's `context.md`
3. When a file's purpose changes, update its description in `context.md`
4. Follow the established patterns for file organization
5. Keep related files together in appropriate directories

## Development Guidelines

1. Use TypeScript for all new code
2. Follow the established testing patterns
3. Document complex logic and components
4. Keep components and utilities focused and single-purpose
5. Maintain clear separation of concerns
6. Follow the project's coding style and conventions
7. Do NOT introduce full-screen post-processing passes (chromatic aberration, bloom, etc.) — all effects must be object-level.

## Getting Started

1. Read the context files in each directory to understand the project structure
2. Follow the established patterns when adding new features
3. Update context files when making significant changes
4. Keep documentation up to date with code changes

# Project Structure

This document provides an overview of the project's directory structure and the purpose of each major component.

## Core Directories

### `src/core/engine/`
The core engine implementation, containing:
- `core/` - Core engine functionality
- `renderers/` - Renderer implementations
- `factories/` - Object factories
- `loaders/` - System and asset loaders
- `types/` - Engine-specific types

### `src/components/`
React components organized by feature:
- `system/` - System-related components
  - `viewer/` - System viewer components
  - `sidebar/` - Sidebar components
  - `options/` - Options panel components
- `debug/` - Debug components
- `ui/` - Reusable UI components
- `3d/` - 3D-specific components
- `layout/` - Layout components

### `src/utils/`
Utility functions organized by domain:
- `math/` - Math utilities
- `three/` - Three.js utilities
- `validation/` - Validation utilities
- `helpers/` - General helpers

### `src/assets/`
Static assets:
- `shaders/` - GLSL shaders
- `textures/` - Texture files
- `models/` - 3D models
- `styles/` - Global styles

### `docs/`
Documentation:
- `architecture/` - System architecture docs
- `components/` - Component documentation
- `engine/` - Engine documentation
- `guides/` - Development guides

## Configuration Files

- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `jest.config.js` - Jest test configuration
- `vitest.config.ts` - Vitest configuration

## Testing

- `__tests__/` - Test files
- `__mocks__/` - Mock implementations
- `jest.setup.ts` - Jest setup
- `jest.setup.tsx` - Jest setup for React components

## Key Files

- `README.md`: Project overview and high-level architecture 