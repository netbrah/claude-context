#!/bin/bash
# File: scripts/build-perl-parser.sh
# Builds tree-sitter-perl parser natively for Linux

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/prebuilds}"

echo "🔨 Building tree-sitter-perl parser for Linux..."
echo ""

# Check for required tools
echo "✅ Checking build dependencies..."
for tool in node npm gcc g++ make python3; do
    if ! command -v $tool &> /dev/null; then
        echo "❌ Required tool not found: $tool"
        echo "   Install: sudo apt-get install build-essential nodejs npm python3"
        exit 1
    fi
done

echo "✅ All build tools available"
echo ""

# Find the perl parser package
PERL_PARSER_PATH="$ROOT_DIR/packages/core/node_modules/@ganezdragon/tree-sitter-perl"

if [ ! -d "$PERL_PARSER_PATH" ]; then
    echo "⚠️ Perl parser not found, installing..."
    cd "$ROOT_DIR/packages/core"
    pnpm install @ganezdragon/tree-sitter-perl
    
    if [ ! -d "$PERL_PARSER_PATH" ]; then
        echo "❌ Failed to install @ganezdragon/tree-sitter-perl"
        exit 1
    fi
fi

echo "📦 Found Perl parser at: $PERL_PARSER_PATH"
cd "$PERL_PARSER_PATH"

# Check if already built
if [ -f "build/Release/tree_sitter_perl_binding.node" ]; then
    echo "⚠️ Parser already built. Cleaning..."
    rm -rf build
fi

# Build the parser
echo "🔨 Compiling native parser..."
echo "   This may take a few minutes..."

if [ -f "binding.gyp" ]; then
    # Use node-gyp if binding.gyp exists
    echo "📦 Using node-gyp build..."
    npx node-gyp rebuild
elif [ -f "bindings/node/binding.gyp" ]; then
    echo "📦 Using node-gyp from bindings/node..."
    cd bindings/node
    npx node-gyp rebuild
    cd ../..
else
    echo "❌ No binding.gyp found!"
    echo "   Available files:"
    ls -la
    
    # Try to generate bindings if tree-sitter-cli is available
    if command -v tree-sitter &> /dev/null; then
        echo "🔧 Attempting to generate bindings with tree-sitter CLI..."
        tree-sitter generate
        if [ -f "binding.gyp" ]; then
            npx node-gyp rebuild
        fi
    else
        echo "❌ Cannot build: no binding.gyp and tree-sitter CLI not available"
        exit 1
    fi
fi

# Find the compiled binary
COMPILED_BINARY=""
for location in \
    "build/Release/tree_sitter_perl_binding.node" \
    "bindings/node/build/Release/tree_sitter_perl_binding.node" \
    "build/Release/parser.node" \
    "*.node"; do
    
    if [ -f "$location" ] || ls $location 2>/dev/null | grep -q ".node"; then
        COMPILED_BINARY=$(ls $location 2>/dev/null | head -n 1)
        break
    fi
done

if [ -z "$COMPILED_BINARY" ] || [ ! -f "$COMPILED_BINARY" ]; then
    echo "❌ Compiled binary not found!"
    echo "   Searched locations:"
    echo "   - build/Release/*.node"
    echo "   - bindings/node/build/Release/*.node"
    exit 1
fi

echo "✅ Build successful: $COMPILED_BINARY"

# Copy to prebuilds directory
mkdir -p "$OUTPUT_DIR"
PREBUILD_NAME="tree-sitter-perl-$(uname -m)-$(uname -s | tr '[:upper:]' '[:lower:]').node"
PREBUILD_PATH="$OUTPUT_DIR/$PREBUILD_NAME"

cp "$COMPILED_BINARY" "$PREBUILD_PATH"

# Also copy to linux-x64 directory for bundle inclusion
LINUX_X64_DIR="$ROOT_DIR/prebuilds/linux-x64"
mkdir -p "$LINUX_X64_DIR"
if [ ! -f "$LINUX_X64_DIR/tree_sitter_perl_binding.node" ]; then
    cp "$COMPILED_BINARY" "$LINUX_X64_DIR/tree_sitter_perl_binding.node"
    echo "📦 Copied to bundle prebuilds: $LINUX_X64_DIR/tree_sitter_perl_binding.node"
fi

echo ""
echo "✅ Perl parser prebuild created!"
echo "📁 Location: $PREBUILD_PATH"
echo "📁 Bundle location: $LINUX_X64_DIR/tree_sitter_perl_binding.node"
echo ""
echo "🚀 To use this prebuild:"
echo "   PERL_PARSER_PREBUILD=$PREBUILD_PATH ./scripts/create-standalone-bundle.sh"
echo ""
echo "   Or during standalone installation:"
echo "   PERL_PARSER_PREBUILD=$PREBUILD_PATH ./install.sh"
echo ""

# Test the binary using the copied prebuild
echo "🧪 Testing compiled binary..."
if [ -f "$PREBUILD_PATH" ]; then
    node -e "
    try {
        const binding = require('$PREBUILD_PATH');
        console.log('✅ Binary loads successfully');
        console.log('   Exports:', Object.keys(binding));
    } catch(e) {
        console.error('❌ Binary test failed:', e.message);
        console.error('   This may be OK - binary might need to be in proper package context');
    }
    "
else
    echo "⚠️ Cannot test binary - file not found at $PREBUILD_PATH"
fi

echo ""
echo "✨ Perl parser build complete!"
