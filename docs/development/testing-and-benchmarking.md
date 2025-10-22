# Testing and Benchmarking Guide

This guide explains how to run tests and benchmarks for the Claude Context project.

## Table of Contents

- [Quick Start](#quick-start)
- [Running Benchmarks](#running-benchmarks)
- [Running Tests](#running-tests)
- [Setting Up Tests](#setting-up-tests)
- [Continuous Integration](#continuous-integration)
- [Performance Metrics](#performance-metrics)

## Quick Start

### Prerequisites

Before running tests or benchmarks, ensure you have:

1. **Node.js** >= 20.0.0 installed
2. **pnpm** >= 10.0.0 installed
3. All dependencies installed

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install

# Build the project
pnpm build
```

## Running Benchmarks

The project includes a build performance benchmarking system that measures build times across all packages.

### Run the Full Benchmark

```bash
pnpm benchmark
```

This will:
1. Clean all packages
2. Build each package individually (core, MCP, VSCode extension, Chrome extension)
3. Measure and report the time taken for each build
4. Save results to `build-benchmark.json`

### Benchmark Output

The benchmark will display:
- ✅ Success/failure status for each build step
- ⏱️ Duration in milliseconds for each step
- 📊 Total time and success count
- 🖥️ Platform and Node.js version information

Example output:
```
🚀 Starting build performance benchmark...

🔄 Clean all packages...
✅ Clean all packages completed in 1023ms

🔄 Build core package...
✅ Build core package completed in 3692ms

🔄 Build MCP package...
✅ Build MCP package completed in 4668ms

🔄 Build VSCode extension...
✅ Build VSCode extension completed in 4245ms

🔄 Build Chrome extension...
✅ Build Chrome extension completed in 1146ms

📈 Benchmark Summary:
   Total time: 14774ms
   Successful builds: 5/5
   Platform: linux
   Node version: v20.19.5

📊 Benchmark saved to build-benchmark.json
```

### Benchmark History

Benchmark results are saved to `build-benchmark.json` in the project root. The file maintains a history of the last 10 benchmark runs, allowing you to:
- Track performance over time
- Compare builds across different platforms
- Identify performance regressions

View the benchmark history:
```bash
cat build-benchmark.json
```

## Running Tests

### Current Test Infrastructure

The project has Jest configured in the core package. However, test files need to be created.

### Setting Up Jest Tests

The core package has Jest dependencies installed:
- `jest` ^30.0.0
- `ts-jest` ^29.4.0
- `@types/jest` ^30.0.0

To run tests once they are added:

```bash
# Run tests for the core package
cd packages/core
pnpm test

# Or from the root
pnpm --filter @zilliz/claude-context-core test
```

### Test Structure

When creating tests, follow this structure:

```
packages/core/
├── src/
│   ├── splitter/
│   │   ├── ast-splitter.ts
│   │   └── __tests__/
│   │       └── ast-splitter.test.ts
│   ├── context.ts
│   └── __tests__/
│       └── context.test.ts
└── package.json
```

### Example Test File

Create test files with the `.test.ts` extension:

```typescript
// packages/core/src/splitter/__tests__/ast-splitter.test.ts
import { AstCodeSplitter } from '../ast-splitter';

describe('AstCodeSplitter', () => {
  let splitter: AstCodeSplitter;

  beforeEach(() => {
    splitter = new AstCodeSplitter(2500, 300);
  });

  describe('C++ support', () => {
    it('should split C++ code with struct definitions', async () => {
      const code = `
        struct Point {
          int x;
          int y;
        };
      `;
      
      const chunks = await splitter.split(code, 'cpp', 'test.cpp');
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('cpp');
    });

    it('should capture template declarations', async () => {
      const code = `
        template<typename T>
        class Container {
          T data;
        };
      `;
      
      const chunks = await splitter.split(code, 'cpp', 'test.cpp');
      
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle enum definitions', async () => {
      const code = `
        enum class Color {
          Red,
          Green,
          Blue
        };
      `;
      
      const chunks = await splitter.split(code, 'cpp', 'test.cpp');
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
```

### Jest Configuration

Create a `jest.config.js` in the core package if tests are added:

```javascript
// packages/core/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true
      }
    }
  }
};
```

### Add Test Script

Add the test script to `packages/core/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Setting Up Tests

### Step 1: Create Test Configuration

```bash
cd packages/core
```

Create `jest.config.js` with the configuration shown above.

### Step 2: Add Test Scripts

Update `package.json` to include test scripts.

### Step 3: Create Test Files

Create `__tests__` directories and test files as needed.

### Step 4: Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Continuous Integration

### GitHub Actions Workflow

Create a CI workflow to run tests and benchmarks automatically:

```yaml
# .github/workflows/test.yml
name: Test and Benchmark

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm typecheck
        
      - name: Build
        run: pnpm build
        
      - name: Run tests
        run: pnpm test
        
      - name: Run benchmark
        run: pnpm benchmark
        
      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: build-benchmark.json
```

## Performance Metrics

### Build Performance Targets

Based on current benchmark results:

| Package | Target Time | Current (Linux) |
|---------|-------------|-----------------|
| Clean | < 2s | ~1s ✅ |
| Core | < 5s | ~3.7s ✅ |
| MCP | < 5s | ~4.7s ✅ |
| VSCode | < 5s | ~4.2s ✅ |
| Chrome | < 2s | ~1.1s ✅ |
| **Total** | **< 20s** | **~14.8s** ✅ |

### Monitoring Performance

Track performance over time:

```bash
# Extract total times from benchmark history
cat build-benchmark.json | jq '.[] | {timestamp, total: (.results | map(.duration) | add)}'
```

### Platform Comparisons

Compare build times across platforms:

```bash
# View benchmarks grouped by platform
cat build-benchmark.json | jq 'group_by(.platform) | map({platform: .[0].platform, count: length})'
```

## Testing Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// Good
it('should capture struct definitions as separate chunks in C++ code', async () => {

// Less clear
it('test structs', async () => {
```

### 2. Test Organization

Group related tests using `describe` blocks:

```typescript
describe('AstCodeSplitter', () => {
  describe('C++ support', () => {
    describe('struct handling', () => {
      // Related tests here
    });
  });
});
```

### 3. Test Coverage

Aim for high test coverage of critical paths:
- AST parsing logic
- Code chunking algorithms
- File filtering and inclusion rules
- Vector database operations
- Embedding generation

### 4. Mock External Dependencies

Use Jest mocks for external services:

```typescript
import { OpenAIEmbedding } from '../embedding';

jest.mock('openai');

describe('OpenAIEmbedding', () => {
  // Tests with mocked OpenAI client
});
```

### 5. Test Data

Use realistic test data:
- Real-world code examples
- Edge cases (empty files, very large files, special characters)
- Various programming languages

## Troubleshooting

### Benchmark Fails to Run

If the benchmark fails:

1. **Check dependencies**: `pnpm install`
2. **Clear build artifacts**: `pnpm clean`
3. **Check Node.js version**: `node --version` (should be >= 20.0.0)
4. **Check pnpm version**: `pnpm --version` (should be >= 10.0.0)

### Tests Not Found

If tests aren't discovered:

1. Ensure test files end with `.test.ts` or `.spec.ts`
2. Check that Jest configuration is correct
3. Verify test files are in `__tests__` directories or match the test pattern

### Build Performance Degradation

If builds are slower than expected:

1. Check if `node_modules` needs a fresh install
2. Verify TypeScript compiler settings
3. Check for large files in the build output
4. Review recent code changes that might impact build time

## Related Documentation

- [AST Splitter Improvements](../dive-deep/ast-splitter-improvements.md) - Details on C/C++ AST parsing improvements
- [File Inclusion Rules](../dive-deep/file-inclusion-rules.md) - Understanding file filtering
- [Contributing Guide](../../CONTRIBUTING.md) - General contribution guidelines

---

For questions or issues related to testing and benchmarking, please visit our [GitHub Issues](https://github.com/zilliztech/claude-context/issues) page.
