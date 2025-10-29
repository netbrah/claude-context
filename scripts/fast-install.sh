#!/bin/bash
# File: scripts/fast-install.sh
# Quick development installation script - extracts tarballs for fast testing
# Skips full installation overhead (no prebuilds, minimal setup) for rapid iteration
#
# Usage:
#   ./fast-install.sh                    # Install to ./fast-install-test/
#   ./fast-install.sh /custom/path       # Install to custom location
#
# Expected to be run from installation directory where tarballs are located
# (install.sh copies this script to the install dir alongside tarballs)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${1:-$SCRIPT_DIR/fast-install-test}"

echo "⚡ Fast Development Install"
echo "📁 Installation directory: $INSTALL_DIR"
echo ""

# Clean previous installation
if [ -d "$INSTALL_DIR" ]; then
    echo "🧹 Cleaning previous installation..."
    rm -rf "$INSTALL_DIR"
fi
mkdir -p "$INSTALL_DIR"

# Tarballs should be in the same directory as this script
# (install.sh copies fast-install.sh to the install dir with the tarballs)
TARBALL_DIR="$SCRIPT_DIR"

if ! ls "$TARBALL_DIR"/zilliz-claude-context-*.tgz 1> /dev/null 2>&1; then
    echo "❌ Cannot find tarballs in: $TARBALL_DIR"
    echo ""
    echo "Expected: $TARBALL_DIR/zilliz-claude-context-*.tgz"
    echo ""
    echo "This script should be run from the directory where install.sh placed it."
    echo "Typically: ~/.mcp/claude-context/ or your custom install location"
    exit 1
fi

echo "📦 Found tarballs in: $TARBALL_DIR"

# Copy tarballs to install directory
echo "📋 Copying packages..."
cp "$TARBALL_DIR"/zilliz-claude-context-*.tgz "$INSTALL_DIR/" 2>/dev/null || {
    echo "❌ Failed to copy tarballs"
    exit 1
}

cd "$INSTALL_DIR"

# Extract core package
echo "📦 Extracting core package..."
CORE_TGZ=$(ls zilliz-claude-context-core-*.tgz 2>/dev/null | head -n 1)
if [ -z "$CORE_TGZ" ]; then
    echo "❌ Core package not found!"
    exit 1
fi
tar -xzf "$CORE_TGZ"
mv package core-package
echo "  ✓ Core extracted to: core-package/"

# Extract MCP package
echo "📦 Extracting MCP package..."
MCP_TGZ=$(ls zilliz-claude-context-mcp-*.tgz 2>/dev/null | head -n 1)
if [ -z "$MCP_TGZ" ]; then
    echo "❌ MCP package not found!"
    exit 1
fi
tar -xzf "$MCP_TGZ"
mv package mcp-package
echo "  ✓ MCP extracted to: mcp-package/"

# Create minimal node_modules structure for testing
echo "🔗 Creating minimal node_modules..."
mkdir -p node_modules/@zilliz
ln -sf "$INSTALL_DIR/core-package" node_modules/@zilliz/claude-context-core
ln -sf "$INSTALL_DIR/mcp-package" node_modules/@zilliz/claude-context-mcp

# Create test runner script
echo "📝 Creating test runner..."
cat > test-mcp.sh << 'TEST_SCRIPT'
#!/bin/bash
# Quick test script for MCP server

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "🧪 Testing MCP Server..."
echo ""

# Set up minimal environment
export NODE_PATH="$(pwd)/node_modules:$NODE_PATH"

# Try to run MCP server (will show help/version)
echo "Running: node mcp-package/dist/index.js"
node mcp-package/dist/index.js || echo "Note: MCP server may need environment variables to fully initialize"

echo ""
echo "✅ Basic test complete!"
echo ""
echo "📋 To test with environment variables:"
echo "   export OPENAI_API_KEY=your-key"
echo "   export MILVUS_ADDRESS=localhost:19530"
echo "   node mcp-package/dist/index.js"
TEST_SCRIPT
chmod +x test-mcp.sh

echo ""
echo "✅ Fast installation complete!"
echo ""
echo "📁 Installation directory: $INSTALL_DIR"
echo ""
echo "📋 Contents:"
echo "   core-package/     - Core engine"
echo "   mcp-package/      - MCP server (with bundled deps)"
echo "   node_modules/     - Symlinks to packages"
echo "   test-mcp.sh       - Quick test script"
echo ""
echo "⚡ Quick Test Commands:"
echo ""
echo "   # Test MCP server directly:"
echo "   cd $INSTALL_DIR"
echo "   node mcp-package/dist/index.js"
echo ""
echo "   # Or use test script:"
echo "   ./test-mcp.sh"
echo ""
echo "💡 Development Tips:"
echo ""
echo "   1. After changing code:"
echo "      pnpm run build:core  # or build:mcp"
echo "      bash scripts/create-standalone-bundle.sh"
echo "      bash scripts/fast-install.sh"
echo ""
echo "   2. Test with environment:"
echo "      export OPENAI_API_KEY=..."
echo "      export MILVUS_ADDRESS=..."
echo "      node $INSTALL_DIR/mcp-package/dist/index.js"
echo ""
echo "   3. Compare with full install:"
echo "      diff -r $INSTALL_DIR ~/.mcp/claude-context"
echo ""
echo "⚠️  Note: This is a minimal extraction for testing only!"
echo "   - No prebuild installation"
echo "   - No .bin/ executables created"
echo "   - Use full install.sh for production"
echo ""
