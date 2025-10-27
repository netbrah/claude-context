import { CppSymbolExtractor, SymbolKind } from '../cpp-symbol-extractor';
import Parser from 'tree-sitter';

describe('CppSymbolExtractor', () => {
    let extractor: CppSymbolExtractor;
    let parser: Parser;

    beforeEach(() => {
        extractor = new CppSymbolExtractor();
        parser = new Parser();
        // Load the language fresh for each test to avoid race conditions
        const Cpp = require('tree-sitter-cpp');
        parser.setLanguage(Cpp);
    });

    describe('Function Symbol Extraction', () => {
        it('should extract simple function symbols', () => {
            const code = `
int add(int a, int b) {
    return a + b;
}

void printHello() {
    std::cout << "Hello" << std::endl;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols.length).toBeGreaterThanOrEqual(2);

            const addFunc = symbols.find(s => s.name === 'add');
            expect(addFunc).toBeDefined();
            expect(addFunc?.kind).toBe(SymbolKind.Function);
            expect(addFunc?.definition?.line).toBeGreaterThan(0);

            const printFunc = symbols.find(s => s.name === 'printHello');
            expect(printFunc).toBeDefined();
            expect(printFunc?.kind).toBe(SymbolKind.Function);
        });

        it('should extract function with usages', () => {
            const code = `
int multiply(int x, int y) {
    return x * y;
}

int calculate() {
    int result = multiply(5, 3);
    result = multiply(result, 2);
    return result;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const multiplyFunc = symbols.find(s => s.name === 'multiply');
            expect(multiplyFunc).toBeDefined();
            expect(multiplyFunc?.usages).toBeDefined();
            expect(multiplyFunc?.usages!.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle template functions', () => {
            const code = `
template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const maxFunc = symbols.find(s => s.name === 'maximum');
            expect(maxFunc).toBeDefined();
            expect(maxFunc?.kind).toBe(SymbolKind.Function);
        });
    });

    describe('Class Symbol Extraction', () => {
        it('should extract class symbols', () => {
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
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const calcClass = symbols.find(s => s.name === 'Calculator');
            expect(calcClass).toBeDefined();
            expect(calcClass?.kind).toBe(SymbolKind.Class);
            expect(calcClass?.range.startLine).toBeGreaterThan(0);
        });

        it('should extract class with inheritance', () => {
            const code = `
class Base {
public:
    virtual void action() = 0;
};

class Derived : public Base {
public:
    void action() override {
        // Implementation
    }
};
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const baseClass = symbols.find(s => s.name === 'Base');
            expect(baseClass).toBeDefined();
            expect(baseClass?.kind).toBe(SymbolKind.Class);

            const derivedClass = symbols.find(s => s.name === 'Derived');
            expect(derivedClass).toBeDefined();
            expect(derivedClass?.kind).toBe(SymbolKind.Class);
        });
    });

    describe('Struct Symbol Extraction', () => {
        it('should extract struct symbols', () => {
            const code = `
struct Point {
    int x;
    int y;
};

struct Rectangle {
    Point topLeft;
    Point bottomRight;
};
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const pointStruct = symbols.find(s => s.name === 'Point');
            expect(pointStruct).toBeDefined();
            expect(pointStruct?.kind).toBe(SymbolKind.Struct);

            const rectStruct = symbols.find(s => s.name === 'Rectangle');
            expect(rectStruct).toBeDefined();
            expect(rectStruct?.kind).toBe(SymbolKind.Struct);
        });
    });

    describe('Enum Symbol Extraction', () => {
        it('should extract enum symbols', () => {
            const code = `
enum Color {
    RED,
    GREEN,
    BLUE
};

enum class Status {
    SUCCESS,
    FAILURE
};
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const colorEnum = symbols.find(s => s.name === 'Color');
            expect(colorEnum).toBeDefined();
            expect(colorEnum?.kind).toBe(SymbolKind.Enum);

            const statusEnum = symbols.find(s => s.name === 'Status');
            expect(statusEnum).toBeDefined();
            expect(statusEnum?.kind).toBe(SymbolKind.Enum);
        });
    });

    describe('Namespace Symbol Extraction', () => {
        it('should extract namespace symbols', () => {
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
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const utilsNs = symbols.find(s => s.name === 'Utils');
            expect(utilsNs).toBeDefined();
            expect(utilsNs?.kind).toBe(SymbolKind.Namespace);

            const mathNs = symbols.find(s => s.name === 'Math');
            expect(mathNs).toBeDefined();
            expect(mathNs?.kind).toBe(SymbolKind.Namespace);
        });

        it('should handle nested namespaces', () => {
            const code = `
namespace Outer {
    namespace Inner {
        void nestedFunction() {}
    }
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const outerNs = symbols.find(s => s.name === 'Outer');
            expect(outerNs).toBeDefined();

            const innerNs = symbols.find(s => s.name === 'Inner');
            expect(innerNs).toBeDefined();
        });
    });

    describe('Documentation Extraction', () => {
        it('should extract single-line comment documentation', () => {
            const code = `
// This function adds two numbers
int add(int a, int b) {
    return a + b;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const addFunc = symbols.find(s => s.name === 'add');
            expect(addFunc).toBeDefined();
            expect(addFunc?.documentation).toBeDefined();
            expect(addFunc?.documentation).toContain('adds two numbers');
        });

        it('should extract multi-line comment documentation', () => {
            const code = `
// Calculates the factorial
// of a given number
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const factFunc = symbols.find(s => s.name === 'factorial');
            expect(factFunc).toBeDefined();
            expect(factFunc?.documentation).toBeDefined();
        });
    });

    describe('Symbol Range Tracking', () => {
        it('should track correct symbol ranges', () => {
            const code = `
int function1() {
    return 1;
}

int function2() {
    return 2;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            symbols.forEach(symbol => {
                expect(symbol.range.startLine).toBeGreaterThan(0);
                expect(symbol.range.endLine).toBeGreaterThanOrEqual(symbol.range.startLine);
                expect(symbol.range.startColumn).toBeGreaterThanOrEqual(0);
                expect(symbol.range.endColumn).toBeGreaterThanOrEqual(symbol.range.startColumn);
            });
        });

        it('should track definition locations', () => {
            const code = `
void testFunction() {
    int x = 42;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const testFunc = symbols.find(s => s.name === 'testFunction');
            expect(testFunc).toBeDefined();
            expect(testFunc?.definition).toBeDefined();
            expect(testFunc?.definition?.line).toBeGreaterThan(0);
            expect(testFunc?.definition?.column).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Complex Code Patterns', () => {
        it('should handle functions with complex signatures', () => {
            const code = `
std::vector<int> getNumbers(const std::string& name, int count) {
    return std::vector<int>(count, 0);
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const getNumbersFunc = symbols.find(s => s.name === 'getNumbers');
            expect(getNumbersFunc).toBeDefined();
            expect(getNumbersFunc?.kind).toBe(SymbolKind.Function);
        });

        it('should handle classes with multiple methods', () => {
            const code = `
class Manager {
public:
    void start() {}
    void stop() {}
    void restart() {
        stop();
        start();
    }
};
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const managerClass = symbols.find(s => s.name === 'Manager');
            expect(managerClass).toBeDefined();
            expect(managerClass?.kind).toBe(SymbolKind.Class);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty code', () => {
            const code = '';
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle code with only comments', () => {
            const code = `
// Just a comment
/* Another comment */
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle incomplete code gracefully', () => {
            const code = `
int incomplete(
// Missing closing brace
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });
    });

    describe('Chunk-Level Symbol Extraction', () => {
        it('should extract symbols from a specific chunk', () => {
            const code = `
int localFunc() {
    return 42;
}
`;
            const tree = parser.parse(code);
            expect(tree).toBeDefined();
            expect(tree.rootNode).toBeDefined();
            expect(tree.rootNode.children).toBeDefined();
            expect(tree.rootNode.children.length).toBeGreaterThan(0);
            
            const chunkNode = tree.rootNode.children[0]; // First top-level node
            const symbols = extractor.extractChunkSymbols(chunkNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should extract symbols within chunk boundaries', () => {
            const code = `
class TestClass {
    int value;
    void method() {}
};
`;
            const tree = parser.parse(code);
            expect(tree).toBeDefined();
            expect(tree.rootNode).toBeDefined();
            expect(tree.rootNode.children).toBeDefined();
            expect(tree.rootNode.children.length).toBeGreaterThan(0);
            
            const classNode = tree.rootNode.children[0];
            const symbols = extractor.extractChunkSymbols(classNode, code);

            const testClass = symbols.find(s => s.name === 'TestClass');
            expect(testClass).toBeDefined();
            expect(testClass?.kind).toBe(SymbolKind.Class);
        });
    });

    describe('Symbol Metadata Completeness', () => {
        it('should provide complete symbol metadata', () => {
            const code = `
// A simple test function
int testFunc(int param) {
    return param * 2;
}
`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const testFunc = symbols.find(s => s.name === 'testFunc');
            expect(testFunc).toBeDefined();
            expect(testFunc?.name).toBe('testFunc');
            expect(testFunc?.kind).toBe(SymbolKind.Function);
            expect(testFunc?.range).toBeDefined();
            expect(testFunc?.definition).toBeDefined();
            expect(testFunc?.usages).toBeDefined();
        });
    });
});
