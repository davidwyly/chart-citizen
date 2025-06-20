# Test Gap Analysis 🧪

**Analysis Time**: 648ms

## 📊 Coverage Summary
- **Total Files**: 238
- **Tested Files**: 76 (32%)
- **Untested Files**: 162
- **Critical Gaps**: 69
- **Test Files Found**: 474

## 🎯 Coverage by Type
- **Components**: 0/0 (0%)
- **Hooks**: 0/0 (0%)
- **Utils**: 0/0 (0%)
- **Services**: 0/0 (0%)

## 🚨 Critical Gaps (69 files)
- **engine/components/system-viewer/hooks/use-system-data.ts** (component) - Score: 13
  Reason: Complex file missing integration tests

- **engine/services/error-reporter.ts** (service) - Score: 12
  Reason: Complex file missing integration tests

- **engine/components/system-viewer/hooks/use-profile-view.ts** (component) - Score: 12
  Reason: Complex file missing integration tests

- **engine/components/system-viewer/hooks/use-orbital-mechanics.ts** (component) - Score: 12
  Reason: Complex file missing integration tests

- **app/realistic/starmap/services/data-loader.ts** (service) - Score: 12
  Reason: Complex file missing integration tests

- **engine/components/debug-panel.tsx** (component) - Score: 11
  Reason: High criticality file with no test coverage

- **app/realistic/starmap/components/starmap-canvas.tsx** (component) - Score: 11
  Reason: High criticality file with no test coverage

- **scripts/test-gap-analyzer.js** (component) - Score: 10
  Reason: High criticality file with no test coverage

... and 61 more critical gaps

## 📋 Untested Files (162 files)
- **engine/components/debug-panel.tsx** (component) - Criticality: 11
  Missing test coverage

- **app/realistic/starmap/components/starmap-canvas.tsx** (component) - Criticality: 11
  Missing test coverage

- **scripts/test-gap-analyzer.js** (component) - Criticality: 10
  No exports - may not need tests

- **scripts/problem-solver.js** (other) - Criticality: 10
  No exports - may not need tests

- **engine/components/debug-viewer.tsx** (component) - Criticality: 10
  Missing test coverage

- **engine/components/catalog-object-wrapper.tsx** (component) - Criticality: 10
  Missing test coverage

- **engine/components/ui/carousel.tsx** (component) - Criticality: 10
  Missing test coverage

- **scripts/pattern-analyzer.js** (other) - Criticality: 9
  No exports - may not need tests

- **scripts/context-tracer.js** (component) - Criticality: 9
  No exports - may not need tests

- **engine/services/shader-scaling/shader-scaling-service.ts** (service) - Criticality: 9
  Missing test coverage

... and 152 more untested files

## 🔍 Missing Test Types (48 files)
- **lib/roman-numerals.ts** (other)
  Missing: component
  Has: unit

- **lib/performance-monitor.ts** (hook)
  Missing: integration
  Has: unit, unit, component

- **engine/object-factory.tsx** (other)
  Missing: interaction
  Has: unit, component, unit, component, api, integration

- **engine/utils/adaptive-time-scaling.ts** (util)
  Missing: component
  Has: unit

- **engine/types/view-mode-config.ts** (types)
  Missing: component
  Has: unit

- **engine/types/stellar-zones.ts** (types)
  Missing: component, interaction
  Has: unit

## 💡 Recommendations
- Low test coverage detected - prioritize adding tests for critical files
- 69 critical gaps found - prioritize testing high-criticality files
- Many untested files - consider setting up test automation
- Many untested components - add component testing with React Testing Library

## 🎯 Priority Actions
1. **Immediate**: Address 69 critical gaps
2. **Short-term**: Add tests for 123 high-criticality files
3. **Medium-term**: Improve coverage for components, hooks, utils, services files
4. **Long-term**: Reach 80%+ coverage across all file types

## 📊 Analysis Metrics
- **Total Coverage**: 32%
- **Average Criticality**: 6/10
- **Files Analyzed**: 238
- **Test Files**: 474

*Generated on 2025-06-20T18:30:58.489Z*
