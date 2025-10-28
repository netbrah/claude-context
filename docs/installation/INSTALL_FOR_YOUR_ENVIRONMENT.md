# Installation Guide for Your RHEL Environment

This guide shows exactly how to install and configure the standalone bundle in your specific environment.

## 📦 What You'll Get

After following this guide:
- Claude Context installed at `/u/palanisd/.mcp/claude-context`
- All dependencies bundled (no network needed)
- Ready to use with your existing VSCode MCP config

## Step 1: Build the Standalone Bundle

**On a system with internet access** (like this dev container):

```bash
cd /workspaces/claude-context

# Install dependencies (one time)
pnpm install

# Build everything including Perl parser
pnpm run bundle:full

# This creates:
# - bundle-output/claude-context-standalone-YYYYMMDD-HHMMSS.tar.gz (main bundle)
# - prebuilds/tree-sitter-perl-x86_64-linux.node (Perl parser)
```

The bundle will be in `bundle-output/` directory.

## Step 2: Transfer Files to Your System

**Copy these files to your RHEL system**:

```bash
# On build system, find the bundle
ls bundle-output/claude-context-standalone-*.tar.gz

# Transfer to your system (example using scp)
scp bundle-output/claude-context-standalone-*.tar.gz palanisd@your-server:/u/palanisd/.mcp/
scp prebuilds/tree-sitter-perl-x86_64-linux.node palanisd@your-server:/u/palanisd/.mcp/prebuilds/

# You already have:
# /u/palanisd/.mcp/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
```

## Step 3: Install on Your System

**On your RHEL system** (`/u/palanisd/.mcp/`):

```bash
cd /u/palanisd/.mcp

# Extract the bundle
tar -xzf claude-context-standalone-*.tar.gz

# This creates a directory: claude-context-standalone/
ls claude-context-standalone/
# You'll see:
# - install.sh
# - README.md
# - prebuilds/                                    ← Prebuilt binaries included!
#   ├── faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
#   └── tree_sitter_perl_binding.node
# - zilliz-claude-context-core-*.tgz
# - zilliz-claude-context-mcp-*.tgz

# Run installation - prebuilds are AUTO-DETECTED! 🎉
cd claude-context-standalone
./install.sh /u/palanisd/.mcp/claude-context
```

**That's it!** The installer automatically:
- ✅ Detects bundled prebuilds in `prebuilds/` directory
- ✅ Installs faiss-node prebuild automatically
- ✅ Installs Perl parser prebuild automatically
- ✅ Sets up all packages and executables
- ✅ Zero additional downloads or configuration needed!

### Optional: Using Your Own Prebuilds

If you prefer to use your own prebuilt binaries instead of the bundled ones:

```bash
# Override bundled prebuilds with your own
FAISS_PREBUILD=/path/to/your/faiss-node.tar.gz \
PERL_PARSER_PREBUILD=/path/to/your/parser.node \
./install.sh /u/palanisd/.mcp/claude-context
```

**Note**: Environment variables override bundled prebuilds if you provide them.

**What the installer does**:
1. Detects bundled prebuilds in `prebuilds/` directory ✨
2. Creates `/u/palanisd/.mcp/claude-context/`
3. Extracts core and MCP packages
4. Sets up `node_modules/` structure with symlinks
5. Creates executable: `node_modules/.bin/claude-context-mcp`
6. Automatically installs faiss-node prebuild (from bundle)
7. Automatically installs Perl parser to correct location:
   - `/u/palanisd/.mcp/claude-context/core-package/node_modules/@ganezdragon/tree-sitter-perl/build/Release/tree_sitter_perl_binding.node`
8. **Zero npm installs, zero network calls, zero manual configuration!** ✅

## Step 4: Verify Installation

```bash
# Check the installation
ls -la /u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp

# Should be executable and exist
file /u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp

# Quick test (may need env vars to fully work)
/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp --help
```

## Step 5: Update Your VSCode MCP Config

**Your existing config works as-is!** No changes needed if you installed to the default path:

```json
{
  "mcpServers": {
    "claude-context": {
      "command": "/usr/bin/node",
      "args": ["/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp"],
      "env": {
        "EMBEDDING_PROVIDER": "OpenAI",
        "EMBEDDING_MODEL": "text-embedding-3-large",
        "EMBEDDING_BATCH_SIZE": "100",
        "OPENAI_API_KEY": "key=sk_30abc8bf24b6993dad7401159e4ab5afb57cbbc3481a6f19fefc4904c015bc69&user=palanisd",
        "OPENAI_BASE_URL": "https://llm-proxy-api.ai.eng.netapp.com/v1",
        "MILVUS_ADDRESS": "localhost:19530",
        "MILVUS_TOKEN": "",
        "SPLITTER_TYPE": "langchain",
        "CHUNK_SIZE": "1000",
        "CHUNK_OVERLAP": "200",
        "CUSTOM_IGNORE_PATTERNS": "**/.git/**,**/__pycache__/**,**/bedrock/**,**/*cache,**/.history/**,br/**,**/.ruff_cache/**,**/.pytest_cache/**",
        "PATH": "/usr/bin:${env:PATH}"
      }
    }
  }
}
```

