#!/usr/bin/env node

/**
 * Refactor Impact Analyzer 🔍
 * 
 * AI-optimized tool for understanding the complete impact of code changes.
 * Essential for safe refactoring and understanding blast radius.
 * 
 * Usage: npm run analyze-impact -- "ComponentName"
 *        npm run analyze-impact -- "./path/to/file.ts"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class RefactorImpactAnalyzer {
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
      maxDepth: options.maxDepth || 5,
      ...options
    };
    
    this.fileGraph = new Map(); // file -> { imports, exports, usages }
    this.symbolGraph = new Map(); // symbol -> { definedIn, usedIn }
    this.results = {
      target: null,
      directImpacts: [],
      cascadingImpacts: [],
      testFiles: [],
      typeImpacts: [],
      riskAssessment: {},
      refactorPlan: [],
      metrics: {}
    };
  }

  /**
   * Analyze impact of changing a symbol or file
   */
  async analyzeImpact(target) {
    console.log(`🔍 Analyzing impact of: ${target}`);
    const startTime = Date.now();
    
    this.results.target = target;
    
    // Build comprehensive file and symbol graphs
    await this.buildCodeGraph();
    
    // Determine if target is a file or symbol
    const isFile = target.includes('/') || target.includes('.');
    
    if (isFile) {
      await this.analyzeFileImpact(target);
    } else {
      await this.analyzeSymbolImpact(target);
    }
    
    this.assessRisk();
    this.generateRefactorPlan();
    this.calculateMetrics();
    
    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    
    return this.results;
  }

  async buildCodeGraph() {
    const files = await this.discoverFiles();
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        this.fileGraph.set(filePath, analysis);
        
        // Build symbol graph
        analysis.exports.forEach(exp => {
          if (!this.symbolGraph.has(exp.name)) {
            this.symbolGraph.set(exp.name, { definedIn: [], usedIn: [] });
          }
          this.symbolGraph.get(exp.name).definedIn.push(filePath);
        });
        
        analysis.symbolUsages.forEach(usage => {
          if (!this.symbolGraph.has(usage.symbol)) {
            this.symbolGraph.set(usage.symbol, { definedIn: [], usedIn: [] });
          }
          this.symbolGraph.get(usage.symbol).usedIn.push({
            file: filePath,
            line: usage.line,
            context: usage.context
          });
        });
        
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  analyzeFile(filePath, content) {
    const lines = content.split('\n');
    
    return {
      path: filePath,
      size: content.length,
      imports: this.extractImports(content, filePath),
      exports: this.extractExports(content),
      symbolUsages: this.extractSymbolUsages(content),
      isTest: this.isTestFile(filePath, content),
      isType: filePath.endsWith('.d.ts') || filePath.includes('/types/'),
      complexity: this.estimateComplexity(content),
      dependencies: this.extractDependencies(content)
    };
  }

  extractImports(content, fromFile) {
    const imports = [];
    const importPatterns = [
      // Named imports: import { A, B } from './file'
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"`]([^'"`]+)['"`]/g,
      // Default imports: import A from './file' 
      /import\s+(\w+)\s+from\s*['"`]([^'"`]+)['"`]/g,
      // Namespace imports: import * as A from './file'
      /import\s*\*\s*as\s+(\w+)\s+from\s*['"`]([^'"`]+)['"`]/g,
      // Side effect imports: import './file'
      /import\s*['"`]([^'"`]+)['"`]/g
    ];

    importPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 0) { // Named imports
          const symbols = match[1].split(',').map(s => s.trim().split(' as ')[0]);
          const path = this.resolveImportPath(fromFile, match[2]);
          symbols.forEach(symbol => {
            imports.push({ symbol, path, type: 'named' });
          });
        } else if (index === 1) { // Default import
          const path = this.resolveImportPath(fromFile, match[2]);
          imports.push({ symbol: match[1], path, type: 'default' });
        } else if (index === 2) { // Namespace import
          const path = this.resolveImportPath(fromFile, match[2]);
          imports.push({ symbol: match[1], path, type: 'namespace' });
        } else if (index === 3) { // Side effect
          const path = this.resolveImportPath(fromFile, match[1]);
          imports.push({ symbol: null, path, type: 'sideeffect' });
        }
      }
    });

    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      // export function/class/const
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
      // export { A, B }
      /export\s*{\s*([^}]+)\s*}/g,
      // export default
      /export\s+default\s+(\w+)/g
    ];

    exportPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 0) { // Named exports
          exports.push({ name: match[1], type: 'named' });
        } else if (index === 1) { // Export list
          const names = match[1].split(',').map(name => {
            const cleaned = name.trim().split(' as ')[0];
            return { name: cleaned, type: 'named' };
          });
          exports.push(...names);
        } else if (index === 2) { // Default export
          exports.push({ name: match[1], type: 'default' });
        }
      }
    });

    return exports;
  }

  extractSymbolUsages(content) {
    const lines = content.split('\n');
    const usages = [];
    
    // Look for function calls, property access, JSX usage
    const usagePatterns = [
      /(\w+)\s*\(/g,           // Function calls
      /(\w+)\s*\./g,           // Property access
      /<(\w+)[\s>]/g,          // JSX components
      /(\w+):\s*\w+/g,         // Type annotations
      /extends\s+(\w+)/g,      // Class extension
      /implements\s+(\w+)/g    // Interface implementation
    ];

    lines.forEach((line, lineNum) => {
      usagePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const symbol = match[1];
          // Filter out common keywords and short names
          if (symbol.length > 2 && !this.isCommonKeyword(symbol)) {
            usages.push({
              symbol,
              line: lineNum + 1,
              context: line.trim()
            });
          }
        }
      });
    });

    return usages;
  }

  async analyzeFileImpact(targetFile) {
    const normalizedTarget = path.resolve(this.options.rootDir, targetFile);
    const fileAnalysis = this.fileGraph.get(normalizedTarget);
    
    if (!fileAnalysis) {
      console.log(`❌ File not found: ${targetFile}`);
      return;
    }

    // Find direct impacts (files that import this file)
    this.results.directImpacts = Array.from(this.fileGraph.entries())
      .filter(([filePath, analysis]) => 
        analysis.imports.some(imp => imp.path === normalizedTarget)
      )
      .map(([filePath, analysis]) => ({
        file: this.relativePath(filePath),
        reason: 'Imports from target file',
        imports: analysis.imports.filter(imp => imp.path === normalizedTarget),
        isTest: analysis.isTest,
        complexity: analysis.complexity
      }));

    // Find cascading impacts
    await this.findCascadingImpacts(normalizedTarget, 1);
    
    // Find test files
    this.results.testFiles = this.findRelatedTests(normalizedTarget);
    
    // Find type impacts
    if (fileAnalysis.isType) {
      this.results.typeImpacts = this.findTypeImpacts(normalizedTarget);
    }
  }

  async analyzeSymbolImpact(targetSymbol) {
    const symbolData = this.symbolGraph.get(targetSymbol);
    
    if (!symbolData) {
      console.log(`❌ Symbol not found: ${targetSymbol}`);
      return;
    }

    // Direct impacts - files that use this symbol
    this.results.directImpacts = symbolData.usedIn.map(usage => ({
      file: this.relativePath(usage.file),
      line: usage.line,
      context: usage.context,
      reason: 'Uses target symbol',
      isTest: this.fileGraph.get(usage.file)?.isTest || false
    }));

    // Find where symbol is defined
    const definitions = symbolData.definedIn.map(filePath => ({
      file: this.relativePath(filePath),
      exports: this.fileGraph.get(filePath)?.exports.filter(exp => exp.name === targetSymbol) || []
    }));

    this.results.definitions = definitions;
    
    // Find cascading impacts
    for (const usage of symbolData.usedIn) {
      await this.findCascadingImpacts(usage.file, 1);
    }
    
    // Find test coverage
    this.results.testFiles = this.findSymbolTests(targetSymbol);
  }

  async findCascadingImpacts(startFile, depth) {
    if (depth > this.options.maxDepth) return;
    
    const directImporters = Array.from(this.fileGraph.entries())
      .filter(([filePath, analysis]) => 
        analysis.imports.some(imp => imp.path === startFile)
      )
      .map(([filePath]) => filePath);

    for (const importer of directImporters) {
      const existing = this.results.cascadingImpacts.find(impact => impact.file === this.relativePath(importer));
      if (!existing) {
        const analysis = this.fileGraph.get(importer);
        this.results.cascadingImpacts.push({
          file: this.relativePath(importer),
          depth,
          reason: `Imports from file at depth ${depth - 1}`,
          isTest: analysis.isTest,
          complexity: analysis.complexity
        });
        
        // Recurse for cascading impacts
        await this.findCascadingImpacts(importer, depth + 1);
      }
    }
  }

  findRelatedTests(targetFile) {
    const testFiles = [];
    const targetName = path.basename(targetFile, path.extname(targetFile));
    
    // Look for files that test this specific file
    for (const [filePath, analysis] of this.fileGraph) {
      if (analysis.isTest) {
        const testContent = fs.readFileSync(filePath, 'utf8');
        if (testContent.includes(targetName) || 
            analysis.imports.some(imp => imp.path === targetFile)) {
          testFiles.push({
            file: this.relativePath(filePath),
            reason: 'Tests target file'
          });
        }
      }
    }
    
    return testFiles;
  }

  findSymbolTests(targetSymbol) {
    const testFiles = [];
    
    for (const [filePath, analysis] of this.fileGraph) {
      if (analysis.isTest) {
        const usesSymbol = analysis.symbolUsages.some(usage => usage.symbol === targetSymbol);
        if (usesSymbol) {
          testFiles.push({
            file: this.relativePath(filePath),
            reason: 'Tests target symbol'
          });
        }
      }
    }
    
    return testFiles;
  }

  assessRisk() {
    const directCount = this.results.directImpacts.length;
    const cascadingCount = this.results.cascadingImpacts.length;
    const totalImpacts = directCount + cascadingCount;
    
    let riskLevel = 'low';
    if (totalImpacts > 20) riskLevel = 'high';
    else if (totalImpacts > 10) riskLevel = 'medium';
    
    const hasTestCoverage = this.results.testFiles.length > 0;
    const hasComplexFiles = [...this.results.directImpacts, ...this.results.cascadingImpacts]
      .some(impact => impact.complexity > 20);
    
    this.results.riskAssessment = {
      level: riskLevel,
      totalImpacts,
      directImpacts: directCount,
      cascadingImpacts: cascadingCount,
      hasTestCoverage,
      hasComplexFiles,
      recommendations: this.generateRiskRecommendations(riskLevel, hasTestCoverage, hasComplexFiles)
    };
  }

  generateRiskRecommendations(riskLevel, hasTestCoverage, hasComplexFiles) {
    const recommendations = [];
    
    if (riskLevel === 'high') {
      recommendations.push('Consider breaking this into smaller changes');
      recommendations.push('Create feature flags for gradual rollout');
    }
    
    if (!hasTestCoverage) {
      recommendations.push('Add tests before refactoring');
    }
    
    if (hasComplexFiles) {
      recommendations.push('Focus on simplifying complex files first');
      recommendations.push('Consider pair programming for complex changes');
    }
    
    if (riskLevel === 'low') {
      recommendations.push('Safe to proceed with standard testing');
    }
    
    return recommendations;
  }

  generateRefactorPlan() {
    const plan = [];
    
    // Phase 1: Preparation
    plan.push({
      phase: 1,
      title: 'Preparation',
      tasks: [
        'Run full test suite to establish baseline',
        'Create feature branch for changes',
        ...(this.results.testFiles.length === 0 ? ['Add missing test coverage'] : [])
      ]
    });
    
    // Phase 2: Core changes
    plan.push({
      phase: 2,
      title: 'Core Changes',
      tasks: [
        'Modify target file/symbol',
        'Update direct imports/usages',
        'Run affected tests'
      ]
    });
    
    // Phase 3: Propagation
    if (this.results.cascadingImpacts.length > 0) {
      plan.push({
        phase: 3,
        title: 'Cascading Updates',
        tasks: [
          'Update files with cascading dependencies',
          'Fix type errors and compilation issues',
          'Update related tests'
        ]
      });
    }
    
    // Phase 4: Verification
    plan.push({
      phase: 4,
      title: 'Verification',
      tasks: [
        'Run full test suite',
        'Test manually in development',
        'Check for runtime errors',
        'Update documentation if needed'
      ]
    });
    
    this.results.refactorPlan = plan;
  }

  calculateMetrics() {
    this.results.metrics = {
      ...this.results.metrics,
      directImpacts: this.results.directImpacts.length,
      cascadingImpacts: this.results.cascadingImpacts.length,
      testFiles: this.results.testFiles.length,
      riskLevel: this.results.riskAssessment.level,
      totalFilesAnalyzed: this.fileGraph.size,
      totalSymbolsTracked: this.symbolGraph.size
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

  resolveImportPath(fromFile, importPath) {
    if (!this.isLocalImport(importPath)) return null;
    
    let resolved;
    if (importPath.startsWith('@/')) {
      resolved = path.resolve(this.options.rootDir, importPath.substring(2));
    } else {
      resolved = path.resolve(path.dirname(fromFile), importPath);
    }
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    // Try index files
    for (const ext of extensions) {
      if (fs.existsSync(path.join(resolved, 'index' + ext))) {
        return path.join(resolved, 'index' + ext);
      }
    }
    
    return fs.existsSync(resolved) ? resolved : null;
  }

  isLocalImport(importPath) {
    return importPath.startsWith('.') || importPath.startsWith('@/');
  }

  isTestFile(filePath, content) {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') || 
           filePath.includes('__tests__') ||
           /describe\s*\(|it\s*\(|test\s*\(/g.test(content);
  }

  estimateComplexity(content) {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'];
    let complexity = 1;
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  extractDependencies(content) {
    // Extract major dependencies like React hooks, external libraries
    const dependencies = [];
    const patterns = [
      /use\w+\s*\(/g,           // React hooks
      /import.*from\s*['"`](?!\.)/g, // External imports
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) dependencies.push(...matches);
    });
    
    return dependencies;
  }

  isCommonKeyword(word) {
    const keywords = ['if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function', 'class', 'import', 'export', 'from', 'as', 'in', 'of'];
    return keywords.includes(word.toLowerCase());
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { target, directImpacts, cascadingImpacts, testFiles, riskAssessment, refactorPlan, metrics } = this.results;
    
    return `# Refactor Impact Analysis 🔍

**Target**: \`${target}\`
**Analysis Time**: ${metrics.analysisTime}

## 🎯 Impact Summary
- **Risk Level**: ${riskAssessment.level.toUpperCase()}
- **Direct Impacts**: ${metrics.directImpacts} files
- **Cascading Impacts**: ${metrics.cascadingImpacts} files
- **Test Coverage**: ${metrics.testFiles} test files
- **Total Blast Radius**: ${riskAssessment.totalImpacts} files

## ⚠️ Risk Assessment
${riskAssessment.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📁 Direct Impacts (${directImpacts.length} files)
${directImpacts.length === 0 ? 'None found.' : directImpacts.slice(0, 10).map(impact => 
  `- \`${impact.file}\`${impact.line ? `:${impact.line}` : ''} - ${impact.reason}${impact.isTest ? ' (TEST)' : ''}`
).join('\n')}
${directImpacts.length > 10 ? `\n... and ${directImpacts.length - 10} more` : ''}

