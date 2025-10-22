# C/C++ Improvements - Phase Dependencies and Flow

This document provides visual representations of the project structure, dependencies, and implementation flow.

## 📊 Phase Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    C/C++ INDEXING IMPROVEMENTS                       │
│                         Project Overview                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 0: QUICK WINS (1-2 days)                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│ │ P0.1: File   │  │ P0.2: Test   │  │ P0.3: Decl   │  │ P0.4:    ││
│ │ Extensions   │  │ Detection    │  │ Filtering    │  │ Comments ││
│ │ (.cc, .ut)   │  │ (heuristics) │  │ (reduce noise)│  │ Capture  ││
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│ Independent ✓     Independent ✓     Independent ✓     Independent ✓│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SYMBOL METADATA (2-3 days)                                 │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│ │ P1.1: FQN    │  │ P1.2: ID     │  │ P1.3: Dedup  │  │ P1.4:    ││
│ │ Extraction   │◄─│ Boosting     │  │ Detection    │◄─│ Hybrid   ││
│ │ (scope track)│  │ (lexical++)  │  │ (hash check) │  │ Search   ││
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│ Independent ✓     Depends: P1.1     Independent ✓     Depends: P1.2│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: STRUCTURAL CONTEXT (3-5 days)                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│ │ P2.1: Header │  │ P2.2: Adapt  │  │ P2.3: Multi  │  │ P2.4:    ││
│ │ Impl Link    │  │ Chunking     │  │ Level Chunks │  │ Symbol   ││
│ │ (nav support)│  │ (size adjust)│  │ (granularity)│  │ Frequency││
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│ Depends: P1.1     Depends: P0.3     Depends: P1.1     Dep: P1.1,P1.2│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: SEMANTIC ENRICHMENT (1-2 weeks)                            │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│ │ P3.1: clangd │  │ P3.2: Tmpl   │  │ P3.3: Macro  │              │
│ │ Integration  │◄─│ Boost        │  │ Tracking     │              │
│ │ (LSP, types) │  │ (type match) │  │ (preproc)    │              │
│ └──────────────┘  └──────────────┘  └──────────────┘              │
│ Independent ✓     Depends: P3.1     Independent ✓                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: ADVANCED FEATURES (Future)                                 │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│ │ P4.1: Call   │  │ P4.2: Temp   │  │ P4.3: Cluster│              │
│ │ Graph        │  │ Index        │  │ (near-dup)   │              │
│ └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘

Legend: ◄─ = "depends on"  ✓ = "independent"
```

---

## 🔄 Dependency Graph (Detailed)

```
                              START
                                │
                    ┌───────────┴───────────┐
                    │                       │
                 PHASE 0                 PHASE 0
            (All Independent)        (All Independent)
                    │                       │
        ┌───────────┼───────────┐          │
        │           │           │          │
     P0.1        P0.2        P0.3       P0.4
      │           │           │          │
      │           │           │          │
      │           │           └──────────┼─────┐
      │           │                      │     │
      │           │                      │     │
      └───────────┴──────────────────────┴─────┤
                                               │
                                          PHASE 1
                                               │
                    ┌──────────────────────────┼──────────────┐
                    │                          │              │
                  P1.1 ◄─┐                  P1.3            P1.2
                    │    │                     │              │
                    │    │                     │              │
                    │    └─────────────────────┴──────────► P1.4
                    │                                         │
                    │                                         │
                    └─────────────────────────────────────────┤
                                                              │
                                                         PHASE 2
                                                              │
                    ┌─────────────────────────────────────────┤
                    │                 │                       │
                  P2.1              P2.2                   P2.3,P2.4
                    │                 │                       │
                (from P1.1)       (from P0.3)           (from P1.1,P1.2)
                    │                 │                       │
                    └─────────────────┴───────────────────────┤
                                                              │
                                                         PHASE 3
                                                              │
                    ┌─────────────────────────────────────────┤
                    │                                         │
                  P3.1 ────────────► P3.2                  P3.3
                    │                                         │
              (Independent)                            (Independent)
                    │                                         │
                    └─────────────────────────────────────────┤
                                                              │
                                                         PHASE 4
                                                              │
                                                           (Future)
```

---

## 🎯 Critical Path Analysis

### Critical Path 1: Core Search Improvements
```
P0.1 (Extensions) ──► P0.2 (Tests) ──► P1.1 (FQN) ──► P1.2 (IDs) ──► P1.4 (Hybrid)
    2 hours              4 hours         12 hours       8 hours        10 hours
                                                                    
Total: ~36 hours (4.5 days) for basic search improvements
```

### Critical Path 2: Noise Reduction
```
P0.3 (Decl Filter) ──► P1.3 (Dedup) ──► P2.2 (Adaptive)
    8 hours               16 hours         12 hours

