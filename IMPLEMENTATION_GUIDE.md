# C/C++ Improvements - Implementation Guide

## Table of Contents
1. [Development Setup](#development-setup)
2. [Phase 0 Implementation Details](#phase-0-implementation-details)
3. [Phase 1 Implementation Details](#phase-1-implementation-details)
4. [Phase 2 Implementation Details](#phase-2-implementation-details)
5. [Phase 3 Implementation Details](#phase-3-implementation-details)
6. [Testing Strategy](#testing-strategy)
7. [Performance Benchmarking](#performance-benchmarking)

---

## Development Setup

### Prerequisites
```bash
# Required tools
- Node.js 16+
- TypeScript 4.5+
- Tree-sitter CLI
- Git

# Optional for Phase 3
- clangd
- compile_commands.json generator
```

### Repository Structure (Expected)
```
packages/
  core/
    src/
      context.ts              # Language detection
      splitter/
        ast-splitter.ts       # AST-based chunking
      dedup/                  # Phase 1 additions
        hasher.ts
        registry.ts
      linker/                 # Phase 2 additions
        header-impl-linker.ts
      enrichment/             # Phase 3 additions
        clangd-client.ts
        symbol-enricher.ts
    tests/
      context.test.ts
      splitter.test.ts
```

---

## Phase 0 Implementation Details

### Feature 0.1: File Extension Support

**File:** `packages/core/src/context.ts`

```typescript
/**
 * Get programming language from file extension
 */
export function getLanguageFromExtension(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  
  const languageMap: Record<string, string> = {
    // C language
    '.c': 'c',
    '.h': 'c',
    
    // C++ language
    '.cpp': 'cpp',
    '.cc': 'cpp',      // ✅ NEW: Google style C++
    '.cxx': 'cpp',
    '.hpp': 'cpp',
    '.hh': 'cpp',
    '.hxx': 'cpp',
    '.ut': 'cpp',      // ✅ NEW: Unit test files (C++)
    
    // Other languages...
    '.ts': 'typescript',
    '.js': 'javascript',
    // ... rest of mappings
  };
  
  return languageMap[ext] || null;
}
```

**Test:** `packages/core/tests/context.test.ts`

```typescript
describe('getLanguageFromExtension', () => {
  it('should recognize .cc as C++', () => {
    expect(getLanguageFromExtension('test.cc')).toBe('cpp');
  });
  
  it('should recognize .ut as C++ test file', () => {
    expect(getLanguageFromExtension('test.ut')).toBe('cpp');
  });
  
  it('should recognize .cxx as C++', () => {
    expect(getLanguageFromExtension('test.cxx')).toBe('cpp');
  });
});
```

---

### Feature 0.2: Test File Detection

**File:** `packages/core/src/context.ts`

```typescript
/**
 * Determine if a file is a test file based on path and naming conventions
 */
export function isTestFile(filePath: string): boolean {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Check file extension
  if (normalized.endsWith('.ut')) {
    return true;
  }
  
  // Check if in test directory
  const testDirPattern = /(^|\/)tests?(\/|$)|\/unittests?(\/|$)|\/gtest(\/|$)/;
  if (testDirPattern.test(normalized)) {
    return true;
  }
  
  // Check filename patterns
  const testFilePattern = /(_test|\.test|_unittest|\.unittest)\.(c|cc|cpp|cxx|h|hpp)$/;
  if (testFilePattern.test(normalized)) {
    return true;
  }
  
  // Check for test framework indicators in path
  if (normalized.includes('/googletest/') || normalized.includes('/catch2/')) {
    return true;
  }
  
  return false;
}

/**
 * Get file type metadata
 */
export interface FileMetadata {
  language: string | null;
  isTest: boolean;
  extension: string;
}

export function getFileMetadata(filePath: string): FileMetadata {
  return {
    language: getLanguageFromExtension(filePath),
    isTest: isTestFile(filePath),
    extension: path.extname(filePath),
  };
}
```

**Test:**

```typescript
describe('isTestFile', () => {
  const testCases = [
    { path: 'src/tests/foo_test.cpp', expected: true },
    { path: 'src/unittest/bar.cpp', expected: true },
    { path: 'src/foo.ut', expected: true },
    { path: 'tests/helper_test.cc', expected: true },
    { path: 'src/main.cpp', expected: false },
    { path: 'include/header.hpp', expected: false },
  ];
  
  testCases.forEach(({ path, expected }) => {
    it(`should return ${expected} for ${path}`, () => {
      expect(isTestFile(path)).toBe(expected);
    });
  });
});
```

---

### Feature 0.3: Declaration Filtering

**File:** `packages/core/src/splitter/ast-splitter.ts`

```typescript
interface NodeFilterConfig {
  minDeclarationLines: number;
  batchSmallDeclarations: boolean;
  declarationBatchThreshold: number; // lines
}

const CPP_FILTER_CONFIG: NodeFilterConfig = {
  minDeclarationLines: 6,
  batchSmallDeclarations: true,
  declarationBatchThreshold: 20, // batch until 20 lines
};

/**
 * Check if a declaration node should be included
 */
function shouldIncludeDeclaration(node: Parser.SyntaxNode, code: string): boolean {
  const nodeText = code.slice(node.startIndex, node.endIndex);
  
  // Check for initializer (= or {})
  if (/\s*=\s*[^;]+;/.test(nodeText) || /\s*\{[^}]*\}/.test(nodeText)) {
    return true;
  }
  
  // Check line count
  const startLine = node.startPosition.row;
  const endLine = node.endPosition.row;
  const lineCount = endLine - startLine + 1;
  
  if (lineCount >= CPP_FILTER_CONFIG.minDeclarationLines) {
    return true;
  }
  
  // Check for typedef, using, enum patterns
  if (/^\s*(typedef|using|enum)\s/.test(nodeText)) {
    return true;
  }
  
  return false;
}

/**
 * Batch consecutive small declarations
 */
function batchDeclarations(
  nodes: Parser.SyntaxNode[],
  code: string
): Parser.SyntaxNode[] {
  if (!CPP_FILTER_CONFIG.batchSmallDeclarations) {
    return nodes;
  }
  
  const result: Parser.SyntaxNode[] = [];
  let batchStart: Parser.SyntaxNode | null = null;
  let batchLines = 0;
  
  for (const node of nodes) {
    if (node.type === 'declaration') {
      const lines = node.endPosition.row - node.startPosition.row + 1;
      
      if (!batchStart) {
        batchStart = node;
        batchLines = lines;
      } else {
        batchLines += lines;
        
        if (batchLines >= CPP_FILTER_CONFIG.declarationBatchThreshold) {
          // Create synthetic batch node
          const batchNode = {
            ...batchStart,
            endIndex: node.endIndex,
            endPosition: node.endPosition,
            type: 'declaration_batch',
          } as Parser.SyntaxNode;
          
          result.push(batchNode);
          batchStart = null;
          batchLines = 0;
        }
      }
    } else {
      // Flush any pending batch
      if (batchStart) {
        result.push(batchStart);
        batchStart = null;
        batchLines = 0;
      }
      result.push(node);
    }
  }
  
  // Flush final batch
  if (batchStart) {
    result.push(batchStart);
  }
  
  return result;
}

/**
 * Get C++ nodes for chunking with filtering
 */
function getCppChunkableNodes(tree: Parser.Tree, code: string): Parser.SyntaxNode[] {
  const nodes: Parser.SyntaxNode[] = [];
  
  function traverse(node: Parser.SyntaxNode) {
    // Always include these
    if (['function_definition', 'class_specifier', 'namespace_definition'].includes(node.type)) {
      nodes.push(node);
      return; // Don't traverse children
    }
    
    // Conditionally include declarations
    if (node.type === 'declaration') {
      if (shouldIncludeDeclaration(node, code)) {
        nodes.push(node);
        return;
      }
    }
    
    // Traverse children
    for (const child of node.children) {
      traverse(child);
    }
  }
  
  traverse(tree.rootNode);
  
  // Batch small declarations
  return batchDeclarations(nodes, code);
}
```

---

### Feature 0.4: Leading Comment Capture

**File:** `packages/core/src/splitter/ast-splitter.ts`

```typescript
interface CommentCapture {
  text: string;
  startLine: number;
  endLine: number;
}

/**
 * Capture leading comments before a code node
 */
function captureLeadingComments(
  startIndex: number,
  code: string,
  maxLines: number = 30
): CommentCapture | null {
  const lines = code.split('\n');
  const startLine = code.slice(0, startIndex).split('\n').length - 1;
  
  const commentLines: string[] = [];
  let currentLine = startLine - 1;
  let blankLineGap = 0;
  
  // Walk backward
  while (currentLine >= 0 && commentLines.length < maxLines) {
    const line = lines[currentLine].trim();
    
    // Stop if we hit more than one blank line
    if (line === '') {
      blankLineGap++;
      if (blankLineGap > 1) {
        break;
      }
      currentLine--;
      continue;
    }
    
    // Check if it's a comment
    if (line.startsWith('//') || line.startsWith('/*') || 
        line.startsWith('*') || line.endsWith('*/')) {
      commentLines.unshift(lines[currentLine]);
      blankLineGap = 0;
      currentLine--;
      continue;
    }
    
    // Stop if we hit non-comment, non-blank
    break;
  }
  
  if (commentLines.length === 0) {
    return null;
  }
  
  // Filter out license headers
  const commentText = commentLines.join('\n');
  if (commentText.includes('SPDX-License-Identifier') ||
      commentText.includes('Copyright') && commentLines.length > 20) {
    return null;
  }
  
  return {
    text: commentText,
    startLine: currentLine + 1,
    endLine: startLine - 1,
  };
}

/**
 * Enhanced chunk extraction with comments
 */
function extractChunkWithContext(
  node: Parser.SyntaxNode,
  code: string,
  filePath: string
): CodeChunk {
  // Capture leading comments
  const comments = captureLeadingComments(node.startIndex, code);
  
  // Get node text
  const nodeText = code.slice(node.startIndex, node.endIndex);
  
  // Combine comments with code
  const fullText = comments 
    ? `${comments.text}\n${nodeText}` 
    : nodeText;
  
  // Calculate line numbers
  const startLine = comments 
    ? comments.startLine 
    : node.startPosition.row;
  
  return {
    content: fullText,
    startLine,
    endLine: node.endPosition.row,
    language: 'cpp',
    filePath,
  };
}
```

---

## Phase 1 Implementation Details

### Feature 1.1: Fully Qualified Names

**File:** `packages/core/src/splitter/ast-splitter.ts`

```typescript
interface ScopeInfo {
  name: string;
  kind: 'namespace' | 'class' | 'struct';
}

class ScopeStack {
  private stack: ScopeInfo[] = [];
  
  push(name: string, kind: 'namespace' | 'class' | 'struct') {
    this.stack.push({ name, kind });
  }
  
  pop() {
    this.stack.pop();
  }
  
  getFQN(symbolName: string): string {
    const scopes = this.stack.map(s => s.name);
    return [...scopes, symbolName].join('::');
  }
  
  getCurrentScope(): string {
    return this.stack.map(s => s.name).join('::');
  }
}

/**
 * Extract identifier name from a node
 */
function extractIdentifier(node: Parser.SyntaxNode, code: string): string | null {
  // Look for identifier child
  for (const child of node.children) {
    if (child.type === 'identifier') {
      return code.slice(child.startIndex, child.endIndex);
    }
    
    // For function_definition, look in declarator
    if (child.type === 'function_declarator') {
      for (const subChild of child.children) {
        if (subChild.type === 'identifier' || subChild.type === 'field_identifier') {
          return code.slice(subChild.startIndex, subChild.endIndex);
        }
      }
    }
    
    // For class/struct, type_identifier
    if (child.type === 'type_identifier') {
      return code.slice(child.startIndex, child.endIndex);
    }
  }
  
  return null;
}

/**
 * Determine symbol kind from node type
 */
function getSymbolKind(node: Parser.SyntaxNode): string {
  const kindMap: Record<string, string> = {
    'function_definition': 'function',
    'class_specifier': 'class',
    'struct_specifier': 'struct',
    'namespace_definition': 'namespace',
    'enum_specifier': 'enum',
    'declaration': 'declaration',
  };
  
  return kindMap[node.type] || 'unknown';
}

/**
 * Enhanced AST traversal with scope tracking
 */
function extractChunksWithFQN(
  tree: Parser.Tree,
  code: string,
  filePath: string
): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const scopeStack = new ScopeStack();
  
  function traverse(node: Parser.SyntaxNode) {
    // Handle scope entry
    if (node.type === 'namespace_definition') {
      const name = extractIdentifier(node, code);
      if (name) {
        scopeStack.push(name, 'namespace');
      }
    } else if (node.type === 'class_specifier') {
      const name = extractIdentifier(node, code);
      if (name) {
        scopeStack.push(name, 'class');
      }
    }
    
    // Extract chunk if chunkable node
    if (isChunkableNode(node)) {
      const name = extractIdentifier(node, code);
      const kind = getSymbolKind(node);
      const fqn = name ? scopeStack.getFQN(name) : null;
      
      const chunk = extractChunkWithContext(node, code, filePath);
      
      // Add FQN metadata and synthetic header
      if (fqn) {
        chunk.content = `// [symbol: ${fqn} | kind: ${kind}]\n${chunk.content}`;
        chunk.metadata = {
          ...chunk.metadata,
          symbolName: name,
          fullyQualifiedName: fqn,
          symbolKind: kind,
          scope: scopeStack.getCurrentScope(),
        };
      }
      
      chunks.push(chunk);
    } else {
      // Traverse children for non-chunkable nodes
      for (const child of node.children) {
        traverse(child);
      }
    }
    
    // Handle scope exit
    if (node.type === 'namespace_definition' || node.type === 'class_specifier') {
      scopeStack.pop();
    }
  }
  
  traverse(tree.rootNode);
  return chunks;
}
```

---

### Feature 1.2: Identifier Extraction

**File:** `packages/core/src/splitter/ast-splitter.ts`

```typescript
/**
 * Extract identifiers from code chunk for lexical boosting
 */
function extractIdentifiers(node: Parser.SyntaxNode, code: string): Set<string> {
  const identifiers = new Set<string>();
  
  function traverse(n: Parser.SyntaxNode) {
    if (n.type === 'identifier' || n.type === 'field_identifier' || 
        n.type === 'type_identifier') {
      const id = code.slice(n.startIndex, n.endIndex);
      // Filter out very short or common keywords
      if (id.length > 2 && !isKeyword(id)) {
        identifiers.add(id);
      }
    }
    
    // Extract macros (all caps)
    if (n.type === 'identifier') {
      const id = code.slice(n.startIndex, n.endIndex);
      if (id === id.toUpperCase() && id.length > 2) {
        identifiers.add(id);
      }
    }
    
    for (const child of n.children) {
      traverse(child);
    }
  }
  
  traverse(node);
  return identifiers;
}

const CPP_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
  'continue', 'return', 'void', 'int', 'char', 'float', 'double',
  'const', 'static', 'class', 'struct', 'namespace', 'template',
  // ... add more
]);

function isKeyword(id: string): boolean {
  return CPP_KEYWORDS.has(id.toLowerCase());
}

/**
 * Add identifier boost to chunk
 */
function addIdentifierBoost(chunk: CodeChunk, identifiers: Set<string>): void {
  if (identifiers.size === 0) return;
  
  const uniqueIds = Array.from(identifiers).sort();
  const boostLine = `\n// identifiers: ${uniqueIds.join(' ')}`;
  
  chunk.content += boostLine;
  chunk.metadata = {
    ...chunk.metadata,
    identifiers: uniqueIds,
    identifierCount: uniqueIds.length,
  };
}
```

---

### Feature 1.3: Deduplication

**File:** `packages/core/src/dedup/hasher.ts`

```typescript
import { createHash } from 'crypto';

/**
 * Fast hash computation for chunk content
 */
export function computeChunkHash(content: string): string {
  // Normalize whitespace for better duplicate detection
  const normalized = content
    .replace(/\s+/g, ' ')
    .trim();
  
  // Use SHA-256 (fast enough, good distribution)
  const hash = createHash('sha256');
  hash.update(normalized);
  return hash.digest('hex');
}

/**
 * Compute fuzzy hash (for near-duplicates)
 */
export function computeFuzzyHash(content: string): string {
  // Remove comments and string literals for fuzzy matching
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"([^"\\]|\\.)*"/g, '""')
    .replace(/'([^'\\]|\\.)*'/g, "''")
    .replace(/\s+/g, ' ')
    .trim();
  
  const hash = createHash('sha256');
  hash.update(stripped);
  return hash.digest('hex');
}
```

**File:** `packages/core/src/dedup/registry.ts`

```typescript
interface DuplicateEntry {
  canonicalChunkId: string;
  canonicalFilePath: string;
  count: number;
  seenInFiles: Set<string>;
}

