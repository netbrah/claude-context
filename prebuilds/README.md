# Prebuilt Native Modules

This directory contains prebuilt native binaries for offline installation.

## Directory Structure

```
prebuilds/
└── linux-x64/
    ├── faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz    # Vector similarity search
    └── tree_sitter_perl_binding.node                  # Perl parser
```

## Purpose

These prebuilt binaries are automatically included in standalone bundles created by:
```bash
pnpm run bundle:standalone
pnpm run bundle:full
```

The installer (`install.sh`) automatically detects and uses these bundled prebuilds, making installation truly zero-dependency.

## Platform: Linux x86_64

Current prebuilds are for:
- **OS**: Linux (RHEL/Rocky Linux 9.6, Ubuntu 22.04, or compatible)
- **Architecture**: x86_64 (64-bit Intel/AMD)
- **Node.js**: v20.x

## Files

### faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
- **Purpose**: Vector similarity search library
- **Version**: 0.5.1
- **Runtime**: Node.js NAPI v8
- **Source**: https://github.com/ewfian/faiss-node
- **Size**: ~14 MB

### tree_sitter_perl_binding.node
- **Purpose**: Tree-sitter parser for Perl code
- **Package**: @ganezdragon/tree-sitter-perl
- **Build**: Native compiled binding for AST parsing
- **Size**: ~3 MB

## Adding Prebuilds

To add prebuilt binaries for this platform:

1. **Place files in `prebuilds/linux-x64/`**:
   ```bash
   # Download or build your prebuilds
   cp your-faiss-node-*.tar.gz prebuilds/linux-x64/
   cp your-tree-sitter-perl.node prebuilds/linux-x64/tree_sitter_perl_binding.node
   ```

2. **Create standalone bundle**:
   ```bash
   pnpm run bundle:standalone
   ```
   
   The script automatically detects and includes files from `prebuilds/linux-x64/`.

3. **Bundle includes prebuilds**:
   ```
   claude-context-standalone/
   └── prebuilds/
       ├── faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
       └── tree_sitter_perl_binding.node
   ```

4. **Installer auto-detects them**:
   ```bash
   ./install.sh  # Automatically uses bundled prebuilds!
   ```

## Building Prebuilds

### Build Perl Parser

```bash
# Use the build script
pnpm run build:perl-parser

# Output: prebuilds/tree-sitter-perl-x86_64-linux.node
# Rename to: prebuilds/linux-x64/tree_sitter_perl_binding.node
```

### Get faiss-node Prebuild

Download from GitHub releases or build locally:
```bash
# From releases (if available)
wget https://github.com/ewfian/faiss-node/releases/download/v0.5.1/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz

# Or build locally (requires build tools)
cd /tmp
git clone https://github.com/ewfian/faiss-node
cd faiss-node
npm install
npm run prebuild
# Find prebuild in prebuilds/ directory
```

## Other Platforms

To support other platforms, create additional directories:

```
prebuilds/
├── linux-x64/          # Linux 64-bit (current)
├── linux-arm64/        # Linux ARM64 (future)
├── darwin-x64/         # macOS Intel (future)
└── darwin-arm64/       # macOS Apple Silicon (future)
```

Update `create-standalone-bundle.sh` to detect platform-specific prebuilds.

## Git Ignore

Prebuilt binaries are ignored by git (`.gitignore`):
```gitignore
prebuilds/**/*.tar.gz
prebuilds/**/*.node
```

This prevents large binaries from being committed to the repository.

## Verification

After adding prebuilds, verify they're included in bundles:

```bash
# Create bundle
pnpm run bundle:standalone

# Check bundle contents
tar -tzf bundle-output/claude-context-standalone-*.tar.gz | grep prebuilds
```

You should see:
```
claude-context-standalone/prebuilds/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
claude-context-standalone/prebuilds/tree_sitter_perl_binding.node
```

## Notes

- **File names matter**: The installer looks for specific filenames
- **Keep versions updated**: Match Node.js NAPI versions
- **Test before distribution**: Always test the bundle on target platform
- **Platform-specific**: These are Linux x86_64 binaries only

## See Also

- [Standalone Bundle Documentation](../docs/STANDALONE_BUNDLE.md)
- [Build Tree-Sitter Perl](../docs/BUILD_TREE_SITTER_PERL.md)
- [Installation Guide](../docs/INSTALL_FOR_YOUR_ENVIRONMENT.md)
