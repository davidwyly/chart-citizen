# Engine Lib Directory Context

This directory contains engine-specific utilities and helper functions.

## Files

- `planet-customizer.ts`: Planet customization and configuration utilities
- `material-registry.ts`: Registry for managing Three.js materials
- `__tests__/`: Test files for engine lib utilities
- `types/`: Engine-specific type definitions

## Organization Notes

- **Shared utilities** (utils, performance-monitor, roman-numerals) are located in the root `/lib/` directory
- **Engine-specific utilities** remain in this directory
- All components should import shared utilities from `@/lib/` not `@/engine/lib/`

## Library Guidelines

1. Keep utilities pure and side-effect free when possible
2. Document complex functions with JSDoc comments
3. Use TypeScript for all library code
4. Write unit tests for all utilities
5. Follow functional programming principles
6. Keep utilities focused and single-purpose 