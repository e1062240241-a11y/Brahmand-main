const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = process.argv[2] || 'app/vendor/[id].tsx';
const code = fs.readFileSync(path, 'utf8');
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

function parentIsText(path) {
  let p = path.parentPath;
  while (p && p.node.type !== 'JSXElement') p = p.parentPath;
  if (!p) return false;
  return getName(p.node.openingElement.name) === 'Text';
}

traverse(ast, {
  JSXExpressionContainer(path) {
    const expr = path.node.expression;
    if (expr.type === 'StringLiteral' || expr.type === 'TemplateLiteral') {
      if (!parentIsText(path)) {
        console.log('EXPR_STRING_IN_VIEW?', getName(path.parentPath.node.openingElement?.name), 'line', path.node.loc.start.line, 'value', expr.type === 'StringLiteral' ? expr.value : expr.quasis.map(q => q.value.raw).join(''));
      }
    }
  }
});
