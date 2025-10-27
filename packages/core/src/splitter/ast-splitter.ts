import Parser from 'tree-sitter';
import { Splitter, CodeChunk } from './index';
import { CppSymbolExtractor } from './cpp-symbol-extractor';

// Language parsers
const JavaScript = require('tree-sitter-javascript');
const TypeScript = require('tree-sitter-typescript').typescript;
const Python = require('tree-sitter-python');
const Java = require('tree-sitter-java');
const Cpp = require('tree-sitter-cpp');
const Go = require('tree-sitter-go');
const Rust = require('tree-sitter-rust');
const CSharp = require('tree-sitter-c-sharp');
const Scala = require('tree-sitter-scala');
const Perl = require('@ganezdragon/tree-sitter-perl');

// Validate parsers are loaded
if (!JavaScript) {
    throw new Error('tree-sitter-javascript parser failed to load. Please ensure tree-sitter-javascript is properly installed.');
}
if (!TypeScript) {
    throw new Error('tree-sitter-typescript parser failed to load. Please ensure tree-sitter-typescript is properly installed.');
}
if (!Python) {
    throw new Error('tree-sitter-python parser failed to load. Please ensure tree-sitter-python is properly installed.');
}
if (!Java) {
    throw new Error('tree-sitter-java parser failed to load. Please ensure tree-sitter-java is properly installed.');
}
if (!Cpp) {
    throw new Error('tree-sitter-cpp parser failed to load. Please ensure tree-sitter-cpp is properly installed.');
}
if (!Go) {
    throw new Error('tree-sitter-go parser failed to load. Please ensure tree-sitter-go is properly installed.');
}
if (!Rust) {
    throw new Error('tree-sitter-rust parser failed to load. Please ensure tree-sitter-rust is properly installed.');
}
if (!CSharp) {
    throw new Error('tree-sitter-c-sharp parser failed to load. Please ensure tree-sitter-c-sharp is properly installed.');
}
if (!Scala) {
    throw new Error('tree-sitter-scala parser failed to load. Please ensure tree-sitter-scala is properly installed.');
}
if (!Perl) {
    throw new Error('@ganezdragon/tree-sitter-perl parser failed to load. Please ensure @ganezdragon/tree-sitter-perl is properly installed.');
}

// Node types that represent logical code units
const SPLITTABLE_NODE_TYPES = {
    javascript: ['function_declaration', 'arrow_function', 'class_declaration', 'method_definition', 'export_statement'],
    typescript: ['function_declaration', 'arrow_function', 'class_declaration', 'method_definition', 'export_statement', 'interface_declaration', 'type_alias_declaration'],
    python: ['function_definition', 'class_definition', 'decorated_definition', 'async_function_definition'],
    java: ['method_declaration', 'class_declaration', 'interface_declaration', 'constructor_declaration'],
    cpp: [
        'function_definition',
        'class_specifier',
        'struct_specifier',
        'enum_specifier',
        'namespace_definition',
        'template_declaration',
        'type_definition',
        'union_specifier'
    ],
    go: ['function_declaration', 'method_declaration', 'type_declaration', 'var_declaration', 'const_declaration'],
    rust: ['function_item', 'impl_item', 'struct_item', 'enum_item', 'trait_item', 'mod_item'],
    csharp: ['method_declaration', 'class_declaration', 'interface_declaration', 'struct_declaration', 'enum_declaration'],
    scala: ['method_declaration', 'class_declaration', 'interface_declaration', 'constructor_declaration'],
    perl: ['function_definition', 'package_statement', 'method_invocation']
};

export class AstCodeSplitter implements Splitter {
    private chunkSize: number = 2500;
    private chunkOverlap: number = 300;
    private parser: Parser;
    private langchainFallback: any; // LangChainCodeSplitter for fallback
    private cppSymbolExtractor: CppSymbolExtractor;

