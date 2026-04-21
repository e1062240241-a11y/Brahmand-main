const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const file = process.argv[2];
if (!file) {
  console.error('Need file path');
  process.exit(1);
}
const code = fs.readFileSync(file, 'utf8');
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
});

function getName(node) {
  if (!node) return null;
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return `${getName(node.object)}.${getName(node.property)}`;
  return null;
}

const viewNames = new Set(['View', 'ScrollView', 'SafeAreaView', 'TouchableOpacity', 'SafeAreaView']);

traverse(ast, {
  JSXElement(path) {
    const name = getName(path.node.openingElement.name);
    if (!viewNames.has(name)) return;
    for (const child of path.node.children) {
      if (child.type === 'JSXText') {
        const text = child.value;
        if (text.trim().length > 0) {
          console.log(`${file}: ${name} has raw JSXText child at line ${child.loc.start.line}: ${JSON.stringify(text.trim())}`);
        }
      } else if (child.type === 'JSXExpressionContainer') {
        const expr = child.expression;
        if (expr.type === 'StringLiteral') {
          console.log(`${file}: ${name} has StringLiteral child at line ${child.loc.start.line}: ${JSON.stringify(expr.value)}`);
        }
        if (expr.type === 'TemplateLiteral') {
          const raw = expr.quasis.map(q => q.value.raw).join('');
          if (raw.trim().length > 0) {
            console.log(`${file}: ${name} has TemplateLiteral child at line ${child.loc.start.line}: ${JSON.stringify(raw.trim())}`);
          }
        }
      }
    }
  }
});
