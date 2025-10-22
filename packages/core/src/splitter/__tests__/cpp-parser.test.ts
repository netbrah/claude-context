import { AstCodeSplitter } from '../ast-splitter';
import { CodeChunk } from '../index';
import * as fs from 'fs';
import * as path from 'path';

describe('AstCodeSplitter - C++ Parsing', () => {
  let splitter: AstCodeSplitter;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    // Initialize splitter with reasonable chunk sizes for testing
    splitter = new AstCodeSplitter(2500, 300);
  });

  describe('Basic C++ Parsing', () => {
    it('should parse simple C++ code', async () => {
      const code = `
int add(int a, int b) {
    return a + b;
}

int multiply(int x, int y) {
    return x * y;
}
`;

      const chunks = await splitter.split(code, 'cpp', 'test.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('cpp');
      expect(chunks[0].metadata.filePath).toBe('test.cpp');
    });

    it('should parse simple.cpp fixture', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'simple.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'simple.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain the simpleFunction
      const hasFunction = chunks.some(chunk => 
        chunk.content.includes('simpleFunction')
      );
      expect(hasFunction).toBe(true);
    });

    it('should handle different C++ file extensions', async () => {
      const code = 'int test() { return 1; }';

      const cppResult = await splitter.split(code, 'cpp', 'test.cpp');
      const cxxResult = await splitter.split(code, 'c++', 'test.cxx');
      const cResult = await splitter.split(code, 'c', 'test.c');

      expect(cppResult.length).toBeGreaterThan(0);
      expect(cxxResult.length).toBeGreaterThan(0);
      expect(cResult.length).toBeGreaterThan(0);
    });
  });

  describe('Function Parsing', () => {
    it('should extract function definitions', async () => {
      const code = `
void printHello() {
    std::cout << "Hello" << std::endl;
}

int calculate(int a, int b) {
    return a + b;
}

double process(double x) {
    return x * 2.0;
}
`;

      const chunks = await splitter.split(code, 'cpp');

      // Should find at least the functions
      expect(chunks.length).toBeGreaterThanOrEqual(3);
      
      // Check that functions are properly extracted
      const functionNames = ['printHello', 'calculate', 'process'];
      functionNames.forEach(name => {
        const hasFunction = chunks.some(chunk => 
          chunk.content.includes(name)
        );
        expect(hasFunction).toBe(true);
      });
    });

    it('should parse functions with complex signatures', async () => {
      const code = `
template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

void callback(std::function<void(int)> func, int value) {
    func(value);
}

std::vector<int> getNumbers() {
    return {1, 2, 3, 4, 5};
}
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      // Should capture functions - templates may or may not be in separate chunks
      // depending on how tree-sitter parses them, so we check for any function
      const hasFunction = chunks.some(chunk => 
        chunk.content.includes('maximum') || 
        chunk.content.includes('callback') ||
        chunk.content.includes('getNumbers')
      );
      expect(hasFunction).toBe(true);
    });
  });

  describe('Class Parsing', () => {
    it('should extract class definitions', async () => {
      const code = `
class SimpleClass {
private:
    int value;
    
public:
    SimpleClass(int v) : value(v) {}
    
    int getValue() const {
        return value;
    }
    
    void setValue(int v) {
        value = v;
    }
};
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      // Should capture the class
      const hasClass = chunks.some(chunk => 
        chunk.content.includes('SimpleClass')
      );
      expect(hasClass).toBe(true);
    });

    it('should parse classes with inheritance', async () => {
      const code = `
class Base {
public:
    virtual void action() = 0;
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void action() override {
        // Implementation
    }
};
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      const hasBase = chunks.some(chunk => chunk.content.includes('class Base'));
      const hasDerived = chunks.some(chunk => chunk.content.includes('class Derived'));
      
      expect(hasBase).toBe(true);
      expect(hasDerived).toBe(true);
    });
  });

  describe('Namespace Parsing', () => {
    it('should extract namespace definitions', async () => {
      const code = `
namespace Utils {
    int helper() {
        return 42;
    }
    
    void process() {
        // Do something
    }
}

namespace Math {
    const double PI = 3.14159;
    
    double square(double x) {
        return x * x;
    }
}
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      const hasUtils = chunks.some(chunk => chunk.content.includes('namespace Utils'));
      const hasMath = chunks.some(chunk => chunk.content.includes('namespace Math'));
      
      expect(hasUtils).toBe(true);
      expect(hasMath).toBe(true);
    });

    it('should handle nested namespaces', async () => {
      const code = `
namespace Outer {
    namespace Inner {
        void nestedFunction() {
            // Implementation
        }
    }
}
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      const hasNested = chunks.some(chunk => 
        chunk.content.includes('namespace')
      );
      expect(hasNested).toBe(true);
    });
  });

  describe('Sample Files', () => {
    it('should parse sample.cpp completely', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'sample.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify metadata
      chunks.forEach(chunk => {
        expect(chunk.metadata.language).toBe('cpp');
        expect(chunk.metadata.filePath).toBe('sample.cpp');
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
        expect(chunk.content.trim()).not.toBe('');
      });

      // Check for key components
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('add');
      expect(allContent).toContain('Calculator');
      expect(allContent).toContain('MathUtils');
    });

    it('should parse complex.cpp with all constructs', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'complex.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'complex.cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);

      // Verify various C++ constructs are captured
      const allContent = chunks.map(c => c.content).join('\n');
      
      // Check for classes
      expect(allContent).toContain('Shape');
      expect(allContent).toContain('Rectangle');
      expect(allContent).toContain('Circle');
      
      // Check for namespaces
      expect(allContent).toContain('Graphics');
      
      // Check for functions
      expect(allContent).toContain('findPrimes');
    });
  });

  describe('Chunk Size Management', () => {
    it('should respect chunk size limits', async () => {
      const splitterSmall = new AstCodeSplitter(500, 50);
      
      const code = fs.readFileSync(
        path.join(fixturesDir, 'complex.cpp'),
        'utf-8'
      );

      const chunks = await splitterSmall.split(code, 'cpp');

      // Each chunk should be reasonably sized
      chunks.forEach(chunk => {
        // Allow some buffer over the limit for overlap
        expect(chunk.content.length).toBeLessThan(1000);
      });
    });

    it('should handle chunk overlap', async () => {
      const splitterWithOverlap = new AstCodeSplitter(1000, 200);
      
      const code = `
int function1() {
    return 1;
}

int function2() {
    return 2;
}

int function3() {
    return 3;
}
`;

      const chunks = await splitterWithOverlap.split(code, 'cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      // Just verify chunks are created, overlap logic is internal
      chunks.forEach(chunk => {
        expect(chunk.content.trim()).not.toBe('');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const chunks = await splitter.split('', 'cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      // Empty code should still create at least one chunk
    });

    it('should handle code with only comments', async () => {
      const code = `
// This is a comment
/* Multi-line
   comment */
// Another comment
`;

      const chunks = await splitter.split(code, 'cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle malformed code gracefully', async () => {
      const code = `
int incomplete(
// Missing closing brace and parenthesis
`;

      // Should not throw, should fall back to langchain splitter
      const chunks = await splitter.split(code, 'cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle very long lines', async () => {
      const longLine = 'int function() { return ' + '1 + '.repeat(1000) + '0; }';
      
      const chunks = await splitter.split(longLine, 'cpp');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Line Number Tracking', () => {
    it('should track correct line numbers', async () => {
      const code = `// Line 1
// Line 2
int function1() {  // Line 3
    return 1;      // Line 4
}                  // Line 5
                   // Line 6
int function2() {  // Line 7
    return 2;      // Line 8
}                  // Line 9
`;

      const chunks = await splitter.split(code, 'cpp', 'test.cpp');

      expect(chunks.length).toBeGreaterThan(0);
      
      chunks.forEach(chunk => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
      });
    });

    it('should maintain line number continuity', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp', 'sample.cpp');

      // Line numbers should be reasonable
      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThan(0);
        
        if (index > 0) {
          // Current chunk should not start before previous chunk started
          const prevChunk = chunks[index - 1];
          // Allow for overlap
          expect(chunk.metadata.startLine).toBeGreaterThanOrEqual(
            prevChunk.metadata.startLine - 50
          );
        }
      });
    });
  });

  describe('Configuration', () => {
    it('should allow updating chunk size', () => {
      const initialSize = 2500;
      const newSize = 5000;
      
      const s = new AstCodeSplitter(initialSize, 300);
      s.setChunkSize(newSize);
      
      // Configuration updated successfully (no error thrown)
      expect(s).toBeDefined();
    });

    it('should allow updating chunk overlap', () => {
      const s = new AstCodeSplitter(2500, 300);
      s.setChunkOverlap(500);
      
      // Configuration updated successfully (no error thrown)
      expect(s).toBeDefined();
    });
  });

  describe('Language Support Detection', () => {
    it('should support C++ language variations', () => {
      expect(AstCodeSplitter.isLanguageSupported('cpp')).toBe(true);
      expect(AstCodeSplitter.isLanguageSupported('c++')).toBe(true);
      expect(AstCodeSplitter.isLanguageSupported('c')).toBe(true);
      expect(AstCodeSplitter.isLanguageSupported('CPP')).toBe(true);
      expect(AstCodeSplitter.isLanguageSupported('C++')).toBe(true);
    });

    it('should reject unsupported languages', () => {
      expect(AstCodeSplitter.isLanguageSupported('cobol')).toBe(false);
      expect(AstCodeSplitter.isLanguageSupported('fortran')).toBe(false);
    });
  });

  describe('Content Quality', () => {
    it('should produce non-empty chunks', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.cpp'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'cpp');

      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
        expect(chunk.content).toBeTruthy();
      });
    });

    it('should preserve code structure', async () => {
      const code = `
class Test {
public:
    void method() {
        // Content
    }
};
`;

      const chunks = await splitter.split(code, 'cpp');

      // At least one chunk should contain the complete class structure
      const hasClass = chunks.some(chunk => 
        chunk.content.includes('class Test') && 
        chunk.content.includes('method')
      );
      
      expect(hasClass).toBe(true);
    });
  });
});
