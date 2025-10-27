# CI/CD Pipeline Guide

This document describes the optimized CI/CD workflows for the Claude Context monorepo.

## Overview

Our pipeline is optimized for:
- **Fast feedback**: Fail-fast approach with quick linting and testing
- **No redundancy**: Workflows run only when needed, no duplicate work  
- **Easy artifact access**: Dev branches get automatic releases with downloadable .tgz packages
- **Clear release strategy**: Separate workflows for dev testing vs. production releases

## Workflows

### 1. CI (`ci.yml`) - Fast Feedback Loop

**Triggers:** All pull requests and pushes to main branches

**Purpose:** Provide fast feedback on code quality

**Steps:**
1. **Lint** (fastest - catches TypeScript and style issues)
2. **Build** (catches compilation errors)  
3. **Test** (most thorough validation including flaky test handling)

**Strategy:** Fail-fast approach - if linting fails, build and tests don't run.

**Duration:** ~3-5 minutes

**Key Features:**
- ✅ TypeScript type checking with proper build dependencies
- ✅ ESLint with modern flat config (warnings don't fail CI)
- ✅ Comprehensive test suite with flaky test isolation
- ✅ Coverage reports uploaded as artifacts

---

### 2. Build Development Artifacts (`build-dev-artifacts.yml`)

**Triggers:** All pushes to non-main branches

**Purpose:** Create easily accessible .tgz packages for development and testing

**Key Features:**
- ✅ Creates GitHub Release for each dev branch
- ✅ **Replaces** previous release/tag for the same branch (no clutter)
- ✅ Includes detailed changelog with commits since last build
- ✅ Shows commit author attribution
- ✅ Downloadable .tgz packages for core and MCP

**Tag Format:** `dev-<branch-name>` (e.g., `dev-feature-new-indexing`)

**Packages Created:**
- `zilliz-claude-context-core-<version>.tgz`
- `zilliz-claude-context-mcp-<version>.tgz`

**Release Notes Include:**
- Branch name and latest commit
- Build timestamp
- Changes since last dev build for this branch
- Installation instructions for .tgz packages
- Testing commands

**Artifact Access:**
- **GitHub Release**: Go to Releases → Find your branch tag → Download .tgz
- **Workflow Artifacts**: Available for 30 days in Actions tab

**Duration:** ~4-6 minutes

---

### 3. Build & Benchmark (`build.yml`)

**Triggers:** All PRs and pushes to main branches

**Purpose:** Performance validation and cross-platform compatibility

**Key Features:**
- ✅ Performance benchmarks (build times, C++ parsing speed)
- ✅ Cross-platform build validation (Windows, macOS, Linux)
- ✅ Multiple Node.js version testing
- ✅ Benchmark results uploaded as artifacts

**Duration:** ~8-12 minutes

---

### 4. Release Production (`release-prod.yml`)

**Triggers:** Manual workflow dispatch only

**Purpose:** Create official releases with .tgz packages and optional npm publishing

**When to Use:** When ready to release a new version to users

**Input Parameters:**
- `version`: Release version (e.g., `1.0.2`)
- `core_version`: Core package version (optional, defaults to main version)
- `mcp_version`: MCP package version (optional, defaults to main version)
- `publish_npm`: Whether to publish to npm registry

**Steps:**
1. Validate version format and uniqueness
2. Run full CI pipeline (lint, build, test)
3. Update package.json versions
4. Build and create .tgz packages
5. Generate comprehensive release notes
6. Create Git tag and GitHub release
7. Optionally publish to npm

**Requirements:**
- Version must follow semver format (X.Y.Z)
- Secrets required for npm publishing: `NPM_TOKEN`

**Tag Format:** `v<version>` (e.g., `v1.0.2`)

**Duration:** ~8-15 minutes

---

## Typical Workflows

### Feature Development

1. **Create feature branch**: `git checkout -b feature-new-indexing`
2. **Push commits**: Each push triggers **Build Dev Artifacts**
3. **Download packages**: Go to Releases → `dev-feature-new-indexing` → Download .tgz files
4. **Test locally**:
   ```bash
   npm install ./zilliz-claude-context-core-*.tgz
   npm install ./zilliz-claude-context-mcp-*.tgz
   ```
5. **Push more commits**: Release automatically updates (replaces old one)
6. **Create PR**: Triggers **CI** and **Build & Benchmark** workflows
7. **Merge to main**: Triggers **CI** and **Build & Benchmark**

### Testing Dev Packages

```bash
# Download .tgz files from GitHub release, then:

# Test core package
npm install ./zilliz-claude-context-core-*.tgz
node -e "const {Context} = require('@zilliz/claude-context-core'); console.log('Core loaded');"

# Test MCP package
npm install -g ./zilliz-claude-context-mcp-*.tgz
npx @zilliz/claude-context-mcp
```

### Production Release

1. **Ensure main branch is stable**
2. **Run Release Production workflow manually**:
   - Go to Actions → Release Production → Run workflow
   - Input version number (e.g., `1.0.3`)
   - Choose whether to publish to npm
3. **Workflow creates**:
   - Git tag (`v1.0.3`)
   - GitHub release with .tgz packages
   - Optional npm publication
4. **Users can install**:
   - From npm: `npm install @zilliz/claude-context-core@1.0.3`
   - From .tgz: Download and `npm install ./package.tgz`

---

## Package Structure

Our monorepo produces these main packages:

### Core Package (`@zilliz/claude-context-core`)
- **Purpose**: Core indexing engine with AST-based code splitting
- **Exports**: Context class, embeddings, vector databases, splitters
- **Installation**: `npm install @zilliz/claude-context-core`

### MCP Package (`@zilliz/claude-context-mcp`)
- **Purpose**: Model Context Protocol server for AI agent integration
- **Exports**: MCP server executable
- **Installation**: `npm install @zilliz/claude-context-mcp`
- **Usage**: `npx @zilliz/claude-context-mcp`

---

## Optimization Details

### What We Improved

1. **Dev Branch Artifacts:**
   - ✅ GitHub Releases instead of workflow artifacts (easier access)
   - ✅ Automatic tag replacement (no spam)
   - ✅ Detailed changelogs with author attribution
   - ✅ Ready-to-install .tgz packages

2. **Production Releases:**
   - ✅ Manual trigger with version input validation
   - ✅ Optional npm publishing
   - ✅ Comprehensive testing before release
   - ✅ Automatic version bumping and tagging

3. **CI Pipeline:**
   - ✅ Fixed TypeScript linking issues
   - ✅ Modern ESLint flat config
   - ✅ Proper handling of flaky tests
   - ✅ Fast fail-fast approach

4. **Performance Testing:**
   - ✅ Separated benchmarks into dedicated workflow
   - ✅ Cross-platform validation
   - ✅ Performance regression detection

### Performance Improvements

- **Before**: Multiple overlapping workflows, 15-20 minutes total
- **After**: Streamlined workflows, 4-6 minutes for dev feedback
- **Redundancy**: Eliminated duplicate work across workflows

---

## Monitoring and Debugging

### Check Workflow Status

```bash
# View all workflow runs
gh run list

# View specific workflow runs  
gh run list --workflow=ci.yml

# View logs for a specific run
gh run view <run-id> --log
```

### Common Issues

**Issue**: Dev artifact not appearing
- **Solution**: Check Actions tab, then Releases tab after completion

**Issue**: TypeScript linking errors
- **Solution**: Ensure build step runs before typecheck in workflows

**Issue**: npm publish fails
- **Solution**: Check NPM_TOKEN secret and version doesn't already exist

**Issue**: Tag already exists error
- **Solution**: Version validation should catch this, but manually delete tag if needed

---

## Best Practices

1. **Always test dev artifacts** before merging to main
2. **Use semantic versioning** for production releases
3. **Keep commits atomic** for better changelogs
4. **Write clear commit messages** (they appear in release notes)
5. **Monitor CI failures** and fix quickly
6. **Test .tgz packages locally** before relying on npm

---

## Secrets Configuration

Required secrets for full functionality:

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `GITHUB_TOKEN` | Automatic releases | All workflows (auto-provided) |
| `NPM_TOKEN` | npm registry publishing | Production releases (optional) |

Configure secrets in: Repository Settings → Secrets and variables → Actions

---

## Summary

The optimized CI/CD pipeline provides:

✅ **Fast feedback** - Developers know if their code passes in <5 minutes  
✅ **Easy testing** - Dev builds available as .tgz packages via GitHub Releases  
✅ **No clutter** - Dev releases replace old ones for the same branch  
✅ **Clear history** - Detailed changelogs with author attribution  
✅ **No redundancy** - Each workflow has a specific purpose  
✅ **Production ready** - Manual releases with full validation and optional npm publishing  
✅ **Monorepo optimized** - Proper handling of core and MCP packages  

This setup follows CI/CD best practices while being tailored to our monorepo structure and package distribution needs.
