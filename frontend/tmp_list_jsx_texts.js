const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const file = process.argv[2] || 'app/vendor/[id].tsx';
const code = fs.readFileSync(file, 'utf8');
const ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

function getName(node) {
  if (!node) return null;
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return `${getName(node.object)}.${getName(node.property)}`;
  return null;
}

traverse(ast, {
  JSXText(path) {
    const text = path.node.value;
    const parentPath = path.findParent((p) => p.isJSXElement());
    const parentName = parentPath ? getName(parentPath.node.openingElement.name) : null;
    console.log('TEXT', file, parentName, 'line', path.node.loc.start.line, JSON.stringify(text));
  }
});
