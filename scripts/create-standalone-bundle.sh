#!/bin/bash
# File: scripts/create-standalone-bundle.sh
# Creates a fully self-contained bundle with all dependencies for offline installation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_DIR="$ROOT_DIR/bundle-output"
TEMP_DIR="$BUNDLE_DIR/temp"

echo "🚀 Creating standalone Claude Context bundle..."
echo "📁 Root directory: $ROOT_DIR"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUNDLE_DIR"
mkdir -p "$TEMP_DIR"

# Build all packages first
echo "📦 Building packages..."
cd "$ROOT_DIR"
pnpm run build:core
pnpm run build:mcp

# Create bundled MCP package with ALL dependencies
echo "📦 Creating bundled MCP package..."
cd "$ROOT_DIR/packages/mcp"

# Temporarily modify package.json to bundle ALL dependencies
echo "🔧 Preparing bundled dependencies..."

# Backup original package.json
cp package.json package.json.backup

# Create a node script to add bundledDependencies
node -e "
const fs = require('fs');
const pkg = require('./package.json');

// Get all dependencies from core package too
const corePkg = require('../core/package.json');

// Bundle everything
pkg.bundledDependencies = [
  '@zilliz/claude-context-core',
  '@modelcontextprotocol/sdk',
  'zod',
  // Include all core dependencies
  ...Object.keys(corePkg.dependencies || {})
];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Added bundledDependencies:', pkg.bundledDependencies.length, 'packages');
"

# Install ALL dependencies (including core's dependencies) in node_modules
echo "📥 Installing all dependencies locally..."
pnpm install --prod --ignore-scripts

# Pack the MCP package with bundled dependencies
echo "📦 Creating MCP tarball with bundled dependencies..."
# Use npm pack instead of pnpm pack for better bundledDependencies support
# Filter out npm notice messages, only get the .tgz filename
PACKED_FILE=$(npm pack --pack-destination "$TEMP_DIR" 2>&1 | grep '\.tgz$' | tail -n 1)
if [ -z "$PACKED_FILE" ]; then
    echo "❌ Error: npm pack failed or no .tgz file generated"
    exit 1
fi
MCP_TARBALL="$TEMP_DIR/$PACKED_FILE"

# Restore original package.json
mv package.json.backup package.json

echo "✅ MCP bundle created: $(basename "$MCP_TARBALL")"

# Create core package tarball
echo "📦 Creating Core package tarball..."
cd "$ROOT_DIR/packages/core"
pnpm install --prod --ignore-scripts
# Filter out npm notice messages, only get the .tgz filename
CORE_PACKED=$(npm pack --pack-destination "$TEMP_DIR" 2>&1 | grep '\.tgz$' | tail -n 1)
if [ -z "$CORE_PACKED" ]; then
    echo "❌ Error: npm pack failed for core package"
    exit 1
fi
CORE_TARBALL="$TEMP_DIR/$CORE_PACKED"
echo "✅ Core bundle created: $(basename "$CORE_TARBALL")"

# Create final bundle structure
echo "📁 Creating final bundle structure..."
FINAL_BUNDLE="$BUNDLE_DIR/claude-context-standalone"
mkdir -p "$FINAL_BUNDLE"
mkdir -p "$FINAL_BUNDLE/prebuilds"

# Copy tarballs
cp "$MCP_TARBALL" "$FINAL_BUNDLE/"
cp "$CORE_TARBALL" "$FINAL_BUNDLE/"

# Copy prebuilt native modules if they exist
echo "📦 Checking for prebuilt native modules..."
if [ -d "$ROOT_DIR/prebuilds/linux-x64" ]; then
    echo "✅ Found prebuilt binaries, including in bundle..."
    
    # Copy faiss-node prebuild
    if [ -f "$ROOT_DIR/prebuilds/linux-x64/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz" ]; then
        cp "$ROOT_DIR/prebuilds/linux-x64/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz" "$FINAL_BUNDLE/prebuilds/"
        echo "  ✓ faiss-node prebuild included"
    fi
    
    # Copy Perl parser prebuild
    if [ -f "$ROOT_DIR/prebuilds/linux-x64/tree_sitter_perl_binding.node" ]; then
        cp "$ROOT_DIR/prebuilds/linux-x64/tree_sitter_perl_binding.node" "$FINAL_BUNDLE/prebuilds/"
        echo "  ✓ Perl parser prebuild included"
    fi