export class DeduplicationRegistry {
  private exactMatches = new Map<string, DuplicateEntry>();
  private fuzzyMatches = new Map<string, DuplicateEntry>();
  
  /**
   * Register a chunk and check for duplicates
   */
  register(
    chunkId: string,
    filePath: string,
    content: string
  ): {
    isDuplicate: boolean;
    isNearDuplicate: boolean;
    canonicalId?: string;
    dupCount?: number;
  } {
    const exactHash = computeChunkHash(content);
    const fuzzyHash = computeFuzzyHash(content);
    
    // Check exact duplicate
    const exactEntry = this.exactMatches.get(exactHash);
    if (exactEntry) {
      exactEntry.count++;
      exactEntry.seenInFiles.add(filePath);
      
      return {
        isDuplicate: true,
        isNearDuplicate: false,
        canonicalId: exactEntry.canonicalChunkId,
        dupCount: exactEntry.count,
      };
    }
    
    // Check fuzzy duplicate
    const fuzzyEntry = this.fuzzyMatches.get(fuzzyHash);
    if (fuzzyEntry) {
      fuzzyEntry.count++;
      fuzzyEntry.seenInFiles.add(filePath);
      
      return {
        isDuplicate: false,
        isNearDuplicate: true,
        canonicalId: fuzzyEntry.canonicalChunkId,
        dupCount: fuzzyEntry.count,
      };
    }
    
    // Register as new
    const newEntry: DuplicateEntry = {
      canonicalChunkId: chunkId,
      canonicalFilePath: filePath,
      count: 1,
      seenInFiles: new Set([filePath]),
    };
    
    this.exactMatches.set(exactHash, newEntry);
    this.fuzzyMatches.set(fuzzyHash, newEntry);
    
    return {
      isDuplicate: false,
      isNearDuplicate: false,
    };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    let totalDuplicates = 0;
    let totalNearDuplicates = 0;
    
    for (const entry of this.exactMatches.values()) {
      if (entry.count > 1) {
        totalDuplicates += entry.count - 1;
      }
    }
    
    return {
      uniqueChunks: this.exactMatches.size,
      totalDuplicates,
      duplicateRatio: totalDuplicates / (this.exactMatches.size + totalDuplicates),
    };
  }
}
```

---

## Testing Strategy

### Unit Test Structure

```typescript
// packages/core/tests/cpp-improvements.test.ts

