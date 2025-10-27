# Claude Context - Copilot Instructions

## Project Overview

Claude Context is a monorepo that provides semantic code search capabilities for AI coding agents through Multiple Vector Database integration and Model Context Protocol (MCP). It enables AI agents to efficiently search large codebases using hybrid search (BM25 + dense vectors) rather than loading entire directories into context.

**Architecture**: Three-tier system consisting of:
- `@zilliz/claude-context-core`: Core indexing engine with AST-based code splitting
- `@zilliz/claude-context-mcp`: MCP server for AI agent integration (main product)
- VSCode extension: IDE integration for semantic search

## Development Workflow

### Essential Commands
```bash
# Development setup (Node.js 20-22 required, NOT 24+)
pnpm install && pnpm build

# Package-specific development
pnpm dev:core     # Core engine with file watching
pnpm dev:mcp      # MCP server with tsx --watch
pnpm dev:vscode   # VSCode extension development

# Testing
pnpm test:core                    # Jest tests
./run-parser-tests.sh            # Quick AST parser validation
pnpm benchmark:cpp               # C++ parsing performance
```

### Build Dependencies & Order
1. **Core must build first** - other packages depend on it via `workspace:*`
2. **TypeScript composite project** - uses project references in root `tsconfig.json`
3. **Cross-platform builds** - uses `rimraf` instead of `rm -rf`

### Environment Configuration
- **Global config**: `~/.context/.env` loads before MCP clients
- **Provider flexibility**: `EMBEDDING_PROVIDER` supports OpenAI/VoyageAI/Gemini/Ollama
- **Hybrid search default**: `HYBRID_MODE=true` (BM25 + dense vectors)

## Core Architecture Patterns

### Embedding & Vector Database Strategy
```typescript
// Standard initialization pattern in packages/mcp/src/index.ts
const embedding = createEmbeddingInstance(config);
const vectorDatabase = new MilvusVectorDatabase({
    address: config.milvusAddress,
    token: config.milvusToken
});
const context = new Context({ embedding, vectorDatabase });
```

### Code Splitting Philosophy
- **AST-first with fallback**: `AstCodeSplitter` attempts syntax-aware splitting, falls back to LangChain for unsupported languages
- **Language detection**: File extension → language mapping in `context.ts`
- **Chunking strategy**: Respects function/class boundaries when possible

### MCP Protocol Implementation
- **stdio transport**: All console.log redirected to stderr to avoid corrupting JSON protocol
- **Tool descriptions**: Include usage guidance and absolute path requirements
- **Error handling**: Distinguishes between user errors vs system failures

## File Processing Rules

### Supported Extensions (DEFAULT_SUPPORTED_EXTENSIONS)
Programming: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, `.cpp`, `.c`, `.h`, `.hpp`, `.cs`, `.go`, `.rs`, `.php`, `.rb`, `.swift`, `.kt`, `.scala`, `.m`, `.mm`, `.cc`, `.ut`, `.pl`, `.pm`, `.thpl`

Documentation: `.md`, `.markdown`, `.ipynb`, `.smf`

### Ignore Patterns Logic
1. **Default patterns** (build dirs, IDE files, VCS)
2. **Project-specific**: Loads `.gitignore`, `.contextignore`, etc. from codebase root
3. **Global patterns**: `~/.context/.contextignore`
4. **Custom patterns**: Via environment variables or MCP parameters

## Testing & Quality Patterns

### Core Package Testing
- **Jest configuration**: `packages/core/jest.config.js`
- **AST parser tests**: Validates tree-sitter integration for each language
- **Mock filesystem**: Uses `mock-fs` for isolated testing

### Performance Monitoring
- **Build benchmarks**: `scripts/build-benchmark.js` tracks package build times
- **C++ parsing**: `scripts/cpp-benchmark.js` measures AST performance
- **Embedding batching**: `EMBEDDING_BATCH_SIZE` controls batch processing

### VSCode Extension Development
- **Webpack bundling**: Production builds via `webpack.config.js`
- **Asset copying**: `copy-assets.js` handles resource files
- **Development watching**: `tsc --watch` + asset copying

## Integration Points

### MCP Client Configuration
**Standard pattern** for all MCP clients:
```json
{
  "claude-context": {
    "command": "npx",
    "args": ["@zilliz/claude-context-mcp@latest"],
    "env": {
      "OPENAI_API_KEY": "sk-...",
      "MILVUS_TOKEN": "..."
    }
  }
}
```

### Vector Database Abstraction
- **Interface**: `VectorDatabase` in `packages/core/src/vectordb/`
- **Implementation**: Currently Milvus/Zilliz Cloud only
- **Collections**: Named based on codebase path hash + hybrid mode

## Common Debugging Approaches

### MCP Server Issues
1. **Check stderr output** - all logs go there to preserve JSON protocol
2. **Validate absolute paths** - MCP tools require absolute paths
3. **Environment loading** - verify `~/.context/.env` is loaded

### Indexing Performance
- **Chunk limits**: 450k chunk limit to prevent memory issues
- **Batch processing**: Configurable via `EMBEDDING_BATCH_SIZE`
- **File size warnings**: Logs files >100KB or >50 chunks

### AST Parser Debugging
- **Language support**: Check `AstCodeSplitter.getSupportedLanguages()`
- **Fallback behavior**: AST failures gracefully fall back to LangChain
- **Tree-sitter integration**: WASM loading for browser environments

## Package Interdependencies

- **Core**: No internal dependencies, uses tree-sitter parsers
- **MCP**: Depends on core via workspace reference
- **VSCode**: Depends on core, bundles web-tree-sitter for browser
- **Examples**: Reference core and MCP for demonstrations