    constructor(chunkSize?: number, chunkOverlap?: number) {
        if (chunkSize) this.chunkSize = chunkSize;
        if (chunkOverlap) this.chunkOverlap = chunkOverlap;
        this.parser = new Parser();
        this.cppSymbolExtractor = new CppSymbolExtractor();

        // Initialize fallback splitter
        const { LangChainCodeSplitter } = require('./langchain-splitter');
        this.langchainFallback = new LangChainCodeSplitter(chunkSize, chunkOverlap);
    }

    async split(code: string, language: string, filePath?: string): Promise<CodeChunk[]> {
        // Check if language is supported by AST splitter
        const langConfig = this.getLanguageConfig(language);
        if (!langConfig) {
            console.log(`📝 Language ${language} not supported by AST, using LangChain splitter for: ${filePath || 'unknown'}`);
            return await this.langchainFallback.split(code, language, filePath);
        }

        try {
            console.log(`🌳 Using AST splitter for ${language} file: ${filePath || 'unknown'}`);

            // Validate parser is available
            if (!langConfig.parser) {
                console.warn(`[ASTSplitter] ⚠️  Parser for ${language} not available, falling back to LangChain: ${filePath || 'unknown'}`);
                return await this.langchainFallback.split(code, language, filePath);
            }

            // Detailed diagnostic logging for parser setup
            console.log(`[ASTSplitter] Parser available for ${language}, code length: ${code.length}, file: ${filePath || 'unknown'}`);
            
            this.parser.setLanguage(langConfig.parser);
            const tree = this.parser.parse(code);

            // Enhanced diagnostic logging for parsing results
            if (!tree || !tree.rootNode) {
                console.warn(`[ASTSplitter] ⚠️  Failed to parse AST for ${language}, parser: ${!!langConfig.parser}, tree: ${!!tree}, rootNode: ${!!(tree?.rootNode)}, code length: ${code.length}, file: ${filePath || 'unknown'}`);
                return await this.langchainFallback.split(code, language, filePath);
            }
            
            console.log(`[ASTSplitter] Successfully parsed AST for ${language}, rootNode type: ${tree.rootNode.type}, children: ${tree.rootNode.childCount}, file: ${filePath || 'unknown'}`);

            // Extract chunks based on AST nodes
            const chunks = this.extractChunks(tree.rootNode, code, langConfig.nodeTypes, language, filePath);

            // If chunks are too large, split them further
            const refinedChunks = await this.refineChunks(chunks, code);

            return refinedChunks;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            console.warn(`[ASTSplitter] ⚠️  AST splitter failed for ${language}, falling back to LangChain: ${errorMessage}`);
            if (errorStack) {
                console.warn(`[ASTSplitter] Error stack: ${errorStack}`);
            }
            return await this.langchainFallback.split(code, language, filePath);
        }
    }

    setChunkSize(chunkSize: number): void {
        this.chunkSize = chunkSize;
        this.langchainFallback.setChunkSize(chunkSize);
    }

    setChunkOverlap(chunkOverlap: number): void {
        this.chunkOverlap = chunkOverlap;
        this.langchainFallback.setChunkOverlap(chunkOverlap);
    }