describe('C++ Improvements', () => {
  describe('File Extension Support', () => {
    // Tests from Feature 0.1
  });
  
  describe('Test File Detection', () => {
    // Tests from Feature 0.2
  });
  
  describe('Declaration Filtering', () => {
    it('should filter trivial declarations', () => {
      const code = `
        int x;
        int y;
        int z = 10;
      `;
      // Test filtering logic
    });
    
    it('should batch small declarations', () => {
      // Test batching
    });
  });
  
  describe('FQN Extraction', () => {
    it('should build correct FQN for nested class', () => {
      const code = `
        namespace foo {
          namespace bar {
            class Baz {
              void qux() {}
            };
          }
        }
      `;
      // Expect: foo::bar::Baz::qux
    });
  });
  
  describe('Deduplication', () => {
    it('should detect exact duplicates', () => {
      // Test exact matching
    });
    
    it('should detect near-duplicates', () => {
      // Test fuzzy matching
    });
  });
});
```

### Integration Tests

```typescript
describe('End-to-End C++ Indexing', () => {
  it('should correctly process a complete C++ file', async () => {
    const testFile = `
      // This is a test file
      namespace myapp {
        class Calculator {
          public:
            int add(int a, int b) {
              return a + b;
            }
        };
      }
    `;
    
    const chunks = await processFile(testFile, 'test.cpp');
    
    expect(chunks).toHaveLength(1);
    expect(chunks[0].metadata.fullyQualifiedName).toBe('myapp::Calculator::add');
    expect(chunks[0].metadata.symbolKind).toBe('function');
    expect(chunks[0].content).toContain('// This is a test file');
  });
});
```

---

## Performance Benchmarking

### Benchmark Suite

```typescript
// packages/core/benchmarks/cpp-indexing.bench.ts

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  filesProcessed: number;
  chunksGenerated: number;
  timeMs: number;
  throughput: number; // chunks/sec
}

