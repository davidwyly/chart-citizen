# Lib Directory Context

This directory contains shared utilities, types, and helper functions used throughout the application.

## Key Subdirectories

- `utils/`: General utility functions and helpers
- `types/`: Shared TypeScript type definitions
- `constants/`: Application-wide constants
- `hooks/`: Custom React hooks
- `store/`: State management and store-related code

## File Organization Rules

1. Each utility should be in its own file
2. Related utilities should be grouped in subdirectories
3. Types should be in a `types.ts` file within their relevant directory
4. Constants should be in a `constants.ts` file

## Library Guidelines

1. Keep utilities pure and side-effect free when possible
2. Document complex functions with JSDoc comments
3. Use TypeScript for all library code
4. Write unit tests for all utilities
5. Follow functional programming principles
6. Keep utilities focused and single-purpose 