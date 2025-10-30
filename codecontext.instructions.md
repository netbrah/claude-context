# Code Context Search Instructions for Copilot

## Overview

This document provides guidance on how and when to use the `search_code` tool effectively when working with the Claude Context codebase. The `search_code` tool leverages semantic search powered by vector embeddings and hybrid search (BM25 + dense vectors) to find relevant code across the entire codebase.

## Primary Search Strategy: Use `search_code` First

**ALWAYS** prefer using `search_code` over grep/ripgrep searches. The semantic search is:
- **Context-aware**: Understands code meaning, not just text patterns
- **Intelligent**: Finds semantically related code even with different naming
- **Comprehensive**: Searches across the entire indexed codebase efficiently
- **Precise**: Returns results ranked by relevance with proper context

### When to Use `search_code`

Use `search_code` as your **PRIMARY** search tool for:

1. **Finding Implementations**
   - Locating functions, classes, or methods by description
   - Example: "functions that handle MCP tool registration"
   - Example: "code that processes embedding requests"

2. **Understanding Architecture**
   - Discovering how components interact
   - Example: "vector database initialization and connection"
   - Example: "file synchronization logic"

3. **Code Context Gathering**
   - Getting relevant context before making changes
   - Example: "error handling patterns in indexing"
   - Example: "configuration loading mechanisms"

4. **Bug Investigation**
   - Locating problematic code sections
   - Example: "collection limit validation"
   - Example: "snapshot management errors"

5. **Feature Development**
   - Understanding existing implementations before adding features
   - Example: "progress tracking during indexing"
   - Example: "file extension filtering logic"

6. **Refactoring Tasks**
   - Finding all related code that needs updates
   - Example: "code that uses embedding providers"
   - Example: "snapshot save operations"

7. **Pattern Discovery**
   - Identifying code patterns and conventions
   - Example: "async error handling patterns"
   - Example: "logging conventions in handlers"

8. **Duplicate Detection**
   - Finding similar or redundant implementations
   - Example: "path validation logic"
   - Example: "absolute path resolution"

## How to Use `search_code` Effectively

### Basic Usage Pattern

```typescript
// The search_code tool is available through MCP
// Query format: natural language description

// Example 1: Find specific functionality
search_code({
  path: "/absolute/path/to/codebase",
  query: "code that handles indexing progress updates",
  limit: 10
})

// Example 2: Find error handling patterns
search_code({
  path: "/absolute/path/to/codebase",
  query: "error handling in MCP tool handlers",
  limit: 5
})

// Example 3: Find with file type filter
search_code({
  path: "/absolute/path/to/codebase",
  query: "TypeScript interfaces for vector database",
  limit: 10,
  extensionFilter: [".ts"]
})
```

### Crafting Effective Queries

**Good Queries** (semantic and descriptive):
- ✅ "functions that validate absolute paths"
- ✅ "code that synchronizes with vector database collections"
- ✅ "snapshot manager save operations"
- ✅ "error messages for collection limits"
- ✅ "background indexing with progress callbacks"

**Poor Queries** (too generic or ambiguous):
- ❌ "path" (too vague)
- ❌ "error" (returns too many generic results)
- ❌ "index" (ambiguous - array index or codebase indexing?)

**Pro Tips for Better Queries**:
1. **Be Specific**: Include context about what the code does
2. **Use Technical Terms**: Include domain-specific terminology (e.g., "MCP", "embedding", "vector database")
3. **Describe Intent**: Focus on what the code accomplishes, not variable names
4. **Add Context**: Include information about the component or feature area

### Understanding Search Results

Results from `search_code` include:
- **File path and line numbers**: Exact location of the code
- **Ranked by relevance**: Most relevant results first
- **Code context**: Surrounding code for understanding
- **Language identification**: Programming language of the snippet

Example result format:
```
1. Code snippet (typescript) [claude-context]
   Location: packages/mcp/src/handlers.ts:144-189
   Rank: 1
   Context:
   ```typescript
   public async handleIndexCodebase(args: any) {
       const { path: codebasePath, force, splitter } = args;
       // ... code snippet ...
   }
   ```
```

## When to Fall Back to Grep

Use grep/ripgrep **ONLY** when:

1. **Exact String Matching Required**
   - Finding exact error messages or log strings
   - Example: `grep -r "Collection limit reached" .`

2. **File Name or Path Searches**
   - Finding files by exact name
   - Example: `find . -name "*.test.ts"`

3. **Regular Expression Patterns**
   - Complex regex patterns that semantic search can't handle
   - Example: `grep -E "v[0-9]+\.[0-9]+\.[0-9]+" package.json`

4. **Codebase Not Indexed Yet**
   - When working in a new or unindexed directory
   - Always try to index first if possible

5. **Simple String Occurrences**
   - Counting occurrences of a specific string
   - Example: `grep -c "TODO" *.ts`

## Workflow: Search-First Approach

### Recommended Workflow

1. **Start with `search_code`**
   ```
   Query: "functions that handle snapshot persistence"
   ```

2. **Review semantic results**
   - Examine the returned code snippets
   - Identify relevant files and line ranges

3. **Use grep for refinement** (if needed)
   ```bash
   # Only if you need exact string matches in specific files
   grep -n "saveCodebaseSnapshot" packages/mcp/src/snapshot.ts
   ```