async function benchmarkIndexing(
  testFiles: string[],
  config: IndexingConfig
): Promise<BenchmarkResult> {
  const start = performance.now();
  
  let totalChunks = 0;
  for (const file of testFiles) {
    const chunks = await processFile(file, config);
    totalChunks += chunks.length;
  }
  
  const end = performance.now();
  const timeMs = end - start;
  
  return {
    operation: 'Full Indexing Pipeline',
    filesProcessed: testFiles.length,
    chunksGenerated: totalChunks,
    timeMs,
    throughput: (totalChunks / timeMs) * 1000,
  };
}

// Run benchmarks
async function main() {
  const testSizes = [100, 1000, 10000]; // file counts
  
  for (const size of testSizes) {
    console.log(`\nBenchmarking with ${size} files...`);
    
    const baseline = await benchmarkIndexing(
      generateTestFiles(size),
      { enableImprovements: false }
    );
    
    const improved = await benchmarkIndexing(
      generateTestFiles(size),
      { enableImprovements: true }
    );
    
    console.log(`Baseline: ${baseline.throughput.toFixed(2)} chunks/sec`);
    console.log(`Improved: ${improved.throughput.toFixed(2)} chunks/sec`);
    console.log(`Change: ${((improved.throughput / baseline.throughput - 1) * 100).toFixed(1)}%`);
  }
}
```

---

## Monitoring and Metrics

### Metrics to Track

```typescript
interface IndexingMetrics {
  // Performance
  totalIndexingTimeMs: number;
  avgChunkProcessingTimeMs: number;
  
