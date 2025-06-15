# Tests Context

## Test Organization
Tests are organized by feature area and type:

## Integration Tests
- `integration/`: End-to-end integration tests for major workflows

## Unit Tests
- `error-handling.test.ts`: Comprehensive tests for the error handling system including custom error types, error reporter, validation framework, and enhanced system loader
- `module-resolution-validation.test.ts`: Tests for module resolution and import validation (removed)

## Test Utilities
- Test utilities and mocks are co-located with their respective test files
- Global test setup and configuration in vitest.config.ts

## Coverage Areas
- Error handling and reporting
- System loading and validation
- Component error boundaries
- Input validation and sanitization
- Retry logic and failure recovery

## 🗂️ Directory Structure

- **`integration/`** - Cross-system integration tests
  - `module-resolution-validation.test.ts` - Tests module resolution fixes and import path validation
  - `binary-star-system.test.ts` - Tests complex multi-star system behavior across view modes

## 📋 Test Categories

### **Integration Tests**
Tests that verify multiple components/systems working together:
- Module resolution and import path validation
- Complex system behaviors across different view modes  
- Cross-component interactions and state management
- System-level performance and behavior validation

### **Test Standards**
- All integration tests use Vitest framework
- Tests should verify end-to-end functionality
- Mock external dependencies when necessary
- Use descriptive test names and clear assertions

## 🚀 Running Integration Tests

```bash
# Run all integration tests
pnpm test __tests__/integration

# Run specific integration test
pnpm test module-resolution-validation
pnpm test binary-star-system
```

## 📚 Documentation

For detailed testing guidelines, see `docs/testing/test-organization.md` 