    private getLanguageConfig(language: string): { parser: any; nodeTypes: string[] } | null {
        const langMap: Record<string, { parser: any; nodeTypes: string[] }> = {
            'javascript': { parser: JavaScript, nodeTypes: SPLITTABLE_NODE_TYPES.javascript },
            'js': { parser: JavaScript, nodeTypes: SPLITTABLE_NODE_TYPES.javascript },
            'typescript': { parser: TypeScript, nodeTypes: SPLITTABLE_NODE_TYPES.typescript },
            'ts': { parser: TypeScript, nodeTypes: SPLITTABLE_NODE_TYPES.typescript },
            'python': { parser: Python, nodeTypes: SPLITTABLE_NODE_TYPES.python },
            'py': { parser: Python, nodeTypes: SPLITTABLE_NODE_TYPES.python },
            'java': { parser: Java, nodeTypes: SPLITTABLE_NODE_TYPES.java },
            'cpp': { parser: Cpp, nodeTypes: SPLITTABLE_NODE_TYPES.cpp },
            'cc': { parser: Cpp, nodeTypes: SPLITTABLE_NODE_TYPES.cpp },
            'c++': { parser: Cpp, nodeTypes: SPLITTABLE_NODE_TYPES.cpp },
            'c': { parser: Cpp, nodeTypes: SPLITTABLE_NODE_TYPES.cpp },
            'go': { parser: Go, nodeTypes: SPLITTABLE_NODE_TYPES.go },
            'rust': { parser: Rust, nodeTypes: SPLITTABLE_NODE_TYPES.rust },
            'rs': { parser: Rust, nodeTypes: SPLITTABLE_NODE_TYPES.rust },
            'cs': { parser: CSharp, nodeTypes: SPLITTABLE_NODE_TYPES.csharp },
            'csharp': { parser: CSharp, nodeTypes: SPLITTABLE_NODE_TYPES.csharp },
            'scala': { parser: Scala, nodeTypes: SPLITTABLE_NODE_TYPES.scala },
            'perl': { parser: Perl, nodeTypes: SPLITTABLE_NODE_TYPES.perl },
            'pl': { parser: Perl, nodeTypes: SPLITTABLE_NODE_TYPES.perl },
            'pm': { parser: Perl, nodeTypes: SPLITTABLE_NODE_TYPES.perl }
        };

        return langMap[language.toLowerCase()] || null;
    }

    private extractChunks(
        node: Parser.SyntaxNode,
        code: string,
        splittableTypes: string[],
        language: string,
        filePath?: string
    ): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const codeLines = code.split('\n');

        // Check if this is a C++ file to enable symbol extraction
        const isCpp = ['cpp', 'c++', 'c', 'cc'].includes(language.toLowerCase());

        const traverse = (currentNode: Parser.SyntaxNode) => {
            // Check if this node type should be split into a chunk
            if (splittableTypes.includes(currentNode.type)) {
                const startLine = currentNode.startPosition.row + 1;
                const endLine = currentNode.endPosition.row + 1;
                const nodeText = code.slice(currentNode.startIndex, currentNode.endIndex);

                // Only create chunk if it has meaningful content
                if (nodeText && nodeText.trim && nodeText.trim().length > 0) {
                    const chunk: CodeChunk = {
                        content: nodeText,
                        metadata: {
                            startLine,
                            endLine,
                            language,
                            filePath,
                        }
                    };

                    // Extract symbol metadata for C++ files
                    if (isCpp) {
                        try {
                            const symbols = this.cppSymbolExtractor.extractChunkSymbols(currentNode, nodeText);
                            if (symbols.length > 0) {
                                chunk.metadata.symbols = symbols.map(s => ({
                                    name: s.name,
                                    kind: s.kind,
                                    range: s.range,
                                    definition: s.definition,
                                    usages: s.usages,
                                    documentation: s.documentation,
                                    // LSP-like metadata for semantic search
                                    signature: s.signature,
                                    returnType: s.returnType,
                                    parameters: s.parameters,
                                    parentSymbol: s.parentSymbol,
                                    scope: s.scope,
                                    isStatic: s.isStatic,
                                    isVirtual: s.isVirtual,
                                    isConst: s.isConst,
                                    baseClasses: s.baseClasses
                                }));
                            }
                        } catch (error) {
                            // Symbol extraction failed, continue without symbols
                            console.warn(`Symbol extraction failed for chunk: ${error}`);
                        }
                    }

                    chunks.push(chunk);
                }
            }

            // Continue traversing child nodes
            for (const child of currentNode.children) {
                traverse(child);
            }
        };

        traverse(node);