Total: ~36 hours (4.5 days) for noise reduction
```

### Critical Path 3: Semantic Enhancement
```
P1.1 (FQN) ──► P2.1 (Header-Impl) ──► P3.1 (clangd) ──► P3.2 (Templates)
   12 hours       20 hours              40 hours          8 hours

Total: ~80 hours (10 days) for semantic features
```

---

## 📅 Timeline Visualization

```
Week 1: Phase 0 - Foundation
┌───────┬───────┬───────┬───────┬───────┐
│ Day 1 │ Day 2 │ Day 3 │ Day 4 │ Day 5 │
├───────┼───────┼───────┼───────┼───────┤
│ P0.1  │ P0.2  │ P0.3  │ P0.3  │ Test  │
│ P0.2  │ P0.4  │ P0.4  │       │ Doc   │
└───────┴───────┴───────┴───────┴───────┘

Week 2: Phase 1 - Metadata (Part 1)
┌───────┬───────┬───────┬───────┬───────┐
│ Day 1 │ Day 2 │ Day 3 │ Day 4 │ Day 5 │
├───────┼───────┼───────┼───────┼───────┤
│ P1.1  │ P1.1  │ P1.2  │ P1.3  │ P1.3  │
│       │       │       │       │       │
└───────┴───────┴───────┴───────┴───────┘

Week 3: Phase 1 (Part 2) + Phase 2 (Start)
┌───────┬───────┬───────┬───────┬───────┐
│ Day 1 │ Day 2 │ Day 3 │ Day 4 │ Day 5 │
├───────┼───────┼───────┼───────┼───────┤
│ P1.3  │ P1.4  │ P1.4  │ P2.2  │ P2.2  │
│       │       │       │       │ Test  │
└───────┴───────┴───────┴───────┴───────┘

Week 4-5: Phase 2 - Structure
┌───────────────────────────────────────┐
│ P2.1 (3 days) │ P2.3 (2 days) │ P2.4  │
└───────────────────────────────────────┘

Week 6-8: Phase 3 - Semantics
┌───────────────────────────────────────┐
│   P3.1 (10 days)  │ P3.2  │ P3.3      │
└───────────────────────────────────────┘
```

---

## 🔀 Parallel Development Opportunities

### Sprint 1 (Week 1)
```
Developer 1: P0.1 ──► P0.3
Developer 2: P0.2 ──► P0.4
```

### Sprint 2 (Week 2)
```
Developer 1: P1.1
Developer 2: P1.3
```

### Sprint 3 (Week 3)
```
Developer 1: P1.2 ──► P1.4
Developer 2: P1.3 (cont) ──► P2.2
```

### Sprint 4-5 (Week 4-5)
```
Developer 1: P2.1
Developer 2: P2.3 ──► P2.4
```

---

## 📈 Incremental Value Delivery

```
Value
  ^
  │                                              ▲ Phase 3
  │                                          ▲  Complete
  │                                      ▲   (+40% precision)
  │                                  ▲
  │                              ▲       Phase 2 Complete
  │                          ▲           (+30% precision)
  │                      ▲   
  │                  ▲           Phase 1 Complete
  │              ▲               (+15% precision)
  │          ▲       
  │      ▲               Phase 0 Complete
  │  ▲                   (Foundation)
  │▲─────────────────────────────────────────► Time
 Start    W1      W2      W3      W4-5    W6-8

Key Milestones:
• Week 1: Foundation + test detection
• Week 2: FQN + basic dedup
• Week 3: Hybrid search working
• Week 4-5: Navigation features
• Week 6-8: Advanced semantics
```

---

## 🧩 Feature Interaction Matrix

```
           P0.1 P0.2 P0.3 P0.4 P1.1 P1.2 P1.3 P1.4 P2.1 P2.2 P2.3 P2.4 P3.1 P3.2 P3.3
