# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Runner:**
- Custom test runner (no Jest/Vitest detected)
- Implemented in `tests/overlap-detection.test.ts`
- Simple Promise-based test execution

**Assertion Library:**
- Custom assertion functions (no testing framework dependencies)
- Manual expectation implementation

**Run Commands:**
```bash
# No standard test commands detected
# Custom test execution:
tsx tests/overlap-detection.test.ts    # Run overlap detection tests
```

## Test File Organization

**Location:**
- Tests in dedicated `tests/` directory
- No co-located tests found in source directories
- Test files follow `*.test.ts` naming pattern

**Naming:**
- Pattern: `[feature]-test.ts` (e.g., `overlap-detection.test.ts`)
- Descriptive names indicating the feature being tested

**Structure:**
```
tests/
├── overlap-detection.test.ts     # Core business logic tests
```

## Test Structure

**Suite Organization:**
```typescript
// Custom TestRunner class implementation
class TestRunner {
    private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
    private passed = 0;
    private failed = 0;

    test(name: string, fn: () => Promise<void>) {
        this.tests.push({ name, fn });
    }

    async run() {
        // Execute tests and track results
    }
}
```

**Patterns:**
- **Setup:** Custom test runner initialization
- **Teardown:** No explicit cleanup patterns detected
- **Assertion:** Custom `expect` function with fluent interface

## Mocking

**Framework:** No mocking framework detected (no Jest, Vitest, or sinon dependencies)

**Patterns:**
- Manual function mocking for testing logic (e.g., `isDayPartConflict` function)
- Hardcoded test data instead of mock factories
- No database mocking - tests focus on pure logic validation

```typescript
// Example manual mocking pattern
const isDayPartConflict = (part1: string, part2: string): boolean => {
    if (part1 === 'ALL' || part2 === 'ALL') return true;
    return part1 === part2;
};
```

**What to Mock:**
- Pure business logic functions
- Date comparison logic
- Validation rules

**What NOT to Mock:**
- Database operations (avoided in favor of logic-only testing)

## Fixtures and Factories

**Test Data:**
- Hardcoded test values in test functions
- No external fixture files detected
- Date objects created inline for specific test scenarios

**Location:**
- Test data embedded within test functions
- No separate fixture directories

## Coverage

**Requirements:** No coverage enforcement detected

**View Coverage:**
- No coverage tools configured
- Manual test result reporting with pass/fail counts
- Console output shows test execution status

## Test Types

**Unit Tests:**
- Focus on pure business logic (overlap detection, validation rules)
- Test individual functions in isolation
- No framework dependencies

**Integration Tests:**
- Not detected
- Database operations tested separately via debug scripts

**E2E Tests:**
- Not used
- No browser automation framework detected

## Common Patterns

**Async Testing:**
```typescript
runner.test('should allow booking adjacent dates', async () => {
    // Async test implementation using Promises
    const result = await someAsyncOperation();
    expect(result).toBe(expected);
});
```

**Error Testing:**
```typescript
const expect = (actual: any) => ({
    toBe: (expected: any) => {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, but got ${actual}`);
        }
    }
});
```

**Manual Test Execution:**
- Tests run via Node.js with TSX transpiler
- No test watcher or hot reload detected
- Manual process exit with appropriate exit codes

## Testing Infrastructure Gaps

**Missing Elements:**
- No formal test framework (Jest/Vitest/Mocha)
- No automated test runner configuration
- No CI/CD integration detected
- No coverage reporting
- No component testing framework
- No API endpoint testing
- No database integration testing

**Debug Scripts as Alternative Testing:**
- Multiple debug scripts in root directory (`debug-*.ts`, `test-*.ts`)
- Manual execution for specific business logic validation
- Serve as informal testing for complex workflows

---

*Testing analysis: 2026-02-03*