# Building tree-sitter-perl Native Module

The `@ganezdragon/tree-sitter-perl` package requires a native build for your platform. This guide explains how to build it.

## Prerequisites

Ensure you have the following tools installed:
- Node.js (v20 or higher)
- Python 3
- C/C++ compiler (gcc/g++ on Linux, clang on macOS, MSVC on Windows)
- make
- node-gyp

### Installing Prerequisites on Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 make g++
```

### Installing Prerequisites on macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install
```

### Installing Prerequisites on Windows

Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with C++ development tools.

## Building tree-sitter-perl

### Option 1: Using pnpm (Recommended)

1. Install pnpm if not already installed:
   ```bash
   npm install -g pnpm
   ```

2. Navigate to the project root:
   ```bash
   cd /path/to/claude-context
   ```

3. Approve build scripts for tree-sitter-perl:
   ```bash
   pnpm approve-builds
   ```
   
   When prompted:
   - Use `Space` to select `@ganezdragon/tree-sitter-perl`
   - Press `Enter` to confirm
   - Type `y` and press `Enter` to approve

   The native module will be built automatically.

4. Verify the build:
   ```bash
   pnpm test:core
   ```
   
   You should see:
   - `🌳 Using AST splitter for perl file:` in the output
   - `✅ Perl AST support is available` in test results

### Option 2: Manual Build

If you need to rebuild manually:

```bash
cd node_modules/.pnpm/@ganezdragon+tree-sitter-perl@*/node_modules/@ganezdragon/tree-sitter-perl
node-gyp rebuild
```

### Option 3: Using npm rebuild

From the project root:

```bash
npm rebuild @ganezdragon/tree-sitter-perl
```

## Troubleshooting

### "No native build was found" Error

This error occurs when the native module hasn't been built for your platform. Follow the build steps above.

### Build Fails on Linux

Ensure you have all required build tools:
```bash
sudo apt-get install -y build-essential python3 make g++
```

### Build Fails on macOS

Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Build Fails on Windows

1. Install Visual Studio Build Tools with C++ support
2. Run the build command in "Developer Command Prompt for VS"

## Verifying the Installation

After building, verify the native module exists:

```bash
# Linux/macOS
ls -la node_modules/.pnpm/@ganezdragon+tree-sitter-perl@*/node_modules/@ganezdragon/tree-sitter-perl/build/Release/tree_sitter_perl_binding.node

# Windows (PowerShell)
dir node_modules\.pnpm\@ganezdragon+tree-sitter-perl@*\node_modules\@ganezdragon\tree-sitter-perl\build\Release\tree_sitter_perl_binding.node
```

If the file exists, the module is built correctly.

## Fallback Behavior

If the native build is not available, the system will automatically fall back to the LangChain splitter. You'll see:
- `📝 Language perl not supported by AST, using LangChain splitter` in logs
- `⚠️ Perl AST support not available (native build missing), will use LangChain fallback` in tests

While the fallback works, AST-based parsing provides better code chunking for Perl files.

## CI/CD Integration

For CI/CD pipelines, ensure build tools are installed before running `pnpm install`:

```yaml
# GitHub Actions example
- name: Install build tools
  run: sudo apt-get update && sudo apt-get install -y build-essential python3

- name: Install pnpm
  run: npm install -g pnpm

- name: Install dependencies and build
  run: pnpm install

- name: Approve tree-sitter-perl build
  run: echo -e "\n\ny" | pnpm approve-builds @ganezdragon/tree-sitter-perl
```

## Getting Help

If you continue to have issues building tree-sitter-perl:
1. Check the [tree-sitter-perl repository](https://github.com/ganezdragon/tree-sitter-perl) for issues
2. Ensure all prerequisites are installed
3. Try cleaning node_modules and reinstalling: `rm -rf node_modules && pnpm install`
