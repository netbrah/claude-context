import Parser from 'tree-sitter';

/**
 * Symbol information extracted from C++ code
 */
export interface SymbolInfo {
    name: string;
    kind: SymbolKind;
    range: {
        startLine: number;
        endLine: number;
        startColumn: number;
        endColumn: number;
    };
    definition?: {
        line: number;
        column: number;
    };
    usages?: Array<{
        line: number;
        column: number;
    }>;
    documentation?: string;
}

/**
 * Symbol kinds matching LSP SymbolKind enum
 */
export enum SymbolKind {
    Function = 'function',
    Class = 'class',
    Method = 'method',
    Variable = 'variable',
    Namespace = 'namespace',
    Struct = 'struct',
    Enum = 'enum',
    Interface = 'interface',
    Constructor = 'constructor',
    Field = 'field',
    Parameter = 'parameter',
    TypeParameter = 'type_parameter',
    Template = 'template'
}

/**
 * Extract symbol information from C++ code using tree-sitter
 * This provides metadata similar to LSP but without requiring a language server
 */
export class CppSymbolExtractor {
    /**
     * Extract all symbols from a C++ AST
     */
    public extractSymbols(root: Parser.SyntaxNode, code: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = [];
        const symbolUsages = new Map<string, Array<{ line: number; column: number }>>();

        // First pass: collect all identifier usages
        this.collectIdentifierUsages(root, symbolUsages);

        // Second pass: extract symbol definitions
        this.extractSymbolDefinitions(root, code, symbols, symbolUsages);

        return symbols;
    }

    /**
     * Extract symbols from a specific chunk's AST node
     */
    public extractChunkSymbols(node: Parser.SyntaxNode, code: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = [];
        const symbolUsages = new Map<string, Array<{ line: number; column: number }>>();

        // Collect usages within this chunk
        this.collectIdentifierUsages(node, symbolUsages);

        // Extract definitions within this chunk
        this.extractSymbolDefinitions(node, code, symbols, symbolUsages);

        return symbols;
    }

    /**
     * Collect all identifier usages (references) in the AST
     */
    private collectIdentifierUsages(
        node: Parser.SyntaxNode,
        usages: Map<string, Array<{ line: number; column: number }>>
    ): void {
        // Collect identifier nodes that represent usages
        if (node.type === 'identifier' && node.parent) {
            const parentType = node.parent.type;
            // Skip identifiers that are part of declarations
            if (!this.isDeclarationContext(parentType)) {
                const name = node.text;
                if (!usages.has(name)) {
                    usages.set(name, []);
                }
                usages.get(name)!.push({
                    line: node.startPosition.row + 1,
                    column: node.startPosition.column
                });
            }
        }

        // Recursively process children
        for (const child of node.children) {
            this.collectIdentifierUsages(child, usages);
        }
    }

    /**
     * Check if a node type represents a declaration context
     */
    private isDeclarationContext(nodeType: string): boolean {
        return [
            'function_declarator',
            'type_identifier',
            'field_declaration',
            'parameter_declaration',
            'class_specifier',
            'struct_specifier',
            'enum_specifier',
            'namespace_definition'
        ].includes(nodeType);
    }

