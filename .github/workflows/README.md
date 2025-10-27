# GitHub Actions Workflows

This directory contains the optimized CI/CD workflows for the Claude Context project.

## Workflow Overview

### 🔍 [lint.yml](lint.yml) - Code Quality (Fast Fail)
**Triggers**: All PRs and pushes to main branches  
**Duration**: ~1-2 minutes  
**Purpose**: Fast feedback on code quality issues

- ✅ TypeScript type checking
- ✅ ESLint linting (continues on error to show all issues)
- ⚡ Runs first for quick feedback

### 🧪 [test.yml](test.yml) - Test Suite
**Triggers**: All PRs and pushes to main branches  
**Duration**: ~5-10 minutes  
**Purpose**: Comprehensive test coverage

- ✅ Core package unit tests with coverage
- ✅ AST parser tests  
- 📊 Uploads coverage reports
- 🌳 Tests tree-sitter parsers for all languages

### 🏗️ [build.yml](build.yml) - Build Validation & Benchmarks
**Triggers**: All PRs and pushes to main branches  
**Duration**: ~10-15 minutes  
**Purpose**: Ensure builds work across platforms

**Primary Build (Ubuntu 20.x)**:
- ✅ Build all packages
- 📊 Run build performance benchmark
- ⚡ Run C++ parser performance benchmark
- 📈 Generate performance summaries

**Cross-Platform Matrix**:
- ✅ Windows (Node 20.x)
- ✅ macOS (Node 20.x)
- ✅ Ubuntu (Node 22.x)

### 🚧 [release-dev.yml](release-dev.yml) - Development Releases
**Triggers**: Push tags matching `dev-*` (e.g., `dev-v1.0.0`)  
**Duration**: ~15-20 minutes  
**Purpose**: Create pre-releases for testing

**Creates GitHub Pre-release with**:
- 📦 Core package tarball (`zilliz-claude-context-core-*.tgz`)
- 📦 MCP package tarball (`zilliz-claude-context-mcp-*.tgz`)
- 📦 VSCode extension VSIX (`semanticcodesearch-*.vsix`)
- 📊 Build benchmark results
- ⚡ C++ parser benchmark results

**Installation from Dev Release**:
```bash
# Download artifacts from the GitHub release page
npm install ./zilliz-claude-context-core-*.tgz
npm install ./zilliz-claude-context-mcp-*.tgz

# VSCode: Extensions → ... → Install from VSIX
```

### 🚀 [release-prod.yml](release-prod.yml) - Production Releases
**Triggers**: Push tags matching `v*` (e.g., `v1.0.0`)  
**Duration**: ~20-30 minutes  
**Purpose**: Publish stable releases

**Publishes to**:
- 📦 npm: `@zilliz/claude-context-core`
- 📦 npm: `@zilliz/claude-context-mcp`
- 🔌 VSCode Marketplace: `semanticcodesearch`
- 📋 GitHub Releases with artifacts

**Installation**:
```bash
npm install @zilliz/claude-context-core
npm install @zilliz/claude-context-mcp
# VSCode: Search "Semantic Code Search" in Extensions
```

## Workflow Features

### ⚡ Performance Optimizations

1. **Concurrency Control**: Cancels in-progress runs when new commits are pushed
2. **Dependency Caching**: Uses pnpm cache for faster installs
3. **Fail-Fast Strategy**: Linting runs first to catch simple issues quickly
4. **Parallel Jobs**: Cross-platform builds run in parallel

### 📊 Reporting & Artifacts

- **Workflow Summaries**: Each workflow generates a summary in the Actions UI
- **Artifact Uploads**: Test coverage, benchmarks, and packages are preserved
- **Retention**: Artifacts kept for 30 days (dev releases: 90 days)

### 🎯 Trigger Strategy

| Workflow | Push to Main | Pull Request | Tag `dev-*` | Tag `v*` |
|----------|--------------|--------------|-------------|----------|
| Lint     | ✅           | ✅           | -           | -        |
| Test     | ✅           | ✅           | -           | -        |
| Build    | ✅           | ✅           | -           | -        |
| Release (Dev) | -       | -            | ✅          | -        |
| Release (Prod) | -      | -            | -           | ✅       |

## Creating Releases

### Development Release
```bash
# Create and push a dev tag
git tag dev-v1.0.0-alpha
git push origin dev-v1.0.0-alpha

# Or with a custom name
git tag dev-feature-test
git push origin dev-feature-test
```

This creates a **pre-release** on GitHub with downloadable artifacts for testing.

### Production Release
```bash
# Ensure version is bumped in package.json files
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This:
1. Runs all tests
2. Publishes to npm
3. Publishes to VSCode Marketplace
4. Creates a GitHub release

## Required Secrets

Configure these in repository settings → Secrets and variables → Actions:

- `NPM_TOKEN`: npm authentication token for publishing packages
- `VSCE_PAT`: Visual Studio Code Personal Access Token for marketplace publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Workflow Execution Order

For PRs and commits:
```
Lint (1-2 min) → Test (5-10 min) → Build (10-15 min)
     ↓                ↓                    ↓
  (fail fast)    (core tests)      (cross-platform)
```

All three workflows run in parallel, but Lint provides the fastest feedback.

## Troubleshooting

### Workflow Fails
1. Check the workflow summary in the Actions tab
2. Review the specific job logs
3. Download artifacts for debugging (test coverage, benchmarks)

### Dev Release Not Created
- Ensure tag starts with `dev-`
- Check workflow permissions in repository settings

### Production Release Fails
- Verify `NPM_TOKEN` and `VSCE_PAT` secrets are set
- Ensure tests pass before tagging
- Check version numbers are properly bumped

## Maintenance

### Adding New Tests
Update [test.yml](test.yml) to include new test commands.

### Adding New Packages
Update [build.yml](build.yml) to verify new package build outputs.

### Modifying Benchmarks
Update [build.yml](build.yml) if benchmark commands or output formats change.

## Migration from Old Workflows

The following old workflows have been replaced:

- ❌ `ci.yml` → ✅ `lint.yml` + `test.yml` + `build.yml`
- ❌ `test-and-benchmark.yml` → ✅ `test.yml` + `build.yml`
- ❌ `build-and-release-dev.yml` → ✅ `release-dev.yml`
- ❌ `build-and-release-main.yml` → ✅ `release-prod.yml`

Benefits:
- ⚡ Faster feedback (separate lint job)
- 📦 No redundancy (each job has clear purpose)
- 🎯 Better artifact organization
- 📊 Improved reporting and summaries
