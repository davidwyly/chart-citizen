# Test Organization Guide

This document outlines the testing structure and organization principles for Chart Citizen.

## 🗂️ Test Directory Structure

```text
chart-citizen/
├── vitest.setup.ts                   # Global test setup and configuration
├── vitest.config.ts                  # Vitest configuration with path aliases
├── app/                              # App-specific tests
│   └── __tests__/                    # App component tests
├── components/                       # Shared component tests
│   └── __tests__/                    # Component unit tests
├── engine/                           # Engine-specific tests
│   ├── __tests__/                    # Engine unit and integration tests
│   │   ├── integration/              # Cross-engine integration tests
│   │   ├── suites/                   # Organized test suites
│   │   ├── object-factory.test.tsx   # Core factory tests
│   │   ├── system-loader.test.ts     # System loading tests
│   │   └── orbital-system.test.ts    # Orbital mechanics tests
│   └── components/                   # Engine component tests
│       └── [component]/              # Component-specific test directories
│           └── __tests__/            # Component unit tests
├── lib/                              # Library utility tests
│   └── __tests__/                    # Utility function tests
└── hooks/                            # Custom hook tests
    └── __tests__/                    # Hook behavior tests
```

## 📋 Test Classification

### **Integration Tests** (`engine/__tests__/integration/`)
Tests that verify multiple components/systems working together:

- **Cross-module interactions** - Testing module resolution, import paths
- **System-level behavior** - Testing complex star system features across view modes  
- **End-to-end workflows** - Testing complete user journeys
- **Performance integration** - Testing performance across multiple systems

**Current Integration Tests:**
- `adaptive-time-scaling-integration.test.tsx` - Time scaling across systems
- `binary-star-system.test.ts` - Complex multi-star system behavior
- `data-loading-pipeline.test.tsx` - Data loading and processing pipeline
- `module-resolution-validation.test.ts` - Module and import validation

### **Unit Tests** (alongside source files)
Tests that verify individual components/functions in isolation:

- **Component behavior** - Testing individual React components
- **Function logic** - Testing pure functions and utilities
- **Type validation** - Testing TypeScript type definitions
- **Class methods** - Testing individual class methods and state

**Location:** In `__tests__/` folders within the same directory as source files

**Naming Convention:** `*.test.ts` or `*.test.tsx` for unit test files

### **Test Suites** (`engine/__tests__/suites/`)
Organized collections of related tests:

- **Camera System** - All camera-related functionality
- **Engine Core** - Core engine functionality
- **Mode System** - View mode system tests
- **Performance** - Performance and optimization tests
- **Rendering** - Rendering system tests

## 🎯 Test Guidelines

### **When to Write Integration Tests**
1. **Multi-component interactions** - When testing features that span multiple components
2. **System behavior** - When testing how different parts of the engine work together
3. **Configuration validation** - When testing module resolution, path mappings, etc.
4. **View mode interactions** - When testing how features behave across different view modes

### **When to Write Unit Tests**
1. **Individual components** - When testing a single React component in isolation
2. **Utility functions** - When testing pure functions with clear inputs/outputs
3. **Type definitions** - When validating TypeScript type behavior
4. **Class methods** - When testing individual methods or state management

### **Test Organization Principles**
1. **Proximity Rule** - Unit tests should be close to the code they test
2. **Integration Separation** - Integration tests should be in dedicated folders
3. **Clear Naming** - Test files should clearly indicate what they test
4. **Minimal Dependencies** - Tests should have minimal external dependencies
5. **Suite Organization** - Related tests should be grouped in logical suites

## 🚀 Running Tests

### **All Tests**
```bash
pnpm test
```

### **Integration Tests Only**
```bash
pnpm test integration
```

### **Unit Tests Only**
```bash
pnpm test --exclude="**/integration/**"
```

### **Specific Test Suite**
```bash
pnpm test suites/camera
```

### **Watch Mode**
```bash
pnpm test --watch
```

### **Coverage Report**
```bash
pnpm test --coverage
```

## 📦 Test Utilities and Setup

### **Global Setup** (`vitest.setup.ts`)
- **Jest-DOM matchers** - Extended expect assertions for DOM testing
- **Three.js mocks** - WebGL context mocking for 3D tests
- **ResizeObserver mock** - For responsive component testing
- **Global cleanup** - Automatic cleanup between tests
- **Mock management** - Centralized mock clearing and restoration

### **Test Configuration** (`vitest.config.ts`)
- **Path aliases** - Matches tsconfig.json for consistent imports
- **Test environment** - jsdom for React component testing
- **Include/exclude patterns** - Optimized test discovery
- **Timeout settings** - Appropriate timeouts for different test types
- **Reporting** - Verbose output with JSON reporting

## 🔧 Best Practices

### **Test Structure**
```typescript
describe('ComponentName', () => {
  describe('Feature Group', () => {
    it('should do specific thing when condition is met', () => {
      // Arrange
      const testData = setupTestData();
      
      // Act
      const result = performAction(testData);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### **Test Naming**
- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks
- Use nested `describe` blocks for logical organization

### **Mock Management**
- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks
- Clear mocks between tests (handled automatically)
- Mock external dependencies consistently

### **Async Testing**
```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toBe(expectedValue);
});
```

## 🧹 Test Maintenance

### **TODO Test Policy**
- **Remove unused TODOs** - Delete placeholder tests that won't be implemented
- **Implement critical TODOs** - Priority tests should be implemented
- **Document remaining TODOs** - Keep only well-documented placeholder tests

### **Test Cleanup Checklist**
- [ ] Remove obsolete test files
- [ ] Update tests when refactoring code
- [ ] Consolidate duplicate test logic
- [ ] Remove unused imports and dependencies
- [ ] Update test documentation

### **When Adding New Features**
- [ ] Write unit tests for new components/functions
- [ ] Write integration tests if feature spans multiple systems
- [ ] Update existing tests if behavior changes
- [ ] Add test documentation if needed

### **When Refactoring**
- [ ] Update unit tests to match new structure
- [ ] Verify integration tests still pass
- [ ] Remove obsolete test files
- [ ] Update test documentation

## 🔍 Troubleshooting

### **Common Issues**
1. **Import Path Errors** - Check `vitest.config.ts` path aliases match `tsconfig.json`
2. **Module Resolution** - Verify aliases are correctly configured
3. **Mock Issues** - Check mock setup in `vitest.setup.ts`
4. **Type Errors** - Ensure test files are included in TypeScript compilation
5. **WebGL/Three.js Errors** - Check WebGL mocking in global setup

### **Debug Commands**
```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test path/to/test.test.ts

# Run tests matching pattern
pnpm test --grep "pattern"
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Three.js Testing Patterns](https://threejs.org/docs/#manual/en/introduction/Testing) 