**Config file location**: 
- Usually: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Or wherever your VSCode stores MCP settings

## Step 6: Restart VSCode / MCP Client

After updating the config:
1. Close and reopen VSCode
2. Or restart the MCP client
3. Claude Context should now be available

## 📁 Final Directory Structure

After installation, you'll have:

```
/u/palanisd/.mcp/
├── claude-context/                          # Installation directory
│   ├── node_modules/
│   │   ├── @zilliz/
│   │   │   ├── claude-context-core/        # Symlink to core-package
│   │   │   └── claude-context-mcp/         # Symlink to mcp-package
│   │   └── .bin/
│   │       └── claude-context-mcp          # Executable (this is what you run)
│   ├── core-package/                       # Extracted core package
│   │   ├── dist/
│   │   ├── node_modules/                   # ALL core dependencies bundled here
│   │   └── package.json
│   ├── mcp-package/                        # Extracted MCP package
│   │   ├── dist/
│   │   ├── node_modules/                   # ALL MCP dependencies bundled here
│   │   └── package.json
│   ├── zilliz-claude-context-core-*.tgz   # Original tarballs (can delete after install)
│   └── zilliz-claude-context-mcp-*.tgz
├── claude-context-standalone/              # Extracted bundle (can delete after install)
│   ├── install.sh
│   └── ...
├── faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz  # Your existing prebuild
└── prebuilds/
    └── tree-sitter-perl-x86_64-linux.node      # Perl parser from bundle build
```

## 🎯 Key Differences from Your Old Method

### Before (Your `update-dependencies.sh` script)
```bash
npm install @zilliz/claude-context-mcp@latest  # ❌ Needs network
npm update                                      # ❌ Needs network
npm install --ignore-scripts                    # ❌ Downloads packages
```

### After (Standalone bundle)
```bash
tar -xzf claude-context-standalone-*.tar.gz    # ✅ Just extract
./install.sh                                   # ✅ No network calls
```

## 🔧 Troubleshooting

### Installation Script Not Executable
```bash
chmod +x claude-context-standalone/install.sh
```

### MCP Binary Not Found After Install
```bash
# Check if it exists
ls -la /u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp

# Make it executable
chmod +x /u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp
```

### Permission Errors
```bash
# Ensure you own the installation directory
chown -R palanisd:palanisd /u/palanisd/.mcp/claude-context
```

### faiss-node Not Working
```bash
# Verify your prebuild exists
ls -la /u/palanisd/.mcp/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz

# Re-run install with explicit path
cd /u/palanisd/.mcp/claude-context-standalone
FAISS_PREBUILD=/u/palanisd/.mcp/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz \
./install.sh /u/palanisd/.mcp/claude-context
```

### Test Core Package Manually
```bash
cd /u/palanisd/.mcp/claude-context
/usr/bin/node -e "require('@zilliz/claude-context-core'); console.log('Core works!');"
```

### Test MCP Server Manually
```bash
cd /u/palanisd/.mcp/claude-context
OPENAI_API_KEY=your-key \
MILVUS_ADDRESS=localhost:19530 \
EMBEDDING_PROVIDER=OpenAI \
./node_modules/.bin/claude-context-mcp
```

## 🔄 Updating to New Version

When you get a new standalone bundle:

```bash
# Backup current installation (optional)
mv /u/palanisd/.mcp/claude-context /u/palanisd/.mcp/claude-context.backup

# Install new version
cd /u/palanisd/.mcp
tar -xzf claude-context-standalone-NEW-VERSION.tar.gz
cd claude-context-standalone

FAISS_PREBUILD=/u/palanisd/.mcp/faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz \
PERL_PARSER_PREBUILD=/u/palanisd/.mcp/prebuilds/tree-sitter-perl-x86_64-linux.node \
./install.sh /u/palanisd/.mcp/claude-context

# Test
/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp --help

# If it works, delete backup
rm -rf /u/palanisd/.mcp/claude-context.backup
```

## 📊 Size Comparison

```
Your old method:
- Multiple tarballs
- node_modules after npm install: ~500MB+

Standalone bundle:
- Single tarball: ~150-200MB
- Installed size: ~400MB
- No additional downloads
```

## ✅ Checklist

- [ ] Build bundle on system with internet: `pnpm run bundle:full`
- [ ] Transfer bundle tarball to `/u/palanisd/.mcp/`
- [ ] Transfer Perl parser to `/u/palanisd/.mcp/prebuilds/`
- [ ] Extract bundle: `tar -xzf ...`
- [ ] Run install.sh with FAISS_PREBUILD and PERL_PARSER_PREBUILD
- [ ] Verify executable: `/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp`
- [ ] Update VSCode MCP config (if needed)
- [ ] Restart VSCode
- [ ] Test semantic search in Claude

## 🎉 Done!

You now have a completely offline installation that doesn't need npm or network access!

## See Also

- [Standalone Bundle Documentation](STANDALONE_BUNDLE.md) - Complete technical docs
- [Quick Start](OFFLINE_INSTALL_QUICKSTART.md) - Quick reference
- [Workflow Guide](STANDALONE_BUNDLE_WORKFLOWS.md) - Using GitHub Actions to build bundles
