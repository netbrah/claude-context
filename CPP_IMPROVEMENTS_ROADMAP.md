# C/C++ Code Indexing and Retrieval - Improvement Roadmap

## Overview
This document outlines a comprehensive roadmap for improving C/C++ code indexing and retrieval capabilities in large-scale codebases. The improvements are organized into phases with clear priorities and measurable outcomes.

---

## Current State Analysis

### Existing Capabilities
- Extension mapping for `.c`, `.cpp`, `.h`, `.hpp` files
- Tree-sitter based structural splitting (function definitions, class specifiers, namespace definitions, declarations)
- Dense embeddings with optional BM25+vector hybrid search
- Basic metadata (start/end lines, file extension, language)
- Post-pass size trimming for large chunks

### Pain Points
- Duplicate boilerplate from header files repeated across translation units
- Over-fragmentation from trivial declarations
- Missing symbol metadata for better re-ranking
- No test awareness or filtering (`.ut` files not differentiated)
- Lack of fully qualified names (FQN) for symbols
- Preprocessor/macros obscuring intent
- No header-to-implementation linkage

---

## Phase 0: Quick Wins (P0 - High ROI, Low Effort)
**Estimated Duration:** 1-2 days  
**Branch Prefix:** `feature/p0-`

### Feature 0.1: File Extension Support
**Branch:** `feature/p0-file-extensions`
- Add `.cc` extension mapping to C++
- Add `.ut` extension mapping to C++ (test files)
- Add `.cxx`, `.hxx`, `.hh` if not already present

**Files to Modify:**
- `packages/core/src/context.ts` (or equivalent language detection module)

**Acceptance Criteria:**
- [ ] `.cc` files are recognized as C++
- [ ] `.ut` files are recognized as C++ test files
- [ ] Extension mapping is tested and verified

---

### Feature 0.2: Test File Detection
**Branch:** `feature/p0-test-detection`
- Implement `isTestFile()` function with heuristics
- Mark chunks from test files with `isTest: true` metadata
- Detection patterns:
  - Files ending in `.ut`
  - Paths containing `/test/`, `/tests/`, `/unittest/`, `/unittests/`
  - Files matching `*_test.{c,cc,cpp,cxx,ut}`
  - Files matching `*.test.{c,cc,cpp,cxx,ut}`

**Files to Modify:**
- `packages/core/src/context.ts` or similar

**Acceptance Criteria:**
- [ ] Test files are correctly identified
- [ ] Metadata includes `isTest` flag
- [ ] Unit tests verify detection patterns

---

### Feature 0.3: Declaration Filtering
**Branch:** `feature/p0-declaration-filtering`
- Refine AST node selection to filter noisy declarations
- Keep: `function_definition`, `class_specifier`, `namespace_definition`
- Conditionally include `declaration` only if:
  - Contains an initializer, OR
  - Spans ≥ 6 lines, OR
  - Matches typedef/using/enum patterns
- Batch consecutive small declarations into one chunk

**Files to Modify:**
- `packages/core/src/splitter/ast-splitter.ts`

**Acceptance Criteria:**
- [ ] Trivial declarations are filtered out
- [ ] Small declarations are batched together
- [ ] Meaningful declarations are preserved
- [ ] Reduction in tiny chunk count by ~40%

---

### Feature 0.4: Leading Comment Capture
**Branch:** `feature/p0-comment-capture`
- Scan upward from each code chunk to capture leading comments
- Include docblocks and function/class comments
- Exclude license headers (>30 lines or SPDX patterns)
- Stop at blank line gap > 1 line

**Files to Modify:**
- `packages/core/src/splitter/ast-splitter.ts`

**Acceptance Criteria:**
- [ ] Function docblocks are included with function chunks
- [ ] Class comments are included with class chunks
- [ ] License headers are excluded
- [ ] Embeddings improve from comment context

---

## Phase 1: Symbol Metadata Enhancement (P1 - High ROI, Medium Effort)
**Estimated Duration:** 2-3 days  
**Branch Prefix:** `feature/p1-`

### Feature 1.1: Fully Qualified Names (FQN)
**Branch:** `feature/p1-fqn-extraction`
- Maintain scope stack during AST traversal (namespaces, classes)
- Build FQN for symbols (e.g., `foo::bar::Baz::qux`)
- Add synthetic header to chunks: `// [symbol: foo::bar::Baz::qux | kind: method]`
- Store FQN in metadata

**Files to Modify:**
- `packages/core/src/splitter/ast-splitter.ts`

**Acceptance Criteria:**
- [ ] Namespace scope tracking implemented
- [ ] Class scope tracking implemented
- [ ] FQN correctly computed for nested symbols
- [ ] Metadata includes `symbolName` and `fullyQualifiedName`
- [ ] Symbol kind stored (function, method, class, namespace, etc.)

---

