# C++ Symbol Metadata Example

This example demonstrates the enhanced symbol metadata extraction feature for C++ files with LSP-like capabilities.

## What's New

When parsing C++ files (.cpp, .cc, .c, .c++), the AST splitter now automatically extracts rich symbol metadata including:

### Core Symbol Information
- **Symbol names**: Functions, classes, structs, enums, namespaces
- **Symbol kinds**: Categorized by type (function, class, struct, enum, namespace, etc.)
- **Definitions**: Line and column numbers where symbols are defined
- **Usages**: All locations where symbols are referenced
- **Documentation**: Extracted from comments above symbols
- **Ranges**: Complete range information for each symbol

### LSP-like Enhancements for Better Semantic Search
- **Function Signatures**: Complete signature with return type and parameters
- **Type Information**: Return types and parameter types for functions
- **Symbol Hierarchy**: Parent-child relationships (class methods, nested namespaces)
- **Access Modifiers**: Public/private/protected scope for class members
- **Function Qualifiers**: Static, virtual, and const qualifiers
- **Inheritance**: Base classes for classes and structs

These enhancements enable more precise semantic search and better code understanding for AI models.

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
            
            // LSP-like metadata
            if (symbol.signature) {
                console.log(`  Signature: ${symbol.signature}`);
            }
            if (symbol.returnType) {
                console.log(`  Return Type: ${symbol.returnType}`);
            }
            if (symbol.parameters) {
                console.log(`  Parameters: ${symbol.parameters.map(p => `${p.type} ${p.name}`).join(', ')}`);
            }
            if (symbol.parentSymbol) {
                console.log(`  Parent: ${symbol.parentSymbol}`);
            }
            if (symbol.scope) {
                console.log(`  Scope: ${symbol.scope}`);
            }
            if (symbol.baseClasses) {
                console.log(`  Base Classes: ${symbol.baseClasses.join(', ')}`);
            }
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
  Signature: int add(int a, int b)
  Return Type: int
  Parameters: int a, int b
  Documentation: This function adds two numbers

Symbol: multiply
  Kind: function
  Defined at: line 9, col 4
  Usages: 0 references
  Signature: int multiply(int x, int y)
  Return Type: int
  Parameters: int x, int y
  Parent: Calculator
  Scope: public

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
    
    // LSP-like enhancements for semantic search
    signature?: string;              // Full function signature (e.g., "int add(int a, int b)")
    returnType?: string;             // Return type for functions
    parameters?: Array<{             // Function parameters with types
        name: string;
        type: string;
    }>;
    parentSymbol?: string;           // Parent class/namespace name
    scope?: 'public' | 'private' | 'protected';  // Access modifier
    isStatic?: boolean;              // Static member
    isVirtual?: boolean;             // Virtual function
    isConst?: boolean;               // Const method
    baseClasses?: string[];          // Base classes for inheritance
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

1. **Better Code Understanding**: AI models can understand code structure, inheritance hierarchies, and function signatures
2. **Improved Search**: Find symbols by signature, type, or parent class for more precise queries
3. **Context-Aware Retrieval**: Semantic search can rank results by parameter types, return types, and visibility
4. **Type-Aware Analysis**: Enable queries like "find all functions returning std::vector" or "methods in class Database"
5. **Documentation Integration**: Automatically extract and index documentation alongside code

## LSP-Inspired Features

This implementation extracts metadata similar to what Language Server Protocol provides:

| LSP Feature | Implementation | Benefit for Embeddings |
|-------------|---------------|------------------------|
| **Hover Info** | Function signatures with types | Enables type-based semantic search |
| **Document Symbols** | Hierarchical symbol extraction | Preserves class/namespace structure |
| **Go to Definition** | Definition locations tracked | Links symbols to their declarations |
| **Find References** | Usage tracking within chunks | Builds lightweight call graph |
| **Signature Help** | Parameter names and types | Improves function signature matching |

## Comparison with Language-Server-MCP-Bridge

While the [Language-Server-MCP-Bridge](https://github.com/sehejjain/Language-Server-MCP-Bridge) provides real-time LSP queries via VSCode (perfect for interactive development), this implementation:

- **Pre-computes metadata at index time** - Zero latency during retrieval
- **Works standalone** - No LSP server or VSCode required
- **Optimized for embeddings** - Metadata stored with code chunks for semantic search
- **Fully offline** - All analysis happens during code parsing

Think of it as "LSP results baked into the search index" for instant, structured code understanding.
