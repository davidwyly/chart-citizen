# Chart Citizen - Project Context

This is a Next.js application for visualizing and interacting with celestial systems using Three.js and React Three Fiber.

## 🗂️ Key Directories

- **`app/`**: Next.js 13+ App Router with dynamic mode routing and page components
- **`engine/`**: Core celestial rendering engine with 3D components, renderers, and simulation systems
- **`components/`**: Shared React UI components used across different modes and pages
- **`lib/`**: Framework-agnostic utilities, types, and shared functionality
- **`hooks/`**: Shared React hooks for state management and effects
- **`public/`**: Static assets including textures, models, and universe data files
- **`docs/`**: Architecture documentation and feature specifications
- **`__tests__/`**: Integration test suites and test utilities
- **`styles/`**: Global styles, design system, and CSS modules

## 🏗️ Architecture Summary

**Chart Citizen** follows a layered architecture with clear separation of concerns:

1. **App Layer** (`app/`) - Next.js routing and page composition
2. **Engine Layer** (`engine/`) - 3D rendering and celestial simulation logic  
3. **Component Layer** (`components/`, `hooks/`) - React UI and state management
4. **Utility Layer** (`lib/`) - Pure functions and shared types

## 📋 Development Guidelines

### **File Organization**
1. Each directory maintains its own `context.md` file explaining its purpose
2. New files must be documented in their directory's `context.md`
3. Related functionality should be grouped in appropriate subdirectories
4. Follow established naming conventions and patterns

### **Code Quality**
1. **TypeScript First**: All new code must use TypeScript with proper typing
2. **Testing Required**: Include tests for new functionality and bug fixes
3. **Performance Conscious**: Consider performance impact of new features
4. **Documentation**: Update relevant documentation when making changes

### **Architecture Principles**
1. **No Full-Screen Post-Processing**: Visual effects must be object-level only
2. **Component-Based**: Use React Three Fiber components for 3D objects
3. **Mode Separation**: Keep realistic and Star Citizen modes independent
4. **Type Safety**: Leverage TypeScript for compile-time error prevention

## 🚀 Getting Started

1. **Read Documentation**: Start with `README.md` for architecture overview
2. **Explore Context Files**: Each directory's `context.md` explains its purpose  
3. **Follow Patterns**: Use existing code patterns when adding new features
4. **Keep Docs Current**: Update context files when making significant changes

## 🎯 Current Status

- ✅ **Directory Structure**: Consolidated from confusing dual-folder structure
- ✅ **Engine Linting**: Fixed TypeScript errors in production engine code
- ✅ **Test Infrastructure**: Comprehensive test suite with proper type safety
- ✅ **Mode System**: Clean separation between realistic and Star Citizen universes
- ✅ **Performance**: Built-in monitoring and automatic quality scaling
- ✅ **Moon System**: Complete overhaul with proper orbital mechanics and hierarchical navigation

## ⚙️ Scripts

- `npm run dev`: Starts the development server and opens `http://localhost:3000/viewer`.
- `npm run dev:star-citizen`: Starts the development server and opens `http://localhost:3000/star-citizen`.
- `npm run dev:realistic`: Starts the development server and opens `http://localhost:3000/realistic`.
- `npm run build`: Builds the Next.js application for production.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run type-check`: Runs TypeScript compiler to check for type errors.
- `npm run test`: Runs all Vitest tests.
- `npm run test:modes`: Runs Vitest tests specific to view modes.
- `npm run test:view-modes`: Runs Vitest tests specific to modes.
- `npm run test:engine`: Runs Vitest tests specific to the engine.
- `npm run test:shaders`: Runs Vitest tests specific to shaders.
- `npm run test:camera`: Runs Vitest tests specific to the camera.
- `npm run test:data`: Runs Vitest tests specific to data integrity.
- `npm run test:objects`: Runs Vitest tests specific to objects.
- `npm run test:setup`: Runs Vitest tests specific to setup.
- `npm run test:features`: Runs Vitest tests specific to features.
- `npm run test:coverage`: Runs Vitest with code coverage reporting.
- `npm run test:watch`: Runs Vitest in watch mode.
- `npm run test:profile`: Runs profiling tests. 