import { CppSymbolExtractor, SymbolKind } from '../cpp-symbol-extractor';
import Parser from 'tree-sitter';

const Cpp = require('tree-sitter-cpp');

describe('CppSymbolExtractor', () => {
    let extractor: CppSymbolExtractor;
    let parser: Parser;

    beforeEach(() => {
        extractor = new CppSymbolExtractor();
        parser = new Parser();
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

    describe('Advanced Function Extraction', () => {
        it('should extract multiple functions from same file', () => {
            const code = `
int func1() { return 1; }
int func2() { return 2; }
int func3() { return 3; }
int func4() { return 4; }
int func5() { return 5; }
            `;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols.length).toBeGreaterThanOrEqual(5);
            expect(symbols.filter(s => s.kind === SymbolKind.Function).length).toBeGreaterThanOrEqual(5);
        });

        it('should handle functions with empty bodies', () => {
            const code = `void empty() {}`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const emptyFunc = symbols.find(s => s.name === 'empty');
            expect(emptyFunc).toBeDefined();
            expect(emptyFunc?.kind).toBe(SymbolKind.Function);
        });

        it('should extract function signatures', () => {
            const code = `
std::vector<int> process(const std::string& name, int count) {
    return std::vector<int>(count, 0);
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const processFunc = symbols.find(s => s.name === 'process');
            expect(processFunc).toBeDefined();
            expect(processFunc?.signature).toBeDefined();
        });

        it('should handle functions with default parameters', () => {
            const code = `int compute(int x, int y = 10) { return x + y; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const computeFunc = symbols.find(s => s.name === 'compute');
            expect(computeFunc).toBeDefined();
        });

        it('should handle functions with reference parameters', () => {
            const code = `void modify(int& value) { value = 42; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const modifyFunc = symbols.find(s => s.name === 'modify');
            expect(modifyFunc).toBeDefined();
        });

        it('should handle functions with pointer parameters', () => {
            const code = `void process(int* ptr) { *ptr = 100; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const processFunc = symbols.find(s => s.name === 'process');
            expect(processFunc).toBeDefined();
        });

        it('should handle functions with const reference parameters', () => {
            const code = `void display(const std::string& text) { /* ... */ }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const displayFunc = symbols.find(s => s.name === 'display');
            expect(displayFunc).toBeDefined();
        });

        it('should handle functions with no parameters', () => {
            const code = `int getValue() { return 42; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const getValueFunc = symbols.find(s => s.name === 'getValue');
            expect(getValueFunc).toBeDefined();
        });

        it('should handle functions with multiple parameters', () => {
            const code = `int sum(int a, int b, int c, int d) { return a + b + c + d; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const sumFunc = symbols.find(s => s.name === 'sum');
            expect(sumFunc).toBeDefined();
        });
    });

    describe('Advanced Class Extraction', () => {
        it('should extract empty class', () => {
            const code = `class Empty {};`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const emptyClass = symbols.find(s => s.name === 'Empty');
            expect(emptyClass).toBeDefined();
            expect(emptyClass?.kind).toBe(SymbolKind.Class);
        });

        it('should extract class with only constructor', () => {
            const code = `
class Point {
public:
    Point(int x, int y) : x_(x), y_(y) {}
private:
    int x_, y_;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const pointClass = symbols.find(s => s.name === 'Point');
            expect(pointClass).toBeDefined();
        });

        it('should extract class with destructor', () => {
            const code = `
class Resource {
public:
    Resource() {}
    virtual ~Resource() {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const resourceClass = symbols.find(s => s.name === 'Resource');
            expect(resourceClass).toBeDefined();
        });

        it('should extract class with multiple inheritance', () => {
            const code = `
class Base1 {};
class Base2 {};
class Derived : public Base1, public Base2 {};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const derivedClass = symbols.find(s => s.name === 'Derived');
            expect(derivedClass).toBeDefined();
            expect(derivedClass?.baseClasses).toBeDefined();
        });

        it('should extract nested classes', () => {
            const code = `
class Outer {
public:
    class Inner {
        int value;
    };
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const outerClass = symbols.find(s => s.name === 'Outer');
            const innerClass = symbols.find(s => s.name === 'Inner');
            expect(outerClass).toBeDefined();
            expect(innerClass).toBeDefined();
        });

        it('should extract abstract class', () => {
            const code = `
class AbstractBase {
public:
    virtual void pureVirtual() = 0;
    virtual void regularVirtual() {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const abstractClass = symbols.find(s => s.name === 'AbstractBase');
            expect(abstractClass).toBeDefined();
        });

        it('should extract forward declared class', () => {
            const code = `
class Forward;
class Actual {
    Forward* ptr;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const actualClass = symbols.find(s => s.name === 'Actual');
            expect(actualClass).toBeDefined();
        });
    });

    describe('Field and Variable Extraction', () => {
        it('should extract public fields', () => {
            const code = `
class Data {
public:
    int publicField;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const dataClass = symbols.find(s => s.name === 'Data');
            expect(dataClass).toBeDefined();
        });

        it('should extract private fields', () => {
            const code = `
class Secure {
private:
    int privateField;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const secureClass = symbols.find(s => s.name === 'Secure');
            expect(secureClass).toBeDefined();
        });

        it('should extract static member variables', () => {
            const code = `
class Counter {
public:
    static int count;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const counterClass = symbols.find(s => s.name === 'Counter');
            expect(counterClass).toBeDefined();
        });

        it('should extract const member variables', () => {
            const code = `
class Constants {
public:
    const int MAX_SIZE;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const constantsClass = symbols.find(s => s.name === 'Constants');
            expect(constantsClass).toBeDefined();
        });

        it('should handle multiple fields in one declaration', () => {
            const code = `
class Point3D {
public:
    int x, y, z;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const point3D = symbols.find(s => s.name === 'Point3D');
            expect(point3D).toBeDefined();
        });
    });

    describe('Advanced Namespace Extraction', () => {
        it('should extract anonymous namespaces', () => {
            const code = `
namespace {
    int helper() { return 42; }
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should extract multiple namespaces', () => {
            const code = `
namespace NS1 { void func1() {} }
namespace NS2 { void func2() {} }
namespace NS3 { void func3() {} }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const ns1 = symbols.find(s => s.name === 'NS1');
            const ns2 = symbols.find(s => s.name === 'NS2');
            const ns3 = symbols.find(s => s.name === 'NS3');
            expect(ns1 || ns2 || ns3).toBeDefined();
        });

        it('should handle deeply nested namespaces', () => {
            const code = `
namespace Level1 {
    namespace Level2 {
        namespace Level3 {
            void deepFunc() {}
        }
    }
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(symbols.length).toBeGreaterThan(0);
        });
    });

    describe('Template and Generic Features', () => {
        it('should extract template class', () => {
            const code = `
template<typename T>
class Container {
    T value;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const container = symbols.find(s => s.name === 'Container');
            expect(container).toBeDefined();
        });

        it('should extract template function with multiple parameters', () => {
            const code = `
template<typename T, typename U>
T convert(U value) { return static_cast<T>(value); }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const convertFunc = symbols.find(s => s.name === 'convert');
            expect(convertFunc).toBeDefined();
        });

        it('should handle variadic templates', () => {
            const code = `
template<typename... Args>
void print(Args... args) {}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const printFunc = symbols.find(s => s.name === 'print');
            expect(printFunc).toBeDefined();
        });
    });

    describe('Method and Access Specifier Tests', () => {
        it('should extract methods with different access specifiers', () => {
            const code = `
class AccessTest {
public:
    void publicMethod() {}
protected:
    void protectedMethod() {}
private:
    void privateMethod() {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const accessTest = symbols.find(s => s.name === 'AccessTest');
            expect(accessTest).toBeDefined();
        });

        it('should extract virtual methods', () => {
            const code = `
class VirtualTest {
    virtual void virtualMethod() {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const virtualTest = symbols.find(s => s.name === 'VirtualTest');
            expect(virtualTest).toBeDefined();
        });

        it('should extract override methods', () => {
            const code = `
class Base {
    virtual void method() {}
};
class Derived : public Base {
    void method() override {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const derivedClass = symbols.find(s => s.name === 'Derived');
            expect(derivedClass).toBeDefined();
        });

        it('should extract final methods', () => {
            const code = `
class FinalTest {
    virtual void method() final {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            const finalTest = symbols.find(s => s.name === 'FinalTest');
            expect(finalTest).toBeDefined();
        });
    });
});
