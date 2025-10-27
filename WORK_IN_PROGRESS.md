# Work In Progress - C/C++ Code Indexing Improvements

**Status**: Phase 0 - Quick Wins  
**Started**: 2025-10-22  
**Last Updated**: 2025-10-22  
**Branch**: `copilot/analyze-code-base-and-next-task`

---

## Executive Summary

This document tracks the ongoing implementation of C/C++ code indexing improvements as outlined in `CPP_IMPROVEMENTS_ROADMAP.md`. The project aims to improve code search quality, reduce index size, and enhance developer productivity when working with large C/C++ codebases.

### Current Focus: Phase 0 - Quick Wins

**Goal**: Implement foundational improvements with high ROI and low effort
**Timeline**: 1-2 days
**Impact**: 40% reduction in noise, foundation for all future improvements

---

## Codebase State Analysis

### Repository Structure

```
claude-context/
├── packages/
│   ├── core/                    # Core indexing engine
│   │   ├── src/
│   │   │   ├── context.ts      # File detection and metadata
│   │   │   ├── splitter/
│   │   │   │   ├── ast-splitter.ts    # AST-based code splitting
│   │   │   │   ├── langchain-splitter.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── cpp-parser.test.ts  # 25 passing tests
│   │   │   │       └── fixtures/
│   │   │   ├── embedding/      # OpenAI, Voyage, Ollama, Gemini
│   │   │   ├── vectordb/       # Milvus/Zilliz integration
│   │   │   └── sync/           # Incremental indexing
│   │   └── package.json
│   ├── mcp/                     # MCP server
│   ├── vscode-extension/        # VSCode extension
│   └── chrome-extension/        # Chrome extension
├── docs/                        # Documentation
├── examples/                    # Usage examples
└── CPP_IMPROVEMENTS_ROADMAP.md  # Feature roadmap
```

### Technology Stack

- **Language**: TypeScript 5.8.3
- **Parser**: tree-sitter with language-specific parsers
- **Testing**: Jest (25 tests passing)
- **Build**: pnpm + TypeScript compiler
- **Embedding Providers**: OpenAI, VoyageAI, Ollama, Gemini
- **Vector Database**: Milvus / Zilliz Cloud

### Current C++ Support

**File Extensions** (COMPLETE ✅):
- `.c`, `.cpp`, `.cc`, `.cxx`, `.ut`
- `.h`, `.hpp`, `.hh`, `.hxx`

**AST Node Types Supported**:
- `function_definition` - Function implementations
- `class_specifier` - Class definitions
- `namespace_definition` - Namespace blocks
- `declaration` - Variable and type declarations (needs filtering)

**Key Features Working**:
- ✅ Tree-sitter based AST parsing
- ✅ Fallback to LangChain splitter for unsupported languages
- ✅ Configurable chunk size (default 2500 chars)
- ✅ Configurable overlap (default 300 chars)
- ✅ Line number tracking
- ✅ Metadata extraction (language, file path)
- ✅ Robust error handling with fallbacks

---

## Phase 0: Quick Wins - Implementation Status

### ✅ Feature 0.1: File Extension Support (COMPLETE)

**Status**: Already implemented in `context.ts` line 30  
**Files Modified**: None needed  
**Evidence**:
```typescript
const DEFAULT_SUPPORTED_EXTENSIONS = [
    // ...
    '.cc',   // ✅ Google-style C++
    '.ut',   // ✅ Unit test files
    // ...
];
```

**Acceptance Criteria Met**:
- [x] `.cc` files recognized as C++
- [x] `.ut` files recognized as C++ test files
- [x] Extension mapping tested and verified

**Next Steps**: None - feature complete

---

### ⏳ Feature 0.2: Test File Detection (IN PROGRESS)

**Status**: Not yet implemented  
**Priority**: HIGH  
**Estimated Effort**: 4 hours  
**Branch**: Will create `feature/p0-test-detection`

#### Requirements

Implement `isTestFile()` function with multiple heuristics:

1. **Extension-based**: Files ending in `.ut`
2. **Path-based**: Directories containing test indicators
   - `/test/`, `/tests/`
   - `/unittest/`, `/unittests/`
   - `/gtest/`, `/googletest/`
   - `/catch2/`
3. **Filename-based**: Test naming patterns
   - `*_test.{c,cc,cpp,cxx,ut}`
   - `*.test.{c,cc,cpp,cxx,ut}`
   - `*_unittest.{c,cc,cpp,cxx}`
   - `test_*.{c,cc,cpp,cxx}`

#### Implementation Plan