  // Quality
  totalChunks: number;
  duplicateChunks: number;
  duplicateRatio: number;
  avgChunkSizeChars: number;
  avgChunkSizeLines: number;
  
  // Distribution
  chunkSizeP50: number;
  chunkSizeP75: number;
  chunkSizeP90: number;
  chunkSizeP99: number;
  
  // Feature-specific
  testChunkCount: number;
  testChunkRatio: number;
  fqnCoverage: number; // % of chunks with FQN
  commentCapturereRate: number; // % with comments
}

function emitMetrics(metrics: IndexingMetrics) {
  console.log('=== Indexing Metrics ===');
  console.log(`Total chunks: ${metrics.totalChunks}`);
  console.log(`Duplicate ratio: ${(metrics.duplicateRatio * 100).toFixed(2)}%`);
  console.log(`Test chunks: ${metrics.testChunkCount} (${(metrics.testChunkRatio * 100).toFixed(1)}%)`);
  console.log(`FQN coverage: ${(metrics.fqnCoverage * 100).toFixed(1)}%`);
  console.log(`\nSize distribution (lines):`);
  console.log(`  P50: ${metrics.chunkSizeP50}`);
  console.log(`  P75: ${metrics.chunkSizeP75}`);
  console.log(`  P90: ${metrics.chunkSizeP90}`);
  console.log(`  P99: ${metrics.chunkSizeP99}`);
}
```

---

## Configuration

### Feature Flags

```typescript
// packages/core/src/config/cpp-config.ts

