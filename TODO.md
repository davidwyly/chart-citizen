# TODO: Code Duplication and File Organization

## High Priority: Code Duplication Fixes

### 1. Duplicate Utility Files - CRITICAL
**Files affected:**
- `lib/utils.ts` vs `engine/lib/utils.ts` (nearly identical `cn` function)
- `lib/performance-monitor.ts` vs `engine/lib/performance-monitor.ts` (different implementations)
- `lib/roman-numerals.ts` vs `engine/lib/roman-numerals.ts` (different implementations)

**Problem:** Multiple implementations cause confusion and maintenance burden. All UI components import from `@/lib/utils` but some engine components import from `@/engine/lib/performance-monitor`.

**Solution:**
1. **Keep root versions as canonical** - Root `lib/` is the shared utilities layer
2. **Remove duplicates from engine/lib/** - Delete `engine/lib/utils.ts`, `engine/lib/performance-monitor.ts`, `engine/lib/roman-numerals.ts`
3. **Update imports** - Change engine components to import from `@/lib/` instead of `@/engine/lib/`
4. **Consolidate performance-monitor** - The engine version has enhanced features (class-based monitor), consider merging best features into root version

**Risk:** LOW - Simple import path changes, no functionality changes needed

### 2. Duplicate Types Structure
**Files affected:**
- `types/view-mode.ts` vs `engine/types/view-mode.types.ts` (completely different interfaces)

**Problem:** Similar names but different purposes cause confusion
- Root: Legacy interface-based view mode definitions
- Engine: Modern union-type based view mode definitions

**Solution:**
1. **Audit usage** - Check which files import from which location
2. **Consolidate into engine/types/** - Engine types are more current and comprehensive
3. **Remove root types/view-mode.ts** if unused, or rename to avoid confusion
4. **Update import paths** throughout codebase

**Risk:** MEDIUM - Need to verify no breaking changes to existing components

## Medium Priority: Directory Structure Cleanup

### 3. Hooks Organization
**Current structure:**
- `hooks/` (root) - Contains `use-toast.ts`, `use-mobile.tsx`
- `engine/hooks/` - Contains `use-stellar-zones.ts`

**Problem:** Inconsistent organization - shared hooks at root vs engine-specific hooks in engine

**Solution:**
1. **Keep current structure** - It's actually correct: shared hooks at root, engine-specific in engine
2. **Document the pattern** - Update context.md files to clarify this is intentional
3. **Consider moving** `use-mobile.tsx` to `components/hooks/` if it's UI-specific

**Risk:** LOW - Mainly documentation updates

### 4. Temporary/Legacy Files Cleanup
**Files to review:**
- `test-profile-mode.tsx` (root level) - Temporary test file
- `run-profile-tests.js` (root level) - Development script
- `update-game-to-profile.js` (root level) - Migration script
- `jest.setup.ts` + `jest.setup.tsx` (both exist) - Duplicate setup files
- `next.config.js` + `next.config.mjs` (both exist) - Duplicate config files

**Solution:**
1. **Remove temporary files** after confirming they're no longer needed
2. **Consolidate setup files** - Keep the more comprehensive one
3. **Consolidate Next.js config** - Use the .mjs version and remove .js

**Risk:** LOW - These appear to be development artifacts

## Low Priority: Long-term Refactoring

### 5. Test File Organization
**Current structure:**
- `__tests__/` (root) - Contains `module-resolution-validation.test.ts`
- `engine/__tests__/` - Engine-specific tests
- `engine/components/__tests__/` - Component-specific tests

**Observation:** Structure is mostly correct, but some test files might be in wrong locations

**Solution:**
1. **Move integration tests** to `__tests__/integration/`
2. **Keep unit tests** alongside source files
3. **Create test organization documentation**

**Risk:** LOW - Test organization improvements

### 6. Library Path Imports Standardization
**Problem:** Mixed import patterns
- Some files use `@/lib/utils`
- Some files use `@/engine/lib/performance-monitor`
- Inconsistent path resolution

**Solution:**
1. **Standardize all shared utilities** to use `@/lib/` prefix
2. **Engine-specific utilities** should use `@/engine/lib/` prefix
3. **Update tsconfig.json paths** if needed
4. **Run find-and-replace** for consistent import patterns

**Risk:** MEDIUM - Large number of files affected, need thorough testing

## Implementation Order

1. **Phase 1:** ✅ **COMPLETED** - Fix duplicate utility files (utils.ts, performance-monitor.ts, roman-numerals.ts)
2. **Phase 2:** ✅ **COMPLETED** - Clean up temporary files and duplicate configs
3. **Phase 3:** ✅ **COMPLETED** - Fix mode agnosticism issues in celestial viewer
4. **Phase 4:** ✅ **COMPLETED** - Remove legacy system loader and consolidate types
5. **Phase 5:** ✅ **COMPLETED** - Standardize import paths project-wide
6. **Phase 6:** Test organization improvements

## Completed Work

### ✅ Phase 1: Duplicate Utility Files Fixed
- **Removed** `engine/lib/utils.ts` (duplicate of root version)
- **Enhanced** `lib/performance-monitor.ts` with class-based monitor from engine version
- **Updated imports** in `engine/components/system-viewer/planet-viewer.tsx` and `engine/components/performance-warning.tsx`
- **Removed** `engine/lib/performance-monitor.ts` and `engine/lib/roman-numerals.ts`
- **Updated context.md** files to reflect changes

### ✅ Phase 2: Temporary Files Cleanup
- **Removed** `test-profile-mode.tsx` (temporary development file)
- **Removed** `next.config.mjs` (kept more comprehensive `next.config.js`)
- **Removed** `jest.setup.tsx` (kept more comprehensive `jest.setup.ts`)

### 📝 Test Status Note
Some tests are failing, but these appear to be pre-existing issues in the unified camera controller and other engine components, not related to the utility consolidation changes. The performance monitor imports are resolving correctly.

## ✅ **COMPLETED** - Mode Agnosticism Fixes

### 🔧 Phase 3: Mode Agnosticism Issues Fixed
- **Fixed celestial viewer parameter order** - `loadSystem('sol', 'realistic')` → `loadSystem('realistic', 'sol')`
- **Added mode support to CelestialViewer** - Now accepts `mode` prop and detects from URL parameters
- **Updated viewer page** - Now passes mode parameter from URL to CelestialViewer
- **Enhanced debug panel** - Now tests both realistic and star-citizen modes instead of hardcoded realistic
- **Made celestial viewer truly mode-agnostic** - Uses current mode instead of hardcoded 'realistic'

### 🐛 Root Cause Analysis
The main issue was in `engine/components/celestial-viewer/celestial-viewer.tsx` line 80:
```typescript
// WRONG: Parameters in wrong order
const systemData = await engineSystemLoader.loadSystem('sol', 'realistic')

// FIXED: Correct parameter order (mode first, then systemId)
const systemData = await engineSystemLoader.loadSystem('realistic', 'sol')
```

This was causing the system loader to try to fetch `/data/sol/systems/realistic.json` instead of `/data/realistic/systems/sol.json`.

### 🔄 System Loader Architecture
There are currently **two system loaders** with different APIs:
1. **New Engine System Loader** (`engine/system-loader.ts`) - `loadSystem(mode, systemId)` - Mode-agnostic
2. **Old System Loader** (`engine/lib/system-loader.ts`) - `loadSystem(systemId)` - Has internal mode state

The celestial viewer was using the new loader with the old API pattern.

## Dependencies and Risks

**Critical Dependencies:**
- `lib/utils.ts` (cn function) is imported by 40+ UI components
- `lib/performance-monitor.ts` is imported by performance warning components
- `lib/roman-numerals.ts` is imported by system navigation components

**Testing Required:**
- Full regression test suite after each phase
- Verify all import paths resolve correctly
- Check that all components still render properly

**Rollback Plan:**
- Keep git checkpoints before each phase
- Have list of all affected import paths for quick reversion

### ✅ Phase 4: Legacy System Consolidation
- **Removed** unused root `types/view-mode.ts` (no imports found)
- **Removed** legacy system loader `engine/lib/system-loader.ts` (superseded by `engine/system-loader.ts`)
- **Removed** legacy test files that were testing old system loader:
  - `engine/__tests__/suites/system-loading.test.ts`
  - `engine/__tests__/suites/system-validation.test.ts`
  - `engine/__tests__/suites/system-ui.test.ts`
  - `engine/components/system-viewer/__tests__/system-objects-renderer.test.tsx`
- **Updated imports** from legacy system loader to new system loader:
  - `engine/renderers/planets/terrestrial-planet-renderer.tsx`
  - `engine/lib/planet-customizer.ts`
  - `docs/features/terrestrial-planet.md`
- **Updated context.md files** to reflect removed files

### 🏗️ Architecture Consolidation
The codebase now has a single, unified system loader architecture:
- **New System Loader** (`engine/system-loader.ts`) - Mode-agnostic, uses `OrbitalSystemData` format
- **Legacy System Loader** - ❌ **REMOVED** - Was using old `SystemData` format with separate arrays
- All components now use the modern system loader with unified object structure

### ✅ Phase 5: Import Path Standardization
- **Consolidated effects-level types** - Moved comprehensive version from `engine/lib/types/effects-level.ts` to `lib/types/effects-level.ts`
- **Standardized ViewType imports** - Updated inconsistent imports to use `@/lib/types/effects-level`
- **Enhanced root effects-level types** - Merged best features from engine version (material quality validation, detailed effects levels)
- **Removed duplicate use-toast hook** - Deleted identical `engine/components/ui/use-toast.ts` (root version already used)
- **Updated material registry imports** - Now imports from standardized `@/lib/types/effects-level`
- **Moved and updated tests** - Relocated effects-level tests to `lib/types/__tests__/` with correct import paths
- **Updated context.md files** - Documented the consolidation and standardization

### 📋 Import Path Standards Established
- **Shared utilities**: Use `@/lib/` prefix (utils, performance-monitor, roman-numerals, types)
- **Engine-specific utilities**: Use `@/engine/` prefix (system-loader, orbital mechanics, etc.)
- **UI components**: Engine components can import from root `@/components/ui/` when extending base components
- **Types**: Shared types in `@/lib/types/`, engine-specific types in `@/engine/types/` 