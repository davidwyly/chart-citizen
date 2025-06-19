# Test Suite Reorganization Plan

## 📊 Current Status (Baseline)
- **Total Tests**: 1269 (148 failing, 1119 passing, 2 skipped)
- **Main Issues**: Placeholder tests, view mode config issues, scattered organization
- **Duplicated Areas**: Camera tests (20+ files), Profile view tests (15+ files)

## 🎯 Reorganization Goals
1. **Consolidate duplicate/scattered tests** into logical groupings
2. **Move tests closer to source code** following proximity principle
3. **Separate integration vs unit tests** clearly
4. **Remove or implement placeholder tests**
5. **Fix configuration issues** in view mode system

## 📁 Consolidation Plan

### **Phase 1: Camera System Tests**
**Current**: 20+ files scattered across `__tests__/` and `engine/components/system-viewer/__tests__/`

**Consolidate to**:
```
engine/components/system-viewer/__tests__/camera/
├── camera-controls.test.ts          # Combine: camera-controls-broken, camera-tracking-*
├── camera-framing.test.ts           # Combine: camera-framing-*, camera-midpoint-*  
├── camera-jitter.test.ts            # Combine: camera-jitter-*, camera-planet-viewing
├── camera-integration.test.ts       # Combine: camera-scene-traversal, unified-camera-*
└── camera-profile-view.test.ts      # Profile-specific camera tests
```

**Files to consolidate**:
- `__tests__/camera-jitter-*.test.ts` (4 files) → `camera-jitter.test.ts`
- `__tests__/camera-tracking-*.test.ts` (3 files) → `camera-controls.test.ts`
- `__tests__/camera-controls-broken.test.ts` → `camera-controls.test.ts`
- `__tests__/camera-planet-viewing.test.ts` → `camera-jitter.test.ts`
- `__tests__/optimal-camera-range.test.ts` → `camera-integration.test.ts`
- Multiple `engine/.../camera-*` files → respective consolidated files

### **Phase 2: Profile View Tests**
**Current**: 15+ files scattered across multiple directories

**Consolidate to**:
```
engine/components/system-viewer/__tests__/profile-view/
├── profile-view-core.test.ts        # Basic profile view functionality
├── profile-view-layout.test.ts      # Layout and positioning logic
├── profile-view-camera.test.ts      # Profile-specific camera behavior
├── profile-view-navigation.test.ts  # Hierarchical navigation
├── profile-view-integration.test.ts # Cross-system integration
└── profile-view-requirements.test.ts # Keep existing (remove placeholders)
```

**Files to consolidate**:
- `__tests__/profile-view-regression.test.ts` → `profile-view-integration.test.ts`
- Multiple `engine/.../profile-*` files → respective consolidated files
- Remove placeholder tests from `profile-view-requirements.test.ts`

### **Phase 3: Orbital Mechanics Tests**
**Current**: Scattered across multiple directories

**Consolidate to**:
```
engine/utils/__tests__/orbital-mechanics/
├── orbital-mechanics-core.test.ts   # Basic calculations
├── orbital-mechanics-scaling.test.ts # Scaling and size calculations  
├── orbital-mechanics-integration.test.ts # Cross-system integration
└── orbital-mechanics-validation.test.ts # Distance and collision validation
```

### **Phase 4: Performance Tests**
**Current**: Mix in `__tests__/performance/` and scattered locations

**Reorganize to**:
```
__tests__/performance/               # Keep performance directory
├── memory-leaks.test.ts            # Consolidate memory-related tests
├── render-performance.test.ts      # Consolidate rendering performance
├── object-selection.test.ts        # Consolidate selection performance
└── camera-jitter.test.ts          # Move camera-jitter perf tests here
```

### **Phase 5: Integration Tests** 
**Current**: Good structure, minor cleanup needed

**Keep structure, consolidate**:
```
__tests__/integration/
├── data-loading-pipeline.test.tsx  # Keep
├── binary-star-system.test.ts      # Keep
├── adaptive-time-scaling.test.tsx  # Keep
└── module-resolution.test.ts       # Keep (clean up validation)
```

## 🚀 Implementation Steps

### **Step 1: Fix Placeholder Tests**
- Remove 17 `expect(true).toBe(false)` placeholder tests
- Either implement or convert to TODO comments
- Fix view mode configuration issues

### **Step 2: Consolidate Camera Tests**
- Create camera test directory structure
- Merge related test files
- Remove duplicated test logic
- Update imports and test utilities

### **Step 3: Consolidate Profile View Tests**
- Create profile view test directory
- Merge related test files
- Remove redundant test coverage
- Fix broken profile view functionality

### **Step 4: Move Tests to Proper Locations**
- Move unit tests closer to source code
- Keep integration tests in `__tests__/integration/`
- Organize performance tests in `__tests__/performance/`

### **Step 5: Clean Up Root __tests__ Directory**
- Remove consolidated files
- Keep only integration and performance directories
- Update test organization documentation

## 📊 Expected Outcomes
- **Reduced test files**: ~50 fewer test files
- **Better organization**: Tests near their source code
- **Fewer failing tests**: Fix placeholder and config issues
- **Clearer structure**: Logical grouping of related tests
- **Easier maintenance**: Less duplication, better naming

## 🔧 Files to Delete After Consolidation
```
__tests__/camera-*.test.ts (9 files)
__tests__/profile-view-regression.test.ts
__tests__/orbital-mechanics-debug.test.ts
__tests__/scaling-ratio-validation.test.ts
__tests__/optimal-*.test.ts (3 files)
Multiple engine/.../profile-*.test.ts files
Multiple engine/.../camera-*.test.ts files
```

## ⚠️ Risk Mitigation
- **Backup strategy**: Create git branch before changes
- **Test coverage**: Verify no tests are lost during consolidation
- **Incremental approach**: Consolidate one area at a time
- **Validation**: Run test suite after each consolidation phase 