export interface CppIndexingConfig {
  // Feature toggles
  enableTestDetection: boolean;
  enableDeduplication: boolean;
  enableFQN: boolean;
  enableCommentCapture: boolean;
  enableIdentifierBoost: boolean;
  enableDeclarationFiltering: boolean;
  
  // Thresholds
  minDeclarationLines: number;
  declarationBatchThreshold: number;
  maxCommentLines: number;
  dedupThreshold: number;
  
  // Search behavior
  testPenalty: number;
  symbolBoostFactor: number;
  hybridSearchWeights: {
    dense: number;
    sparse: number;
  };
}

export const DEFAULT_CPP_CONFIG: CppIndexingConfig = {
  enableTestDetection: true,
  enableDeduplication: true,
  enableFQN: true,
  enableCommentCapture: true,
  enableIdentifierBoost: true,
  enableDeclarationFiltering: true,
  
  minDeclarationLines: 6,
  declarationBatchThreshold: 20,
  maxCommentLines: 30,
  dedupThreshold: 0.95,
  
  testPenalty: 10,
  symbolBoostFactor: 2.0,
  hybridSearchWeights: {
    dense: 0.55,
    sparse: 0.45,
  },
};
```

---

## Documentation Updates

### User-Facing Documentation

```markdown
# C/C++ Code Indexing Improvements

