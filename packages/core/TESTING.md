# Testing Guide for @zilliz/claude-context-core

## Overview

This package uses Jest with ts-jest for testing. The test suite includes unit tests for code splitting, AST parsing, and symbol extraction.

## Running Tests

```bash
# Run all tests with parallel execution (faster but may have intermittent failures)
pnpm test

# Run tests serially (slower but more reliable)
pnpm test:serial

# Run tests in watch mode (automatically runs serially to avoid issues)
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Known Issues

### Tree-sitter Parser Race Conditions

The tests in `cpp-symbol-extractor.test.ts` may exhibit intermittent failures when run in parallel with other tests due to shared state in tree-sitter parser instances. This is a known limitation of tree-sitter when used in concurrent testing environments.

**Symptoms:**
- Tests pass when run individually
- Tests may fail intermittently with errors like `Cannot read properties of undefined (reading 'type')`
- Failure count varies between test runs (typically 15-17 failures)

**Workaround:**
Use `pnpm test:serial` to run tests sequentially, which eliminates the race condition.

**Root Cause:**
Tree-sitter language parsers are loaded at module level and Parser instances can have state conflicts when multiple tests create and use parsers concurrently.

## Test Structure

```
src/splitter/__tests__/
├── cpp-parser.test.ts           # AST-based C++ code splitting tests
├── cpp-symbol-extractor.test.ts # C++ symbol extraction tests (may be flaky in parallel)
├── cpp-symbol-metadata.test.ts  # Symbol metadata integration tests
├── cpp-fixtures.test.ts         # Tests with real C++ code fixtures
├── perl-parser.test.ts          # Perl parsing tests
├── smf-parser.test.ts          # SMF file parsing tests
└── fixtures/                    # Test fixture files
```

## Best Practices

1. **Running Locally**: Use `pnpm test:serial` for consistent results during development
2. **CI/CD**: Consider using `--maxWorkers=1` or `--runInBand` for reliable CI test runs
3. **Debugging**: Run individual test files with `npx jest path/to/test.ts` to isolate issues
4. **Performance**: Parallel execution (`pnpm test`) is faster but may require multiple runs to catch intermittent failures

## Dependencies

### Test Dependencies
- `jest@^30.0.0` - Test framework
- `ts-jest@^29.4.0` - TypeScript support for Jest
- `@types/jest@^30.0.0` - TypeScript definitions
- `mock-fs@^5.5.0` - File system mocking

### Parser Dependencies
- `tree-sitter@^0.21.1` - Core tree-sitter library
- `tree-sitter-cpp@^0.22.0` - C++ parser
- `tree-sitter-javascript@^0.21.0` - JavaScript parser
- `tree-sitter-python@^0.21.0` - Python parser
- And other language-specific parsers...

## Troubleshooting

### Tests fail with "Cannot read properties of undefined"
- **Cause**: Tree-sitter parser race condition
- **Solution**: Run with `pnpm test:serial`

### Jest cache issues
- **Solution**: Clear the cache with `rm -rf .jest-cache` or `jest --clearCache`

### TypeScript compilation errors in tests
- **Solution**: Ensure `pnpm build` has been run before testing
- **Solution**: Check that tsconfig.json is properly configured

### Out of memory errors
- **Solution**: Reduce `maxWorkers` or use serial execution
- **Solution**: Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096" pnpm test`

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Use `beforeEach` for test setup to ensure isolation
3. Add null guards when working with tree-sitter nodes
4. Test your changes both individually and as part of the full suite
5. Document any known limitations or race conditions
