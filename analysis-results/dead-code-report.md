# Dead Code Hunter Results 🏹

**Analysis completed in 650ms**

## Executive Summary
- **Dead Files**: 33 files (146 KB)
- **Suspicious Files**: 198 files (1434 KB) 
- **Legacy Systems**: 27 files
- **Duplicates**: 1 sets (1 KB)
- **Total Savings**: 147 KB

## 🗑️ Dead Files (High Confidence - Safe to Delete)

- `update-game-to-profile.js` (2KB) - No exports found
- `scripts/standardize-radius-to-km.js` (5KB) - No exports found
- `hooks/use-mobile.tsx` (1KB) - No imports found
- `engine/system-loader-enhanced.ts` (11KB) - No imports found
- `engine/utils/stellar-zone-geometry.ts` (7KB) - No imports found
- `engine/utils/coordinated-scaling-calculator.ts` (9KB) - No imports found
- `engine/types/catalog.ts` (1KB) - No imports found
- `engine/renderers/geometry-renderers/materials/storm-material.ts` (2KB) - No imports found
- `engine/renderers/geometry-renderers/materials/planet-rings-material.ts` (5KB) - No imports found
- `engine/renderers/geometry-renderers/materials/gas-giant-material.ts` (5KB) - No imports found
- `engine/renderers/geometry-renderers/materials/enhanced-terrestrial-planet-material.ts` (13KB) - No imports found
- `engine/lib/planet-customizer.ts` (5KB) - No imports found
- `engine/core/engine-state.ts` (2KB) - No imports found
- `engine/core/camera/camera-animations.ts` (8KB) - No imports found
- `engine/components/theme-provider.tsx` (0KB) - No imports found
- `engine/components/error-boundary.tsx` (7KB) - No imports found
- `engine/components/debug-viewer.tsx` (8KB) - No imports found
- `engine/components/debug-panel.tsx` (5KB) - No imports found
- `engine/components/catalog-object-wrapper.tsx` (4KB) - No imports found
- `engine/components/system-viewer/system-navigation-bar.tsx` (6KB) - No imports found
- `engine/components/system-viewer/system-info-overlay.tsx` (3KB) - No imports found
- `engine/components/system-viewer/profile-layout-controller.tsx` (5KB) - No imports found
- `engine/components/system-viewer/planet-viewer.tsx` (3KB) - No imports found
- `engine/components/system-viewer/components/system-info-overlay.tsx` (3KB) - No imports found
- `engine/components/starmap/starmap-viewer.tsx` (6KB) - No imports found
- `engine/components/3d-ui/types.d.ts` (0KB) - No exports found
- `engine/components/3d-ui/space-curvature-effect.tsx` (4KB) - No imports found
- `engine/components/3d-ui/smog-planet.tsx` (2KB) - No imports found
- `engine/backgrounds/space-nebula-background.tsx` (7KB) - No imports found
- `components/system-viewer.tsx` (0KB) - No exports found
- `app/not-found.tsx` (1KB) - No imports found
- `app/[mode]/star-citizen/star-citizen-mode-view.tsx` (3KB) - No imports found
- `app/[mode]/realistic/realistic-mode-view.tsx` (3KB) - No imports found

## ⚠️ Suspicious Files (Review Required)

- `run-profile-tests.js` (1KB) - Test file with no imports
- `scripts/verify-catalog-objects.js` (4KB) - Test file with no imports
- `scripts/smart-file-reader.js` (11KB) - Test file with no imports
- `scripts/pattern-analyzer.js` (17KB) - Test file with no imports
- `scripts/convert-orbital-system.ts` (11KB) - Test file with no imports
- `scripts/ai-workflow-toolkit.js` (26KB) - Test file with no imports
- `scripts/agent-coordinator.js` (16KB) - Test file with no imports
- `lib/types/__tests__/effects-level.test.ts` (1KB) - Test file with no imports
- `lib/__tests__/utils.test.ts` (1KB) - Test file with no imports
- `lib/__tests__/utils-bugs.test.ts` (6KB) - Test file with no imports

... and 188 more

## 🏚️ Legacy Systems (27 files)

- `scripts/project-intelligence.js` (high priority) - 4 markers
- `scripts/dead-code-hunter.js` (high priority) - 3 markers
- `scripts/convert-orbital-system.ts` (low priority) - 1 markers
- `scripts/ai-workflow-toolkit.js` (high priority) - 1 markers
- `engine/system-loader.ts` (low priority) - 1 markers

... and 22 more

## 👥 Duplicates (1 sets)

- hooks/use-mobile.tsx ↔ engine/components/ui/use-mobile.tsx (1KB each)

## 🎯 Recommended Actions

1. **Immediate**: Delete 33 dead files (saves 146 KB)
2. **Review**: Audit 198 suspicious files  
3. **Plan**: Address 27 legacy systems
4. **Dedupe**: Resolve 1 duplicate sets

*Report generated on 2025-06-20T18:30:58.486Z*
