/**
 * Edge Cases and Error Handling Tests for CppSymbolExtractor
 * Inspired by comprehensive test patterns from Language-Server-MCP-Bridge
 * 
 * This file focuses on:
 * - Input validation tests
 * - Parser error handling
 * - Boundary conditions
 * - Complex C++ features
 */

import { CppSymbolExtractor, SymbolKind } from '../cpp-symbol-extractor';
import Parser from 'tree-sitter';

const Cpp = require('tree-sitter-cpp');

describe('CppSymbolExtractor - Edge Cases and Error Handling', () => {
    let extractor: CppSymbolExtractor;
    let parser: Parser;

    beforeEach(() => {
        extractor = new CppSymbolExtractor();
        parser = new Parser();
        parser.setLanguage(Cpp);
    });

    describe('Input Validation Tests', () => {
        it('should handle empty code string', () => {
            const code = '';
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
            expect(symbols.length).toBe(0);
        });

        it('should handle code with only whitespace', () => {
            const code = '   \n\t\n   \n';
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle code with only comments', () => {
            const code = `
// Just a comment
/* Another comment */
// More comments
            `;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle very large code files', () => {
            // Generate a large file with many functions (using reasonable size)
            const functions = Array.from({ length: 100 }, (_, i) => 
                `void function${i}() { /* implementation */ }`
            ).join('\n');
            
            const tree = parser.parse(functions);
            const symbols = extractor.extractSymbols(tree.rootNode, functions);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
            expect(symbols.length).toBeGreaterThan(0);
        });

        it('should handle mixed language content gracefully', () => {
            const code = `
int valid() { return 1; }
const pythonLike = def invalid():
class ValidCpp {};
            `;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
            // Should at least extract valid C++ symbols
        });

        it('should handle unicode in identifiers', () => {
            const code = `
int validFunction() { return 0; }
// Unicode comment: 你好世界
            `;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(symbols.length).toBeGreaterThan(0);
        });

        it('should handle very long symbol names', () => {
            const longName = 'a'.repeat(500);
            const code = `void ${longName}() {}`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            if (symbols.length > 0) {
                expect(symbols[0].name).toBeDefined();
            }
        });

        it('should handle special characters in comments', () => {
            const code = `
// Comment with special chars: @#$%^&*()
/* Multi-line with: <>&"' */
int test() { return 0; }
            `;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const testFunc = symbols.find(s => s.name === 'test');
            expect(testFunc).toBeDefined();
        });
    });

    describe('Parser Error Handling', () => {
        it('should not throw on incomplete function definition', () => {
            const code = `
int incomplete(
// Missing closing parenthesis and body
            `;
            
            expect(() => {
                const tree = parser.parse(code);
                extractor.extractSymbols(tree.rootNode, code);
            }).not.toThrow();
        });

        it('should not throw on unmatched braces', () => {
            const code = `
class Incomplete {
    int value;
// Missing closing brace
            `;
            
            expect(() => {
                const tree = parser.parse(code);
                extractor.extractSymbols(tree.rootNode, code);
            }).not.toThrow();
        });

        it('should not throw on missing semicolons', () => {
            const code = `
int a = 5
int b = 10
void func() { return }
            `;
            
            expect(() => {
                const tree = parser.parse(code);
                extractor.extractSymbols(tree.rootNode, code);
            }).not.toThrow();
        });

        it('should not throw on incomplete template syntax', () => {
            const code = `
template<typename T
void incomplete() {}
            `;
            
            expect(() => {
                const tree = parser.parse(code);
                extractor.extractSymbols(tree.rootNode, code);
            }).not.toThrow();
        });

        it('should handle parse tree with error nodes', () => {
            const code = `
int valid() { return 1; }
@@@ invalid syntax @@@
int another() { return 2; }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            // Should still extract valid symbols
        });

        it('should handle corrupt AST nodes gracefully', () => {
            const code = `int test() { return 0; }`;
            const tree = parser.parse(code);
            
            // Should not throw even with edge case parsing
            expect(() => {
                extractor.extractSymbols(tree.rootNode, code);
            }).not.toThrow();
        });
    });

    describe('Boundary Condition Tests', () => {
        it('should handle symbol at line 0', () => {
            const code = `int firstLine() { return 0; }`;
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            if (symbols.length > 0) {
                expect(symbols[0].range.startLine).toBeGreaterThan(0);
            }
        });

        it('should handle symbol at very large line number', () => {
            // Create code with many newlines
            const prefix = '\n'.repeat(10000);
            const code = prefix + 'int farDownFunction() { return 0; }';
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            if (symbols.length > 0) {
                expect(symbols[0].range.startLine).toBeGreaterThan(10000);
            }
        });

        it('should handle zero-length symbols', () => {
            const code = `int () {}`;  // Malformed but parseable
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle maximum nesting depth', () => {
            // Create deeply nested namespaces
            let code = '';
            for (let i = 0; i < 20; i++) {
                code += `namespace N${i} { `;
            }
            code += 'void deepFunction() {}';
            for (let i = 0; i < 20; i++) {
                code += ' }';
            }
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle very long function bodies', () => {
            const longBody = Array.from({ length: 1000 }, (_, i) => 
                `    int var${i} = ${i};`
            ).join('\n');
            
            const code = `
void longFunction() {
${longBody}
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const func = symbols.find(s => s.name === 'longFunction');
            expect(func).toBeDefined();
        });

        it('should handle empty ranges', () => {
            const code = `class Empty {};`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            symbols.forEach(symbol => {
                expect(symbol.range.endLine).toBeGreaterThanOrEqual(symbol.range.startLine);
            });
        });
    });

    describe('Complex C++ Features', () => {
        it('should handle preprocessor directives', () => {
            const code = `
#define MAX 100
#ifdef DEBUG
int debugFunc() { return 1; }
#endif
int normalFunc() { return 2; }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle macro-defined functions', () => {
            const code = `
#define FUNC_MACRO(x) void func##x() { return; }
FUNC_MACRO(1)
FUNC_MACRO(2)
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle template specializations', () => {
            const code = `
template<typename T>
class Container { T value; };

template<>
class Container<int> { int value; };
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const containers = symbols.filter(s => s.name === 'Container');
            expect(containers.length).toBeGreaterThan(0);
        });

        it('should handle attributes', () => {
            const code = `
[[nodiscard]] int getValue() { return 42; }
[[deprecated("Use newFunc instead")]] void oldFunc() {}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const getValue = symbols.find(s => s.name === 'getValue');
            expect(getValue).toBeDefined();
        });

        it('should handle friend declarations', () => {
            const code = `
class A {
    friend class B;
    friend void friendFunc();
    int value;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const classA = symbols.find(s => s.name === 'A');
            expect(classA).toBeDefined();
        });

        it('should handle using declarations', () => {
            const code = `
namespace std {
    class string {};
}
using std::string;
using MyInt = int;
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });

        it('should handle operator overloading', () => {
            const code = `
class Complex {
    Complex operator+(const Complex& other) { return *this; }
    bool operator==(const Complex& other) { return true; }
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const complexClass = symbols.find(s => s.name === 'Complex');
            expect(complexClass).toBeDefined();
        });

        it('should handle lambda functions', () => {
            const code = `
int main() {
    auto lambda = [](int x) { return x * 2; };
    return 0;
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const mainFunc = symbols.find(s => s.name === 'main');
            expect(mainFunc).toBeDefined();
        });

        it('should handle constexpr functions', () => {
            const code = `
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const fact = symbols.find(s => s.name === 'factorial');
            expect(fact).toBeDefined();
        });

        it('should handle inline functions', () => {
            const code = `
inline int square(int x) { return x * x; }
class Math {
    inline int cube(int x) { return x * x * x; }
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const square = symbols.find(s => s.name === 'square');
            expect(square).toBeDefined();
        });

        it('should handle anonymous namespaces', () => {
            const code = `
namespace {
    int helper() { return 42; }
}
int publicFunc() { return helper(); }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(symbols.length).toBeGreaterThan(0);
        });

        it('should handle function overloading', () => {
            const code = `
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }
int add(int a, int b, int c) { return a + b + c; }
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const addFuncs = symbols.filter(s => s.name === 'add');
            expect(addFuncs.length).toBe(3);
        });

        it('should handle virtual and override functions', () => {
            const code = `
class Base {
    virtual void action() = 0;
    virtual void process() {}
};

class Derived : public Base {
    void action() override {}
    void process() override {}
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const baseClass = symbols.find(s => s.name === 'Base');
            const derivedClass = symbols.find(s => s.name === 'Derived');
            expect(baseClass).toBeDefined();
            expect(derivedClass).toBeDefined();
        });

        it('should handle static members', () => {
            const code = `
class Counter {
    static int count;
    static void increment() { count++; }
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const counter = symbols.find(s => s.name === 'Counter');
            expect(counter).toBeDefined();
        });

        it('should handle const methods', () => {
            const code = `
class Data {
    int getValue() const { return value; }
    void setValue(int v) { value = v; }
    int value;
};
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const data = symbols.find(s => s.name === 'Data');
            expect(data).toBeDefined();
        });
    });

    describe('Concurrent Operations Simulation', () => {
        it('should handle multiple extraction calls on same code', () => {
            const code = `
int func1() { return 1; }
int func2() { return 2; }
            `;
            const tree = parser.parse(code);

            // Simulate concurrent calls
            const results = [
                extractor.extractSymbols(tree.rootNode, code),
                extractor.extractSymbols(tree.rootNode, code),
                extractor.extractSymbols(tree.rootNode, code)
            ];

            results.forEach(symbols => {
                expect(symbols).toBeDefined();
                expect(symbols.length).toBeGreaterThan(0);
            });
        });

        it('should handle extraction from different code simultaneously', () => {
            const code1 = `int func1() { return 1; }`;
            const code2 = `class Class2 {};`;
            const code3 = `namespace NS3 { void func3() {} }`;

            const tree1 = parser.parse(code1);
            const tree2 = parser.parse(code2);
            const tree3 = parser.parse(code3);

            const symbols1 = extractor.extractSymbols(tree1.rootNode, code1);
            const symbols2 = extractor.extractSymbols(tree2.rootNode, code2);
            const symbols3 = extractor.extractSymbols(tree3.rootNode, code3);

            expect(symbols1.length).toBeGreaterThan(0);
            expect(symbols2.length).toBeGreaterThan(0);
            expect(symbols3.length).toBeGreaterThan(0);
        });
    });

    describe('Performance and Resource Tests', () => {
        it('should complete extraction within reasonable time for large files', () => {
            const functions = Array.from({ length: 500 }, (_, i) => 
                `void function${i}(int param${i}) { return; }`
            ).join('\n');
            
            const startTime = Date.now();
            const tree = parser.parse(functions);
            const symbols = extractor.extractSymbols(tree.rootNode, functions);
            const endTime = Date.now();

            expect(symbols).toBeDefined();
            expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
        });

        it('should handle deeply nested structures efficiently', () => {
            let code = '';
            for (let i = 0; i < 10; i++) {
                code += `namespace N${i} { class C${i} { `;
            }
            code += 'void method() {}';
            for (let i = 0; i < 10; i++) {
                code += ' }; }';
            }
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            expect(Array.isArray(symbols)).toBe(true);
        });
    });

    describe('Metadata Completeness for Edge Cases', () => {
        it('should provide metadata even for malformed symbols', () => {
            const code = `
int normalFunc() { return 0; }
int ( ) { } // Malformed
            `;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            symbols.forEach(symbol => {
                expect(symbol.name).toBeDefined();
                expect(symbol.kind).toBeDefined();
                expect(symbol.range).toBeDefined();
            });
        });

        it('should handle missing documentation gracefully', () => {
            const code = `int undocumented() { return 0; }`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            if (symbols.length > 0) {
                // Documentation is optional
                expect(symbols[0].name).toBe('undocumented');
            }
        });

        it('should handle missing parameters gracefully', () => {
            const code = `void noParams() {}`;
            
            const tree = parser.parse(code);
            const symbols = extractor.extractSymbols(tree.rootNode, code);

            expect(symbols).toBeDefined();
            const func = symbols.find(s => s.name === 'noParams');
            expect(func).toBeDefined();
            // Parameters can be empty or undefined
        });
    });
});
