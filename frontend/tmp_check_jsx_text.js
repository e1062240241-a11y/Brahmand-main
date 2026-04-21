const fs = require('fs');
const parser = require('@babel/parser');
const path = process.argv[2] || 'app/vendor/[id].tsx';
const code = fs.readFileSync(path, 'utf8');
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
});

function getJSXElementName(node) {
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return getJSXElementName(node.object) + '.' + getJSXElementName(node.property);
  return null;
}

let found = false;
function visit(node, parent) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXText') {
    const text = node.value;
    if (text.trim().length > 0) {
      let p = parent;
      while (p && p.type !== 'JSXElement') p = p.parent;
      const parentName = p && p.openingElement ? getJSXElementName(p.openingElement.name) : null;
      if (parentName !== 'Text') {
        console.log('INVALID JSX TEXT:', JSON.stringify(text), 'parent=', parentName, 'line=', node.loc.start.line);
        found = true;
      }
    }
  }
  for (const key in node) {
    if (key === 'parent') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => {
        if (child && typeof child === 'object') {
          child.parent = node;
          visit(child, node);
        }
      });
    } else if (value && typeof value === 'object') {
      value.parent = node;
      visit(value, node);
    }
  }
}
visit(ast, null);
if (!found) console.log('No invalid JSX text nodes found.');