P0.1 Ext    ●    -    -    -    ✓    -    -    -    -    -    -    -    -    -    -
P0.2 Test   -    ●    -    -    -    -    -    ✓✓   -    -    -    -    -    -    -
P0.3 Decl   -    -    ●    -    -    -    -    -    -    ✓✓   -    -    -    -    -
P0.4 Comm   -    -    -    ●    ✓    -    -    -    -    -    -    -    -    -    -
P1.1 FQN    ✓    -    -    ✓    ●    ✓✓   -    ✓    ✓✓   -    ✓✓   ✓✓   ✓    -    -
P1.2 ID     -    -    -    -    ✓✓   ●    -    ✓✓   -    -    -    ✓✓   -    -    -
P1.3 Dedup  -    -    -    -    -    -    ●    -    -    -    -    -    -    -    -
P1.4 Hybr   -    ✓✓   -    -    ✓    ✓✓   -    ●    -    -    -    ✓    -    -    -
P2.1 HdrI   -    -    -    -    ✓✓   -    -    -    ●    -    -    -    ✓    -    -
P2.2 Adpt   -    -    ✓✓   -    -    -    -    -    -    ●    -    -    -    -    -
P2.3 Multi  -    -    -    -    ✓✓   -    -    ✓    -    -    ●    -    -    -    -
P2.4 Freq   -    -    -    -    ✓✓   ✓✓   -    ✓    -    -    -    ●    -    -    -
P3.1 clan   -    -    -    -    ✓    -    -    -    ✓    -    -    -    ●    ✓✓   -
P3.2 Tmpl   -    -    -    -    -    -    -    -    -    -    -    -    ✓✓   ●    -
P3.3 Macr   -    -    -    -    -    -    -    -    -    -    -    -    -    -    ●

Legend:
● = Self
✓✓ = Strong dependency (required)
✓ = Weak dependency (enhanced by)
- = No dependency
```

---

## 🎨 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │ .cpp     │  │ .cc      │  │ .ut      │  │ .hpp     │      │
│   │ files    │  │ files    │  │ files    │  │ files    │      │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└────────┼─────────────┼─────────────┼─────────────┼──────────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PREPROCESSING LAYER (P0)                      │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Language Detection (P0.1) + Test Detection (P0.2)    │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Comment Capture (P0.4)                               │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PARSING LAYER (Tree-sitter)                  │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ AST Generation                                       │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Node Selection & Filtering (P0.3)                    │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNKING LAYER (P1)                           │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Scope Tracking + FQN Building (P1.1)                 │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Identifier Extraction (P1.2)                         │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Adaptive Chunking (P2.2)                             │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ENRICHMENT LAYER (P1, P2, P3)                  │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Duplicate Detection (P1.3)                           │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Header-Impl Linkage (P2.1)                           │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ [Optional] clangd Enrichment (P3.1)                  │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INDEXING LAYER                              │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Vector Embedding Generation                          │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ BM25 Index Building (Sparse)                         │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Vector DB Storage (Dense)                            │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SEARCH LAYER (P1.4)                         │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Query Analysis                                       │     │
│   └────────┬────────────────────┬────────────────────────┘     │
│            │                    │                              │
│            ▼                    ▼                              │
│   ┌─────────────┐      ┌──────────────┐                       │
│   │ BM25 Search │      │ Vector Search│                       │
│   └──────┬──────┘      └──────┬───────┘                       │
│          │                    │                                │
│          └────────┬───────────┘                                │
│                   ▼                                            │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Hybrid RRF + Boosting                                │     │
│   └────────────────────────┬─────────────────────────────┘     │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ Test Filtering + Re-ranking (P2.4)                   │     │
│   └────────────────────────┬─────────────────────────────┘     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
                     ┌───────────────┐
                     │ SEARCH RESULTS│
                     └───────────────┘
```

---

## 🔍 Query Processing Flow

```
User Query: "how does add function work in Calculator?"
    │
    ▼
┌─────────────────────┐
│ Query Parsing       │
│ - Extract keywords  │
│ - Detect intent     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Test Detection      │◄─── P0.2
│ Query contains test?│
└──────────┬──────────┘
           │ No
           ▼
┌─────────────────────┐
│ Parallel Search     │
│ ┌─────────────────┐ │
│ │ BM25 (sparse)   │ │◄─── P1.2 (ID boost)
│ │ - "add"         │ │
│ │ - "Calculator"  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Vector (dense)  │ │◄─── P0.4 (comments)
│ │ - semantic      │ │      P1.1 (FQN)
│ │ - embedding     │ │
│ └─────────────────┘ │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Hybrid RRF Merge    │◄─── P1.4
│ Weighted 0.55/0.45  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Symbol Boost        │◄─── P1.1 (FQN match)
│ Calculator::add ++  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Test Filter         │◄─── P0.2
│ Penalize .ut files  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Frequency Penalty   │◄─── P2.4
│ Common utils down   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Duplicate Filter    │◄─── P1.3
│ Show canonical only │
└──────────┬──────────┘
           │
           ▼
      Top K Results
```

---

## 📊 Resource Allocation