else
    echo "⚠️ No prebuilt binaries found in prebuilds/linux-x64/"
    echo "   Bundle will be created without native module prebuilds"
fi

# Create installation script
cat > "$FINAL_BUNDLE/install.sh" << 'INSTALL_SCRIPT'
#!/bin/bash
# Standalone installation script for Claude Context

set -euo pipefail

INSTALL_DIR="${1:-$HOME/.mcp/claude-context}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Installing Claude Context (standalone bundle)..."
echo "📁 Installation directory: $INSTALL_DIR"

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy tarballs to install directory first
echo "📦 Copying packages..."
cp "$SCRIPT_DIR"/zilliz-claude-context-*.tgz "$INSTALL_DIR/" 2>/dev/null || true

cd "$INSTALL_DIR"

# Extract core package
echo "📦 Installing core package..."
CORE_TGZ=$(ls zilliz-claude-context-core-*.tgz 2>/dev/null | head -n 1)
if [ -z "$CORE_TGZ" ]; then
    echo "❌ Core package not found!"
    exit 1
fi
tar -xzf "$CORE_TGZ"
mv package core-package

# Extract MCP package (includes bundled dependencies)
echo "📦 Installing MCP package with bundled dependencies..."
MCP_TGZ=$(ls zilliz-claude-context-mcp-*.tgz 2>/dev/null | head -n 1)
if [ -z "$MCP_TGZ" ]; then
    echo "❌ MCP package not found!"
    exit 1
fi
tar -xzf "$MCP_TGZ"
mv package mcp-package

# Create node_modules structure
echo "🔗 Setting up node_modules..."
mkdir -p node_modules/@zilliz

# Link packages
ln -sf "$INSTALL_DIR/core-package" node_modules/@zilliz/claude-context-core
ln -sf "$INSTALL_DIR/mcp-package" node_modules/@zilliz/claude-context-mcp

# Create bin directory
mkdir -p node_modules/.bin
cat > node_modules/.bin/claude-context-mcp << 'BIN_SCRIPT'
#!/usr/bin/env node
require('../@zilliz/claude-context-mcp/dist/index.js');
BIN_SCRIPT
chmod +x node_modules/.bin/claude-context-mcp

# Handle native dependencies (faiss-node)
echo "🔧 Installing native dependencies..."

# Auto-detect bundled prebuilds
BUNDLED_FAISS="$SCRIPT_DIR/prebuilds/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz"
BUNDLED_PERL="$SCRIPT_DIR/prebuilds/tree_sitter_perl_binding.node"

# Determine faiss-node prebuild source (bundled > env var)
FAISS_SOURCE=""
if [ -f "$BUNDLED_FAISS" ]; then
    FAISS_SOURCE="$BUNDLED_FAISS"
    echo "✅ Using bundled faiss-node prebuild"
elif [ -n "${FAISS_PREBUILD:-}" ] && [ -f "$FAISS_PREBUILD" ]; then
    FAISS_SOURCE="$FAISS_PREBUILD"
    echo "✅ Using faiss-node prebuild from: $FAISS_PREBUILD"
fi

# Install faiss-node if source found
if [ -n "$FAISS_SOURCE" ] && [ -d "mcp-package/node_modules/faiss-node" ]; then
    echo "🔧 Installing faiss-node prebuild..."
    cd mcp-package/node_modules/faiss-node
    mkdir -p prebuilds
    cp "$FAISS_SOURCE" prebuilds/
    npx prebuild-install --runtime napi --verbose || echo "⚠️ Prebuild install failed, may need compilation"
    cd "$INSTALL_DIR"
    echo "✅ faiss-node prebuild installed"
