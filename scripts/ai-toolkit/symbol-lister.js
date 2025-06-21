const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class SymbolLister {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.verbose = Boolean(options.verbose);
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  async listSymbols(filePath) {
    this.log(`🔎 Listing symbols in: ${filePath}`);
    const absolutePath = path.resolve(this.rootDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ File not found: ${absolutePath}`);
      process.exit(1);
    }

    const code = fs.readFileSync(absolutePath, 'utf-8');
    const symbols = {
      filePath,
      exports: [],
      reExports: [],
    };

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'classProperties',
          'objectRestSpread'
        ],
      });

      traverse(ast, {
        ExportNamedDeclaration: (path) => {
          if (path.node.declaration) {
            if (path.node.declaration.declarations) {
              path.node.declaration.declarations.forEach(decl => {
                symbols.exports.push({ name: decl.id.name, type: 'named' });
              });
            } else if (path.node.declaration.id) {
              symbols.exports.push({ name: path.node.declaration.id.name, type: 'named' });
            }
          } else if (path.node.specifiers) {
            path.node.specifiers.forEach(spec => {
              const exportInfo = {
                name: spec.exported.name,
                local: spec.local ? spec.local.name : null,
                type: 'named'
              };

              if (path.node.source) {
                exportInfo.type = 're-export';
                exportInfo.from = path.node.source.value;
                symbols.reExports.push(exportInfo);
              } else {
                symbols.exports.push(exportInfo);
              }
            });
          }
        },
        ExportDefaultDeclaration: (path) => {
          let name = '(anonymous)';
          if (path.node.declaration.id) {
            name = path.node.declaration.id.name;
          } else if (path.node.declaration.name) {
            name = path.node.declaration.name;
          }
          symbols.exports.push({ name, type: 'default' });
        },
        ExportAllDeclaration: (path) => {
            symbols.reExports.push({
                name: '*',
                type: 're-export-all',
                from: path.node.source.value,
            });
        }
      });
      
      console.log(JSON.stringify(symbols));

    } catch (error) {
      console.error(`❌ Failed to parse file and list symbols for ${filePath}:`, error.message);
      process.exit(1);
    }
  }
}

module.exports = { SymbolLister }; 