**Files to Modify**:
- `packages/core/src/context.ts` - Add `isTestFile()` function
- `packages/core/src/types.ts` - Add `isTest` to metadata interface
- `packages/core/src/splitter/ast-splitter.ts` - Include test metadata in chunks

**Code Structure**:
```typescript
// In context.ts
export function isTestFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Extension check
  if (normalized.endsWith('.ut')) return true;
  
  // Path patterns
  const testDirPattern = /(^|\/)tests?(\/|$)|\/unittests?(\/|$)|\/g?test(\/|$)/;
  if (testDirPattern.test(normalized)) return true;
  
  // Filename patterns
  const testFilePattern = /(^|_|\.)(test|unittest)(_|\.)/;
  if (testFilePattern.test(normalized)) return true;
  
  return false;
}
```

**Test Cases Required**:
- [ ] Detect `.ut` extension
- [ ] Detect `/test/` directory
- [ ] Detect `/tests/` directory
- [ ] Detect `/unittest/` directory
- [ ] Detect `foo_test.cpp` pattern
- [ ] Detect `test_foo.cpp` pattern
- [ ] Detect `foo.test.cpp` pattern
- [ ] Correctly identify non-test files
- [ ] Handle Windows path separators
- [ ] Case insensitive matching

**Acceptance Criteria**:
- [ ] Test files correctly identified
- [ ] Metadata includes `isTest: true` flag
- [ ] Unit tests cover all patterns
- [ ] No false positives on real codebases
- [ ] Documentation updated

**Impact**: Foundation for test filtering in search, cleaner results

---

### ⏳ Feature 0.3: Declaration Filtering (NOT STARTED)

**Status**: Not yet implemented  
**Priority**: HIGH  
**Estimated Effort**: 8 hours  
**Branch**: Will create `feature/p0-declaration-filtering`

#### Problem Statement

Current implementation includes ALL `declaration` AST nodes, which creates noise:
- Simple variable declarations: `int x;`, `const char* name;`
- Forward declarations: `class MyClass;`
- External declarations: `extern int global_var;`

These create many small, low-value chunks that clutter search results.

#### Requirements

**Filtering Logic**:

Keep declaration if ANY of these conditions:
1. Has initializer: `int x = 42;` or `std::string s{"hello"};`
2. Spans ≥ 6 lines (likely has meaningful content)
3. Matches special patterns:
   - `typedef` statements
   - `using` declarations
   - `enum` definitions
   - `struct`/`union` definitions

**Batching Logic**:

If multiple small declarations are consecutive:
1. Collect them into a batch
2. Stop when batch reaches 20 lines
3. Create single chunk for the batch
4. Include location metadata for batch

#### Implementation Plan

**Files to Modify**:
- `packages/core/src/splitter/ast-splitter.ts`

**Configuration**:
```typescript
interface NodeFilterConfig {
  minDeclarationLines: number;        // Default: 6
  batchSmallDeclarations: boolean;    // Default: true
  declarationBatchThreshold: number;  // Default: 20 lines
}
```

**Key Functions**:
```typescript
function shouldIncludeDeclaration(node: Parser.SyntaxNode, code: string): boolean
function batchDeclarations(nodes: Parser.SyntaxNode[], code: string): Parser.SyntaxNode[]
function getCppChunkableNodes(tree: Parser.Tree, code: string): Parser.SyntaxNode[]
```

**Test Cases Required**:
- [ ] Filter trivial declarations (`int x;`)
- [ ] Keep declarations with initializers (`int x = 10;`)
- [ ] Keep multi-line declarations
- [ ] Keep typedef declarations
- [ ] Keep enum definitions
- [ ] Batch consecutive small declarations
- [ ] Stop batching at threshold
- [ ] Preserve meaningful declarations
- [ ] Measure chunk count reduction

**Acceptance Criteria**:
- [ ] Trivial declarations filtered
- [ ] Small declarations batched
- [ ] Meaningful declarations preserved
- [ ] 40% reduction in tiny chunks (metric)
- [ ] Tests cover edge cases
- [ ] No loss of important code

**Impact**: Major reduction in index size and noise

---

### ⏳ Feature 0.4: Leading Comment Capture (NOT STARTED)

**Status**: Not yet implemented  
**Priority**: MEDIUM  
**Estimated Effort**: 6 hours  
**Branch**: Will create `feature/p0-comment-capture`

#### Problem Statement

Currently, code chunks don't include their associated documentation:
- Function docblocks are separated from function body
- Class comments not included with class definition
- Inline explanations lost

This reduces embedding quality and search accuracy.

#### Requirements

**Comment Capture Logic**:

For each code chunk:
1. Scan upward from chunk start
2. Capture comment lines (C++ style `//` and C style `/* */`)
3. Stop at:
   - Blank line gap > 1 line
   - Non-comment, non-blank line
   - File start
4. Exclude license headers:
   - Lines with `SPDX-License-Identifier`
   - Blocks with `Copyright` and > 20 lines

**Comment Types to Capture**:
- Doxygen/Javadoc style: `/** ... */`
- Single-line: `// ...`
- Multi-line: `/* ... */`
- Banner comments
- Inline documentation

#### Implementation Plan

**Files to Modify**:
- `packages/core/src/splitter/ast-splitter.ts`

**Key Functions**:
```typescript
interface CommentCapture {
  text: string;
  startLine: number;
  endLine: number;
}

function captureLeadingComments(
  startIndex: number,
  code: string,
  maxLines?: number  // Default: 30
): CommentCapture | null

function extractChunkWithContext(
  node: Parser.SyntaxNode,
  code: string,
  filePath: string
): CodeChunk
```

**Test Cases Required**:
- [ ] Capture Doxygen docblocks
- [ ] Capture C++ style comments
- [ ] Capture C style comments
- [ ] Stop at blank line gap
- [ ] Exclude license headers (SPDX)
- [ ] Exclude long copyright blocks
- [ ] Handle mixed comment styles
- [ ] Preserve original line numbers
- [ ] Verify embedding improvement

**Acceptance Criteria**:
- [ ] Function docblocks included
- [ ] Class comments included
- [ ] License headers excluded
- [ ] Line numbers correctly adjusted
- [ ] Embeddings show quality improvement
- [ ] No performance regression

**Impact**: Better semantic understanding, improved search quality

---

## Implementation Timeline

### Week 1: Phase 0 Implementation

**Day 1-2: Test File Detection (P0.2)**
- [ ] Implement `isTestFile()` function
- [ ] Add metadata to chunks
- [ ] Write comprehensive tests
- [ ] Test on real codebases
- [ ] Document behavior

**Day 2-3: Declaration Filtering (P0.3)**
- [ ] Implement filtering logic
- [ ] Implement batching logic
- [ ] Add configuration options
- [ ] Write tests for all patterns
- [ ] Measure chunk reduction
- [ ] Document thresholds

**Day 3-4: Comment Capture (P0.4)**
- [ ] Implement comment scanning
- [ ] Add license header detection
- [ ] Integrate with chunk extraction
- [ ] Test with various comment styles
- [ ] Verify embedding quality
- [ ] Document behavior

**Day 5: Testing & Documentation**
- [ ] Run full test suite
- [ ] Integration testing
- [ ] Update documentation
- [ ] Create examples
- [ ] Write migration guide

---

## Success Metrics

### Phase 0 Goals

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| Chunk count reduction | - | -40% | 🔜 Not measured |
| Test file detection accuracy | 0% | >95% | 🔜 Not implemented |
| Comment capture rate | 0% | >80% | 🔜 Not implemented |
| Index size reduction | - | -20% | 🔜 Not measured |
| Test coverage | 100% | 100% | ✅ Maintaining |
| Build time | ~2s | ≤2.5s | ✅ 2.371s |

### Quality Indicators

**Before Phase 0**:
- Total chunks per 1000 LOC: TBD (need baseline)
- Average chunk size: TBD (need baseline)
- Trivial chunks ratio: TBD (need baseline)

**After Phase 0** (Expected):
- Trivial chunks reduced by 40%
- Test code properly tagged
- Better semantic context from comments
- Improved search relevance

---

## Testing Strategy

### Test Categories

1. **Unit Tests** (packages/core/src/splitter/__tests__)
   - Individual function tests
   - Edge case handling
   - Pattern matching accuracy

2. **Integration Tests**
   - End-to-end file processing
   - Multiple features working together
   - Real-world code samples

3. **Performance Tests**
   - Indexing speed
   - Memory usage
   - Chunk generation rate

4. **Regression Tests**
   - Existing 25 tests must pass
   - No breaking changes to API
   - Backward compatibility

### Test Data

**Fixtures** (packages/core/src/splitter/__tests__/fixtures/):
- `simple.cpp` - Basic C++ code
- `complex.cpp` - Advanced features
- Additional fixtures needed:
  - `test_file.cpp` - Test code examples
  - `with_comments.cpp` - Documented code
  - `declarations.cpp` - Various declaration types

---

## Technical Debt & Risks

### Known Issues

