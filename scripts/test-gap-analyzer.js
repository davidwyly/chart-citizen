#!/usr/bin/env node

/**
 * Test Gap Analyzer 🧪
 * 
 * AI-optimized tool for finding missing test coverage and testing gaps.
 * Essential for understanding testing blind spots and prioritizing test creation.
 * 
 * Usage: npm run analyze-test-gaps
 *        npm run analyze-test-gaps --focus=components
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class TestGapAnalyzer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || [
        'node_modules/**', 
        'dist/**', 
        'build/**', 
        '.next/**',
        'analysis-results/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**'
      ],
      focus: options.focus || 'all', // 'components', 'utils', 'hooks', 'services', 'all'
      ...options
    };
    
    this.results = {
      summary: {
        totalFiles: 0,
        testedFiles: 0,
        untestedFiles: 0,
        coverageGaps: []
      },
      untestedFiles: [],
      missingTestTypes: [],
      criticalGaps: [],
      recommendations: [],
      testPatterns: {
        components: { total: 0, tested: 0 },
        hooks: { total: 0, tested: 0 },
        utils: { total: 0, tested: 0 },
        services: { total: 0, tested: 0 }
      },
      metrics: {}
    };
    
    this.fileAnalysis = new Map();
    this.testFiles = new Map();
  }

  /**
   * Analyze test coverage gaps
   */
  async analyzeTestGaps() {
    console.log('🧪 Analyzing test coverage gaps...');
    const startTime = Date.now();
    
    // Discover and analyze files
    await this.discoverFiles();
    await this.discoverTestFiles();
    await this.analyzeFiles();
    
    // Find gaps
    this.findUntestedFiles();
    this.findMissingTestTypes();
    this.findCriticalGaps();
    this.analyzeTestPatterns();
    this.generateRecommendations();
    this.calculateMetrics();
    
    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    
    return this.results;
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
        const analysis = this.analyzeSourceFile(filePath, content);
        this.fileAnalysis.set(filePath, analysis);
      } catch (error) {
        // Skip unreadable files
      }
    }
    
    this.results.summary.totalFiles = this.fileAnalysis.size;
  }

  async discoverTestFiles() {
    const testPatterns = [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}'
    ];
    
    for (const pattern of testPatterns) {
      const testFiles = glob.sync(pattern, {
        cwd: this.options.rootDir,
        absolute: true
      });
      
      for (const testFile of testFiles) {
        try {
          const content = fs.readFileSync(testFile, 'utf8');
          const analysis = this.analyzeTestFile(testFile, content);
          this.testFiles.set(testFile, analysis);
        } catch (error) {
          // Skip unreadable files
        }
      }
    }
  }

  analyzeSourceFile(filePath, content) {
    const relativePath = this.relativePath(filePath);
    const lines = content.split('\n');
    
    return {
      path: filePath,
      relativePath,
      size: content.length,
      lines: lines.length,
      type: this.determineFileType(filePath, content),
      complexity: this.calculateComplexity(content),
      exports: this.extractExports(content),
      functions: this.extractFunctions(content),
      classes: this.extractClasses(content),
      hooks: this.extractHooks(content),
      components: this.extractComponents(content),
      apiEndpoints: this.extractApiEndpoints(content),
      eventHandlers: this.extractEventHandlers(content),
      stateManagement: this.extractStateManagement(content),
      hasTests: false, // Will be updated when we find tests
      testTypes: [], // Types of tests that exist for this file
      criticalityScore: this.calculateCriticalityScore(filePath, content)
    };
  }

  analyzeTestFile(filePath, content) {
    const relativePath = this.relativePath(filePath);
    
    return {
      path: filePath,
      relativePath,
      testedFiles: this.findTestedFiles(filePath, content),
      testTypes: this.identifyTestTypes(content),
      testCount: this.countTests(content),
      coverage: this.analyzeCoverage(content),
      hasIntegrationTests: this.hasIntegrationTests(content),
      hasUnitTests: this.hasUnitTests(content),
      hasE2ETests: this.hasE2ETests(content)
    };
  }

  determineFileType(filePath, content) {
    const relativePath = this.relativePath(filePath);
    
    if (relativePath.includes('/components/') || content.includes('JSX') || /function\s+\w+\s*\([^)]*\)\s*{[^}]*return\s*\(/m.test(content)) {
      return 'component';
    } else if (relativePath.includes('/hooks/') || /export\s+function\s+use\w+/m.test(content)) {
      return 'hook';
    } else if (relativePath.includes('/utils/') || relativePath.includes('/lib/')) {
      return 'util';
    } else if (relativePath.includes('/services/') || relativePath.includes('/api/')) {
      return 'service';
    } else if (relativePath.includes('/types/') || filePath.endsWith('.d.ts')) {
      return 'types';
    } else if (relativePath.includes('/pages/') || relativePath.includes('/app/')) {
      return 'page';
    } else {
      return 'other';
    }
  }

  calculateComplexity(content) {
    // Simplified complexity calculation
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try', '&&', '||'];
    let complexity = 1;
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  extractExports(content) {
    const exports = [];
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g,
      /export\s+default\s+(\w+)/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 1) { // Export list
          const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
          exports.push(...names.map(name => ({ name, type: 'named' })));
        } else {
          exports.push({ name: match[1], type: index === 2 ? 'default' : 'named' });
        }
      }
    });

    return exports;
  }

  extractFunctions(content) {
    const functions = [];
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          type: pattern.source.includes('async') ? 'async' : 'sync'
        });
      }
    });

    return functions;
  }

  extractClasses(content) {
    const classes = [];
    const pattern = /(?:export\s+)?class\s+(\w+)/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      classes.push({ name: match[1] });
    }

    return classes;
  }

  extractHooks(content) {
    const hooks = [];
    const patterns = [
      /(?:export\s+)?(?:function\s+|const\s+)(use\w+)/g,
      /(use\w+)\s*\(/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const hookName = match[1];
        if (hookName.startsWith('use') && hookName.length > 3) {
          hooks.push({ name: hookName });
        }
      }
    });

    return [...new Map(hooks.map(h => [h.name, h])).values()]; // Deduplicate
  }

  extractComponents(content) {
    const components = [];
    const patterns = [
      /(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/g,
      /<([A-Z]\w+)[\s>]/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const componentName = match[1];
        if (componentName && componentName[0] === componentName[0].toUpperCase()) {
          components.push({
            name: componentName,
            type: index === 0 ? 'definition' : 'usage'
          });
        }
      }
    });

    return [...new Map(components.map(c => [c.name, c])).values()]; // Deduplicate
  }

  extractApiEndpoints(content) {
    const endpoints = [];
    const patterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\.get\(|\.post\(|\.put\(|\.delete\(/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index < 2) {
          endpoints.push({ url: match[1], type: index === 0 ? 'fetch' : 'axios' });
        } else {
          endpoints.push({ type: 'api-call' });
        }
      }
    });

    return endpoints;
  }

  extractEventHandlers(content) {
    const handlers = [];
    const patterns = [
      /on\w+\s*=\s*{([^}]+)}/g,
      /handle\w+/g,
      /addEventListener/g
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        handlers.push(...matches);
      }
    });

    return handlers;
  }

  extractStateManagement(content) {
    const statePatterns = [];
    const patterns = [
      /useState/g,
      /useReducer/g,
      /useContext/g,
      /useStore/g,
      /useState|useReducer|useContext|useStore/g
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        statePatterns.push(...matches);
      }
    });

    return [...new Set(statePatterns)]; // Deduplicate
  }

  calculateCriticalityScore(filePath, content) {
    let score = 0;
    const relativePath = this.relativePath(filePath);
    
    // Higher score = more critical = needs tests more urgently
    
    // File type criticality
    if (relativePath.includes('/components/')) score += 3;
    if (relativePath.includes('/services/')) score += 4;
    if (relativePath.includes('/utils/')) score += 2;
    if (relativePath.includes('/hooks/')) score += 3;
    if (relativePath.includes('/api/')) score += 5;
    
    // Complexity criticality
    const complexity = this.calculateComplexity(content);
    if (complexity > 20) score += 3;
    else if (complexity > 10) score += 2;
    else if (complexity > 5) score += 1;
    
    // Feature criticality
    if (content.includes('fetch') || content.includes('axios')) score += 2; // API calls
    if (content.includes('useState') || content.includes('useReducer')) score += 1; // State
    if (content.includes('useEffect')) score += 1; // Side effects
    if (content.includes('try') && content.includes('catch')) score += 1; // Error handling
    
    // File size criticality
    const lines = content.split('\n').length;
    if (lines > 200) score += 2;
    else if (lines > 100) score += 1;
    
    return score;
  }

  findTestedFiles(testFilePath, testContent) {
    const testedFiles = [];
    
    // Look for import statements that indicate what's being tested
    const importPattern = /import\s+.*from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = importPattern.exec(testContent)) !== null) {
      const importPath = match[1];
      if (this.isLocalImport(importPath)) {
        const resolved = this.resolveImportPath(testFilePath, importPath);
        if (resolved && this.fileAnalysis.has(resolved)) {
          testedFiles.push(resolved);
        }
      }
    }
    
    return testedFiles;
  }

  identifyTestTypes(content) {
    const types = [];
    
    if (content.includes('describe') || content.includes('it') || content.includes('test')) {
      types.push('unit');
    }
    if (content.includes('render') && content.includes('@testing-library')) {
      types.push('component');
    }
    if (content.includes('fireEvent') || content.includes('userEvent')) {
      types.push('interaction');
    }
    if (content.includes('cy.') || content.includes('browser.')) {
      types.push('e2e');
    }
    if (content.includes('request') || content.includes('supertest')) {
      types.push('api');
    }
    if (content.includes('integration') || content.includes('Integration')) {
      types.push('integration');
    }
    
    return types;
  }

  countTests(content) {
    const testMatches = content.match(/(?:it|test)\s*\(/g);
    return testMatches ? testMatches.length : 0;
  }

  analyzeCoverage(content) {
    // Simple coverage analysis based on test patterns
    const coverage = {
      hasHappyPath: content.includes('should') || content.includes('expect'),
      hasErrorHandling: content.includes('error') || content.includes('throw'),
      hasEdgeCases: content.includes('edge') || content.includes('boundary'),
      hasAsyncTests: content.includes('async') || content.includes('await'),
    };
    
    coverage.score = Object.values(coverage).filter(Boolean).length * 25; // Out of 100
    
    return coverage;
  }

  hasIntegrationTests(content) {
    return content.includes('integration') || content.includes('Integration');
  }

  hasUnitTests(content) {
    return content.includes('describe') || content.includes('it') || content.includes('test');
  }

  hasE2ETests(content) {
    return content.includes('cy.') || content.includes('browser.') || content.includes('page.');
  }

  async analyzeFiles() {
    // Mark files as tested based on test file analysis
    for (const [testFilePath, testAnalysis] of this.testFiles) {
      testAnalysis.testedFiles.forEach(testedFilePath => {
        const fileAnalysis = this.fileAnalysis.get(testedFilePath);
        if (fileAnalysis) {
          fileAnalysis.hasTests = true;
          fileAnalysis.testTypes.push(...testAnalysis.testTypes);
        }
      });
    }
    
    // Count tested vs untested
    let testedCount = 0;
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis.hasTests) {
        testedCount++;
      }
    }
    
    this.results.summary.testedFiles = testedCount;
    this.results.summary.untestedFiles = this.results.summary.totalFiles - testedCount;
  }

  findUntestedFiles() {
    const untested = [];
    
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (!analysis.hasTests) {
        // Skip based on focus option  
        if (this.options.focus !== 'all') {
          // Handle plural focus options (components, utils, hooks, services)
          const focusType = this.options.focus.endsWith('s') ? this.options.focus.slice(0, -1) : this.options.focus;
          if (analysis.type !== focusType) {
            continue;
          }
        }
        
        untested.push({
          file: analysis.relativePath,
          type: analysis.type,
          complexity: analysis.complexity,
          criticalityScore: analysis.criticalityScore,
          size: analysis.lines,
          exports: analysis.exports.length,
          functions: analysis.functions.length,
          components: analysis.components.length,
          reason: this.getUntestedReason(analysis)
        });
      }
    }
    
    // Sort by criticality score (highest first)
    untested.sort((a, b) => b.criticalityScore - a.criticalityScore);
    
    this.results.untestedFiles = untested;
  }

  getUntestedReason(analysis) {
    if (analysis.type === 'types') return 'Type definitions - low priority';
    if (analysis.complexity < 3) return 'Low complexity - consider if tests needed';
    if (analysis.exports.length === 0) return 'No exports - may not need tests';
    if (analysis.functions.length === 0 && analysis.classes.length === 0) return 'No testable units found';
    return 'Missing test coverage';
  }

  findMissingTestTypes() {
    const missingTypes = [];
    
    for (const [filePath, analysis] of this.fileAnalysis) {
      if (analysis.hasTests) {
        const missing = [];
        
        // Check for missing test types based on file characteristics
        if (analysis.components.length > 0 && !analysis.testTypes.includes('component')) {
          missing.push('component');
        }
        if (analysis.apiEndpoints.length > 0 && !analysis.testTypes.includes('api')) {
          missing.push('api');
        }
        if (analysis.eventHandlers.length > 0 && !analysis.testTypes.includes('interaction')) {
          missing.push('interaction');
        }
        if (analysis.stateManagement.length > 0 && !analysis.testTypes.includes('integration')) {
          missing.push('integration');
        }
        
        if (missing.length > 0) {
          missingTypes.push({
            file: analysis.relativePath,
            type: analysis.type,
            missingTestTypes: missing,
            currentTestTypes: analysis.testTypes,
            reason: `Has ${missing.join(', ')} features but missing corresponding tests`
          });
        }
      }
    }
    
    this.results.missingTestTypes = missingTypes;
  }

  findCriticalGaps() {
    const critical = [];
    
    for (const [filePath, analysis] of this.fileAnalysis) {
      // Critical = high criticality score + no tests
      if (analysis.criticalityScore >= 8 && !analysis.hasTests) {
        critical.push({
          file: analysis.relativePath,
          type: analysis.type,
          criticalityScore: analysis.criticalityScore,
          complexity: analysis.complexity,
          reason: 'High criticality file with no test coverage',
          recommendations: this.getCriticalRecommendations(analysis)
        });
      }
      
      // Critical = has tests but missing error handling tests
      if (analysis.hasTests && analysis.complexity > 15 && !analysis.testTypes.includes('integration')) {
        critical.push({
          file: analysis.relativePath,
          type: analysis.type,
          criticalityScore: analysis.criticalityScore,
          complexity: analysis.complexity,
          reason: 'Complex file missing integration tests',
          recommendations: ['Add integration tests', 'Test error scenarios', 'Test edge cases']
        });
      }
    }
    
    this.results.criticalGaps = critical.sort((a, b) => b.criticalityScore - a.criticalityScore);
  }

  getCriticalRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.components.length > 0) {
      recommendations.push('Add component rendering tests');
      recommendations.push('Test component props and interactions');
    }
    
    if (analysis.functions.length > 0) {
      recommendations.push('Add unit tests for functions');
      recommendations.push('Test function inputs and outputs');
    }
    
    if (analysis.apiEndpoints.length > 0) {
      recommendations.push('Add API integration tests');
      recommendations.push('Test error scenarios');
    }
    
    if (analysis.stateManagement.length > 0) {
      recommendations.push('Test state management logic');
      recommendations.push('Test state updates and side effects');
    }
    
    if (analysis.complexity > 10) {
      recommendations.push('Focus on testing complex logic');
      recommendations.push('Consider breaking down complex functions');
    }
    
    return recommendations;
  }

  analyzeTestPatterns() {
    // Count by type
    for (const [filePath, analysis] of this.fileAnalysis) {
      const type = analysis.type;
      if (this.results.testPatterns[type]) {
        this.results.testPatterns[type].total++;
        if (analysis.hasTests) {
          this.results.testPatterns[type].tested++;
        }
      }
    }
    
    // Calculate percentages
    Object.keys(this.results.testPatterns).forEach(type => {
      const pattern = this.results.testPatterns[type];
      pattern.coverage = pattern.total > 0 ? Math.round((pattern.tested / pattern.total) * 100) : 0;
    });
  }

  generateRecommendations() {
    const recommendations = [];
    const { testPatterns, untestedFiles, criticalGaps } = this.results;
    
    // Coverage recommendations
    const totalCoverage = this.results.summary.totalFiles > 0 
      ? Math.round((this.results.summary.testedFiles / this.results.summary.totalFiles) * 100)
      : 0;
    
    if (totalCoverage < 50) {
      recommendations.push('Low test coverage detected - prioritize adding tests for critical files');
    }
    
    // Type-specific recommendations
    Object.entries(testPatterns).forEach(([type, pattern]) => {
      if (pattern.total > 0 && pattern.coverage < 60) {
        recommendations.push(`Low ${type} test coverage (${pattern.coverage}%) - focus on testing ${type} files`);
      }
    });
    
    // Critical gap recommendations
    if (criticalGaps.length > 0) {
      recommendations.push(`${criticalGaps.length} critical gaps found - prioritize testing high-criticality files`);
    }
    
    // Specific recommendations
    if (untestedFiles.length > 20) {
      recommendations.push('Many untested files - consider setting up test automation');
    }
    
    if (untestedFiles.filter(f => f.type === 'component').length > 5) {
      recommendations.push('Many untested components - add component testing with React Testing Library');
    }
    
    if (untestedFiles.filter(f => f.type === 'service').length > 3) {
      recommendations.push('Untested services detected - add integration tests for API and business logic');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    const totalCoverage = this.results.summary.totalFiles > 0 
      ? Math.round((this.results.summary.testedFiles / this.results.summary.totalFiles) * 100)
      : 0;
    
    this.results.metrics = {
      ...this.results.metrics,
      totalCoverage: `${totalCoverage}%`,
      untestedFiles: this.results.untestedFiles.length,
      criticalGaps: this.results.criticalGaps.length,
      missingTestTypes: this.results.missingTestTypes.length,
      averageCriticality: this.calculateAverageCriticality(),
      testFilesFound: this.testFiles.size
    };
  }

  calculateAverageCriticality() {
    const scores = Array.from(this.fileAnalysis.values()).map(a => a.criticalityScore);
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }

  // Helper methods
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

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { summary, untestedFiles, criticalGaps, missingTestTypes, testPatterns, recommendations, metrics } = this.results;
    
    return `# Test Gap Analysis 🧪

**Analysis Time**: ${metrics.analysisTime}

## 📊 Coverage Summary
- **Total Files**: ${summary.totalFiles}
- **Tested Files**: ${summary.testedFiles} (${metrics.totalCoverage})
- **Untested Files**: ${summary.untestedFiles}
- **Critical Gaps**: ${metrics.criticalGaps}
- **Test Files Found**: ${metrics.testFilesFound}

## 🎯 Coverage by Type
${Object.entries(testPatterns).map(([type, pattern]) => 
  `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${pattern.tested}/${pattern.total} (${pattern.coverage}%)`
).join('\n')}

## 🚨 Critical Gaps (${criticalGaps.length} files)
${criticalGaps.length === 0 ? 'No critical gaps found!' : criticalGaps.slice(0, 8).map(gap => 
  `- **${gap.file}** (${gap.type}) - Score: ${gap.criticalityScore}\n  Reason: ${gap.reason}`
).join('\n\n')}
${criticalGaps.length > 8 ? `\n... and ${criticalGaps.length - 8} more critical gaps` : ''}

## 📋 Untested Files (${untestedFiles.length} files)
${untestedFiles.length === 0 ? 'All files have tests!' : untestedFiles.slice(0, 10).map(file => 
  `- **${file.file}** (${file.type}) - Criticality: ${file.criticalityScore}\n  ${file.reason}`
).join('\n\n')}
${untestedFiles.length > 10 ? `\n... and ${untestedFiles.length - 10} more untested files` : ''}

## 🔍 Missing Test Types (${missingTestTypes.length} files)
${missingTestTypes.length === 0 ? 'No missing test types detected.' : missingTestTypes.slice(0, 6).map(missing => 
  `- **${missing.file}** (${missing.type})\n  Missing: ${missing.missingTestTypes.join(', ')}\n  Has: ${missing.currentTestTypes.join(', ') || 'basic tests'}`
).join('\n\n')}

## 💡 Recommendations
${recommendations.length === 0 ? 'No specific recommendations.' : recommendations.map(rec => `- ${rec}`).join('\n')}

## 🎯 Priority Actions
1. **Immediate**: Address ${criticalGaps.length} critical gaps
2. **Short-term**: Add tests for ${untestedFiles.filter(f => f.criticalityScore >= 5).length} high-criticality files
3. **Medium-term**: Improve coverage for ${Object.entries(testPatterns).filter(([,p]) => p.coverage < 60).map(([t]) => t).join(', ')} files
4. **Long-term**: Reach 80%+ coverage across all file types

## 📊 Analysis Metrics
- **Total Coverage**: ${metrics.totalCoverage}
- **Average Criticality**: ${metrics.averageCriticality}/10
- **Files Analyzed**: ${summary.totalFiles}
- **Test Files**: ${metrics.testFilesFound}

*Generated on ${new Date().toISOString()}*
`;
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
  
  const analyzer = new TestGapAnalyzer({
    rootDir: process.cwd(),
    ...options
  });

  analyzer.analyzeTestGaps().then(() => {
    const report = analyzer.generateReport();
    const reportPath = path.join(outputDir, 'test-gap-report.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'test-gaps.json');
      fs.writeFileSync(jsonPath, JSON.stringify(analyzer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = TestGapAnalyzer;