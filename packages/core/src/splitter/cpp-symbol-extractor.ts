import Parser from 'tree-sitter';

/**
 * Symbol information extracted from C++ code
 * Enhanced with LSP-like metadata for better semantic search
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
    // LSP-like enhancements for semantic search
    signature?: string;           // Full function/method signature
    returnType?: string;          // Return type for functions
    parameters?: Array<{          // Function parameters with types
        name: string;
        type: string;
    }>;
    parentSymbol?: string;        // Parent class/namespace name
    scope?: 'public' | 'private' | 'protected';  // Access modifier
    isStatic?: boolean;           // Static member
    isVirtual?: boolean;          // Virtual function
    isConst?: boolean;            // Const method
    baseClasses?: string[];       // Base classes for inheritance
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
        try {
            // Validate inputs
            if (!root || !code) {
                console.warn('[CppSymbolExtractor] Invalid input to extractSymbols');
                return [];
            }

            const symbols: SymbolInfo[] = [];
            const symbolUsages = new Map<string, Array<{ line: number; column: number }>>();

            // First pass: collect all identifier usages
            this.collectIdentifierUsages(root, symbolUsages);

            // Second pass: extract symbol definitions
            this.extractSymbolDefinitions(root, code, symbols, symbolUsages);

            return symbols;
        } catch (error) {
            console.error('[CppSymbolExtractor] Symbol extraction failed:', error);
            return []; // Graceful failure
        }
    }

    /**
     * Extract symbols from a specific chunk's AST node
     */
    public extractChunkSymbols(node: Parser.SyntaxNode, code: string): SymbolInfo[] {
        try {
            // Validate inputs
            if (!node || !code) {
                console.warn('[CppSymbolExtractor] Invalid input to extractChunkSymbols');
                return [];
            }

            const symbols: SymbolInfo[] = [];
            const symbolUsages = new Map<string, Array<{ line: number; column: number }>>();

            // Collect usages within this chunk
            this.collectIdentifierUsages(node, symbolUsages);

            // Extract definitions within this chunk
            this.extractSymbolDefinitions(node, code, symbols, symbolUsages);

            return symbols;
        } catch (error) {
            console.error('[CppSymbolExtractor] Chunk symbol extraction failed:', error);
            return []; // Graceful failure
        }
    }

    /**
     * Collect all identifier usages (references) in the AST
     */
    private collectIdentifierUsages(
        node: Parser.SyntaxNode,
        usages: Map<string, Array<{ line: number; column: number }>>
    ): void {
        // Validate node
        if (!node || !node.type) {
            return;
        }

        try {
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
            if (node.children && Array.isArray(node.children)) {
                for (const child of node.children) {
                    if (child) {
                        this.collectIdentifierUsages(child, usages);
                    }
                }
            }
        } catch (error) {
            // Log but don't throw - continue with remaining nodes
            console.warn('[CppSymbolExtractor] Error collecting identifier usages:', error);
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
        // Validate node
        if (!node || !node.type) {
            return;
        }

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

            // Extract LSP-like metadata for better semantic search
            try {
                // Extract function signature and parameters
                if (symbolKind === SymbolKind.Function) {
                    const sigInfo = this.extractFunctionSignature(symbolNode);
                    if (sigInfo) {
                        symbol.signature = sigInfo.signature;
                        symbol.returnType = sigInfo.returnType;
                        symbol.parameters = sigInfo.parameters;
                        symbol.isConst = sigInfo.isConst;
                        symbol.isVirtual = sigInfo.isVirtual;
                        symbol.isStatic = sigInfo.isStatic;
                    }
                }

                // Extract class inheritance
                if (symbolKind === SymbolKind.Class || symbolKind === SymbolKind.Struct) {
                    const baseClasses = this.extractBaseClasses(symbolNode);
                    if (baseClasses.length > 0) {
                        symbol.baseClasses = baseClasses;
                    }
                }

                // Extract scope/visibility for class members
                const scope = this.extractScope(symbolNode);
                if (scope) {
                    symbol.scope = scope;
                }

                // Extract parent symbol (for methods, nested classes, etc.)
                const parent = this.findParentSymbol(symbolNode);
                if (parent) {
                    symbol.parentSymbol = parent;
                }
            } catch (error) {
                // If metadata extraction fails, continue without it
                console.warn(`Failed to extract metadata for symbol ${symbolName}:`, error);
            }

            // Try to extract documentation (comments before the symbol)
            const doc = this.extractDocumentation(symbolNode, code);
            if (doc) {
                symbol.documentation = doc;
            }

            symbols.push(symbol);
        }

        // Recursively process children
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                if (child) {
                    this.extractSymbolDefinitions(child, code, symbols, usages);
                }
            }
        }
    }

    /**
     * Find a child node by type using breadth-first search
     */
    private findChildByType(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
        // Validate node
        if (!node || !node.children || !Array.isArray(node.children)) {
            return null;
        }

        // First check direct children
        for (const child of node.children) {
            if (child && child.type === type) {
                return child;
            }
        }
        // Then check grandchildren (limited depth to avoid performance issues)
        for (const child of node.children) {
            if (child && child.children && Array.isArray(child.children)) {
                for (const grandchild of child.children) {
                    if (grandchild && grandchild.type === type) {
                        return grandchild;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Extract function signature information
     */
    private extractFunctionSignature(node: Parser.SyntaxNode): {
        signature: string;
        returnType?: string;
        parameters: Array<{ name: string; type: string }>;
        isConst: boolean;
        isVirtual: boolean;
        isStatic: boolean;
    } | null {
        try {
            const declarator = this.findChildByType(node, 'function_declarator');
            if (!declarator) return null;

            // Extract return type
            let returnType: string | undefined;
            for (const child of node.children) {
                if (child.type === 'primitive_type' || child.type === 'type_identifier' || 
                    child.type === 'qualified_identifier' || child.type === 'template_type') {
                    returnType = child.text;
                    break;
                }
            }

            // Extract parameters
            const parameters: Array<{ name: string; type: string }> = [];
            const paramList = this.findChildByType(declarator, 'parameter_list');
            if (paramList) {
                for (const child of paramList.children) {
                    if (child.type === 'parameter_declaration') {
                        let paramType = '';
                        let paramName = '';
                        
                        for (const paramChild of child.children) {
                            if (paramChild.type === 'primitive_type' || paramChild.type === 'type_identifier' ||
                                paramChild.type === 'qualified_identifier') {
                                paramType = paramChild.text;
                            } else if (paramChild.type === 'identifier' || paramChild.type === 'reference_declarator' ||
                                       paramChild.type === 'pointer_declarator') {
                                // Extract parameter name from declarator
                                const nameNode = this.findChildByType(paramChild, 'identifier');
                                if (nameNode) {
                                    paramName = nameNode.text;
                                } else if (paramChild.type === 'identifier') {
                                    paramName = paramChild.text;
                                }
                            }
                        }
                        
                        if (paramType) {
                            parameters.push({
                                name: paramName || 'unnamed',
                                type: paramType
                            });
                        }
                    }
                }
            }

            // Check for const qualifier
            const isConst = node.text.includes('const ') || node.text.endsWith(' const');
            
            // Check for virtual
            const isVirtual = node.text.trim().startsWith('virtual ');
            
            // Check for static
            const isStatic = node.text.trim().startsWith('static ');

            // Build full signature
            const funcName = this.findChildByType(declarator, 'identifier')?.text || 'unknown';
            const paramSig = parameters.map(p => `${p.type} ${p.name}`).join(', ');
            let signature = `${returnType || 'void'} ${funcName}(${paramSig})`;
            if (isConst) signature += ' const';

            return {
                signature,
                returnType,
                parameters,
                isConst,
                isVirtual,
                isStatic
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract base classes from class/struct definition
     */
    private extractBaseClasses(node: Parser.SyntaxNode): string[] {
        const baseClasses: string[] = [];
        try {
            const baseClassClause = this.findChildByType(node, 'base_class_clause');
            if (baseClassClause) {
                for (const child of baseClassClause.children) {
                    if (child.type === 'type_identifier' || child.type === 'qualified_identifier') {
                        baseClasses.push(child.text);
                    }
                }
            }
        } catch (error) {
            // Return empty array if extraction fails
        }
        return baseClasses;
    }

    /**
     * Extract scope/visibility (public, private, protected)
     */
    private extractScope(node: Parser.SyntaxNode): 'public' | 'private' | 'protected' | undefined {
        try {
            // Look for access specifier in parent nodes
            let current = node.parent;
            while (current) {
                if (current.type === 'field_declaration_list' || current.type === 'declaration_list') {
                    // Check siblings for access specifier
                    const parent = current.parent;
                    if (parent) {
                        let lastAccessSpec: 'public' | 'private' | 'protected' | undefined;
                        for (const sibling of parent.children) {
                            if (sibling.type === 'access_specifier') {
                                const text = sibling.text.replace(':', '').trim();
                                if (text === 'public' || text === 'private' || text === 'protected') {
                                    lastAccessSpec = text;
                                }
                            }
                            if (sibling === current && lastAccessSpec) {
                                return lastAccessSpec;
                            }
                        }
                    }
                }
                current = current.parent;
            }
        } catch (error) {
            // Return undefined if extraction fails
        }
        return undefined;
    }

    /**
     * Find parent symbol name (for nested symbols)
     */
    private findParentSymbol(node: Parser.SyntaxNode): string | undefined {
        try {
            let current = node.parent;
            while (current) {
                // Look for parent class, struct, or namespace
                if (current.type === 'class_specifier' || current.type === 'struct_specifier') {
                    const identifier = this.findChildByType(current, 'type_identifier');
                    if (identifier) {
                        return identifier.text;
                    }
                } else if (current.type === 'namespace_definition') {
                    const identifier = this.findChildByType(current, 'namespace_identifier') ||
                                     this.findChildByType(current, 'identifier');
                    if (identifier) {
                        return identifier.text;
                    }
                }
                current = current.parent;
            }
        } catch (error) {
            // Return undefined if extraction fails
        }
        return undefined;
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
