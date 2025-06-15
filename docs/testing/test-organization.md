# Test Organization Guide

This document outlines the testing structure and organization principles for Chart Citizen.

## 🗂️ Test Directory Structure

```text
chart-citizen/
├── __tests__/                     # Root-level integration tests
│   └── integration/               # Cross-system integration tests
│       ├── module-resolution-validation.test.ts
│       └── binary-star-system.test.ts
├── engine/                        # Engine-specific tests
│   ├── __tests__/                 # Engine unit tests
│   │   ├── object-factory.test.tsx    # Tests object factory individually
│   │   ├── system-loader.test.ts      # Tests system loader individually
│   │   ├── setup.ts                   # Test setup and utilities
│   │   └── context.md                 # Engine test documentation
│   └── components/                # Component-specific tests
│       └── __tests__/             # Component unit tests (alongside source)
├── lib/                          # Library unit tests
│   └── types/
│       └── __tests__/            # Type validation tests
└── app/                         # app specific tests
    └── [mode]                    # mode specific tests
        ├── star-citizen/         # star citizen specific tests
        │   └── __tests__/              
        ├── realistic/
        │   └── __tests__/
        └── starmap/
            └── __tests__/
```

## 📋 Test Classification

### **Integration Tests** (`__tests__/integration/`)
Tests that verify multiple components/systems working together:

- **Cross-module interactions** - Testing module resolution, import paths
- **System-level behavior** - Testing complex star system features across view modes  
- **End-to-end workflows** - Testing complete user journeys
- **Performance integration** - Testing performance across multiple systems

**Naming Convention:** `*.test.ts` for integration test files

### **Unit Tests** (alongside source files)
Tests that verify individual components/functions in isolation:

- **Component behavior** - Testing individual React components
- **Function logic** - Testing pure functions and utilities
- **Type validation** - Testing TypeScript type definitions
- **Class methods** - Testing individual class methods and state

**Location:** In `__tests__/` folders within the same directory as source files

**Naming Convention:** `*.test.ts` or `*.test.tsx` for unit test files

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

## 🚀 Running Tests

### **All Tests**
```bash
pnpm test
```

### **Integration Tests Only**
```bash
pnpm test __tests__/integration
```

### **Unit Tests Only**
```bash
pnpm test --testPathIgnorePatterns=__tests__/integration
```

### **Specific Test Suite**
```bash
pnpm test object-factory
```

## 📦 Test Utilities

### **Setup Files**
- `engine/__tests__/setup.ts` - Engine-specific test setup and mocks
- `jest.setup.ts` - Global test setup and configuration

### **Mock Files**
- `__mocks__/` - Global mocks for external dependencies
- Individual `__mocks__/` folders alongside components for specific mocks

## 🔧 Configuration

### **Vitest Configuration** (`vitest.config.ts`)
- Path mappings aligned with `tsconfig.json`
- Test environment setup (jsdom for React components)
- Mock configurations and globals

### **TypeScript Configuration**
- Test files included in `tsconfig.json` compilation
- Proper type resolution for test utilities and mocks

## 📋 Test Checklist

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

### **When Fixing Bugs**
- [ ] Write a test that reproduces the bug
- [ ] Verify the test fails before the fix
- [ ] Verify the test passes after the fix
- [ ] Consider if integration tests are needed

## 🎨 Best Practices

### **Test Naming**
- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks

### **Test Structure**
- Arrange: Set up test data and conditions
- Act: Execute the code being tested
- Assert: Verify the expected results

### **Test Maintenance**
- Keep tests simple and focused
- Remove redundant or duplicate tests
- Update tests when functionality changes
- Use test utilities to reduce duplication

## 🔍 Troubleshooting

### **Common Issues**
1. **Import Path Errors** - Check `tsconfig.json` and `vitest.config.ts` path mappings
2. **Module Resolution** - Verify webpack aliases match TypeScript paths
3. **Mock Issues** - Check mock file locations and configurations
4. **Type Errors** - Ensure test files are included in TypeScript compilation

### **Debug Commands**
```bash
# Run tests with verbose output
pnpm test --verbose

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 