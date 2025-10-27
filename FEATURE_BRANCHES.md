# Feature Branch Tracking

This document tracks the status of all feature branches for the C/C++ improvements project.

## Branch Naming Convention

- **Phase 0 (Quick Wins):** `feature/p0-<feature-name>`
- **Phase 1 (Symbol Metadata):** `feature/p1-<feature-name>`
- **Phase 2 (Structural Context):** `feature/p2-<feature-name>`
- **Phase 3 (Semantic Enrichment):** `feature/p3-<feature-name>`
- **Phase 4 (Advanced):** `feature/p4-<feature-name>`

## Phase 0: Quick Wins

### ✅ P0.1: File Extension Support
- **Branch:** `feature/p0-file-extensions`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None
- **Estimated Effort:** 2 hours
- **Description:** Add support for `.cc` and `.ut` file extensions

**Tasks:**
- [ ] Update language mapping in `context.ts`
- [ ] Add unit tests for new extensions
- [ ] Update documentation
- [ ] Submit PR

---

### ✅ P0.2: Test File Detection
- **Branch:** `feature/p0-test-detection`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P0.1 (optional)
- **Estimated Effort:** 4 hours
- **Description:** Implement heuristics to detect test files

**Tasks:**
- [ ] Implement `isTestFile()` function
- [ ] Add `isTest` metadata to chunks
- [ ] Create comprehensive test suite
- [ ] Test against real codebases
- [ ] Submit PR

---

### ✅ P0.3: Declaration Filtering
- **Branch:** `feature/p0-declaration-filtering`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None
- **Estimated Effort:** 8 hours
- **Description:** Filter trivial declarations and batch small ones

**Tasks:**
- [ ] Implement `shouldIncludeDeclaration()` logic
- [ ] Implement declaration batching
- [ ] Add configuration options
- [ ] Create test cases with various declaration types
- [ ] Measure reduction in chunk count
- [ ] Submit PR

---

### ✅ P0.4: Leading Comment Capture
- **Branch:** `feature/p0-comment-capture`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None
- **Estimated Effort:** 6 hours
- **Description:** Capture and include leading comments with code chunks

**Tasks:**
- [ ] Implement `captureLeadingComments()` function
- [ ] Add license header detection and exclusion
- [ ] Integrate with chunk extraction
- [ ] Test with various comment styles
- [ ] Verify embedding quality improvement
- [ ] Submit PR

---

## Phase 1: Symbol Metadata Enhancement

### ✅ P1.1: Fully Qualified Names (FQN)
- **Branch:** `feature/p1-fqn-extraction`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None
- **Estimated Effort:** 12 hours
- **Description:** Track scope and build FQNs for all symbols

**Tasks:**
- [ ] Implement `ScopeStack` class
- [ ] Add scope tracking during AST traversal
- [ ] Extract identifier names from various node types
- [ ] Build FQN strings
- [ ] Add synthetic header with FQN
- [ ] Store in metadata
- [ ] Create extensive test suite
- [ ] Submit PR

---

### ✅ P1.2: Identifier Extraction and Boosting
- **Branch:** `feature/p1-identifier-boost`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P1.1 (recommended)
- **Estimated Effort:** 8 hours
- **Description:** Extract identifiers for lexical search boosting

**Tasks:**
- [ ] Implement identifier extraction from AST
- [ ] Filter keywords and common terms
- [ ] Deduplicate identifiers
- [ ] Append boost string to chunks
- [ ] Test lexical search improvement
- [ ] Submit PR

---

### ✅ P1.3: Duplicate Detection and Suppression
- **Branch:** `feature/p1-deduplication`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None
- **Estimated Effort:** 16 hours
- **Description:** Detect and mark duplicate chunks

**Tasks:**
- [ ] Create `hasher.ts` module
- [ ] Create `registry.ts` module
- [ ] Implement exact matching
- [ ] Implement fuzzy matching
- [ ] Integrate with indexing pipeline
- [ ] Add duplicate metadata
- [ ] Measure index size reduction
- [ ] Create configuration options
- [ ] Submit PR

---

### ✅ P1.4: Hybrid Search Enhancement
- **Branch:** `feature/p1-hybrid-search`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P1.2 (for identifier boost)
- **Estimated Effort:** 10 hours
- **Description:** Enhance search with weighted RRF and boosting

