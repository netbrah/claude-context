#!/bin/bash

# Quick Test Runner for C++ Parser
# This script runs the C++ parser tests and displays results

set -e

echo "=================================================="
echo "C++ Parser Unit Tests - Quick Runner"
echo "=================================================="
echo ""

# Navigate to core package
cd "$(dirname "$0")/packages/core"

echo "📦 Installing dependencies (if needed)..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "🧪 Running C++ parser tests..."
echo ""

npm test

echo ""
echo "=================================================="
echo "✅ All tests completed successfully!"
echo "=================================================="
echo ""
echo "For more options:"
echo "  - Watch mode: npm run test:watch"
echo "  - Coverage:   npm run test:coverage"
echo ""
