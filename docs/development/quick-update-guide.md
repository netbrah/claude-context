# Quick Package Update Guide

Guide for developers who want to test package changes on an installed system without rebuilding the entire standalone bundle.

## Use Case

You have a full standalone bundle installed and want to test changes to the core or MCP package without:
- Rebuilding the entire standalone bundle
- Re-downloading/rebuilding native modules (faiss-node, perl parser)
- Losing your current installation

## Quick Core Package Update

### 1. Build and Pack on Dev Machine

```bash
cd packages/core
pnpm build
npm pack
```

This creates: `zilliz-claude-context-core-0.1.3.tgz`

### 2. Transfer to Test System

```bash
scp zilliz-claude-context-core-0.1.3.tgz user@test-system:/tmp/
```

### 3. Install on Test System

```bash
cd ~/.mcp/claude-context  # or wherever you installed
npm install --force /tmp/zilliz-claude-context-core-0.1.3.tgz
```

**Done!** The `--force` flag ensures npm replaces the existing package.

## Quick MCP Package Update

Same process for MCP package:

```bash
# On dev machine
cd packages/mcp
pnpm build
npm pack

# Transfer
scp zilliz-claude-context-mcp-0.1.3.tgz user@test-system:/tmp/

# Install
cd ~/.mcp/claude-context
npm install --force /tmp/zilliz-claude-context-mcp-0.1.3.tgz
```

## What Gets Preserved

✅ **Native modules remain intact**
- faiss-node prebuilds
- tree-sitter-perl parser
- All other native binaries

✅ **Dependencies stay in place**
- No re-download of dependencies
- Workspace structure preserved

✅ **Configuration unchanged**
- Environment variables
- MCP client configuration

## What Gets Updated

🔄 **Only the specific package you install**
- Core: Just the indexing/splitting logic
- MCP: Just the MCP server code

## When to Use Full Reinstall

Use the full standalone bundle installation when:
- Native modules need rebuilding (Node.js version change)
- Major dependency updates
- Complete environment reset needed
- Testing the full installation process

### Full Clean Install

```bash
# Remove everything
cd ~/.mcp
rm -rf claude-context

# Reinstall from bundle
cd /path/to/standalone-bundle
./install.sh
```

## Testing After Update

```bash
# Restart your MCP client (VSCode, Claude Desktop, etc.)
# Or test the MCP server directly:
~/.mcp/claude-context/node_modules/.bin/claude-context-mcp
```

## Troubleshooting

### Package Not Updated

If changes don't appear, clear npm cache:

```bash
npm cache clean --force
npm install --force /tmp/zilliz-claude-context-core-0.1.3.tgz
```

### Native Module Errors

If you get native module errors after update, you may need a full reinstall:

```bash
cd ~/.mcp
rm -rf claude-context
# Then run full install
```

### Verify Installation

Check installed version:

```bash
cd ~/.mcp/claude-context
npm list @zilliz/claude-context-core
npm list @zilliz/claude-context-mcp
```

## Local Development Without Transfer

If developing and testing on the same machine:

```bash
# Build package
cd packages/core
pnpm build
npm pack

# Install directly (no scp needed)
cd ~/.mcp/claude-context
npm install --force /path/to/claude-context/packages/core/zilliz-claude-context-core-0.1.3.tgz
```

## Pro Tips

1. **Version Numbers**: Keep version in package.json to track which build you're testing
2. **Symlinks**: Consider using `npm link` for rapid local development (not for production)
3. **Logs**: Check MCP client logs to verify your changes are loaded
4. **Restart**: Always restart your MCP client after package updates
