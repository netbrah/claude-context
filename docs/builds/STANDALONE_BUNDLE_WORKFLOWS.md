# Standalone Bundle Workflows

This document describes the GitHub Actions workflows for creating standalone bundles.

## Workflows

### 1. `build-standalone-bundle.yml` - Continuous Build

**Trigger**: Automatically on push to main/master/develop branches when package files change

**Purpose**: Continuous integration build for testing standalone bundles

**What it does**:
- Builds Perl parser for x86_64 Linux
- Creates standalone bundle with all dependencies
- Verifies bundle integrity
- Tests installation process
- Uploads artifacts (30-day retention)

**Artifacts**:
- `claude-context-standalone-bundle` - Complete bundle tarball
- `tree-sitter-perl-x86_64-linux` - Perl parser binary

**Manual Trigger**:
```bash
# Via GitHub UI: Actions → Build Standalone Bundle → Run workflow
# Options:
#   - upload_release: true/false (create pre-release)
#   - release_tag: e.g., "standalone-v0.1.3-test"
```

### 2. `release-standalone-bundle.yml` - Official Release

**Trigger**: Push tags matching `standalone-v*` or `bundle-v*`

**Purpose**: Create official standalone bundle releases

**What it does**:
- Builds complete standalone bundle
- Runs tests
- Generates SHA256 checksums
- Creates GitHub release with:
  - Versioned bundle tarball
  - Perl parser binary
  - Checksums file
  - Installation scripts
  - Complete documentation

**Creating a Release**:

```bash
# Option 1: Tag and push (automatic release)
git tag standalone-v0.1.3
git push origin standalone-v0.1.3

# Option 2: Manual trigger via GitHub UI
# Actions → Release Standalone Bundle → Run workflow
#   - tag_name: standalone-v0.1.3
#   - mark_latest: true/false
```

## Target Environment

All workflows build for:
- **OS**: RHEL/Rocky Linux 9.6 compatible
- **Architecture**: x86_64 (64-bit)
- **Node.js**: v20.19.2
- **Kernel**: 5.14.0+

Built on Ubuntu 22.04 (close compatibility with RHEL 9).

## Bundle Contents

Each bundle includes:

1. **Core Package** (`@zilliz/claude-context-core`)
   - All dependencies bundled
   - Tree-sitter parsers for 15+ languages
   - Vector database integration

2. **MCP Server** (`@zilliz/claude-context-mcp`)
   - Model Context Protocol integration
   - All dependencies bundled

3. **Native Modules**
   - Tree-sitter Perl parser (pre-compiled)
   - Installation script with prebuild support

4. **Documentation**
   - Installation guide
   - Configuration examples
   - Troubleshooting tips

## Using Artifacts

### From Workflow Run

```bash
# Download artifacts from Actions tab
# Extract the bundle
tar -xzf claude-context-standalone-*.tar.gz
cd claude-context-standalone

# Install
./install.sh /your/path
```

### From Release

```bash
# Download from Releases page
wget https://github.com/zilliztech/claude-context/releases/download/standalone-v0.1.3/claude-context-standalone-v0.1.3.tar.gz

# Verify checksum
wget https://github.com/zilliztech/claude-context/releases/download/standalone-v0.1.3/checksums.txt
sha256sum -c checksums.txt

# Extract and install
tar -xzf claude-context-standalone-v0.1.3.tar.gz
cd claude-context-standalone
./install.sh
```

## Workflow Outputs

### Workflow Summary

Each workflow run generates a summary with:
- Bundle information (version, size, platform)
- Download links
- Installation instructions
- Documentation links

### Artifacts (build-standalone-bundle.yml)

- **Retention**: 30 days
- **Access**: From workflow run page → Artifacts section
- **Contents**: Complete bundle + Perl parser

### Release Assets (release-standalone-bundle.yml)

- **Retention**: Permanent (until manually deleted)
- **Access**: GitHub Releases page
- **Contents**:
  - `claude-context-standalone-v{VERSION}.tar.gz` - Main bundle
  - `tree-sitter-perl-x86_64-linux.node` - Perl parser
  - `checksums.txt` - SHA256 checksums
  - `README.md` - Installation guide
  - `install.sh` - Installation script

## Customization

### Building for Different Platforms

To build for a different Linux platform, modify the workflow:

```yaml
runs-on: ubuntu-22.04  # Change to match your target
```

Or use Docker:

```yaml
- name: Build in target container
  run: |
    docker run --rm -v $PWD:/workspace \
      rockylinux:9 \
      /bin/bash -c "cd /workspace && bash scripts/build-perl-parser.sh"
```

### Custom Node.js Version

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.19.2'  # Change version here
```

## Troubleshooting

### Perl Parser Build Fails

The workflow includes comprehensive error handling. Check:
1. Build tools are installed (gcc, g++, make)
2. Node.js version is compatible (20.x)
3. tree-sitter parser source is available

### Bundle Creation Fails

Common issues:
1. Dependencies not installed: Check `pnpm install` step
2. Build failed: Check `pnpm build` step
3. Script permissions: Scripts are made executable in workflow

### Installation Test Fails

The workflow tests installation. If it fails:
1. Check bundle contents
2. Verify required files exist
3. Review installation script output

## CI/CD Integration

### Development Workflow

```
1. Push to feature branch
   ↓
2. build-standalone-bundle.yml runs
   ↓
3. Artifacts available for testing
   ↓
4. Download and test on target system
   ↓
5. Merge to main when verified
```

### Release Workflow

```
1. Update version in package.json
   ↓
2. Commit and push to main
   ↓
3. Create and push tag: standalone-v{VERSION}
   ↓
4. release-standalone-bundle.yml runs
   ↓
5. GitHub Release created automatically
   ↓
6. Download and deploy to production
```

## Manual Build (Local)

If you prefer to build locally instead of using GitHub Actions:

```bash
# Install dependencies
pnpm install

# Build Perl parser
pnpm run build:perl-parser

# Create bundle
pnpm run bundle:full

# Bundle is in: bundle-output/claude-context-standalone-*.tar.gz
```

## See Also

- [Standalone Bundle Documentation](../STANDALONE_BUNDLE.md)
- [Offline Installation Quick Start](../OFFLINE_INSTALL_QUICKSTART.md)
- [Build Tree-Sitter Perl](../BUILD_TREE_SITTER_PERL.md)
- [GitHub Actions Workflow README](../../.github/workflows/README.md)
