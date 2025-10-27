const Parser = require('tree-sitter');
const Cpp = require('tree-sitter-cpp');

console.log('Cpp parser type:', typeof Cpp);

if (!Cpp) {
    console.error('ERROR: tree-sitter-cpp parser failed to load.');
    process.exit(1);
}

const parser = new Parser();
parser.setLanguage(Cpp);
console.log('Parser language set successfully');

const code = `
int add(int a, int b) {
    return a + b;
}
`;

const tree = parser.parse(code);
console.log('Tree exists:', !!tree);
console.log('Root node exists:', !!(tree && tree.rootNode));
if (tree && tree.rootNode) {
    console.log('Root node type:', tree.rootNode.type);
    console.log('SUCCESS: Parsing works!');
} else {
    console.error('ERROR: Tree or root node is null/undefined');
    process.exit(1);
}
