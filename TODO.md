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
6. **Phase 6:** ✅ **COMPLETED** - Test organization improvements
7. **Phase 7:** ✅ **COMPLETED** - Implement error handling improvements (Custom Error Types, Error Boundaries, Enhanced System Loader, Error Reporter, Validation Framework)

## TODO: Future Enhancements

### 1. Structured Logging System
**Summary:** Implement a dedicated, structured logging system beyond console-based logging, with defined log levels and potential integration with external log aggregation services.
**File/Path Reference:** Primarily `engine/services/logger.ts` (new file) and various points across the codebase where `console.log`/`warn`/`error` are currently used.
**Why needed:** To provide more granular observability, enable easier filtering and analysis of logs, and facilitate integration with centralized logging platforms for production environments. This will complement the existing error reporting by providing a more comprehensive view of application events and health.
**Priority:** Medium