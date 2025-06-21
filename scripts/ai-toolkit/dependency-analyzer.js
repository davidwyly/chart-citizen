#!/usr/bin/env node

/**
 * Dependency Graph Analyzer 📦
 * 
 * AI-optimized tool for analyzing package dependencies and import relationships.
 * Essential for understanding dependency bloat, circular dependencies, and unused packages.
 * 
 * Usage: npm run analyze-deps
 *        npm run analyze-deps --focus=circular
 *        npm run analyze-deps --focus=unused
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class DependencyAnalyzer {
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
      focus: options.focus || 'all', // 'circular', 'unused', 'heavy', 'all'
      ...options
    };
    
    this.results = {
      summary: {
        totalPackages: 0,
        usedPackages: 0,
        unusedPackages: 0,
        circularDependencies: 0,
        heavyImports: 0
      },
      packageDependencies: {},
      unusedDependencies: [],
      circularDependencies: [],
      heavyImports: [],
      importGraph: new Map(),
      packageUsage: new Map(),
      recommendations: [],
      metrics: {}
    };
    
    this.packageJson = {};
    this.fileAnalysis = new Map();
    this.packageUsage = new Map();
    this.importGraph = new Map();
    // Load alias mappings from tsconfig.json for path-alias awareness (e.g. @engine/* → engine/*)
    this.aliasMappings = this.loadTsconfigAliases();
  }

  /**
   * Analyze project dependencies
   */
  async analyzeDependencies() {
    console.log('📦 Analyzing dependency graph...');
    const startTime = Date.now();
    
    // Load package.json
    await this.loadPackageJson();
    
    // Discover and analyze files
    await this.discoverFiles();
    await this.analyzeImports();
    
    // Build dependency graphs
    this.buildImportGraph();
    this.analyzePackageUsage();
    
    // Find issues
    this.findUnusedDependencies();
    this.findCircularDependencies();
    this.findHeavyImports();
    
    this.generateRecommendations();
    this.calculateMetrics();
    
    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    
    return this.results;
  }

  async loadPackageJson() {
    try {
      const packagePath = path.join(this.options.rootDir, 'package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      this.packageJson = JSON.parse(content);
      
      this.results.packageDependencies = {
        dependencies: this.packageJson.dependencies || {},
        devDependencies: this.packageJson.devDependencies || {},
        peerDependencies: this.packageJson.peerDependencies || {}
      };
      
      const totalDeps = Object.keys(this.results.packageDependencies.dependencies).length +
                       Object.keys(this.results.packageDependencies.devDependencies).length +
                       Object.keys(this.results.packageDependencies.peerDependencies).length;
      
      this.results.summary.totalPackages = totalDeps;
      
    } catch (error) {
      console.warn('⚠️ Could not load package.json');
    }
  }

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

    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        this.fileAnalysis.set(filePath, analysis);
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  analyzeFile(filePath, content) {
    const relativePath = path.relative(this.options.rootDir, filePath);
    
    return {
      path: filePath,
      relativePath,
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      size: content.length,
      lines: content.split('\n').length
    };
  }

  extractImports(content) {
    const imports = [];
    const patterns = [
      // ES6 imports: import ... from 'package'
      /import\s+(?:{[^}]*}|[\w*]+(?:\s*,\s*{[^}]*})?|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
      // Dynamic imports: import('package')
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // Require: require('package')
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        imports.push({
          path: importPath,
          type: index === 0 ? 'es6' : index === 1 ? 'dynamic' : 'require',
          isExternal: this.isExternalPackage(importPath),
          isLocal: this.isLocalImport(importPath)
        });
      }
    });

    return imports;
  }

  extractExports(content) {
    const exports = [];
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+([\w$]+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /export\s*\*\s*from\s+['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 0) {
          exports.push({ name: match[1], type: 'named' });
        } else if (index === 1) {
          const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
          names.forEach(name => exports.push({ name, type: 'named' }));
        } else if (index === 2) {
          exports.push({ from: match[1], type: 'reexport' });
        }
      }
    });

    return exports;
  }

  async analyzeImports() {
    // Process all imports to understand usage patterns
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis && analysis.imports) {
        analysis.imports.forEach(imp => {
          if (imp && imp.isExternal) {
            const packageName = this.getPackageName(imp.path);
            if (packageName && !this.packageUsage.has(packageName)) {
              this.packageUsage.set(packageName, {
                files: [],
                importCount: 0,
                types: new Set()
              });
            }
            
            if (packageName) {
              const usage = this.packageUsage.get(packageName);
              usage.files.push(analysis.relativePath);
              usage.importCount++;
              usage.types.add(imp.type);
            }
          }
        });
      }
    }
  }

  buildImportGraph() {
    // Build internal import graph for circular dependency detection
    for (const [filePath, analysis] of this.fileAnalysis) {
      const dependencies = [];
      
      analysis.imports.forEach(imp => {
        if (imp.isLocal) {
          const resolvedPath = this.resolveImportPath(filePath, imp.path);
          if (resolvedPath && this.fileAnalysis.has(resolvedPath)) {
            dependencies.push(resolvedPath);
          }
        }
      });
      
      this.importGraph.set(filePath, dependencies);
    }
  }

  analyzePackageUsage() {
    const allDependencies = {
      ...this.results.packageDependencies.dependencies,
      ...this.results.packageDependencies.devDependencies,
      ...this.results.packageDependencies.peerDependencies
    };
    
    let usedCount = 0;
    
    Object.keys(allDependencies).forEach(packageName => {
      if (this.packageUsage.has(packageName)) {
        usedCount++;
      }
    });
    
    this.results.summary.usedPackages = usedCount;
    this.results.summary.unusedPackages = this.results.summary.totalPackages - usedCount;
  }

  findUnusedDependencies() {
    if (this.options.focus !== 'all' && this.options.focus !== 'unused') return;
    
    const allDependencies = {
      ...this.results.packageDependencies.dependencies,
      ...this.results.packageDependencies.devDependencies
    };
    
    Object.keys(allDependencies).forEach(packageName => {
      if (!this.packageUsage.has(packageName) && !this.isMetaPackage(packageName)) {
        this.results.unusedDependencies.push({
          name: packageName,
          version: allDependencies[packageName],
          type: this.results.packageDependencies.dependencies[packageName] ? 'dependency' : 'devDependency',
          reason: 'No import statements found'
        });
      }
    });
  }

  findCircularDependencies() {
    if (this.options.focus !== 'all' && this.options.focus !== 'circular') return;
    
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    const dfs = (filePath, path = []) => {
      if (recursionStack.has(filePath)) {
        // Found a cycle
        const cycleStart = path.indexOf(filePath);
        const cycle = path.slice(cycleStart);
        cycle.push(filePath);
        cycles.push(cycle.map(f => this.relativePath(f)));
        return;
      }
      
      if (visited.has(filePath)) return;
      
      visited.add(filePath);
      recursionStack.add(filePath);
      path.push(filePath);
      
      const dependencies = this.importGraph.get(filePath) || [];
      dependencies.forEach(dep => dfs(dep, [...path]));
      
      recursionStack.delete(filePath);
    };
    
    for (const filePath of this.importGraph.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath);
      }
    }
    
    this.results.circularDependencies = cycles.map(cycle => ({
      cycle,
      length: cycle.length - 1,
      severity: cycle.length > 5 ? 'high' : cycle.length > 3 ? 'medium' : 'low'
    }));
    
    this.results.summary.circularDependencies = cycles.length;
  }

  findHeavyImports() {
    if (this.options.focus !== 'all' && this.options.focus !== 'heavy') return;
    
    // Known heavy packages
    const heavyPackages = [
      'lodash', 'moment', 'rxjs', '@material-ui/core', 'antd', 
      'date-fns', 'ramda', 'immutable', 'three', 'babylonjs'
    ];
    
    this.packageUsage.forEach((usage, packageName) => {
      const isHeavy = heavyPackages.some(heavy => packageName.includes(heavy));
      const isWidelyUsed = usage.files.length > 10;
      const hasDefaultImport = usage.types.has('es6');
      
      if (isHeavy || (isWidelyUsed && hasDefaultImport)) {
        this.results.heavyImports.push({
          package: packageName,
          files: usage.files.length,
          reason: isHeavy ? 'Known heavy package' : 'Widely imported package',
          imports: usage.importCount,
          recommendation: this.getOptimizationRecommendation(packageName, usage)
        });
      }
    });
    
    this.results.summary.heavyImports = this.results.heavyImports.length;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Unused dependencies
    if (this.results.unusedDependencies.length > 5) {
      recommendations.push(`🧹 **Cleanup**: Remove ${this.results.unusedDependencies.length} unused dependencies to reduce bundle size`);
    } else if (this.results.unusedDependencies.length > 0) {
      recommendations.push(`🧹 **Cleanup**: Consider removing ${this.results.unusedDependencies.length} unused dependencies`);
    }
    
    // Circular dependencies
    if (this.results.circularDependencies.length > 0) {
      const highSeverity = this.results.circularDependencies.filter(c => c.severity === 'high').length;
      if (highSeverity > 0) {
        recommendations.push(`🚨 **Critical**: Resolve ${highSeverity} complex circular dependencies immediately`);
      } else {
        recommendations.push(`⚠️ **Architecture**: Address ${this.results.circularDependencies.length} circular dependencies`);
      }
    }
    
    // Heavy imports
    if (this.results.heavyImports.length > 3) {
      recommendations.push(`📦 **Performance**: Optimize ${this.results.heavyImports.length} heavy imports for better bundle size`);
    }
    
    // General health
    const unusedPercentage = (this.results.summary.unusedPackages / this.results.summary.totalPackages) * 100;
    if (unusedPercentage > 20) {
      recommendations.push(`📊 **Health**: ${Math.round(unusedPercentage)}% of dependencies are unused - consider dependency audit`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('No significant dependency issues identified');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    // --- Coupling metrics ---------------------------------------------------
    const fanIn = {};
    const fanOut = {};
    for (const [file, deps] of this.importGraph) {
      fanOut[file] = deps.length;
      deps.forEach(dep => {
        fanIn[dep] = (fanIn[dep] || 0) + 1;
      });
    }
    const fanInValues = Object.values(fanIn);
    const fanOutValues = Object.values(fanOut);
    const avgFanIn = fanInValues.length ? fanInValues.reduce((a,b)=>a+b,0) / fanInValues.length : 0;
    const avgFanOut = fanOutValues.length ? fanOutValues.reduce((a,b)=>a+b,0) / fanOutValues.length : 0;

    // Determine files with max coupling
    const maxFanInFile = Object.entries(fanIn).sort((a,b)=>b[1]-a[1])[0] || [null,0];
    const maxFanOutFile = Object.entries(fanOut).sort((a,b)=>b[1]-a[1])[0] || [null,0];

    this.results.metrics = {
      ...this.results.metrics,
      filesAnalyzed: this.fileAnalysis.size,
      packagesTracked: this.packageUsage.size,
      dependencyUtilization: this.results.summary.totalPackages > 0 ? 
        Math.round((this.results.summary.usedPackages / this.results.summary.totalPackages) * 100) : 0,
      circularComplexity: this.results.circularDependencies.reduce((sum, c) => sum + c.length, 0),
      coupling: {
        averageFanIn: Number(avgFanIn.toFixed(2)),
        averageFanOut: Number(avgFanOut.toFixed(2)),
        maxFanIn: {
          file: maxFanInFile[0] ? this.relativePath(maxFanInFile[0]) : 'N/A',
          count: maxFanInFile[1]
        },
        maxFanOut: {
          file: maxFanOutFile[0] ? this.relativePath(maxFanOutFile[0]) : 'N/A',
          count: maxFanOutFile[1]
        }
      }
    };
  }

  // Helper methods
  isExternalPackage(importPath) {
    // Treat path-alias prefixes as local (internal) imports
    const isAlias = this.aliasMappings.some(m => importPath.startsWith(m.alias));
    return !importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/') && !isAlias;
  }

  isLocalImport(importPath) {
    if (importPath.startsWith('.') || importPath.startsWith('@/')) return true;
    return this.aliasMappings.some(m => importPath.startsWith(m.alias));
  }

  getPackageName(importPath) {
    // Handle scoped packages like @react/fiber
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    }
    
    return importPath.split('/')[0];
  }

  isMetaPackage(packageName) {
    // Packages that don't have direct imports (configs, types, etc.)
    const metaPackages = [
      'typescript', 'eslint', 'prettier', 'vitest', 'jest',
      '@types/', 'eslint-', 'babel-', 'webpack', 'vite'
    ];
    
    return metaPackages.some(meta => packageName.includes(meta));
  }

  resolveImportPath(fromFile, importPath) {
    let resolved;

    // Handle @/ alias (root-relative)
    if (importPath.startsWith('@/')) {
      resolved = path.resolve(this.options.rootDir, importPath.substring(2));
    }

    // Handle user-defined aliases from tsconfig
    if (!resolved) {
      const match = this.aliasMappings.find(m => importPath.startsWith(m.alias));
      if (match) {
        const subPath = importPath.substring(match.alias.length);
        resolved = path.resolve(this.options.rootDir, match.target, subPath);
      }
    }

    // Handle relative import
    if (!resolved && importPath.startsWith('.')) {
      resolved = path.resolve(path.dirname(fromFile), importPath);
    }

    if (!resolved) return null;

    // Attempt to resolve with multiple extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    for (const ext of extensions) {
      const fullPath = resolved.endsWith(ext) ? resolved : resolved + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  getOptimizationRecommendation(packageName, usage) {
    if (packageName.includes('lodash')) {
      return 'Use tree-shaking with lodash-es or import specific functions';
    } else if (packageName.includes('moment')) {
      return 'Consider switching to date-fns or day.js for smaller bundle size';
    } else if (packageName.includes('material-ui') || packageName.includes('antd')) {
      return 'Use tree-shaking imports to reduce bundle size';
    } else if (usage.files.length > 15) {
      return 'Consider creating a centralized import/export file';
    } else {
      return 'Review import strategy for optimization opportunities';
    }
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { summary, unusedDependencies, circularDependencies, heavyImports, recommendations, metrics } = this.results;
    
    return `# Dependency Analysis 📦

**Analysis Time**: ${metrics.analysisTime}

## 📊 Dependency Summary
- **Total Packages**: ${summary.totalPackages}
- **Used Packages**: ${summary.usedPackages} (${metrics.dependencyUtilization}%)
- **Unused Packages**: ${summary.unusedPackages}
- **Circular Dependencies**: ${summary.circularDependencies}
- **Heavy Imports**: ${summary.heavyImports}

## 🧹 Unused Dependencies (${unusedDependencies.length})
${unusedDependencies.length === 0 ? 'All dependencies are being used!' : unusedDependencies.slice(0, 10).map(dep => 
  `- **${dep.name}** (${dep.type}) - ${dep.reason}`
).join('\n')}
${unusedDependencies.length > 10 ? `\n... and ${unusedDependencies.length - 10} more` : ''}

## 🔄 Circular Dependencies (${circularDependencies.length})
${circularDependencies.length === 0 ? 'No circular dependencies detected!' : circularDependencies.slice(0, 5).map(cycle => 
  `- **${cycle.severity.toUpperCase()}**: ${cycle.cycle.slice(0, -1).join(' → ')} (${cycle.length} files)`
).join('\n')}
${circularDependencies.length > 5 ? `\n... and ${circularDependencies.length - 5} more cycles` : ''}

## 📦 Heavy Imports (${heavyImports.length})
${heavyImports.length === 0 ? 'No heavy import patterns detected.' : heavyImports.slice(0, 8).map(heavy => 
  `- **${heavy.package}** used in ${heavy.files} files - ${heavy.recommendation}`
).join('\n')}

## 💡 Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📈 Coupling Metrics
- **Max Fan-In**: ${metrics.coupling.maxFanIn.count} → ${metrics.coupling.maxFanIn.file}
- **Max Fan-Out**: ${metrics.coupling.maxFanOut.count} ← ${metrics.coupling.maxFanOut.file}
- **Average Fan-In**: ${metrics.coupling.averageFanIn}
- **Average Fan-Out**: ${metrics.coupling.averageFanOut}

## 📊 Analysis Metrics
- **Files Analyzed**: ${metrics.filesAnalyzed}
- **Packages Tracked**: ${metrics.packagesTracked}
- **Dependency Utilization**: ${metrics.dependencyUtilization}%
- **Circular Complexity**: ${metrics.circularComplexity}

## 🎯 Quick Actions
1. **Immediate**: Remove unused dependencies to reduce security surface
2. **Short-term**: Resolve circular dependencies starting with highest severity
3. **Medium-term**: Optimize heavy imports for better bundle performance
4. **Long-term**: Regular dependency audits to maintain health

*Generated on ${new Date().toISOString()}*
`;
  }

  /**
   * Parse tsconfig.json to extract "paths" aliases so the analyzer
   * can treat alias imports (e.g. @engine/* → engine/*) as local paths.
   * Returns an array like [{ alias: '@engine/', target: 'engine/' }, … ]
   * The method is intentionally lightweight – it does not cover advanced
   * path pattern edge-cases but is sufficent for common alias usage.
   */
  loadTsconfigAliases() {
    try {
      const tsconfigPath = path.join(this.options.rootDir, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) return [];

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const paths = (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
      const mappings = [];

      Object.entries(paths).forEach(([key, value]) => {
        if (!Array.isArray(value) || value.length === 0) return;
        // Strip trailing /* if present to get clean prefix
        const aliasPrefix = key.replace(/\*$/, '').replace(/\/*$/, '/');
        const targetPrefix = value[0].replace(/\*$/, '').replace(/\/*$/, '/');
        if (aliasPrefix && targetPrefix) {
          mappings.push({ alias: aliasPrefix, target: targetPrefix });
        }
      });

      if (mappings.length > 0) {
        console.log(`🔗 Loaded ${mappings.length} path alias${mappings.length > 1 ? 'es' : ''} from tsconfig.json`);
      }

      return mappings;
    } catch (_) {
      return [];
    }
  }
}

// CLI interface
if (require.main === module) {
  const options = {};
  const args = process.argv.slice(2);
  
  args.forEach(arg => {
    if (arg.startsWith('--focus=')) {
      options.focus = arg.split('=')[1];
    }
  });
  
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const analyzer = new DependencyAnalyzer({
    rootDir: process.cwd(),
    ...options
  });

  analyzer.analyzeDependencies().then(() => {
    const report = analyzer.generateReport();
    const reportPath = path.join(outputDir, 'dependency-analysis.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'dependencies.json');
      fs.writeFileSync(jsonPath, JSON.stringify(analyzer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = DependencyAnalyzer;