# 🚀 Ultra-Simple Installation - Quick Reference

**For your RHEL 9.6 x86_64 system with Node.js v20.19.2**

## One-Time Build (On System with Internet)

```bash
cd /workspaces/claude-context
pnpm install
pnpm run bundle:full
```

✅ Creates: `bundle-output/claude-context-standalone-*.tar.gz` (includes EVERYTHING!)

## Installation (On Your Offline System)

```bash
# 1. Transfer bundle to your system
scp bundle-output/claude-context-standalone-*.tar.gz palanisd@server:/u/palanisd/.mcp/

# 2. Extract
cd /u/palanisd/.mcp
tar -xzf claude-context-standalone-*.tar.gz

# 3. Install (ONE command - auto-detects everything!)
cd claude-context-standalone
./install.sh /u/palanisd/.mcp/claude-context
```

**That's it!** 🎉 Prebuilds are automatically detected and installed!

## VSCode Config (No Changes Needed!)

Your existing config works as-is:

```json
{
  "mcpServers": {
    "claude-context": {
      "command": "/usr/bin/node",
      "args": ["/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp"],
      "env": {
        "EMBEDDING_PROVIDER": "OpenAI",
        "EMBEDDING_MODEL": "text-embedding-3-large",
        "OPENAI_API_KEY": "your-key",
        "OPENAI_BASE_URL": "https://llm-proxy-api.ai.eng.netapp.com/v1",
        "MILVUS_ADDRESS": "localhost:19530",
        "MILVUS_TOKEN": ""
      }
    }
  }
}
```

## What's Auto-Detected?

✅ faiss-node prebuild (bundled in `prebuilds/`)  
✅ Perl parser prebuild (bundled in `prebuilds/`)  
✅ All JavaScript dependencies (bundled in packages)  
✅ All tree-sitter parsers (JS, Python, C++, Java, Go, Rust, etc.)

## Before vs After

### Before (Your Complex Script)
```bash
npm install @zilliz/claude-context-mcp@latest  # ❌ Network needed
npm update                                      # ❌ Network needed
# Complex dependency management
# Manual prebuild handling
# Multiple environment variables
```

### After (Standalone Bundle)
```bash
tar -xzf bundle.tar.gz     # ✅ Just extract
./install.sh               # ✅ One command
# Everything auto-detected!
```

## Troubleshooting

### Check prebuilds are bundled
```bash
ls -la claude-context-standalone/prebuilds/
# Should show:
#   faiss-node-v0.5.1-napi-v8-linux-x64.tar.gz
#   tree_sitter_perl_binding.node
```

### Verify installation
```bash
/u/palanisd/.mcp/claude-context/node_modules/.bin/claude-context-mcp --help
```

### Test manually
```bash
cd /u/palanisd/.mcp/claude-context
OPENAI_API_KEY=your-key \
MILVUS_ADDRESS=localhost:19530 \
./node_modules/.bin/claude-context-mcp
```

## File Sizes

- Bundle tarball: ~150-200 MB (includes prebuilds!)
- Installed: ~400 MB
- No additional downloads ever needed

## What You DON'T Need Anymore

❌ `update-dependencies.sh` script  
❌ Manual prebuild downloads  
❌ `FAISS_PREBUILD` environment variable (optional now)  
❌ `PERL_PARSER_PREBUILD` environment variable (optional now)  
❌ Network access during installation  
❌ npm/pnpm on target system  

## What You DO Need

✅ Node.js v20.x (you have v20.19.2 ✓)  
✅ The bundle tarball  
✅ 5 minutes of your time  

Done! 🎉