4. **Read full context**
   ```bash
   # View the complete file once you've found the right location
   cat packages/mcp/src/snapshot.ts
   ```

### Example: Debugging an Issue

**Scenario**: Need to understand how collection limits are validated

**Step 1**: Semantic search first
```
search_code({
  path: "/home/runner/work/claude-context/claude-context",
  query: "collection limit validation and error handling",
  limit: 5
})
```

**Step 2**: Review results (if search finds the code, STOP here)

**Step 3**: Only if needed, use grep for exact messages
```bash
grep -r "COLLECTION_LIMIT_MESSAGE" packages/
```

## Best Practices

### DO ✅

1. **Always index codebases first**
   - Ensure the codebase is indexed before searching
   - Check indexing status regularly

2. **Use descriptive queries**
   - Write queries as if explaining to a colleague
   - Include domain context and technical terms

3. **Start broad, then narrow**
   - Begin with broader semantic searches
   - Use `extensionFilter` to narrow by file type if needed

4. **Review multiple results**
   - Don't just look at the top result
   - Check top 5-10 results for comprehensive understanding

5. **Combine with file viewing**
   - Use search results to identify files
   - View complete files for full context

### DON'T ❌

1. **Don't jump to grep immediately**
   - Resist the urge to use familiar tools
   - Give semantic search a chance first

2. **Don't use overly generic queries**
   - Avoid single words like "function" or "class"
   - Add specificity to your queries

3. **Don't ignore search results**
   - If semantic search returns results, examine them
   - The ranking is meaningful - top results are most relevant

4. **Don't search unindexed codebases**
   - Always ensure indexing is complete
   - Use `get_indexing_status` to check progress

## Indexing Guidelines

### Before Searching

Always ensure the codebase is indexed:

```typescript
// Check if indexed
get_indexing_status({
  path: "/absolute/path/to/codebase"
})

// If not indexed, index it first
index_codebase({
  path: "/absolute/path/to/codebase",
  force: false,
  splitter: "ast"
})
```

### Monitoring Indexing Progress

```typescript
// Check progress during indexing
get_indexing_status({
  path: "/absolute/path/to/codebase"
})
```

## Common Search Patterns

### Pattern 1: Understanding a Feature

**Goal**: Learn how snapshot management works

```typescript
search_code({
  path: "/absolute/path/to/codebase",
  query: "snapshot manager initialization and persistence",
  limit: 10
})
```

### Pattern 2: Finding Error Handling

**Goal**: Understand error handling in MCP handlers

```typescript
search_code({
  path: "/absolute/path/to/codebase",
  query: "error handling and exception management in MCP tool handlers",
  limit: 8,
  extensionFilter: [".ts"]
})
```

### Pattern 3: API Usage Discovery

**Goal**: Find how embedding providers are used

```typescript
search_code({
  path: "/absolute/path/to/codebase",
  query: "embedding provider initialization and API calls",
  limit: 10
})
```

### Pattern 4: Configuration Patterns

**Goal**: Understand configuration loading

```typescript
search_code({
  path: "/absolute/path/to/codebase",
  query: "environment variable configuration and validation",
  limit: 5
})
```

## Performance Considerations

### Search Optimization

- **Limit parameter**: Use appropriate limits (5-10 for most cases)
- **Extension filtering**: Use `extensionFilter` to reduce result set
- **Query specificity**: More specific queries return better results faster

### When Search is Most Effective

- **Large codebases**: Semantic search scales better than grep
- **Cross-component searches**: Finds related code across modules
- **Conceptual queries**: Understands intent, not just keywords

## Troubleshooting

### If Search Returns No Results

1. **Verify indexing status**
   ```typescript
   get_indexing_status({ path: "/path/to/codebase" })
   ```

2. **Check if path is correct**
   - Must be absolute path
   - Verify directory exists

3. **Refine your query**
   - Try different phrasing
   - Broaden or narrow scope

4. **Fall back to grep temporarily**
   - Use while re-indexing if needed
   - Return to semantic search once indexed

### If Results Seem Irrelevant

1. **Make query more specific**
   - Add more context words
   - Include technical terminology

2. **Use file extension filter**
   - Narrow to specific file types
   - Example: `extensionFilter: [".ts", ".tsx"]`

3. **Review query phrasing**
   - Try different descriptions
   - Focus on functionality, not implementation details

## Summary

### Key Takeaways

1. **🎯 Use `search_code` as your primary search tool**
2. **🔍 Craft semantic, descriptive queries**
3. **📊 Review multiple results for comprehensive understanding**
4. **⚙️ Use grep only as a fallback for exact string matching**
5. **📚 Always ensure codebases are indexed before searching**

### Quick Reference

| Use Case | Tool | Example |
|----------|------|---------|
| Find implementations | `search_code` | "vector database query operations" |
| Understand patterns | `search_code` | "error handling in async functions" |
| Locate features | `search_code` | "progress tracking callbacks" |
| Exact string match | `grep` | `grep -r "exact error message"` |
| File name search | `find/ls` | `find . -name "*.test.ts"` |
| Regex patterns | `grep` | `grep -E "v[0-9]+"` |

---

**Remember**: Semantic search understands meaning, not just words. Use it first, and you'll find better results faster! 🚀