**Tasks:**
- [ ] Implement weighted RRF
- [ ] Add symbol exact match boost
- [ ] Add test filtering logic
- [ ] Configure default weights
- [ ] Test search quality improvement
- [ ] Submit PR

---

## Phase 2: Structural Context

### ✅ P2.1: Header-Implementation Linkage
- **Branch:** `feature/p2-header-impl-link`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P1.1 (for signature matching)
- **Estimated Effort:** 20 hours
- **Description:** Link header declarations to implementation definitions

**Tasks:**
- [ ] Create header-impl pairing heuristics
- [ ] Implement signature matching
- [ ] Add linkage metadata
- [ ] Create linker module
- [ ] Test with real codebases
- [ ] Submit PR

---

### ✅ P2.2: Adaptive Chunk Sizing
- **Branch:** `feature/p2-adaptive-chunking`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P0.3 (declaration filtering)
- **Estimated Effort:** 12 hours
- **Description:** Adjust chunk size based on codebase characteristics

**Tasks:**
- [ ] Implement stats collection
- [ ] Calculate percentiles
- [ ] Adjust chunk size dynamically
- [ ] Handle giant functions
- [ ] Test with various codebases
- [ ] Submit PR

---

### ✅ P2.3: Multi-Level Chunk Representations
- **Branch:** `feature/p2-multi-level-chunks`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P1.1 (for scope tracking)
- **Estimated Effort:** 16 hours
- **Description:** Store chunks at multiple granularities

**Tasks:**
- [ ] Implement multi-level chunking
- [ ] Add granularity metadata
- [ ] Update search to use appropriate level
- [ ] Test recall improvement
- [ ] Submit PR

---

### ✅ P2.4: Symbol Frequency Downsampling
- **Branch:** `feature/p2-symbol-frequency`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P1.1, P1.2
- **Estimated Effort:** 10 hours
- **Description:** Penalize overly common symbols

**Tasks:**
- [ ] Compute symbol frequency during indexing
- [ ] Implement penalty calculation
- [ ] Apply during re-ranking
- [ ] Test with common utilities
- [ ] Submit PR

---

## Phase 3: Semantic Enrichment

### ✅ P3.1: On-Demand clangd Integration
- **Branch:** `feature/p3-clangd-integration`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** Requires compile_commands.json
- **Estimated Effort:** 40 hours
- **Description:** Integrate clangd for precise semantic information

**Tasks:**
- [ ] Create clangd client module
- [ ] Implement LSP communication
- [ ] Extract type information
- [ ] Extract template parameters
- [ ] Extract qualifiers
- [ ] Implement on-demand enrichment at query time
- [ ] Test performance impact
- [ ] Submit PR

---

### ✅ P3.2: Template and Type Signature Boost
- **Branch:** `feature/p3-template-boost`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** P3.1
- **Estimated Effort:** 8 hours
- **Description:** Boost queries matching templates and types

**Tasks:**
- [ ] Index template signatures
- [ ] Implement template query matching
- [ ] Test with template-heavy code
- [ ] Submit PR

---

### ✅ P3.3: Macro Influence Tracking
- **Branch:** `feature/p3-macro-tracking`
- **Status:** Not Started
- **Assignee:** TBD
- **PR:** N/A
- **Dependencies:** None (can use Tree-sitter)
- **Estimated Effort:** 12 hours
- **Description:** Track macros affecting code regions

**Tasks:**
- [ ] Detect macro usage
- [ ] Store macro metadata
- [ ] Enable macro-based search
- [ ] Test with macro-heavy code
- [ ] Submit PR

---

## Phase 4: Advanced Features (Future)

### ✅ P4.1: Lightweight Call Graph
- **Branch:** `feature/p4-call-graph`
- **Status:** Not Started
- **Priority:** Low
- **Description:** Build call graph for query expansion

---

### ✅ P4.2: Temporal Index Layers
- **Branch:** `feature/p4-temporal-index`
- **Status:** Not Started
- **Priority:** Low
- **Description:** Weight recent changes higher

---

### ✅ P4.3: Repetition Clustering
- **Branch:** `feature/p4-clustering`
- **Status:** Not Started
- **Priority:** Low
- **Description:** Cluster near-duplicate functions

---

## Branch Management Guidelines

### Creating a Feature Branch

```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/p0-file-extensions

# Make changes and commit
git add .
git commit -m "Add support for .cc and .ut extensions"

# Push to remote
git push -u origin feature/p0-file-extensions
```