        // If no meaningful chunks found, create a single chunk with the entire code
        if (chunks.length === 0) {
            const chunk: CodeChunk = {
                content: code,
                metadata: {
                    startLine: 1,
                    endLine: codeLines.length,
                    language,
                    filePath,
                }
            };

            // Extract symbols for the entire file if C++
            if (isCpp) {
                try {
                    const symbols = this.cppSymbolExtractor.extractSymbols(node, code);
                    if (symbols.length > 0) {
                        chunk.metadata.symbols = symbols.map(s => ({
                            name: s.name,
                            kind: s.kind,
                            range: s.range,
                            definition: s.definition,
                            usages: s.usages,
                            documentation: s.documentation,
                            // LSP-like metadata for semantic search
                            signature: s.signature,
                            returnType: s.returnType,
                            parameters: s.parameters,
                            parentSymbol: s.parentSymbol,
                            scope: s.scope,
                            isStatic: s.isStatic,
                            isVirtual: s.isVirtual,
                            isConst: s.isConst,
                            baseClasses: s.baseClasses
                        }));
                    }
                } catch (error) {
                    // Symbol extraction failed, continue without symbols
                    console.warn(`Symbol extraction failed for file: ${error}`);
                }
            }

            chunks.push(chunk);
        }

        return chunks;
    }

    private async refineChunks(chunks: CodeChunk[], originalCode: string): Promise<CodeChunk[]> {
        const refinedChunks: CodeChunk[] = [];

        for (const chunk of chunks) {
            if (chunk.content.length <= this.chunkSize) {
                refinedChunks.push(chunk);
            } else {
                // Split large chunks using character-based splitting
                const subChunks = this.splitLargeChunk(chunk, originalCode);
                refinedChunks.push(...subChunks);
            }
        }

        return this.addOverlap(refinedChunks);
    }

    private splitLargeChunk(chunk: CodeChunk, originalCode: string): CodeChunk[] {
        const lines = chunk.content.split('\n');
        const subChunks: CodeChunk[] = [];
        let currentChunk = '';
        let currentStartLine = chunk.metadata.startLine;
        let currentLineCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineWithNewline = i === lines.length - 1 ? line : line + '\n';

            if (currentChunk.length + lineWithNewline.length > this.chunkSize && currentChunk.length > 0) {
                // Create a sub-chunk
                subChunks.push({
                    content: currentChunk.trim(),
                    metadata: {
                        startLine: currentStartLine,
                        endLine: currentStartLine + currentLineCount - 1,
                        language: chunk.metadata.language,
                        filePath: chunk.metadata.filePath,
                    }
                });

                currentChunk = lineWithNewline;
                currentStartLine = chunk.metadata.startLine + i;
                currentLineCount = 1;
            } else {
                currentChunk += lineWithNewline;
                currentLineCount++;
            }
        }

        // Add the last sub-chunk
        if (currentChunk.trim().length > 0) {
            subChunks.push({
                content: currentChunk.trim(),
                metadata: {
                    startLine: currentStartLine,
                    endLine: currentStartLine + currentLineCount - 1,
                    language: chunk.metadata.language,
                    filePath: chunk.metadata.filePath,
                }
            });
        }

        return subChunks;
    }

    private addOverlap(chunks: CodeChunk[]): CodeChunk[] {
        if (chunks.length <= 1 || this.chunkOverlap <= 0) {
            return chunks;
        }

        const overlappedChunks: CodeChunk[] = [];

        for (let i = 0; i < chunks.length; i++) {
            let content = chunks[i].content;
            const metadata = { ...chunks[i].metadata };

            // Add overlap from previous chunk
            if (i > 0 && this.chunkOverlap > 0) {
                const prevChunk = chunks[i - 1];
                const overlapText = prevChunk.content.slice(-this.chunkOverlap);
                content = overlapText + '\n' + content;
                metadata.startLine = Math.max(1, metadata.startLine - this.getLineCount(overlapText));
            }

            overlappedChunks.push({
                content,
                metadata
            });
        }

        return overlappedChunks;
    }

    private getLineCount(text: string): number {
        return text.split('\n').length;
    }

    /**
     * Check if AST splitting is supported for the given language
     */
    static isLanguageSupported(language: string): boolean {
        const supportedLanguages = [
            'javascript', 'js', 'typescript', 'ts', 'python', 'py',
            'java', 'cpp', 'c++', 'c', 'go', 'rust', 'rs', 'cs', 'csharp', 'scala',
            'perl', 'pl', 'pm'
        ];
        
        return supportedLanguages.includes(language.toLowerCase());
    }
}