elif [ -d "mcp-package/node_modules/faiss-node" ]; then
    echo "⚠️ No faiss-node prebuild found"
    echo "   Provide via: FAISS_PREBUILD=/path/to/prebuild.tar.gz"
fi

# Determine Perl parser source (bundled > env var)
PERL_SOURCE=""
if [ -f "$BUNDLED_PERL" ]; then
    PERL_SOURCE="$BUNDLED_PERL"
    echo "✅ Using bundled Perl parser prebuild"
elif [ -n "${PERL_PARSER_PREBUILD:-}" ] && [ -f "$PERL_PARSER_PREBUILD" ]; then
    PERL_SOURCE="$PERL_PARSER_PREBUILD"
    echo "✅ Using Perl parser from: $PERL_PARSER_PREBUILD"
fi

# Install Perl parser if source found
PERL_PARSER_DIR="core-package/node_modules/@ganezdragon/tree-sitter-perl"
if [ -n "$PERL_SOURCE" ] && [ -d "$PERL_PARSER_DIR" ]; then
    echo "🔧 Installing Perl parser prebuild..."
    
    # Create the build/Release directory structure
    mkdir -p "$PERL_PARSER_DIR/build/Release"
    
    # Copy the prebuild to the correct location
    cp "$PERL_SOURCE" "$PERL_PARSER_DIR/build/Release/tree_sitter_perl_binding.node"
    
    echo "✅ Perl parser prebuild installed to:"
    echo "   $PERL_PARSER_DIR/build/Release/tree_sitter_perl_binding.node"
elif [ -d "$PERL_PARSER_DIR" ]; then
    echo "⚠️ No Perl parser prebuild found"
    echo "   Provide via: PERL_PARSER_PREBUILD=/path/to/parser.node"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Installation summary:"
echo "   📁 Location: $INSTALL_DIR"
echo "   🚀 MCP binary: $INSTALL_DIR/node_modules/.bin/claude-context-mcp"
echo ""
echo "🔧 Next steps:"
echo "   1. Add to your MCP configuration:"
echo '      "command": "'"$INSTALL_DIR"'/node_modules/.bin/claude-context-mcp"'
echo "   2. Set required environment variables:"
echo "      - OPENAI_API_KEY"
echo "      - MILVUS_ADDRESS"
echo "      - EMBEDDING_PROVIDER"
echo ""
INSTALL_SCRIPT
chmod +x "$FINAL_BUNDLE/install.sh"

# Create README
cat > "$FINAL_BUNDLE/README.md" << 'README'
# Claude Context - Standalone Bundle

This is a completely self-contained installation package that includes all dependencies and prebuilt native modules.

## Installation

### Simple Installation (Recommended)

If this bundle includes prebuilt native modules (check `prebuilds/` directory):

```bash
# Just run the installer - prebuilds are auto-detected!
./install.sh

# Or specify custom installation directory
./install.sh /path/to/installation
```

### With Custom Prebuilt Native Modules

If you want to use your own prebuilt binaries instead of bundled ones:

```bash
# With faiss-node prebuild
FAISS_PREBUILD=/path/to/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz ./install.sh

# With Perl parser prebuild
PERL_PARSER_PREBUILD=/path/to/parser.node ./install.sh

# Both
FAISS_PREBUILD=/path/to/faiss.tar.gz PERL_PARSER_PREBUILD=/path/to/parser.node ./install.sh
```

**Note**: Bundled prebuilds are used automatically if present. Environment variables override bundled prebuilds.

## What's Included

✅ **All JavaScript dependencies** - No npm install needed
✅ **Core engine** - AST-based code splitting for 15+ languages  
✅ **MCP server** - Model Context Protocol integration
✅ **Tree-sitter parsers** - JavaScript, Python, C++, Java, Go, Rust, etc.

