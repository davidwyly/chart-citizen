const ts = require('typescript');
const fs = require('fs');
const path = require('path');

class UsageFinder {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.tsconfigPath = path.join(this.rootDir, 'tsconfig.json');
    if (!fs.existsSync(this.tsconfigPath)) {
      throw new Error('tsconfig.json not found in the root directory.');
    }
  }

  findUsages(targetSymbol) {
    const { file: targetFile, symbol: symbolName } = this.parseTarget(targetSymbol);
    const targetFilePath = path.resolve(this.rootDir, targetFile);

    const configFile = ts.readConfigFile(this.tsconfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, this.rootDir);
    
    const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    const checker = program.getTypeChecker();
    const sourceFiles = program.getSourceFiles();

    const results = [];

    const targetSourceFile = program.getSourceFile(targetFilePath);
    if (!targetSourceFile) {
        console.error(`Could not find source file: ${targetFilePath}`);
        return [];
    }
    
    let targetNode = null;

    ts.forEachChild(targetSourceFile, node => {
        if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach(declaration => {
                if (declaration.name.getText(targetSourceFile) === symbolName) {
                    targetNode = declaration;
                }
            });
        } else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
            if (node.name && node.name.getText(targetSourceFile) === symbolName) {
                targetNode = node;
            }
        } else if (ts.isExportAssignment(node) && node.expression.getText(targetSourceFile) === symbolName) {
            targetNode = node;
        } else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            node.exportClause.elements.forEach(specifier => {
                if (specifier.name.getText(targetSourceFile) === symbolName) {
                    targetNode = specifier;
                }
            });
        }
    });

    if (!targetNode) {
      console.error(`Symbol "${symbolName}" not found in ${targetFile}`);
      return [];
    }

    const symbol = checker.getSymbolAtLocation(targetNode.name);

    if (!symbol) {
        console.error(`Could not get symbol for "${symbolName}"`);
        return [];
    }

    for (const sourceFile of sourceFiles) {
        if (sourceFile.isDeclarationFile) continue;
        
        const imports = this.getImports(sourceFile, targetFilePath);
        if (imports.includes(symbolName)) {
            ts.forEachChild(sourceFile, (node) => this.findReferencesInNode(node, sourceFile, checker, symbol, results));
        }
    }

    return this.formatResults(results);
  }

  findReferencesInNode(node, sourceFile, checker, targetSymbol, results) {
    if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol) {
            let resolvedSymbol = symbol;
            if (symbol.flags & ts.SymbolFlags.Alias) {
                resolvedSymbol = checker.getAliasedSymbol(symbol);
            }

            if (resolvedSymbol === targetSymbol) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                const lineContent = sourceFile.text.split('\\n')[line];
                const text = lineContent ? lineContent.trim() : '';
                results.push({
                    file: path.relative(this.rootDir, sourceFile.fileName),
                    line: line + 1,
                    character: character + 1,
                    text: text
                });
            }
        }
    }
    ts.forEachChild(node, (child) => this.findReferencesInNode(child, sourceFile, checker, targetSymbol, results));
  }


  getImports(sourceFile, targetFilePath) {
    const imports = [];
    ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
            const modulePath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
            const resolvedModulePath = path.resolve(path.dirname(sourceFile.fileName), modulePath);
            
            // This is a simplification. A real implementation needs to handle path aliases, .ts/.tsx extensions etc.
            const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', ''];
            let found = false;
            for (const ext of possibleExtensions) {
                if (resolvedModulePath + ext === targetFilePath) {
                    found = true;
                    break;
                }
                 // also check for index files
                if (path.join(resolvedModulePath, 'index' + ext) === targetFilePath) {
                    found = true;
                    break;
                }
            }

            if(found && node.importClause) {
                if (node.importClause.name) { // Default import
                    imports.push(node.importClause.name.getText(sourceFile));
                }
                if (node.importClause.namedBindings) {
                    if (ts.isNamedImports(node.importClause.namedBindings)) {
                        node.importClause.namedBindings.elements.forEach(element => {
                            imports.push(element.propertyName?.getText(sourceFile) || element.name.getText(sourceFile));
                        });
                    } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                        // Namespace import, harder to track specific symbol usages without more logic
                    }
                }
            }
        }
    });
    return imports;
  }
  

  parseTarget(target) {
    const parts = target.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid target format. Use "path/to/file.ts:symbolName"');
    }
    return { file: parts[0], symbol: parts[1] };
  }

  formatResults(results) {
    if (results.length === 0) {
      return { summary: 'No usages found.', usages: [] };
    }

    const uniqueFiles = [...new Set(results.map(r => r.file))];
    return {
      summary: `Found ${results.length} usage(s) in ${uniqueFiles.length} file(s).`,
      usages: results.map(({ file, line, text }) => ({
        file,
        line,
        text
      }))
    };
  }
}

module.exports = UsageFinder; 