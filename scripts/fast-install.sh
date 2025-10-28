#!/bin/bash
# File: fast-install.sh
# Purpose: Quick extraction for development testing - skips full setup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_FILE="${1:-}"

if [ -z "$BUNDLE_FILE" ]; then
    echo "Usage: $0 <bundle-file.tar.gz>"
    echo ""
    echo "This script does a minimal extraction for quick testing:"
    echo "  - Extracts tarballs only"
    echo "  - Skips node_modules setup"
    echo "  - Skips prebuild installation"
    echo ""
    echo "Test with: node -r ./mcp-package/dist/index.js"
    exit 1
fi

if [ ! -f "$BUNDLE_FILE" ]; then
    echo "Error: Bundle file not found: $BUNDLE_FILE"
    exit 1
fi

# Extract to temporary directory
EXTRACT_DIR="$(mktemp -d)"
trap 'rm -rf "$EXTRACT_DIR"' EXIT

echo "📦 Extracting bundle..."
tar -xzf "$BUNDLE_FILE" -C "$EXTRACT_DIR"

# Find the inner directory (usually has timestamp)
INNER_DIR=$(find "$EXTRACT_DIR" -maxdepth 1 -type d ! -path "$EXTRACT_DIR" | head -n1)

if [ -z "$INNER_DIR" ]; then
    echo "Error: Could not find extracted directory"
    exit 1
fi

# Create fast-test directory
TEST_DIR="$PWD/fast-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

echo "🚀 Setting up fast test environment in $TEST_DIR..."

# Extract core package
if [ -f "$INNER_DIR/zilliz-claude-context-core-"*.tgz ]; then
    CORE_TARBALL=$(ls "$INNER_DIR"/zilliz-claude-context-core-*.tgz | head -n1)
    mkdir -p "$TEST_DIR/core-package"
    tar -xzf "$CORE_TARBALL" -C "$TEST_DIR/core-package" --strip-components=1
    echo "✅ Extracted core package"
else
    echo "❌ Core package tarball not found"
    exit 1
fi

# Extract MCP package
if [ -f "$INNER_DIR/zilliz-claude-context-mcp-"*.tgz ]; then
    MCP_TARBALL=$(ls "$INNER_DIR"/zilliz-claude-context-mcp-*.tgz | head -n1)
    mkdir -p "$TEST_DIR/mcp-package"
    tar -xzf "$MCP_TARBALL" -C "$TEST_DIR/mcp-package" --strip-components=1
    echo "✅ Extracted MCP package"
else
    echo "❌ MCP package tarball not found"
    exit 1
fi

# Copy prebuilds if they exist
if [ -d "$INNER_DIR/prebuilds" ]; then
    cp -r "$INNER_DIR/prebuilds" "$TEST_DIR/"
    echo "✅ Copied prebuilds directory"
fi

echo ""
echo "✨ Fast test environment ready!"
echo ""
echo "📁 Directory structure:"
echo "   $TEST_DIR/"
echo "   ├── core-package/      # Extracted core"
echo "   ├── mcp-package/       # Extracted MCP (with bundled deps)"
echo "   └── prebuilds/         # Native binaries (if included)"
echo ""
echo "🧪 Quick test commands:"
echo ""
echo "   # Test core package"
echo "   cd $TEST_DIR"
echo "   node -e \"require('./core-package/dist/index.js'); console.log('Core works')\""
echo ""
echo "   # Test MCP package"
echo "   cd $TEST_DIR"
echo "   node -e \"require('./mcp-package/dist/index.js'); console.log('MCP works')\""
echo ""
echo "   # List bundled dependencies"
echo "   ls -la $TEST_DIR/mcp-package/node_modules/"
echo ""
echo "   # Check if Perl parser is bundled"
echo "   ls -la $TEST_DIR/mcp-package/node_modules/@ganezdragon/tree-sitter-perl/"
echo ""
echo "⚠️  Note: This is NOT a full installation. Native modules will not work"
echo "   without proper installation via prebuild-install."
echo ""
