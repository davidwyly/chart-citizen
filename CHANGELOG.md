# Chart Citizen - Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - Major Architecture Improvements

### 🏗️ **Directory Structure Consolidation**
- **BREAKING**: Removed confusing dual `app/` + `apps/` structure
- **IMPROVED**: Consolidated to single `app/` directory following Next.js 13+ App Router conventions
- **ADDED**: Dynamic mode routing with `app/[mode]/` pattern
- **MOVED**: `apps/realistic/realistic-app.tsx` → `app/[mode]/realistic/realistic-mode-view.tsx`
- **MOVED**: `apps/star-citizen/star-citizen-app.tsx` → `app/[mode]/star-citizen/star-citizen-mode-view.tsx`
- **UPDATED**: All import paths to use `@/engine/` references
- **ENHANCED**: Mode-specific metadata and error handling

### 🔧 **Engine Linting & Quality Improvements**
- **FIXED**: 74% reduction in TypeScript compilation errors (51 → 13 errors)
- **RESOLVED**: Import path issues across all engine production files
- **CORRECTED**: Type interface mismatches in view mode system
- **REPLACED**: Custom JSX material elements with proper THREE.ShaderMaterial usage
- **IMPROVED**: Component prop types and method signatures
- **STANDARDIZED**: Material creation patterns across renderers

### 🧪 **Testing Infrastructure Enhancements**
- **FIXED**: Test linting issues across entire codebase
- **IMPROVED**: TypeScript type safety in test files
- **ENHANCED**: Test coverage for engine components
- **STANDARDIZED**: Test file organization and naming conventions

### 📋 **Documentation Overhaul**
- **UPDATED**: README.md with current architecture and project structure
- **REVISED**: Root `context.md` to reflect consolidated structure
- **ENHANCED**: Package.json with proper project metadata
- **ADDED**: Comprehensive getting started guide
- **IMPROVED**: Architecture documentation and contribution guidelines

### 🎯 **Mode System Improvements**
- **ENHANCED**: Clean separation between realistic and Star Citizen modes
- **IMPROVED**: Route handling with proper Next.js patterns
- **ADDED**: Mode-specific metadata and descriptions
- **STANDARDIZED**: Component naming and export patterns

### 📦 **Development Experience**
- **ADDED**: `type-check` script for standalone TypeScript checking
- **IMPROVED**: Project name and description in package.json
- **ENHANCED**: Development workflow documentation
- **STREAMLINED**: File organization and context documentation

## Technical Details

### Files Restructured
- `apps/realistic/realistic-app.tsx` → `app/[mode]/realistic/realistic-mode-view.tsx`
- `apps/star-citizen/star-citizen-app.tsx` → `app/[mode]/star-citizen/star-citizen-mode-view.tsx`
- Updated `app/[mode]/page.tsx` routing logic
- Enhanced metadata generation for mode-specific pages

### Engine Fixes Applied
- Fixed import paths in 15+ engine components
- Resolved type mismatches in view mode calculator
- Corrected material usage in star and planet renderers
- Standardized Three.js object creation patterns

### Breaking Changes
- `RealisticApp` component renamed to `RealisticModeView`
- `StarCitizenApp` component renamed to `StarCitizenModeView`
- Import paths changed from `@/apps/` to `@/app/[mode]/`
- Removed `apps/` directory entirely

### Migration Guide
If you have any custom code referencing the old structure:
1. Update import paths from `@/apps/` to `@/app/[mode]/`
2. Rename component references from `*App` to `*ModeView`
3. Update any direct file path references to use new structure

---

*This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.* 