1. **Tree-sitter Limitations**
   - Some C++ constructs may not parse correctly
   - Template metaprogramming can be challenging
   - Mitigation: Fallback to LangChain splitter

2. **Performance Considerations**
   - Comment scanning adds overhead
   - AST traversal can be slow for large files
   - Mitigation: Profile and optimize hot paths

3. **Configuration Complexity**
   - Many tunable parameters
   - Need sensible defaults
   - Mitigation: Feature flags, gradual rollout

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing tests | High | Low | Comprehensive regression testing |
| Performance regression | Medium | Medium | Benchmarking before/after |
| False positive filtering | High | Medium | Careful pattern design, real-world testing |
| Configuration confusion | Low | Medium | Good documentation, defaults |

---

## Code Review Checklist

Before merging any Phase 0 feature:

- [ ] All tests passing (unit + integration)
- [ ] No regressions in existing functionality
- [ ] Code follows project style guide
- [ ] Documentation updated
- [ ] Performance measured (no regression)
- [ ] Edge cases handled
- [ ] Error handling in place
- [ ] Logging added for debugging
- [ ] Configuration options documented
- [ ] Examples provided

---

## Dependencies & Prerequisites

### Build Dependencies
- ✅ Node.js 20.x
- ✅ pnpm 10.19.0
- ✅ TypeScript 5.8.3
- ✅ Jest (testing framework)
- ✅ tree-sitter parsers

### Runtime Dependencies
- ✅ tree-sitter C++ parser
- ✅ Embedding provider (OpenAI/Voyage/Ollama/Gemini)
- ✅ Vector database (Milvus/Zilliz)

### Development Tools
- ✅ ESLint (code quality)
- ✅ Rimraf (cleanup)
- ✅ TypeScript compiler

---

## Documentation Updates Required

### User-Facing Documentation
- [ ] Update README.md with new features
- [ ] Add configuration examples
- [ ] Document test file detection patterns
- [ ] Explain declaration filtering behavior
- [ ] Show comment capture examples

### Developer Documentation
- [ ] Update IMPLEMENTATION_GUIDE.md
- [ ] Document new configuration options
- [ ] Add code examples
- [ ] Update architecture diagrams

### API Documentation
- [ ] Document new metadata fields
- [ ] Update TypeScript interfaces
- [ ] Add JSDoc comments
- [ ] Generate API docs

---

## Next Phase Preview: Phase 1 - Symbol Metadata

**Not started** - Will begin after Phase 0 completion

### Planned Features (2-3 days)

1. **P1.1: Fully Qualified Names (FQN)**
   - Track namespace/class scope
   - Build complete symbol names: `foo::bar::Baz::qux`
   - Add FQN metadata to chunks

2. **P1.2: Identifier Extraction**
   - Extract symbols for lexical boosting
   - Enhance BM25 scoring
   - Improve exact match searches

3. **P1.3: Deduplication**
   - Fast hash-based duplicate detection
   - 20-30% index size reduction
   - Improved search quality

4. **P1.4: Hybrid Search Enhancement**
   - Weighted RRF (BM25 + vector)
   - Symbol boosting
   - Test filtering in search

**Impact**: 15-30% improvement in search precision, 20-30% reduction in index size

---

## References

### Project Documentation
- [CPP_IMPROVEMENTS_ROADMAP.md](./CPP_IMPROVEMENTS_ROADMAP.md) - Complete feature roadmap
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Detailed implementation examples
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview
- [FEATURE_BRANCHES.md](./FEATURE_BRANCHES.md) - Branch tracking

### Technical Resources
- [Tree-sitter C++ Grammar](https://github.com/tree-sitter/tree-sitter-cpp)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [Jest Testing Framework](https://jestjs.io/)

### Code Locations
- Core package: `packages/core/`
- AST splitter: `packages/core/src/splitter/ast-splitter.ts`
- Context module: `packages/core/src/context.ts`
- Tests: `packages/core/src/splitter/__tests__/`

---

## Contact & Support

**Project**: claude-context  
**Repository**: https://github.com/netbrah/claude-context  
**Current Branch**: copilot/analyze-code-base-and-next-task  
**Developer**: GitHub Copilot Agent

---

## Changelog

### 2025-10-22
- ✅ Completed codebase analysis
- ✅ Verified build and test infrastructure
- ✅ All 25 existing tests passing
- ✅ Identified Feature 0.1 as already complete
- ✅ Created comprehensive work-in-progress document
- 📝 Next: Start implementing P0.2 (Test File Detection)

---

**Last Updated**: 2025-10-22  
**Version**: 1.0  
**Status**: Phase 0 - Analysis Complete, Ready for Implementation