## Overview
Enhanced C/C++ code indexing with improved chunking, deduplication, and metadata extraction.

## Features

### Test File Detection
Automatically identifies test files based on:
- `.ut` file extension
- Test directory paths (`/test/`, `/tests/`, `/unittest/`)
- Test filename patterns (`*_test.cpp`, `*.test.cpp`)

Test chunks are marked with `isTest: true` metadata.

### Fully Qualified Names (FQN)
Symbol names include full namespace and class scope:
- `foo::bar::Baz::qux` instead of just `qux`
- Improves search precision for large codebases
- Enables "jump to definition" functionality

### Deduplication
Reduces index size by detecting:
- Exact duplicates (common in header includes)
- Near-duplicates (minor variations)

Duplicate chunks are marked but not reindexed.

### Smart Comment Capture
Leading comments and docblocks are automatically included with code chunks:
- Function documentation
- Class descriptions
- Inline explanations

License headers are automatically excluded.

## Configuration

Add to your config file:

```json
{
  "cpp": {
    "enableTestDetection": true,
    "enableDeduplication": true,
    "enableFQN": true,
    "testPenalty": 10,
    "symbolBoost": 2.0
  }
}
```

## Search Tips

### Finding Functions
```
foo::bar::MyClass::myMethod
```

### Including Test Code
```
test assert EXPECT_TRUE
```

### Excluding Tests (default behavior)
Tests are automatically de-prioritized unless your query includes test-related keywords.
```

---

This implementation guide provides detailed code examples and testing strategies for Phases 0 and 1. Would you like me to continue with Phases 2 and 3 details, or would you prefer to focus on implementing these initial features first?
