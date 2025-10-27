# C++ Parser Tests

This directory contains comprehensive unit tests for the C++ parsing functionality in the AST code splitter.

## Overview

The tests validate that the C++ parser can correctly:
- Parse various C++ constructs (functions, classes, namespaces)
- Handle different C++ file extensions (.cpp, .c++, .c)
- Manage chunk sizes and overlaps
- Track line numbers accurately
- Handle edge cases and malformed code

## Running Tests

From the `packages/core` directory:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

- **cpp-parser.test.ts**: Comprehensive test suite for C++ parsing
- **fixtures/**: Sample C++ files used in tests
  - `simple.cpp`: Minimal C++ code for basic testing
  - `sample.cpp`: Medium complexity with functions, classes, and namespaces
  - `complex.cpp`: Advanced C++ features including templates, inheritance, and nested namespaces

## Test Coverage

The test suite covers:

1. **Basic C++ Parsing**: Simple functions and file extensions
2. **Function Parsing**: Various function signatures and templates
3. **Class Parsing**: Classes, inheritance, and methods
4. **Namespace Parsing**: Single and nested namespaces
5. **Sample Files**: Complete file parsing with real-world examples
6. **Chunk Size Management**: Size limits and overlapping
7. **Edge Cases**: Empty code, comments, malformed code, long lines
8. **Line Number Tracking**: Accurate line number metadata
9. **Configuration**: Dynamic chunk size and overlap settings
10. **Language Support Detection**: Language variation support
11. **Content Quality**: Non-empty chunks and structure preservation

## Mocked Dependencies

The tests are designed to run independently without requiring:
- Database connections
- External APIs
- Embedding services

All tests use the AST splitter directly with tree-sitter for parsing, and fallback to the langchain splitter when needed.

## Adding New Tests

To add new tests:

1. Create or update fixture files in `fixtures/` directory
2. Add test cases in `cpp-parser.test.ts` following the existing structure
3. Run tests to ensure they pass: `npm test`

## Performance

Tests are designed to run quickly:
- Total execution time: ~3 seconds
- Individual tests: 1-15ms each
- No external dependencies or network calls

## CI/CD Integration

These tests can be easily integrated into CI/CD pipelines:

```bash
cd packages/core
npm install
npm test
```

Exit code 0 indicates all tests passed.
