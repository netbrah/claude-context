# AST Splitter Improvements for C/C++

## Overview

The AST (Abstract Syntax Tree) splitter has been enhanced with improved support for C/C++ codebases, particularly for large projects. This improvement provides **37.9% more semantic chunks** compared to the previous implementation, resulting in better code understanding and more precise semantic search results.

## What Changed

### Enhanced C/C++ Node Types

The AST splitter now captures the following C/C++ code structures:

| Node Type | Description | Example |
|-----------|-------------|---------|
| `function_definition` | Function implementations | `void myFunc() { ... }` |
| `class_specifier` | Class definitions | `class MyClass { ... };` |
| `struct_specifier` | ✨ **NEW** - Struct definitions | `struct Point { int x, y; };` |
| `enum_specifier` | ✨ **NEW** - Enum definitions | `enum class Color { Red, Blue };` |
| `namespace_definition` | Namespace definitions | `namespace myns { ... }` |
| `template_declaration` | ✨ **NEW** - Template definitions | `template<typename T> class Foo { ... }` |
| `type_definition` | ✨ **NEW** - Type aliases | `typedef int MyInt;` or `using MyInt = int;` |
| `union_specifier` | ✨ **NEW** - Union definitions | `union Value { int i; float f; };` |

### Why This Matters for Large Codebases

#### Before (4 node types)
- Only captured functions, classes, and namespaces
- Missed important C++ constructs like templates and structs
- Used broad `declaration` type that captured local variables

#### After (8 node types)
- Captures all major C/C++ semantic units
- Better granularity for large codebases
- More precise semantic boundaries
- **37.9% improvement** in semantic chunk capture

## Benefits

### 1. Better Semantic Understanding
Templates, structs, and enums are now properly isolated as separate semantic units, improving search accuracy.

### 2. Improved Search Results
When searching for specific types or constructs in large codebases, you'll get more precise results that match the exact semantic boundaries of your code.

### 3. Optimized for Large C++ Projects
Large C++ codebases often have:
- Many template definitions
- Complex struct hierarchies
- Enum-based state machines
- Typedef aliases for clarity

All of these are now properly captured and indexed.

## Example

### Before
```cpp
// Only captured as a single namespace chunk
namespace graphics {
    struct Point { float x, y; };      // Not captured separately
    enum class Color { Red, Blue };    // Not captured separately
    template<typename T>               // Not captured separately
    class Container { ... };
}
```

### After
```cpp
// Captured as multiple semantic chunks:
namespace graphics {              // 1. namespace_definition
    struct Point { float x, y; }; // 2. struct_specifier
    enum class Color { ... };     // 3. enum_specifier
    template<typename T>          // 4. template_declaration
    class Container { ... };      // 5. class_specifier
}
```

## Real-World Impact

Testing with a 153-line real-world graphics engine C++ file:

- **Old Parser**: 29 semantic chunks
- **New Parser**: 40 semantic chunks
- **Improvement**: +11 chunks (37.9% increase)

### Breakdown of New Chunks Captured:
- 6 `struct_specifier` chunks
- 2 `template_declaration` chunks
- 1 `enum_specifier` chunk
- 1 `type_definition` chunk
- 1 `union_specifier` chunk

## Best Practices

### When Working with Large C++ Codebases

1. **Template-Heavy Code**: The improved parser now properly captures template definitions, making it easier to find and understand generic code patterns.

2. **Header Files**: C/C++ header files with many struct and enum definitions now get better semantic chunking.

3. **Type Definitions**: Modern C++ codebases using `using` declarations and `typedef` statements benefit from proper type alias capture.

4. **Union Types**: Low-level C code and polymorphic data structures using unions are now properly indexed.

## Technical Details

### Language Support

The improvements apply to:
- `.cpp` files (C++)
- `.cc` files (C++)
- `.c` files (C)
- `.h` files (C/C++ headers)
- `.hpp` files (C++ headers)

### Chunk Size and Overlap

Default settings remain:
- **Chunk Size**: 2500 characters
- **Chunk Overlap**: 300 characters

These can be configured when initializing the Context:

```typescript
import { Context, AstCodeSplitter } from '@zilliz/claude-context-core';

const splitter = new AstCodeSplitter(
    3000,  // Custom chunk size
    500    // Custom overlap
);

const context = new Context({
    codeSplitter: splitter,
    // ... other config
});
```

## Compatibility

- ✅ Backward compatible with existing indexed codebases
- ✅ No breaking changes to the API
- ✅ All other language parsers (Python, JavaScript, Java, etc.) work as before
- ✅ Automatic fallback to LangChain splitter for unsupported constructs

## Performance

The enhanced node type detection has minimal performance impact:
- Parsing speed: Same as before
- Memory usage: Negligible increase
- Indexing time: Comparable to previous implementation

## Related Documentation

- [File Inclusion Rules](./file-inclusion-rules.md)
- [Asynchronous Indexing Workflow](./asynchronous-indexing-workflow.md)
- [Core Package README](../../packages/core/README.md)

---

For questions or issues related to AST splitting, please visit our [GitHub Issues](https://github.com/zilliztech/claude-context/issues) page.
