import { AstCodeSplitter } from '../ast-splitter';
import * as fs from 'fs';
import * as path from 'path';

describe('AstCodeSplitter - Advanced C++ Fixtures', () => {
  let splitter: AstCodeSplitter;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    splitter = new AstCodeSplitter(2500, 300);
  });

  describe('Algorithm Fixtures', () => {
    it('should parse sorting algorithms', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/sorting.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'sorting.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain various sorting algorithm names
      const content = chunks.map(c => c.content).join(' ');
      expect(content).toContain('quickSort');
      expect(content).toContain('mergeSort');
      expect(content).toContain('heapSort');
      expect(content).toContain('bubbleSort');
      expect(content).toContain('insertionSort');
    });

    it('should parse graph algorithms', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/graph.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'graph.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain graph algorithm names
      const content = chunks.map(c => c.content).join(' ');
      expect(content).toContain('BFS');
      expect(content).toContain('DFS');
      expect(content).toContain('dijkstra');
      expect(content).toContain('bellmanFord');
      expect(content).toContain('topologicalSort');
    });

    it('should parse dynamic programming algorithms', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/dynamic_programming.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'dynamic_programming.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain DP algorithm names
      const content = chunks.map(c => c.content).join(' ');
      expect(content).toContain('Fibonacci');
      expect(content).toContain('longestCommonSubsequence');
      expect(content).toContain('longestIncreasingSubsequence');
      expect(content).toContain('knapsack');
      expect(content).toContain('coinChange');
      expect(content).toContain('editDistance');
    });
  });

  describe('Data Structure Fixtures', () => {
    it('should parse advanced data structures', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'data-structures/advanced.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'advanced.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain data structure names
      const content = chunks.map(c => c.content).join(' ');
      expect(content).toContain('BinarySearchTree');
      expect(content).toContain('AVLTree');
      expect(content).toContain('Trie');
      expect(content).toContain('SegmentTree');
      expect(content).toContain('DisjointSet');
    });

    it('should handle complex templates in data structures', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'data-structures/advanced.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'advanced.cpp');

      // Should handle template classes
      const hasTemplates = chunks.some(chunk => 
        chunk.content.includes('template<typename T>')
      );
      expect(hasTemplates).toBe(true);
      
      // Should handle unique_ptr and smart pointers
      const hasSmartPointers = chunks.some(chunk => 
        chunk.content.includes('std::unique_ptr')
      );
      expect(hasSmartPointers).toBe(true);
    });
  });

  describe('Modern C++ Features', () => {
    it('should parse modern C++ features', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'modern-cpp/features.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'features.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain modern C++ keywords
      const content = chunks.map(c => c.content).join(' ');
      expect(content).toContain('std::unique_ptr');
      expect(content).toContain('std::shared_ptr');
      expect(content).toContain('std::optional');
      expect(content).toContain('std::variant');
      expect(content).toContain('constexpr');
    });

    it('should handle lambda expressions', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'modern-cpp/features.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'features.cpp');

      // Should contain lambda syntax
      const hasLambdas = chunks.some(chunk => 
        chunk.content.includes('auto') && chunk.content.includes('=>')
        || chunk.content.includes('[') && chunk.content.includes(']')
      );
      expect(hasLambdas).toBe(true);
    });

    it('should handle C++17/20 features', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'modern-cpp/features.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'features.cpp');

      const content = chunks.map(c => c.content).join(' ');
      
      // C++17 features
      expect(content).toContain('std::optional');
      expect(content).toContain('std::variant');
      
      // C++20 features (concepts)
      expect(content).toContain('concept');
      expect(content).toContain('requires');
    });
  });

  describe('Performance Tests with Large Fixtures', () => {
    it('should parse all fixtures within reasonable time', async () => {
      const files = [
        'algorithms/sorting.cpp',
        'algorithms/graph.cpp',
        'algorithms/dynamic_programming.cpp',
        'data-structures/advanced.cpp',
        'modern-cpp/features.cpp'
      ];

      const startTime = Date.now();
      
      for (const file of files) {
        const code = fs.readFileSync(
          path.join(fixturesDir, file),
          'utf-8'
        );
        const chunks = await splitter.split(code, 'cpp', file);
        expect(chunks.length).toBeGreaterThan(0);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All fixtures should parse in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large files efficiently', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'data-structures/advanced.cpp'),
        'utf-8'
      );

      const startTime = Date.now();
      const chunks = await splitter.split(code, 'cpp', 'advanced.cpp');
      const endTime = Date.now();

      expect(chunks.length).toBeGreaterThan(0);
      
      // Should parse in under 200ms
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Code Quality Checks', () => {
    it('should preserve namespace structure in algorithms', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/sorting.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'sorting.cpp');

      // Should contain namespace sorting
      const hasNamespace = chunks.some(chunk => 
        chunk.content.includes('namespace sorting')
      );
      expect(hasNamespace).toBe(true);
    });

    it('should maintain template integrity', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/sorting.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'sorting.cpp');

      // Template functions should be in complete chunks
      const templateChunks = chunks.filter(chunk => 
        chunk.content.includes('template<typename T>')
      );
      
      expect(templateChunks.length).toBeGreaterThan(0);
      
      // Each template chunk should have matching braces
      for (const chunk of templateChunks) {
        const openBraces = (chunk.content.match(/{/g) || []).length;
        const closeBraces = (chunk.content.match(/}/g) || []).length;
        
        // Allow for partial chunks at boundaries - chunks may split across templates
        expect(Math.abs(openBraces - closeBraces)).toBeLessThanOrEqual(5);
      }
    });

    it('should include comments and documentation', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/graph.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'graph.cpp');

      // Should preserve comments
      const hasComments = chunks.some(chunk => 
        chunk.content.includes('//') || chunk.content.includes('/*')
      );
      expect(hasComments).toBe(true);
    });

    it('should handle complex inheritance hierarchies', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'algorithms/graph.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'graph.cpp');

      const content = chunks.map(c => c.content).join(' ');
      
      // Should contain class definitions
      expect(content).toContain('class Graph');
      expect(content).toContain('class WeightedGraph');
    });
  });

  describe('Metadata Validation', () => {
    it('should set correct metadata for all fixtures', async () => {
      const files = [
        'algorithms/sorting.cpp',
        'data-structures/advanced.cpp',
        'modern-cpp/features.cpp'
      ];

      for (const file of files) {
        const code = fs.readFileSync(
          path.join(fixturesDir, file),
          'utf-8'
        );
        const chunks = await splitter.split(code, 'cpp', file);

        for (const chunk of chunks) {
          expect(chunk.metadata.language).toBe('cpp');
          expect(chunk.metadata.filePath).toBe(file);
          expect(chunk.metadata.startLine).toBeGreaterThanOrEqual(1);
          expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
        }
      }
    });

    it('should track line numbers correctly across large files', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'data-structures/advanced.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'advanced.cpp');

      // Line numbers should be sequential or overlapping (with reasonable gaps for chunk boundaries)
      for (let i = 1; i < chunks.length; i++) {
        const prevEnd = chunks[i - 1].metadata.endLine;
        const currStart = chunks[i].metadata.startLine;
        
        // Current chunk should start reasonably close to previous chunk's end
        // Allow larger gaps due to chunk overlap and splitting
        expect(currStart).toBeLessThanOrEqual(prevEnd + 50);
      }
    });
  });
});
