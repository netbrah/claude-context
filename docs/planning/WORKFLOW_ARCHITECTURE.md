# CI/CD Workflow Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Pull Request / Push to Main Branches                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  LINT    │      │  TEST    │      │  BUILD   │
    │  1-2 min │      │ 5-10 min │      │ 10-15min │
    └──────────┘      └──────────┘      └──────────┘
         │                  │                  │
         │                  │                  │
    TypeScript         Unit Tests        Build All
    ESLint             Coverage          Benchmarks
                       Parser Tests      Cross-Platform


┌─────────────────────────────────────────────────────────────────────┐
│  Tag: dev-*                                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │  RELEASE-DEV  │
                      │   15-20 min   │
                      └───────────────┘
                              │
                              ▼
                   GitHub Pre-Release
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Core.tgz        MCP.tgz          VSIX
    Benchmarks


┌─────────────────────────────────────────────────────────────────────┐
│  Tag: v*                                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ RELEASE-PROD  │
                      │   20-30 min   │
                      └───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
         npm: core      npm: mcp      VSCode Store
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
                      GitHub Release
```

## Workflow Details

### Parallel PR/Push Workflows

All three workflows run simultaneously for fast feedback:

```
lint.yml (Fast Fail)
├─ TypeScript Type Check
└─ ESLint Validation
   └─ Result: 1-2 minutes ⚡

test.yml (Quality Gate)
├─ Core Unit Tests (119 tests)
├─ Coverage Reports
└─ Parser Tests
   └─ Result: 5-10 minutes

build.yml (Platform Validation)
├─ Primary Build (Ubuntu 20.x)
│  ├─ Build Benchmark
│  └─ C++ Parser Benchmark
└─ Cross-Platform Matrix
   ├─ Windows + Node 20.x
   ├─ macOS + Node 20.x
   └─ Ubuntu + Node 22.x
   └─ Result: 10-15 minutes
```

### Development Release Flow

```
Developer pushes: dev-v1.0.0
                   │
                   ▼
          release-dev.yml
                   │
    ┌──────────────┼──────────────┐
    │              │              │
Build All     Run Tests    Create Tarballs
    │              │              │
    └──────────────┴──────────────┘
                   │
                   ▼
         GitHub Pre-Release
         (with artifacts)
                   │
    ┌──────────────┼──────────────────┐
    │              │                  │
Core Tarball   MCP Tarball      VSIX File
    │              │                  │
    └──────────────┴──────────────────┘
              Download & Test
```

### Production Release Flow

```
Developer pushes: v1.0.0
                   │
                   ▼
          release-prod.yml
                   │
    ┌──────────────┼──────────────┐
    │              │              │
Run Tests     Build All    Create Tarballs
    │              │              │
    └──────────────┴──────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
Publish npm   Publish VSCode  GitHub Release
    │              │              │
    │              │              └─ Backup Tarballs
    │              │                 + Benchmarks
    │              │
    │              └─ VSCode Marketplace
    │                 (semanticcodesearch)
    │
    └─ npm registry
       ├─ @zilliz/claude-context-core
       └─ @zilliz/claude-context-mcp
```

## Security Model

All workflows use explicit permissions following principle of least privilege:

```
┌─────────────────┬────────────────┬────────────────┐
│   Workflow      │  Permissions   │   Reason       │
├─────────────────┼────────────────┼────────────────┤
│ lint.yml        │ contents: read │ Read-only      │
│ test.yml        │ contents: read │ Read-only      │
│ build.yml       │ contents: read │ Read-only      │
│ release-dev.yml │ contents: write│ Create release │
│                 │ packages: read │ Read packages  │
│ release-prod.yml│ contents: write│ Create release │
│                 │ packages: read │ Read packages  │
└─────────────────┴────────────────┴────────────────┘
```

## Concurrency Control

All workflows use concurrency groups to cancel outdated runs:

```
PR #123 → Commit A → Workflows Start
              │
              │ (new push)
              ▼
        Commit B → Cancel Commit A workflows
                   Start new workflows
```

This prevents wasted CI minutes on outdated code.

## Artifact Retention

```
Artifacts Timeline
├─ PR/Push Artifacts: 30 days
│  ├─ Test Coverage
│  ├─ Build Benchmarks
│  └─ C++ Benchmarks
│
└─ Release Artifacts: Permanent
   ├─ Package Tarballs
   ├─ VSIX Files
   └─ Benchmark Results
```

## Performance Metrics

```
Old Workflow System
├─ Average Duration: 20-25 minutes
├─ Redundant Checks: Yes
├─ Feedback Time: End of pipeline
└─ Artifact Access: Manual

New Workflow System
├─ Lint Feedback: 1-2 minutes ⚡
├─ Test Feedback: 5-10 minutes
├─ Build Feedback: 10-15 minutes
├─ Redundant Checks: None ✅
├─ Feedback Time: Parallel (fastest wins)
└─ Artifact Access: Automatic 📦
```

## Decision Tree

```
Code Change?
    │
    ├─ Push to PR/Main
    │   │
    │   ├─ Run lint.yml  ─────────┐
    │   ├─ Run test.yml  ─────────┤ Parallel
    │   └─ Run build.yml ─────────┘
    │
    ├─ Push tag dev-*
    │   │
    │   └─ Run release-dev.yml
    │       └─ Create Pre-Release
    │
    └─ Push tag v*
        │
        └─ Run release-prod.yml
            ├─ Publish npm
            ├─ Publish VSCode
            └─ Create GitHub Release
```

## Testing Locally

```bash
# Verify all workflow commands work locally
./scripts/verify-workflows.sh

Checks:
✓ TypeScript type checking
✓ Build all packages
✓ Verify build outputs
✓ Run core tests
✓ Run parser tests
✓ Build benchmark
✓ C++ benchmark
✓ Create tarballs
✓ Package VSCode extension
```

## Troubleshooting Guide

```
Workflow Failed?
    │
    ├─ Check Workflow Summary (auto-generated)
    │   └─ Contains: Times, status, benchmarks
    │
    ├─ Download Artifacts
    │   ├─ Coverage reports
    │   ├─ Benchmark results
    │   └─ Error logs
    │
    ├─ Run Locally
    │   └─ ./scripts/verify-workflows.sh
    │
    └─ Check Job Logs
        └─ GitHub Actions UI → Specific job
```

---

**Legend**:
- ⚡ = Fast execution
- ✅ = Success/Implemented
- 📦 = Artifact available
- 🔒 = Security hardened
