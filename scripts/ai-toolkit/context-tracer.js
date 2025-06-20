#!/usr/bin/env node

/**
 * Context Tracer 🧬
 * 
 * AI-optimized tool for understanding data flow and component relationships.
 * Essential for debugging and understanding complex interactions.
 * 
 * Usage: npm run trace-context -- "ComponentName" --flow=both
 *        npm run trace-context -- "handleSubmit" --depth=3
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { SmartFileReader } = require('./smart-file-reader');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class ContextTracer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || [
        'node_modules/**', 
        'dist/**', 
        'build/**', 
        '.next/**',
        'analysis-results/**'
      ],
      maxDepth: options.maxDepth || 4,
      flowDirection: options.flowDirection || 'both', // 'up', 'down', 'both'
      ...options
    };
    
    this.results = {
      target: null,
      dataFlow: {
        upstream: [],   // Where data comes FROM
        downstream: [], // Where data goes TO
      },
      componentTree: {
        parents: [],    // Components that use this
        children: [],   // Components this uses
      },
      stateManagement: { libraries: [], storesUsed: [] },
      stateFlow: [],    // State management patterns
      eventFlow: [],    // Event handling chains
      propChains: [],   // Prop drilling analysis
      recommendations: [],
      metrics: {}
    };
    
    this.fileCache = new Map();
    this.symbolMap = new Map();
    this.reader = new SmartFileReader();
  }

  /**
   * Trace context for a given symbol/component
   */
  async traceContext(target, options = {}) {
    console.log(`🧬 Tracing context for: ${target}`);
    const startTime = Date.now();
    
    this.results.target = target;
    this.options = { ...this.options, ...options };
    
    // Build file and symbol maps
    await this.buildContextMaps();
    
    // The rest of the trace functions now need to be updated to use the AST data
    this.traceDownstream(target);
    this.traceComponentRelationships(target);
    
    // Analyze state management in all downstream files, which is where usage occurs.
    for (const downstreamFile of this.results.dataFlow.downstream) {
        const absolutePath = path.resolve(this.options.rootDir, downstreamFile.file);
        const stateInfo = await this.reader.getStateManagementInfo(absolutePath);
        if (stateInfo.libraries.length > 0) {
            this.results.stateManagement.libraries.push(...stateInfo.libraries);
        }
        if (stateInfo.storesUsed.length > 0) {
            this.results.stateManagement.storesUsed.push(...stateInfo.storesUsed);
        }
    }
    // Deduplicate
    this.results.stateManagement.libraries = [...new Set(this.results.stateManagement.libraries)];
    this.results.stateManagement.storesUsed = [...new Set(this.results.stateManagement.storesUsed)];

    this.generateRecommendations();
    this.calculateMetrics();
    
    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    
    return this.results;
  }

  async buildContextMaps() {
    const files = await this.discoverFiles();
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        this.fileCache.set(filePath, analysis);
        
        // Build symbol location map from the new 'symbols' structure
        analysis.symbols.forEach(symbol => {
          if (!this.symbolMap.has(symbol.name)) {
            this.symbolMap.set(symbol.name, []);
          }
          this.symbolMap.get(symbol.name).push({
            file: filePath,
            type: symbol.type
          });
        });
        
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  analyzeFile(filePath, content) {
    const symbols = [];
    const imports = [];
    const exports = [];
    const jsxComponents = [];
    const hookCalls = [];

    try {
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      traverse(ast, {
        // Find imports
        ImportDeclaration(path) {
          const source = path.node.source.value;
          path.node.specifiers.forEach(spec => {
            imports.push({
              source,
              local: spec.local.name,
              imported: spec.type === 'ImportDefaultSpecifier' ? 'default' : (spec.imported ? spec.imported.name : spec.local.name),
            });
          });
        },

        // Find exports
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            // e.g., export const myVar = ...
            if (path.node.declaration.declarations) {
              path.node.declaration.declarations.forEach(decl => {
                exports.push({ name: decl.id.name, type: 'named' });
              });
            }
          } else if (path.node.specifiers) {
            // e.g., export { myVar, myFunc }
            path.node.specifiers.forEach(spec => {
              exports.push({ name: spec.exported.name, type: 'named' });
            });
          }
        },
        ExportDefaultDeclaration(path) {
            if (path.node.declaration.name) {
                exports.push({ name: path.node.declaration.name, type: 'default' });
            }
        },

        // Find function and class declarations (potential symbols)
        FunctionDeclaration(path) {
          symbols.push({ name: path.node.id.name, type: 'function' });
        },
        ClassDeclaration(path) {
          symbols.push({ name: path.node.id.name, type: 'class' });
        },
        VariableDeclarator(path) {
          if (path.node.id.type === 'Identifier') {
            symbols.push({ name: path.node.id.name, type: 'variable' });
          }
        },
        
        // Find component usage (JSX)
        JSXOpeningElement(path) {
            if (path.node.name.type === 'JSXIdentifier') {
                const componentName = path.node.name.name;
                // Simple heuristic: PascalCase is a component
                if (componentName[0] === componentName[0].toUpperCase()) {
                    jsxComponents.push({ name: componentName });
                }
            }
        },

        // Find hook usage
        CallExpression(path) {
            if (path.node.callee.type === 'Identifier' && path.node.callee.name.startsWith('use')) {
                hookCalls.push({ name: path.node.callee.name });
            }
        }
      });
    } catch (error) {
      // Suppress parsing errors for now, as some files might not be standard JS/TS
    }

    return {
      path: filePath,
      symbols,
      imports,
      exports,
      jsxComponents,
      hookCalls
    };
  }

  async traceDownstream(target) {
    const destinations = [];
    const locations = this.symbolMap.get(target);
    if (!locations) return;

    const definingFile = locations[0].file;

    for (const [filePath, analysis] of this.fileCache) {
        if (filePath === definingFile) continue;

        // Check if any import in this file matches our target
        const isImported = analysis.imports.some(imp => 
            imp.local === target && this.resolveImportPath(filePath, imp.source) === definingFile
        );

        if (isImported) {
            // Now, let's see how it's used
            const hookUsage = analysis.hookCalls.find(h => h.name === target);
            const componentUsage = analysis.jsxComponents.find(c => c.name === target);

            if (hookUsage) {
                destinations.push({
                    type: 'hook-usage',
                    destination: `Used as a hook in ${this.relativePath(filePath)}`,
                    file: this.relativePath(filePath),
                });
            }
            if (componentUsage) {
                 destinations.push({
                    type: 'component-usage',
                    destination: `Used as a component in ${this.relativePath(filePath)}`,
                    file: this.relativePath(filePath),
                });
            }
        }
    }
    
    this.results.dataFlow.downstream.push(...destinations);
  }

  async traceComponentRelationships(target) {
    // This needs to be completely rethought with the AST data.
    // For now, let's focus on the downstream usage.
    this.results.componentTree.parents = [];
    this.results.componentTree.children = [];
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Data flow recommendations
    if (this.results.dataFlow.downstream.length > 8) {
      recommendations.push('Wide data distribution - consider using Context or global state');
    }
    
    // Component recommendations
    if (this.results.componentTree.children.length > 10) {
      recommendations.push('Large component - consider breaking into smaller components');
    }
    
    // Prop drilling recommendations
    if (this.results.propChains.length > 0) {
      recommendations.push('Prop drilling detected - consider Context API or state management');
    }
    
    // State recommendations
    const stateTypes = [...new Set(this.results.stateFlow.map(s => s.type))];
    if (stateTypes.length > 3) {
      recommendations.push('Multiple state patterns - consider standardizing state management');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    this.results.metrics = {
      ...this.results.metrics,
      downstreamTargets: this.results.dataFlow.downstream.length,
      parentComponents: this.results.componentTree.parents.length,
      childComponents: this.results.componentTree.children.length,
      statePatterns: this.results.stateFlow.length,
      eventHandlers: this.results.eventFlow.length,
      propChainsDetected: this.results.propChains.length,
      filesAnalyzed: this.fileCache.size
    };
  }

  // Helper methods
  async discoverFiles() {
    const allFiles = [];
    
    for (const pattern of this.options.include) {
      const files = glob.sync(pattern, {
        cwd: this.options.rootDir,
        ignore: this.options.exclude,
        absolute: true
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  extractImports(content, fromFile) {
    const imports = [];
    const importPattern = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))?\s*from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      if (this.isLocalImport(importPath)) {
        const resolved = this.resolveImportPath(fromFile, importPath);
        if (resolved) {
          // Extract imported symbols
          const symbolMatch = content.match(new RegExp(`import\\s+([^}]+)\\s+from\\s+['"\`]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`));
          if (symbolMatch) {
            const symbolsPart = symbolMatch[1];
            if (symbolsPart.includes('{')) {
              // Named imports
              const namedImports = symbolsPart.match(/{([^}]+)}/);
              if (namedImports) {
                const symbols = namedImports[1].split(',').map(s => s.trim().split(' as ')[0]);
                symbols.forEach(symbol => {
                  imports.push({ symbol, path: resolved, type: 'named' });
                });
              }
            } else {
              // Default import
              const symbol = symbolsPart.trim();
              imports.push({ symbol, path: resolved, type: 'default' });
            }
          }
        }
      }
    }

    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g,
      /export\s+default\s+(\w+)/g
    ];

    exportPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 1) { // Export list
          const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
          names.forEach(name => exports.push({ name, type: 'named' }));
        } else {
          exports.push({ name: match[1], type: index === 2 ? 'default' : 'named' });
        }
      }
    });

    return exports;
  }

  isReactFile(content) {
    return content.includes('React') || content.includes('JSX') || content.includes('tsx');
  }

  isLocalImport(importPath) {
    return importPath.startsWith('.') || importPath.startsWith('@/');
  }

  resolveImportPath(fromFile, importPath) {
    let resolved;
    
    if (importPath.startsWith('@/')) {
      resolved = path.resolve(this.options.rootDir, importPath.substring(2));
    } else {
      resolved = path.resolve(path.dirname(fromFile), importPath);
    }
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    for (const ext of extensions) {
      if (fs.existsSync(path.join(resolved, 'index' + ext))) {
        return path.join(resolved, 'index' + ext);
      }
    }
    
    return fs.existsSync(resolved) ? resolved : null;
  }

  getComponentName(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.charAt(0).toUpperCase() + basename.slice(1);
  }

  isCommonKeyword(word) {
    const keywords = ['if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function', 'class', 'import', 'export', 'from', 'as', 'in', 'of', 'true', 'false', 'null', 'undefined'];
    return keywords.includes(word.toLowerCase()) || word.length < 2;
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { target, dataFlow, componentTree, stateManagement } = this.results;

    let report = `# Context Trace Report: ${target}\n\n`;

    report += `## 🧬 Data Flow\n`;
    report += `**Downstream Usage (${dataFlow.downstream.length} locations):**\n`;
    if (dataFlow.downstream.length > 0) {
        dataFlow.downstream.forEach(item => {
            report += `  - **${item.destination}** (type: ${item.type})\n`;
        });
    } else {
        report += `  - No downstream usage found.\n`;
    }
    report += `\n`;

    if (stateManagement.libraries.length > 0 || stateManagement.storesUsed.length > 0) {
      report += `## 🧠 State Management\n`;
      report += `- **Libraries Detected**: ${stateManagement.libraries.join(', ') || 'None'}\n`;
      report += `- **Stores/Hooks Used**: ${stateManagement.storesUsed.join(', ') || 'None'}\n\n`;
    }

    report += `\n*Generated on ${new Date().toISOString()}*\n`;

    return report;
  }

  async run(target) {
    await this.traceContext(target);
    const report = this.generateReport();
    console.log(report);
  }
}

// CLI interface
if (require.main === module) {
  const target = process.argv[2];
  
  if (!target) {
    console.log('Usage: npm run trace-context -- "ComponentName"');
    console.log('       npm run trace-context -- "handleSubmit" --flow=both --depth=3');
    process.exit(1);
  }
  
  const options = {};
  const args = process.argv.slice(3);
  
  args.forEach(arg => {
    if (arg.startsWith('--flow=')) {
      options.flowDirection = arg.split('=')[1];
    } else if (arg.startsWith('--depth=')) {
      options.maxDepth = parseInt(arg.split('=')[1]);
    }
  });
  
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const tracer = new ContextTracer({
    rootDir: process.cwd(),
    ...options
  });

  tracer.traceContext(target, options).then(() => {
    const report = tracer.generateReport();
    const reportPath = path.join(outputDir, 'context-trace-report.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'context-trace.json');
      fs.writeFileSync(jsonPath, JSON.stringify(tracer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = ContextTracer;