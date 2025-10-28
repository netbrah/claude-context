# Standalone Bundle Installation Guide

This guide explains how to create and use completely self-contained Claude Context bundles for air-gapped/offline Linux systems.

## Overview

The standalone bundle includes:
- All JavaScript dependencies bundled together (no npm/pnpm install needed)
- Pre-compiled native modules (optional, but recommended)
- Installation script for easy deployment
- Complete offline installation capability

## Building the Bundle

### Prerequisites on Build System

```bash
# Node.js 20-22 (required)
node --version

# pnpm (required)
pnpm --version

# Build tools for native modules (required for Perl parser)
sudo apt-get install build-essential python3
```

### Step 1: Build Native Modules (Recommended)

#### Build Perl Parser

The Perl tree-sitter parser requires native compilation:

```bash
# Build Perl parser for your Linux platform
pnpm run build:perl-parser

# This creates: prebuilds/tree-sitter-perl-x86_64-linux.node
```

#### Get faiss-node Prebuild

Download or locate your faiss-node prebuild:

```bash
# Example: faiss-node v0.5.1 for Linux x64
# faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
```

### Step 2: Create Standalone Bundle

```bash
# Create bundle with all dependencies
pnpm run bundle:standalone

# Or build everything including Perl parser
pnpm run bundle:full
```

This creates: `bundle-output/claude-context-standalone-YYYYMMDD-HHMMSS.tar.gz`

## Installing on Target System

### Option 1: With Prebuilt Native Modules (Recommended)

Transfer these files to your target system:
- `claude-context-standalone-*.tar.gz`
- `tree-sitter-perl-x86_64-linux.node` (from prebuilds/)
- `faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz`

```bash
# Extract bundle
tar -xzf claude-context-standalone-*.tar.gz
cd claude-context-standalone

# Install with prebuilds
FAISS_PREBUILD=/path/to/faiss-node.tar.gz \
PERL_PARSER_PREBUILD=/path/to/tree-sitter-perl.node \
./install.sh
```

### Option 2: Without Prebuilds (Requires Compilation)

If you have build tools on the target system:

```bash
# Extract and install
tar -xzf claude-context-standalone-*.tar.gz
cd claude-context-standalone
./install.sh

# Native modules will need manual compilation if they fail
```

### Option 3: Custom Installation Directory

```bash
# Install to custom location
./install.sh /custom/path/to/installation
```

## MCP Configuration

After installation, update your MCP config file (e.g., `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "claude-context": {
      "command": "/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp",
      "args": [],
      "env": {
        "OPENAI_API_KEY": "your-key-here",
        "OPENAI_BASE_URL": "https://your-proxy.com/v1",
        "EMBEDDING_PROVIDER": "OpenAI",
        "EMBEDDING_MODEL": "text-embedding-3-large",
        "EMBEDDING_BATCH_SIZE": "100",
        "MILVUS_ADDRESS": "localhost:19530",
        "MILVUS_TOKEN": "",
        "SPLITTER_TYPE": "ast",
        "CHUNK_SIZE": "1000",
        "CHUNK_OVERLAP": "200",
        "CUSTOM_IGNORE_PATTERNS": "**/.git/**,**/__pycache__/**",
        "PATH": "/usr/bin:${env:PATH}"
      }
    }
  }
}
```

## Bundle Contents

The standalone bundle contains:

```
claude-context-standalone/
├── install.sh                                    # Installation script
├── README.md                                     # Installation instructions
├── zilliz-claude-context-core-0.1.3.tgz         # Core package with ALL dependencies
└── zilliz-claude-context-mcp-0.1.3.tgz          # MCP server with bundled dependencies
```

### What's Bundled

**JavaScript dependencies** (bundled, no installation needed):
- All tree-sitter parsers (JavaScript, Python, TypeScript, C++, Java, Go, Rust, etc.)
- LangChain and all its dependencies
- Milvus SDK
- OpenAI/Gemini/Ollama/VoyageAI clients
- All other JavaScript packages

**Native modules** (require prebuilds or compilation):
- `faiss-node` - Vector similarity search
- `@ganezdragon/tree-sitter-perl` - Perl code parsing

## Troubleshooting

### Native Module Issues

**Problem**: `Error: Cannot find module 'faiss-node'`

**Solution**: Provide faiss-node prebuild:
```bash
FAISS_PREBUILD=/path/to/faiss-node.tar.gz ./install.sh
```

**Problem**: `Error loading Perl parser`

**Solution**: Build Perl parser on system with build tools:
```bash
# On a system with gcc/g++/make
cd /path/to/installation
pnpm run build:perl-parser

# Copy the .node file to your target system
```

### Permission Issues

```bash
chmod +x install.sh
chmod +x node_modules/.bin/claude-context-mcp
```

### Node Version Mismatch

Ensure Node.js 20-22 (not 24+):
```bash
node --version  # Should show v20.x or v22.x
```

## Advanced: Manual Installation

If the install script fails, you can manually set up:

```bash
# Extract packages
tar -xzf zilliz-claude-context-core-0.1.3.tgz
tar -xzf zilliz-claude-context-mcp-0.1.3.tgz

# Create node_modules structure
mkdir -p node_modules/@zilliz
ln -s $PWD/package node_modules/@zilliz/claude-context-core
ln -s $PWD/package node_modules/@zilliz/claude-context-mcp

# Create MCP binary
mkdir -p node_modules/.bin
cat > node_modules/.bin/claude-context-mcp << 'EOF'
#!/usr/bin/env node
require('../@zilliz/claude-context-mcp/dist/index.js');
EOF
chmod +x node_modules/.bin/claude-context-mcp
```

## Building for Different Platforms

To create bundles for different Linux distributions:

1. **Build on target platform** (recommended)
   ```bash
   # On each target platform
   pnpm run bundle:full
   ```

2. **Cross-compile native modules**
   - Use Docker containers matching target OS
   - Use node-gyp with appropriate toolchains

## Comparison with npm Install Method

| Feature | Standalone Bundle | npm install |
|---------|------------------|-------------|
| Internet required | No (after bundle created) | Yes |
| Install speed | Fast (pre-bundled) | Slow (downloads each package) |
| Reproducible | Yes (frozen deps) | Requires lockfile |
| Native modules | Manual prebuilds | Auto-downloads (may fail) |
| Proxy handling | Not needed | Complex configuration |

## CI/CD Integration

Add to your build pipeline:

```yaml
# .github/workflows/build-bundle.yml
- name: Build standalone bundle
  run: |
    pnpm install
    pnpm run build:perl-parser
    pnpm run bundle:standalone
    
- name: Upload bundle
  uses: actions/upload-artifact@v3
  with:
    name: claude-context-bundle
    path: bundle-output/*.tar.gz
```

## Security Considerations

- Bundle contains all dependencies at build time
- No supply chain attacks during installation (offline)
- Audit dependencies before building bundle
- Keep bundle creation system secure

## See Also

- [BUILD_TREE_SITTER_PERL.md](BUILD_TREE_SITTER_PERL.md) - Detailed Perl parser build instructions
- [environment-variables.md](getting-started/environment-variables.md) - Configuration options
- [troubleshooting-guide.md](troubleshooting/troubleshooting-guide.md) - Common issues