### Feature 1.2: Identifier Extraction and Boosting
**Branch:** `feature/p1-identifier-boost`
- Extract identifiers from chunks (function names, class names, types, macros)
- Deduplicate identifiers
- Append to lexical boost string: `// identifiers: qux Baz foo bar HASH_TABLE`
- Enhance BM25 scoring without polluting original code

**Files to Modify:**
- `packages/core/src/splitter/ast-splitter.ts`

**Acceptance Criteria:**
- [ ] Identifiers extracted from code chunks
- [ ] Boost string appended to chunk content
- [ ] Lexical search improved for exact symbol matches
- [ ] No impact on original code readability

---

### Feature 1.3: Duplicate Detection and Suppression
**Branch:** `feature/p1-deduplication`
- Implement fast hash computation (xxhash64 or farmhash)
- Track seen chunk hashes during indexing
- Mark duplicate chunks (common in header includes)
- Store duplicate metadata (`isDuplicate`, `canonicalChunkId`, `dupCount`)
- Option to exclude duplicates from default search

**Files to Create:**
- `packages/core/src/dedup/hasher.ts`
- `packages/core/src/dedup/registry.ts`

**Files to Modify:**
- Indexing pipeline to use deduplication

**Acceptance Criteria:**
- [ ] Fast hashing implemented
- [ ] Duplicate detection working
- [ ] Index size reduced by 15-30%
- [ ] Search quality improved (less noise)
- [ ] Metrics tracked: duplicate ratio

---

### Feature 1.4: Hybrid Search Enhancement
**Branch:** `feature/p1-hybrid-search`
- Enable hybrid mode (BM25 + dense vector)
- Weighted RRF (Reciprocal Rank Fusion): dense=0.55, sparse=0.45
- Symbol exact match boost: subtract 5 from rank position
- Test filtering: add +10 penalty to test chunks unless query contains test keywords

**Files to Modify:**
- Search/ranking module

**Acceptance Criteria:**
- [ ] Hybrid mode enabled by default for C/C++
- [ ] Weighted RRF implemented
- [ ] Symbol exact match provides visible boost
- [ ] Test queries correctly surface test code

---

## Phase 2: Structural Context (P2 - Medium-High ROI, Medium Effort)
**Estimated Duration:** 3-5 days  
**Branch Prefix:** `feature/p2-`

### Feature 2.1: Header-Implementation Linkage
**Branch:** `feature/p2-header-impl-link`
- Heuristic pairing: `foo.cpp` → `foo.h`, `foo.hpp`, `include/**/foo.hpp`
- Match function signatures between header and implementation
- Store linkage metadata: `declaredIn`, `definedIn`, `hasInlineDefinition`
- Enable cross-navigation queries

**Files to Create:**
- `packages/core/src/linker/header-impl-linker.ts`

**Acceptance Criteria:**
- [ ] Header-impl pairs detected
- [ ] Function signature matching implemented
- [ ] Metadata includes linkage information
- [ ] "Where is X defined?" queries work

---

### Feature 2.2: Adaptive Chunk Sizing
**Branch:** `feature/p2-adaptive-chunking`
- Compute distribution stats after sampling files
- Calculate p50, p75, p90 percentiles for chunk sizes
- Adjust `chunkSize` based on codebase characteristics
- Handle giant functions without mid-scope splits

**Files to Modify:**
- Chunking configuration
- AST splitter

**Acceptance Criteria:**
- [ ] Stats computed on sample
- [ ] Chunk size adapts to codebase
- [ ] Large functions handled appropriately
- [ ] Metrics: chunk size distribution

---

### Feature 2.3: Multi-Level Chunk Representations
**Branch:** `feature/p2-multi-level-chunks`
- Store both fine-grained (function) and coarse (class/namespace) chunks
- Add `granularity` field to metadata
- Query-time selection based on query type
- Broad queries return coarse units, specific queries return fine units

**Files to Modify:**
- Chunking pipeline
- Search query handler

**Acceptance Criteria:**
- [ ] Multiple granularity levels stored
- [ ] Query router selects appropriate granularity
- [ ] Recall improved for broad queries

---

### Feature 2.4: Symbol Frequency Downsampling
**Branch:** `feature/p2-symbol-frequency`
- Compute global symbol frequency during indexing
- Apply penalty to over-common chunks (logging wrappers, common utilities)
- Re-ranking formula: `finalScore /= (1 + log(1 + globalOccurrence))`

**Acceptance Criteria:**
- [ ] Symbol frequency computed
- [ ] Penalty applied during re-ranking
- [ ] Common boilerplate de-emphasized

---

## Phase 3: Semantic Enrichment (P3 - High Value, High Effort)
**Estimated Duration:** 1-2 weeks  
**Branch Prefix:** `feature/p3-`

### Feature 3.1: On-Demand clangd Integration
**Branch:** `feature/p3-clangd-integration`
- Lazy clangd invocation for top-K results
- Extract precise type information, template parameters
- Enrich with `inline`, `constexpr`, `virtual`, `override` qualifiers
- Requires `compile_commands.json`