    /**
     * Extract symbol definitions from the AST
     */
    private extractSymbolDefinitions(
        node: Parser.SyntaxNode,
        code: string,
        symbols: SymbolInfo[],
        usages: Map<string, Array<{ line: number; column: number }>>
    ): void {
        let symbolName: string | null = null;
        let symbolKind: SymbolKind | null = null;
        let symbolNode: Parser.SyntaxNode | null = null;

        // Extract function definitions
        if (node.type === 'function_definition') {
            const declarator = this.findChildByType(node, 'function_declarator');
            if (declarator) {
                const identifier = this.findChildByType(declarator, 'identifier') ||
                                 this.findChildByType(declarator, 'field_identifier');
                if (identifier) {
                    symbolName = identifier.text;
                    symbolKind = SymbolKind.Function;
                    symbolNode = node;
                }
            }
        }
        // Extract class definitions
        else if (node.type === 'class_specifier') {
            const identifier = this.findChildByType(node, 'type_identifier');
            if (identifier) {
                symbolName = identifier.text;
                symbolKind = SymbolKind.Class;
                symbolNode = node;
            }
        }
        // Extract struct definitions
        else if (node.type === 'struct_specifier') {
            const identifier = this.findChildByType(node, 'type_identifier');
            if (identifier) {
                symbolName = identifier.text;
                symbolKind = SymbolKind.Struct;
                symbolNode = node;
            }
        }
        // Extract enum definitions
        else if (node.type === 'enum_specifier') {
            const identifier = this.findChildByType(node, 'type_identifier');
            if (identifier) {
                symbolName = identifier.text;
                symbolKind = SymbolKind.Enum;
                symbolNode = node;
            }
        }
        // Extract namespace definitions
        else if (node.type === 'namespace_definition') {
            const identifier = this.findChildByType(node, 'namespace_identifier') ||
                             this.findChildByType(node, 'identifier');
            if (identifier) {
                symbolName = identifier.text;
                symbolKind = SymbolKind.Namespace;
                symbolNode = node;
            }
        }
        // Extract field/variable declarations
        else if (node.type === 'field_declaration') {
            const declarator = this.findChildByType(node, 'field_declarator') ||
                             this.findChildByType(node, 'init_declarator');
            if (declarator) {
                const identifier = this.findChildByType(declarator, 'field_identifier') ||
                                 this.findChildByType(declarator, 'identifier');
                if (identifier) {
                    symbolName = identifier.text;
                    symbolKind = SymbolKind.Field;
                    symbolNode = node;
                }
            }
        }
        // Extract template declarations
        else if (node.type === 'template_declaration') {
            // Look for the actual declaration inside the template
            for (const child of node.children) {
                if (child.type === 'function_definition' || child.type === 'class_specifier') {
                    this.extractSymbolDefinitions(child, code, symbols, usages);
                }
            }
        }

        // If we found a symbol, add it to the list
        if (symbolName && symbolKind && symbolNode) {
            const symbol: SymbolInfo = {
                name: symbolName,
                kind: symbolKind,
                range: {
                    startLine: symbolNode.startPosition.row + 1,
                    endLine: symbolNode.endPosition.row + 1,
                    startColumn: symbolNode.startPosition.column,
                    endColumn: symbolNode.endPosition.column
                },
                definition: {
                    line: symbolNode.startPosition.row + 1,
                    column: symbolNode.startPosition.column
                },
                usages: usages.get(symbolName) || []
            };

            // Try to extract documentation (comments before the symbol)
            const doc = this.extractDocumentation(symbolNode, code);
            if (doc) {
                symbol.documentation = doc;
            }

            symbols.push(symbol);
        }

        // Recursively process children
        for (const child of node.children) {
            this.extractSymbolDefinitions(child, code, symbols, usages);
        }
    }

    /**
     * Find a child node by type using breadth-first search
     */
    private findChildByType(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
        // First check direct children
        for (const child of node.children) {
            if (child.type === type) {
                return child;
            }
        }
        // Then check grandchildren (limited depth to avoid performance issues)
        for (const child of node.children) {
            for (const grandchild of child.children) {
                if (grandchild.type === type) {
                    return grandchild;
                }
            }
        }
        return null;
    }

    /**
     * Extract documentation from comments before a symbol
     */
    private extractDocumentation(node: Parser.SyntaxNode, code: string): string | undefined {
        // Look for comment nodes before this symbol
        const lines = code.split('\n');
        const startLine = node.startPosition.row;

        // Check previous lines for comments
        let docLines: string[] = [];
        for (let i = startLine - 1; i >= 0 && i >= startLine - 5; i--) {
            const line = lines[i];
            if (line === undefined) {
                continue; // Skip undefined/out-of-bounds lines
            }
            const trimmedLine = line.trim();
            if (trimmedLine === '') {
                // Empty line, continue looking for comments
                continue;
            } else if (trimmedLine.startsWith('//')) {
                docLines.unshift(trimmedLine.substring(2).trim());
            } else if (trimmedLine.startsWith('/*') && trimmedLine.includes('*/')) {
                // Single-line multi-line comment (/* comment */)
                const startIdx = trimmedLine.indexOf('/*') + 2;
                const endIdx = trimmedLine.indexOf('*/');
                if (startIdx >= 2 && endIdx > startIdx) {
                    const commentText = trimmedLine.substring(startIdx, endIdx).trim();
                    if (commentText) {
                        docLines.unshift(commentText);
                    }
                }
            } else {
                // Non-comment line, stop looking
                break;
            }
        }

        return docLines.length > 0 ? docLines.join(' ') : undefined;
    }
}
