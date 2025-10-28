# C++ Parser Testing and Benchmarking Guide

## Overview

This guide explains how to run tests and benchmarks for the C++ parser in the claude-context project. The test suite includes comprehensive unit tests and performance benchmarks to ensure the parser works correctly and efficiently.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Suite](#test-suite)
3. [Benchmark Suite](#benchmark-suite)
4. [Test Fixtures](#test-fixtures)
5. [Adding New Tests](#adding-new-tests)
6. [Interpreting Results](#interpreting-results)
7. [CI/CD Integration](#cicd-integration)

## Quick Start

### Running Tests

```bash
# From project root
pnpm test:core

# Or from packages/core directory
cd packages/core
pnpm test

# Watch mode (for development)
pnpm test:watch

# With coverage report
pnpm test:coverage
```

### Running Benchmarks

```bash
# Run C++ parser benchmark
pnpm run benchmark:cpp

# Run full build benchmark
pnpm run benchmark
```

### Quick Test Script

A convenience script is provided for running tests:

```bash
./run-parser-tests.sh
```

## Test Suite

### Overview

The test suite (`packages/core/src/splitter/__tests__/cpp-parser.test.ts`) includes **25 comprehensive test cases** covering:

- **Basic C++ Parsing**: Simple code parsing and file extension support
- **Function Parsing**: Function definitions and complex signatures
- **Class Parsing**: Class definitions and inheritance
- **Namespace Parsing**: Namespaces and nested namespaces
- **Sample Files**: Complete file parsing
- **Chunk Size Management**: Size limits and overlap handling
- **Edge Cases**: Empty code, comments-only, malformed code, long lines
- **Line Number Tracking**: Accurate line number preservation
- **Configuration**: Dynamic configuration updates
- **Language Support**: C++ language variation detection
- **Content Quality**: Non-empty chunks and code structure preservation

### Test Categories

#### 1. Basic C++ Parsing
Tests fundamental parsing capabilities:
- Simple C++ code parsing
- Multiple file extensions (.cpp, .cxx, .c)
- Basic syntax recognition

#### 2. Function Parsing
Tests function extraction and parsing:
- Simple function definitions
- Template functions
- Function overloading
- Complex signatures with callbacks

#### 3. Class Parsing
Tests object-oriented construct parsing:
- Class definitions
- Inheritance hierarchies
- Member functions and variables
- Access specifiers (public, private, protected)

#### 4. Namespace Parsing
Tests namespace handling:
- Single namespaces
- Nested namespaces
- Anonymous namespaces

#### 5. Edge Cases
Tests robustness:
- Empty files
- Comment-only files
- Malformed/invalid syntax
- Very long lines (>10,000 characters)

### Running Specific Tests

```bash
# Run specific test file
pnpm test cpp-parser.test.ts

# Run tests matching a pattern
pnpm test -- --testNamePattern="Function Parsing"

# Run in verbose mode
pnpm test -- --verbose
```

### Test Coverage

Current coverage metrics:
- **94.05% statement coverage** on ast-splitter.ts
- **72.5% branch coverage**
- **100% function coverage**

View detailed coverage:
```bash
pnpm test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Benchmark Suite

### Overview

The benchmark suite (`scripts/cpp-benchmark.js`) measures:
- **Parsing speed** (lines per second)
- **File processing time** (milliseconds)
- **Code size metrics** (KB, line counts)
- **Performance trends** (comparison with previous runs)

### Benchmark Features

1. **Comprehensive File Analysis**
   - Scans all C++ files in fixtures directory
   - Measures parse time per file
   - Calculates lines per second throughput

2. **Statistical Summary**
   - Total lines processed
   - Total size analyzed
   - Average processing time
   - Performance comparisons

3. **Historical Tracking**
   - Saves results to `cpp-benchmark-results.json`
   - Keeps last 20 benchmark runs
   - Shows performance trends

4. **Colorized Output**
   - Visual feedback in terminal
   - Performance indicators (⚡ improvements, ⚠️ regressions)

### Running Benchmarks

```bash
# Full C++ benchmark with tests
pnpm run benchmark:cpp

# View results
cat cpp-benchmark-results.json | jq '.[-1]'  # Latest run
```

### Benchmark Output

```
🚀 C++ Parser Benchmark Suite
================================================================================
📊 Found 8 C++ files to benchmark

📄 algorithms/sorting.cpp
   Lines: 157
   Size: 3.35 KB
   Parse Time: 15.31 ms
   Lines/sec: 10255

...

================================================================================
📈 Benchmark Summary
================================================================================
📊 Files analyzed: 8
📏 Total lines: 1448
💾 Total size: 34.33 KB
⏱️  Total parse time: 145.28 ms
⚡ Overall speed: 9967 lines/sec
📊 Average per file: 18.16 ms
📏 Average lines: 181
```

## Test Fixtures

### Directory Structure

```
packages/core/src/splitter/__tests__/fixtures/
├── algorithms/
│   ├── sorting.cpp           # Sorting algorithms (Quick, Merge, Heap, etc.)
│   ├── graph.cpp             # Graph algorithms (BFS, DFS, Dijkstra, etc.)
│   └── dynamic_programming.cpp  # DP problems (LCS, Knapsack, etc.)
├── data-structures/
│   └── advanced.cpp          # Trees, Trie, Segment Tree, Union-Find
├── modern-cpp/
│   └── features.cpp          # C++11/14/17/20 features
├── simple.cpp                # Minimal test case
├── sample.cpp                # Medium complexity
└── complex.cpp               # Advanced features
```

### Fixture Categories

#### Algorithms (564 lines)
- **sorting.cpp**: QuickSort, MergeSort, HeapSort, InsertionSort, BubbleSort
- **graph.cpp**: BFS, DFS, Topological Sort, Dijkstra, Bellman-Ford
- **dynamic_programming.cpp**: Fibonacci, LCS, LIS, Knapsack, Edit Distance

#### Data Structures (333 lines)
- **advanced.cpp**: Binary Search Tree, AVL Tree, Trie, Segment Tree, Disjoint Set

#### Modern C++ (324 lines)
- **features.cpp**: Smart pointers, lambdas, move semantics, concepts, ranges, constexpr

#### Basic Fixtures (227 lines)
- **simple.cpp**: Basic function (4 lines)
- **sample.cpp**: Functions, classes, namespaces (77 lines)
- **complex.cpp**: Inheritance, templates, operators (143 lines)

### Total Test Data
- **8 C++ files**
- **1,448 lines of code**
- **34.33 KB**
- Real-world code patterns from algorithms and data structures

## Adding New Tests

### Adding Test Fixtures

1. Create a new `.cpp` file in the appropriate fixtures directory:
   ```bash
   # For algorithms
   touch packages/core/src/splitter/__tests__/fixtures/algorithms/searching.cpp
   
   # For data structures
   touch packages/core/src/splitter/__tests__/fixtures/data-structures/hash-table.cpp
   
   # For modern C++
   touch packages/core/src/splitter/__tests__/fixtures/modern-cpp/coroutines.cpp
   ```

2. Add C++ code (preferably real-world examples)

3. Benchmark automatically picks up new files on next run

### Adding Test Cases

1. Open `packages/core/src/splitter/__tests__/cpp-parser.test.ts`

2. Add a new test within an existing describe block or create a new one:
   ```typescript
   it('should parse your new feature', async () => {
     const code = `/* your C++ code */`;
     const chunks = await splitter.split(code, 'cpp', 'test.cpp');
     
     expect(chunks.length).toBeGreaterThan(0);
     // Add your assertions
   });
   ```

3. Run tests to verify:
   ```bash
   pnpm test
   ```

### Test Best Practices

- **Keep tests focused**: One concept per test
- **Use descriptive names**: Test name should explain what's being tested
- **Test edge cases**: Empty input, large input, malformed input
- **Verify behavior**: Check both positive and negative cases
- **Use real code**: Base fixtures on actual C++ patterns

## Interpreting Results

### Test Results

```
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        2.445 s
```

- ✅ **All tests passed**: Parser working correctly
- ❌ **Tests failed**: Check error messages and stack traces
- ⏱️ **Time**: Should be under 5 seconds for fast feedback

### Benchmark Results

#### Key Metrics

1. **Lines per second**: Throughput indicator
   - **Target**: >5,000 lines/sec
   - **Good**: >10,000 lines/sec
   - **Excellent**: >20,000 lines/sec

2. **Parse time**: Processing latency
   - Should scale linearly with file size
   - Watch for regressions between runs

3. **Total size**: Amount of code tested
   - More code = more comprehensive testing
   - Current: 34.33 KB across 8 files

#### Performance Trends

The benchmark saves historical data and shows comparisons:

```
📊 Comparison with previous run:
   ⚡ Parse time improved by 12.34 ms
   ⚡ Speed improved by 523 lines/sec
```

- **⚡ Green indicators**: Performance improved
- **⚠️ Yellow indicators**: Performance regressed
- **➡️ Blue indicators**: No change

#### When to Investigate

- Parse time increases >10% without code changes
- Tests start failing intermittently
- Coverage drops below 90%
- Very slow tests (>100ms for simple parsing)

## CI/CD Integration

### GitHub Actions

Tests and benchmarks are integrated into the CI/CD pipeline. See `.github/workflows/test-and-benchmark.yml`.

#### On Every Push/PR

1. Install dependencies
2. Build packages
3. Run all tests
4. Run benchmarks
5. Upload artifacts
6. Comment results on PR

#### Artifacts Generated

- `core-package.tgz`: Core package build
- `mcp-package.tgz`: MCP package build
- `test-results/`: Test output and coverage
- `benchmark-results/`: Performance metrics

### Local Pre-Push Check

Before pushing code:

```bash
# Run full test and benchmark suite
pnpm test && pnpm run benchmark:cpp

# Check build
pnpm build

# Verify no uncommitted changes
git status
```

## Troubleshooting

### Tests Failing

1. **Check dependencies**:
   ```bash
   pnpm install
   ```

2. **Clear cache**:
   ```bash
   pnpm test -- --clearCache
   ```

3. **Run in verbose mode**:
   ```bash
   pnpm test -- --verbose
   ```

### Benchmark Errors

1. **Ensure fixtures exist**:
   ```bash
   ls -R packages/core/src/splitter/__tests__/fixtures/
   ```

2. **Check script permissions**:
   ```bash
   chmod +x scripts/cpp-benchmark.js
   ```

3. **Verify Node.js version**:
   ```bash
   node --version  # Should be 20.x or 22.x
   ```

### Performance Issues

1. **Profile the code**:
   ```bash
   node --prof scripts/cpp-benchmark.js
   ```

2. **Check system resources**:
   ```bash
   top  # CPU usage
   free -h  # Memory usage
   ```

3. **Reduce fixture size temporarily** to isolate issues

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Tree-sitter C++ Parser](https://github.com/tree-sitter/tree-sitter-cpp)
- [Project README](../../README.md)
- [Contributing Guide](../../CONTRIBUTING.md)

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review test examples for patterns