📦 **Prebuilt native modules** (if present in `prebuilds/` directory):
- `faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz` - Vector similarity search
- `tree_sitter_perl_binding.node` - Perl code parsing

## MCP Configuration

After installation, add to your MCP config (e.g., `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "claude-context": {
      "command": "/path/to/installation/node_modules/.bin/claude-context-mcp",
      "args": [],
      "env": {
        "OPENAI_API_KEY": "your-key-here",
        "EMBEDDING_PROVIDER": "OpenAI",
        "EMBEDDING_MODEL": "text-embedding-3-large",
        "MILVUS_ADDRESS": "localhost:19530",
        "MILVUS_TOKEN": "",
        "SPLITTER_TYPE": "ast",
        "CHUNK_SIZE": "1000",
        "CHUNK_OVERLAP": "200"
      }
    }
  }
}
```

## Bundle Contents

```
claude-context-standalone/
├── install.sh                                    # Installation script
├── README.md                                     # This file
├── prebuilds/                                    # Prebuilt native modules (if included)
│   ├── faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
│   └── tree_sitter_perl_binding.node
├── zilliz-claude-context-core-*.tgz             # Core package with dependencies
└── zilliz-claude-context-mcp-*.tgz              # MCP server with dependencies
```

## Quick Start

```bash
# 1. Extract bundle
tar -xzf claude-context-standalone-*.tar.gz
cd claude-context-standalone

# 2. Install (prebuilds auto-detected!)
./install.sh /your/install/path

# 3. Configure MCP client (see above)

# 4. Restart your MCP client (VSCode, Claude Desktop, etc.)
```

## Troubleshooting

### Check for bundled prebuilds
```bash
ls -la prebuilds/
```

If you see files there, they'll be used automatically!

### Test installation
```bash
/path/to/installation/node_modules/.bin/claude-context-mcp --help
```

### Missing native modules
If native modules aren't working, provide your own prebuilds:
```bash
FAISS_PREBUILD=/your/faiss.tar.gz ./install.sh
```

## System Requirements

- **OS**: Linux x86_64 (RHEL/Rocky Linux 9, Ubuntu 22.04, or compatible)
- **Node.js**: v20.x (not compatible with Node.js 24+)
- **Architecture**: x86_64 (64-bit)

## Offline Installation

This bundle is designed for completely offline/air-gapped environments:
1. Copy entire bundle directory to target system
2. Run `./install.sh` (no internet connection required)
3. Native binaries are included (if in `prebuilds/` directory)

## Documentation

For more information, see the main repository:
- https://github.com/zilliztech/claude-context
- https://github.com/zilliztech/claude-context/blob/master/docs/STANDALONE_BUNDLE.md

## Support

- **Issues**: https://github.com/zilliztech/claude-context/issues
- **Documentation**: https://github.com/zilliztech/claude-context/tree/master/docs
README

# Create a distribution tarball
echo "📦 Creating final distribution tarball..."
cd "$BUNDLE_DIR"
DIST_NAME="claude-context-standalone-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$DIST_NAME" claude-context-standalone/

echo ""
echo "✨ Standalone bundle created successfully!"
echo ""
echo "📦 Bundle location: $BUNDLE_DIR/$DIST_NAME"
echo "📁 Extracted bundle: $FINAL_BUNDLE/"
echo ""
echo "📋 Bundle contents:"
ls -lh "$FINAL_BUNDLE"
echo ""
echo "🚀 To use this bundle:"
echo "   1. Copy $DIST_NAME to your target system"
echo "   2. Extract: tar -xzf $DIST_NAME"
echo "   3. Run: cd claude-context-standalone && ./install.sh"
echo ""
echo "💡 With prebuilds:"
echo "   FAISS_PREBUILD=/path/to/faiss.tar.gz PERL_PARSER_PREBUILD=/path/to/parser.node ./install.sh"
echo ""