## 🌊 Cascading Impacts (${cascadingImpacts.length} files)
${cascadingImpacts.length === 0 ? 'None found.' : cascadingImpacts.slice(0, 8).map(impact => 
  `- \`${impact.file}\` (depth ${impact.depth}) - ${impact.reason}${impact.isTest ? ' (TEST)' : ''}`
).join('\n')}
${cascadingImpacts.length > 8 ? `\n... and ${cascadingImpacts.length - 8} more` : ''}

## 🧪 Test Files (${testFiles.length} files)
${testFiles.length === 0 ? 'No test coverage found!' : testFiles.map(test => 
  `- \`${test.file}\` - ${test.reason}`
).join('\n')}

## 📋 Refactor Plan
${refactorPlan.map(phase => 
  `### Phase ${phase.phase}: ${phase.title}\n${phase.tasks.map(task => `- [ ] ${task}`).join('\n')}`
).join('\n\n')}

## 📊 Analysis Metrics
- **Files Analyzed**: ${metrics.totalFilesAnalyzed}
- **Symbols Tracked**: ${metrics.totalSymbolsTracked}
- **Risk Level**: ${riskAssessment.level}
- **Has Test Coverage**: ${riskAssessment.hasTestCoverage ? 'Yes' : 'No'}
- **Has Complex Files**: ${riskAssessment.hasComplexFiles ? 'Yes' : 'No'}

*Generated on ${new Date().toISOString()}*
`;
  }
}

// CLI interface
if (require.main === module) {
  const target = process.argv[2];
  
  if (!target) {
    console.log('Usage: npm run analyze-impact -- "ComponentName"');
    console.log('       npm run analyze-impact -- "./path/to/file.ts"');
    process.exit(1);
  }
  
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const analyzer = new RefactorImpactAnalyzer({
    rootDir: process.cwd()
  });

  analyzer.analyzeImpact(target).then(() => {
    const report = analyzer.generateReport();
    const reportPath = path.join(outputDir, 'refactor-impact-report.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'refactor-impact.json');
      fs.writeFileSync(jsonPath, JSON.stringify(analyzer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = RefactorImpactAnalyzer;