### Opening a Pull Request

1. Ensure all tests pass
2. Update documentation
3. Add metrics/benchmarks if applicable
4. Fill out PR template with:
   - Description of changes
   - Related issue/feature number
   - Test results
   - Performance impact
   - Screenshots (if UI changes)

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests are comprehensive
- [ ] No regressions in existing tests
- [ ] Documentation updated
- [ ] Performance measured
- [ ] Security reviewed
- [ ] Breaking changes documented

### Merging Strategy

1. **Squash and merge** for small features (1-3 commits)
2. **Rebase and merge** for larger features with clean history
3. Delete branch after merge
4. Update this tracking document

---

## Progress Dashboard

### Overall Progress

- **Phase 0:** 0/4 features complete (0%)
- **Phase 1:** 0/4 features complete (0%)
- **Phase 2:** 0/4 features complete (0%)
- **Phase 3:** 0/3 features complete (0%)
- **Phase 4:** 0/3 features complete (0%)

### Total: 0/18 features complete (0%)

---

## Dependencies Graph

```
Phase 0 (All independent)
├── P0.1: File Extensions
├── P0.2: Test Detection
├── P0.3: Declaration Filtering
└── P0.4: Comment Capture

Phase 1
├── P1.1: FQN Extraction (independent)
├── P1.2: Identifier Boost (→ P1.1 recommended)
├── P1.3: Deduplication (independent)
└── P1.4: Hybrid Search (→ P1.2)

Phase 2
├── P2.1: Header-Impl Link (→ P1.1)
├── P2.2: Adaptive Chunking (→ P0.3)
├── P2.3: Multi-Level Chunks (→ P1.1)
└── P2.4: Symbol Frequency (→ P1.1, P1.2)

Phase 3
├── P3.1: clangd Integration (independent, heavy)
├── P3.2: Template Boost (→ P3.1)
└── P3.3: Macro Tracking (independent)

Phase 4
├── P4.1: Call Graph
├── P4.2: Temporal Index
└── P4.3: Clustering
```

---

## Recommended Implementation Order

### Sprint 1 (Week 1)
1. P0.1: File Extensions (Day 1)
2. P0.2: Test Detection (Day 1-2)
3. P0.3: Declaration Filtering (Day 2-3)
4. P0.4: Comment Capture (Day 3-4)
5. Testing & Documentation (Day 5)

### Sprint 2 (Week 2)
1. P1.1: FQN Extraction (Day 1-2)
2. P1.2: Identifier Boost (Day 3)
3. P1.3: Deduplication (Day 4-5)

### Sprint 3 (Week 3)
1. P1.4: Hybrid Search (Day 1-2)
2. P2.2: Adaptive Chunking (Day 3-4)
3. Integration Testing (Day 5)

### Sprint 4 (Week 4)
1. P2.1: Header-Impl Link (Day 1-3)
2. P2.3: Multi-Level Chunks (Day 4-5)

### Sprint 5 (Week 5)
1. P2.4: Symbol Frequency (Day 1-2)
2. P3.3: Macro Tracking (Day 3-4)
3. Comprehensive testing (Day 5)

### Future Sprints
- P3.1: clangd Integration (2-3 weeks)
- P3.2: Template Boost (1 week)
- Phase 4 features (as needed)

---

## Metrics Tracking

### Per-Feature Metrics

Track these for each feature:

- **Development Time:** Actual vs. estimated
- **Test Coverage:** Line coverage %
- **Performance Impact:** Indexing time change
- **Quality Impact:** Measured improvement in MRR or other metrics
- **Index Size Impact:** Change in storage requirements

### Example Entry

```markdown
#### P0.1: File Extensions
- Estimated: 2 hours → Actual: 1.5 hours
- Test Coverage: 95%
- Performance Impact: +0.1% (negligible)
- Quality Impact: N/A (prerequisite feature)
- Index Size Impact: 0%
```

---

## Communication

### Daily Updates
Post progress updates in team channel:
```
🚀 Daily Update - [Date]
Branch: feature/p0-file-extensions
Status: In Progress (70%)
Completed: ✅ Language mapping, ✅ Unit tests
Next: Documentation update
Blockers: None
```

### Weekly Summary
At end of each sprint, summarize:
- Features completed
- Metrics achieved
- Lessons learned
- Adjustments to plan

---

Last Updated: 2025-10-16