```
Phase 0: 🧑‍💻🧑‍💻 (2 developers)
┌──────────────┬──────────────┐
│ Developer A  │ Developer B  │
├──────────────┼──────────────┤
│ P0.1, P0.3   │ P0.2, P0.4   │
│ 10 hours     │ 10 hours     │
└──────────────┴──────────────┘

Phase 1: 🧑‍💻🧑‍💻 (2 developers)
┌──────────────┬──────────────┐
│ Developer A  │ Developer B  │
├──────────────┼──────────────┤
│ P1.1, P1.2   │ P1.3         │
│ 20 hours     │ 16 hours     │
└──────────────┴──────────────┤
│ P1.4: Both collaborate      │
│ 10 hours                    │
└─────────────────────────────┘

Phase 2: 🧑‍💻🧑‍💻 (2 developers)
┌──────────────┬──────────────┐
│ Developer A  │ Developer B  │
├──────────────┼──────────────┤
│ P2.1         │ P2.2, P2.3   │
│ 20 hours     │ 28 hours     │
└──────────────┴──────────────┤
│ P2.4: Developer A           │
│ 10 hours                    │
└─────────────────────────────┘

Phase 3: 🧑‍💻🧑‍💻🧑‍💻 (2-3 developers)
┌──────────────┬──────────────┐
│ Developer A  │ Developer B  │
├──────────────┼──────────────┤
│ P3.1         │ P3.3         │
│ 40 hours     │ 12 hours     │
└──────────────┴──────────────┤
│ P3.2: Developer A or B      │
│ 8 hours                     │
└─────────────────────────────┘
```

---

## 🎯 Success Metrics Flow

```
Baseline Measurement
        │
        ▼
┌─────────────────────────────┐
│ • Search precision: X       │
│ • Index size: Y GB          │
│ • Query latency: Z ms       │
│ • Duplicate ratio: High     │
└───────────┬─────────────────┘
            │
            ▼ Phase 0
┌─────────────────────────────┐
│ ✓ Foundation laid           │
│ ✓ Noise reduced 40%         │
│ • Measure impact            │
└───────────┬─────────────────┘
            │
            ▼ Phase 1
┌─────────────────────────────┐
│ ✓ Precision +15%            │
│ ✓ Index size -25%           │
│ ✓ Duplicates <5%            │
│ • Validate improvements     │
└───────────┬─────────────────┘
            │
            ▼ Phase 2
┌─────────────────────────────┐
│ ✓ Precision +30% (total)    │
│ ✓ Navigation improved       │
│ • User feedback             │
└───────────┬─────────────────┘
            │
            ▼ Phase 3
┌─────────────────────────────┐
│ ✓ Precision +40% (total)    │
│ ✓ Template queries work     │
│ ✓ Production ready          │
└─────────────────────────────┘
```

---

## 📋 Decision Points

```
Start
  │
  ▼
┌─────────────────────┐
│ Is codebase > 1M    │───No───► Use basic indexing
│ LOC C/C++?          │
└──────┬──────────────┘
       │ Yes
       ▼
┌─────────────────────┐
│ Do Phase 0?         │───No───► Skip to Phase 1?
│ (Foundation)        │
└──────┬──────────────┘
       │ Yes
       ▼
    Phase 0 Done
       │
       ▼
┌─────────────────────┐
│ Need FQN &          │───No───► Limited benefits
│ metadata?           │
└──────┬──────────────┘
       │ Yes
       ▼
    Phase 1
       │
       ▼
┌─────────────────────┐
│ Need navigation &   │───No───► Skip to Phase 3?
│ structure?          │
└──────┬──────────────┘
       │ Yes
       ▼
    Phase 2
       │
       ▼
┌─────────────────────┐
│ Heavy template use? │───No───► Done!
│ Complex C++?        │
└──────┬──────────────┘
       │ Yes
       ▼
    Phase 3
       │
       ▼
┌─────────────────────┐
│ Production Ready!   │
└─────────────────────┘
```

---

## 🚀 Launch Checklist Flow

```
Pre-Launch
├─ ✓ All Phase 0 features complete
├─ ✓ All Phase 1 features complete
├─ ✓ Test coverage > 80%
├─ ✓ Benchmarks show improvement
└─ ✓ Documentation complete
    │
    ▼
Beta Launch
├─ ✓ Deploy to staging
├─ ✓ Run full test suite
├─ ✓ Collect metrics
├─ ✓ User feedback (10-20 users)
└─ ✓ Bug fixes applied
    │
    ▼
Phased Rollout
├─ ✓ 10% of users (Week 1)
├─ ✓ Monitor metrics
├─ ✓ 50% of users (Week 2)
├─ ✓ Final adjustments
└─ ✓ 100% of users (Week 3)
    │
    ▼
Post-Launch
├─ Monitor performance
├─ Collect feedback
├─ Plan Phase 2/3
└─ Continuous improvement
```

---

**Last Updated:** 2025-10-16  
**Purpose:** Visual reference for project structure and dependencies  
**Audience:** All team members