**Files to Create:**
- `packages/core/src/enrichment/clangd-client.ts`
- `packages/core/src/enrichment/symbol-enricher.ts`

**Acceptance Criteria:**
- [ ] clangd integration working
- [ ] Type signatures extracted
- [ ] Qualifier metadata stored
- [ ] Performance acceptable (on-demand only)

---

### Feature 3.2: Template and Type Signature Boost
**Branch:** `feature/p3-template-boost`
- Extract template parameters from enriched metadata
- Boost queries containing template keywords
- Match type signatures in queries

**Acceptance Criteria:**
- [ ] Template signatures indexed
- [ ] Type-based queries improved

---

### Feature 3.3: Macro Influence Tracking
**Branch:** `feature/p3-macro-tracking`
- Identify macros affecting code chunks
- Store macro names in metadata
- Enable macro-based queries

**Acceptance Criteria:**
- [ ] Macro detection implemented
- [ ] Macro metadata stored
- [ ] Macro-heavy code findable

---

## Phase 4: Advanced Features (P4 - Future/Optional)
**Estimated Duration:** TBD  
**Branch Prefix:** `feature/p4-`

### Feature 4.1: Lightweight Call Graph
**Branch:** `feature/p4-call-graph`
- Build caller→callee adjacency
- Enable "who calls X?" queries
- Query expansion with call graph

---

### Feature 4.2: Temporal Index Layers
**Branch:** `feature/p4-temporal-index`
- Integrate git history
- Weight recent changes higher
- "What changed recently?" queries

---

### Feature 4.3: Repetition Clustering
**Branch:** `feature/p4-clustering`
- Cluster near-duplicate functions
- Keep centroid representation
- Micro-optimize storage

---

## Success Metrics

### KPIs by Phase

| Metric | Baseline | After P0-P1 | After P2 | After P3 |
|--------|----------|-------------|----------|----------|
| Mean Reciprocal Rank (MRR@10) | - | +15% | +30% | +40% |
| Index Size Reduction | 0% | 20-30% | 30-40% | 35-45% |
| Query Latency (ms) | L | L+5% | L+10% | L+15% |
| Duplicate Chunk Ratio | High | <5% | <2% | <1% |
| Noise Rate (tiny chunks) | High | -40% | -60% | -70% |

---

## Implementation Guidelines

### Branching Strategy
1. Create feature branch from `main`: `git checkout -b feature/p0-file-extensions`
2. Implement feature with tests
3. Run linting and tests
4. Create PR with clear description
5. Merge after review
6. Move to next feature

### Testing Requirements
- Unit tests for each feature
- Integration tests for pipeline changes
- Performance benchmarks for indexing changes
- Accuracy tests for retrieval improvements

### Code Review Checklist
- [ ] Tests passing
- [ ] No regressions in existing functionality
- [ ] Documentation updated
- [ ] Performance impact measured
- [ ] Security reviewed (no vulnerabilities introduced)

---

## Query-Time Heuristics

### Pattern-Based Enhancements

| Query Pattern | Action |
|---------------|--------|
| Contains `::` | Boost FQN exact match 2× |
| Contains `ASSERT_`/`EXPECT_` | Allow `isTest=true` chunks |
| Single uppercase token | Expand with `#define TOKEN` pattern |
| Contains "where"/"who calls" | Use call graph (Phase 4) |
| Contains template keywords | Boost template metadata matches |

---

## Configuration Management

### Feature Flags
Enable gradual rollout of features:
```json
{
  "cpp": {
    "enableTestDetection": true,
    "enableDeduplication": true,
    "enableFQN": true,
    "enableHybridSearch": true,
    "enableHeaderImplLink": true,
    "enableClangdEnrichment": false,
    "dedupThreshold": 0.95,
    "testPenalty": 10,
    "symbolBoost": 2.0
  }
}
```

---

## Performance Considerations

### Scalability Practices
- **Memory Management**: Stream insertion, batch processing
- **Parallelism**: Partition files across workers
- **Incremental Updates**: File hash tracking (SHA-1)
- **Monitoring**: Emit metrics (chunk distribution, duplicate ratio, indexing time)

### Cost Optimization
- Tree-sitter only (fast, lightweight) for phases 0-2
- On-demand clangd only for top results (phase 3)
- Caching of enriched metadata

---

## Next Steps

1. **Review and Prioritize**: Review this roadmap with stakeholders
2. **Set Up Testing**: Create benchmark suite for measuring improvements
3. **Start Phase 0**: Begin with quick wins (file extensions, test detection)
4. **Iterate**: Measure impact of each phase before moving to next
5. **Gather Feedback**: Collect user feedback on retrieval quality

---

## References

- Tree-sitter C/C++ grammar documentation
- clangd Language Server Protocol documentation
- BM25 and dense embedding hybrid search papers
- Code chunking best practices for LLMs

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-16  
**Maintainer:** Development Team
