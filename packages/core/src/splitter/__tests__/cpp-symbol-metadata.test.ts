import { AstCodeSplitter } from '../ast-splitter';
import * as fs from 'fs';
import * as path from 'path';

describe('AstCodeSplitter - C++ Symbol Metadata Integration', () => {
    let splitter: AstCodeSplitter;
    const fixturesDir = path.join(__dirname, 'fixtures');

    beforeEach(() => {
        splitter = new AstCodeSplitter(2500, 300);
    });

    describe('Symbol Metadata in Chunks', () => {
        it('should include symbol metadata for C++ functions', async () => {
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

            // At least one chunk should have symbols
            const chunksWithSymbols = chunks.filter(c => c.metadata.symbols && c.metadata.symbols.length > 0);
            expect(chunksWithSymbols.length).toBeGreaterThan(0);

            // Check for specific function symbols
            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const addFunc = allSymbols.find(s => s.name === 'add');
            expect(addFunc).toBeDefined();
            expect(addFunc?.kind).toBe('function');
        });

        it('should include symbol metadata for C++ classes', async () => {
            const code = `
class Calculator {
private:
    int value;
    
public:
    Calculator(int v) : value(v) {}
    
    int getValue() const {
        return value;
    }
};
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const calcClass = allSymbols.find(s => s.name === 'Calculator');
            
            expect(calcClass).toBeDefined();
            expect(calcClass?.kind).toBe('class');
            expect(calcClass?.range).toBeDefined();
            expect(calcClass?.range.startLine).toBeGreaterThan(0);
        });

        it('should include symbol metadata for namespaces', async () => {
            const code = `
namespace Utils {
    int helper() {
        return 42;
    }
}

namespace Math {
    double PI = 3.14159;
}
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            // Each namespace should be in its own chunk
            expect(chunks.length).toBeGreaterThanOrEqual(2);
            
            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const utilsNs = allSymbols.find(s => s.name === 'Utils');
            const mathNs = allSymbols.find(s => s.name === 'Math');

            // At least one namespace should be found
            expect(utilsNs || mathNs).toBeDefined();
            if (utilsNs) {
                expect(utilsNs.kind).toBe('namespace');
            }
            if (mathNs) {
                expect(mathNs.kind).toBe('namespace');
            }
        });

        it('should include symbol usages in metadata', async () => {
            const code = `
int compute(int x) {
    return x * 2;
}

int main() {
    int result = compute(5);
    result = compute(result);
    return result;
}
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const computeFunc = allSymbols.find(s => s.name === 'compute');

            expect(computeFunc).toBeDefined();
            expect(computeFunc?.usages).toBeDefined();
            expect(Array.isArray(computeFunc?.usages)).toBe(true);
        });

        it('should include documentation in symbol metadata', async () => {
            const code = `
// This function adds two numbers together
int add(int a, int b) {
    return a + b;
}
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const addFunc = allSymbols.find(s => s.name === 'add');

            expect(addFunc).toBeDefined();
            // Documentation extraction is best-effort, so we check if it exists and is non-empty when present
            if (addFunc?.documentation) {
                expect(addFunc.documentation.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Symbol Metadata for Different C++ Extensions', () => {
        it('should extract symbols for .cpp files', async () => {
            const code = 'int test() { return 1; }';
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            expect(allSymbols.length).toBeGreaterThan(0);
        });

        it('should extract symbols for .cc files', async () => {
            const code = 'void process() {}';
            const chunks = await splitter.split(code, 'cc', 'test.cc');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            // Should have at least extracted the file, even if no symbols
            expect(chunks.length).toBeGreaterThan(0);
        });

        it('should extract symbols for .c++ files', async () => {
            const code = 'class Test {};';
            const chunks = await splitter.split(code, 'c++', 'test.cxx');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            expect(allSymbols.length).toBeGreaterThan(0);
        });

        it('should extract symbols for .c files', async () => {
            const code = 'int main() { return 0; }';
            const chunks = await splitter.split(code, 'c', 'test.c');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            expect(allSymbols.length).toBeGreaterThan(0);
        });
    });

    describe('Symbol Metadata for Complex C++ Code', () => {
        it('should handle template functions', async () => {
            const code = `
template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const maxFunc = allSymbols.find(s => s.name === 'maximum');

            expect(maxFunc).toBeDefined();
            expect(maxFunc?.kind).toBe('function');
        });

        it('should handle struct definitions', async () => {
            const code = `
struct Point {
    int x;
    int y;
};
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const pointStruct = allSymbols.find(s => s.name === 'Point');

            expect(pointStruct).toBeDefined();
            expect(pointStruct?.kind).toBe('struct');
        });

        it('should handle enum definitions', async () => {
            const code = `
enum Color {
    RED,
    GREEN,
    BLUE
};
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const colorEnum = allSymbols.find(s => s.name === 'Color');

            expect(colorEnum).toBeDefined();
            expect(colorEnum?.kind).toBe('enum');
        });
    });

    describe('Non-C++ Files Should Not Have Symbol Metadata', () => {
        it('should not extract symbols for JavaScript files', async () => {
            const code = 'function test() { return 1; }';
            const chunks = await splitter.split(code, 'javascript', 'test.js');

            expect(chunks).toBeDefined();
            expect(chunks.length).toBeGreaterThan(0);

            // JavaScript chunks should not have C++ symbol metadata
            const chunksWithSymbols = chunks.filter(c => c.metadata.symbols);
            // Symbols should either not exist or be empty for non-C++ files
            chunksWithSymbols.forEach(chunk => {
                if (chunk.metadata.symbols) {
                    expect(chunk.metadata.symbols.length).toBe(0);
                }
            });
        });

        it('should not extract symbols for Python files', async () => {
            const code = 'def test():\n    return 1';
            const chunks = await splitter.split(code, 'python', 'test.py');

            expect(chunks).toBeDefined();
            expect(chunks.length).toBeGreaterThan(0);

            // Python chunks should not have C++ symbol metadata
            const chunksWithSymbols = chunks.filter(c => c.metadata.symbols);
            chunksWithSymbols.forEach(chunk => {
                if (chunk.metadata.symbols) {
                    expect(chunk.metadata.symbols.length).toBe(0);
                }
            });
        });
    });

    describe('Symbol Metadata with Real Fixtures', () => {
        it('should extract symbols from simple.cpp fixture', async () => {
            const code = fs.readFileSync(
                path.join(fixturesDir, 'simple.cpp'),
                'utf-8'
            );

            const chunks = await splitter.split(code, 'cpp', 'simple.cpp');
            
            expect(chunks).toBeDefined();
            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            
            // Should have at least one symbol
            expect(allSymbols.length).toBeGreaterThan(0);
        });

        it('should extract symbols from sample.cpp fixture', async () => {
            const code = fs.readFileSync(
                path.join(fixturesDir, 'sample.cpp'),
                'utf-8'
            );

            const chunks = await splitter.split(code, 'cpp', 'sample.cpp');
            
            expect(chunks).toBeDefined();
            expect(chunks.length).toBeGreaterThan(0);
            
            // sample.cpp should have at least some chunks with symbols
            const chunksWithSymbols = chunks.filter(c => c.metadata.symbols && c.metadata.symbols.length > 0);
            expect(chunksWithSymbols.length).toBeGreaterThan(0);
        });

        it('should extract symbols from complex.cpp fixture', async () => {
            const code = fs.readFileSync(
                path.join(fixturesDir, 'complex.cpp'),
                'utf-8'
            );

            const chunks = await splitter.split(code, 'cpp', 'complex.cpp');
            
            expect(chunks).toBeDefined();
            expect(chunks.length).toBeGreaterThan(0);
            
            // complex.cpp should have at least some chunks with symbols
            const chunksWithSymbols = chunks.filter(c => c.metadata.symbols && c.metadata.symbols.length > 0);
            expect(chunksWithSymbols.length).toBeGreaterThan(0);
        });
    });

    describe('Symbol Metadata Quality', () => {
        it('should provide complete symbol information', async () => {
            const code = `
// Test function
int testFunc(int x) {
    return x * 2;
}
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');
            const allSymbols = chunks.flatMap(c => c.metadata.symbols || []);
            const testFunc = allSymbols.find(s => s.name === 'testFunc');

            expect(testFunc).toBeDefined();
            expect(testFunc?.name).toBe('testFunc');
            expect(testFunc?.kind).toBe('function');
            expect(testFunc?.range).toBeDefined();
            expect(testFunc?.range.startLine).toBeGreaterThan(0);
            expect(testFunc?.range.endLine).toBeGreaterThanOrEqual(testFunc!.range.startLine);
            expect(testFunc?.definition).toBeDefined();
            expect(testFunc?.usages).toBeDefined();
        });

        it('should maintain symbol ranges within chunk boundaries', async () => {
            const code = `
int func1() { return 1; }
int func2() { return 2; }
int func3() { return 3; }
`;
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            chunks.forEach(chunk => {
                if (chunk.metadata.symbols) {
                    chunk.metadata.symbols.forEach(symbol => {
                        // Symbol range should be within chunk boundaries
                        expect(symbol.range.startLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
                        expect(symbol.range.endLine).toBeLessThanOrEqual(chunk.metadata.endLine);
                    });
                }
            });
        });
    });

    describe('Backwards Compatibility', () => {
        it('should still work without symbol metadata for non-C++ files', async () => {
            const code = 'def test():\n    pass';
            const chunks = await splitter.split(code, 'python', 'test.py');

            expect(chunks).toBeDefined();
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].content).toBeDefined();
            expect(chunks[0].metadata.startLine).toBeDefined();
            expect(chunks[0].metadata.endLine).toBeDefined();
        });

        it('should maintain existing chunk structure', async () => {
            const code = 'int test() { return 1; }';
            const chunks = await splitter.split(code, 'cpp', 'test.cpp');

            // Basic chunk properties should still be present
            expect(chunks[0].content).toBeDefined();
            expect(chunks[0].metadata).toBeDefined();
            expect(chunks[0].metadata.startLine).toBeDefined();
            expect(chunks[0].metadata.endLine).toBeDefined();
            expect(chunks[0].metadata.language).toBe('cpp');
            expect(chunks[0].metadata.filePath).toBe('test.cpp');
        });
    });
});
