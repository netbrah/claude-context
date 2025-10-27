# C++ Symbol Metadata Example

This example demonstrates the new symbol metadata extraction feature for C++ files.

## What's New

When parsing C++ files (.cpp, .cc, .c, .ut), the AST splitter now automatically extracts symbol metadata including:

- **Symbol names**: Functions, classes, structs, enums, namespaces
- **Symbol kinds**: Categorized by type (function, class, struct, enum, namespace, etc.)
- **Definitions**: Line and column numbers where symbols are defined
- **Usages**: All locations where symbols are referenced
- **Documentation**: Extracted from comments above symbols
- **Ranges**: Complete range information for each symbol

## Usage

```typescript
import { AstCodeSplitter } from '@zilliz/claude-context-core';

const splitter = new AstCodeSplitter();

const cppCode = `
// This function adds two numbers
int add(int a, int b) {
    return a + b;
}

class Calculator {
public:
    int multiply(int x, int y) {
        return x * y;
    }
};

namespace Math {
    const double PI = 3.14159;
}
`;

const chunks = await splitter.split(cppCode, 'cpp', 'example.cpp');

// Access symbol metadata
chunks.forEach(chunk => {
    if (chunk.metadata.symbols) {
        chunk.metadata.symbols.forEach(symbol => {
            console.log(`Symbol: ${symbol.name}`);
            console.log(`  Kind: ${symbol.kind}`);
            console.log(`  Defined at: line ${symbol.definition?.line}, col ${symbol.definition?.column}`);
            console.log(`  Usages: ${symbol.usages?.length || 0} references`);
            if (symbol.documentation) {
                console.log(`  Documentation: ${symbol.documentation}`);
            }
        });
    }
});
```

## Example Output

```
Symbol: add
  Kind: function
  Defined at: line 3, col 0
  Usages: 0 references
  Documentation: This function adds two numbers

Symbol: Calculator
  Kind: class
  Defined at: line 7, col 0
  Usages: 0 references

Symbol: Math
  Kind: namespace
  Defined at: line 13, col 0
  Usages: 0 references
```

## Symbol Metadata Structure

```typescript
interface SymbolInfo {
    name: string;                    // Symbol name
    kind: string;                    // Symbol kind (function, class, struct, etc.)
    range: {
        startLine: number;
        endLine: number;
        startColumn: number;
        endColumn: number;
    };
    definition?: {                   // Where the symbol is defined
        line: number;
        column: number;
    };
    usages?: Array<{                // Where the symbol is used
        line: number;
        column: number;
    }>;
    documentation?: string;          // Extracted from comments
}
```

## Supported C++ Extensions

- `.cpp` - C++ source files
- `.cc` - C++ source files (alternative extension)
- `.c` - C source files
- `.c++` - C++ source files (alternative extension)
- `.h` / `.hpp` - Header files (when explicitly parsed as C++)

## Benefits

This feature enables:

1. **Better Code Understanding**: AI models can understand code structure and relationships
2. **Improved Search**: Find symbols and their usages across your codebase
3. **Context-Aware Analysis**: Understand how symbols are used and defined
4. **Documentation Integration**: Automatically extract and index documentation

## Inspiration

This feature was inspired by the [Language-Server-MCP-Bridge](https://github.com/sehejjain/Language-Server-MCP-Bridge) project, which uses VSCode's Language Server Protocol to provide similar metadata. Our implementation uses tree-sitter for standalone operation without requiring a full LSP server.
