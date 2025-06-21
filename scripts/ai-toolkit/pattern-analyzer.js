#!/usr/bin/env node

/**
 * Pattern Analyzer 🔍
 * 
 * AI-optimized tool for finding inconsistent patterns and implementations.
 * Essential for maintaining code consistency and finding refactor opportunities.
 * 
 * Usage: npm run analyze-patterns
 *        npm run analyze-patterns --focus=hooks
 *        npm run analyze-patterns --focus=components
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');
const { findInDir } = require('./utils'); // Assuming a utility for finding files

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// A simple regex to capture import paths. Not as robust as an AST parser, but fast and dependency-free.
const IMPORT_REGEX = /import\s+.*\s+from\s+['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;

class PatternAnalyzer {
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
      focus: options.focus || 'all', // 'hooks', 'components', 'utils', 'types', 'all'
      ...options
    };
    
    this.results = {
      summary: {
        totalPatterns: 0,
        consistentPatterns: 0,
        inconsistentPatterns: 0,
        totalFiles: 0
      },
      patterns: {
        hooks: [],
        components: [],
        utilities: [],
        errorHandling: [],
        apiCalls: [],
        stateManagement: [],
        eventHandlers: []
      },
      inconsistencies: [],
      recommendations: [],
      metrics: {}
    };
    
    this.fileAnalysis = new Map();
    this.patternTemplates = this.initializePatternTemplates();
  }

  initializePatternTemplates() {
    return {
      // React Hooks patterns
      hookDeclaration: {
        pattern: /export\s+(?:function\s+)?(use[A-Z]\w+)/g,
        type: 'hooks',
        description: 'Custom hook declarations'
      },
      hookUsage: {
        pattern: /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*(use\w+)/g,
        type: 'hooks',
        description: 'Hook usage patterns'
      },
      
      // Component patterns
      componentDeclaration: {
        pattern: /(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z]\w+)/g,
        type: 'components',
        description: 'Component declarations'
      },
      propsInterface: {
        pattern: /interface\s+([A-Z]\w+Props)\s*{/g,
        type: 'components',
        description: 'Props interface definitions'
      },
      
      // Error handling patterns
      tryCatch: {
        pattern: /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}/g,
        type: 'errorHandling',
        description: 'Try-catch blocks'
      },
      errorBoundary: {
        pattern: /componentDidCatch|static\s+getDerivedStateFromError|ErrorBoundary/g,
        type: 'errorHandling',
        description: 'Error boundary usage'
      },
      
      // API call patterns
      fetchCall: {
        pattern: /fetch\s*\(\s*['"`)]/g,
        type: 'apiCalls',
        description: 'Fetch API calls'
      },
      axiosCall: {
        pattern: /axios\.\w+\s*\(/g,
        type: 'apiCalls',
        description: 'Axios calls'
      },
      
      // State management patterns
      useState: {
        pattern: /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState/g,
        type: 'stateManagement',
        description: 'useState hook usage'
      },
      useReducer: {
        pattern: /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useReducer/g,
        type: 'stateManagement',
        description: 'useReducer hook usage'
      },
      
      // Event handler patterns
      eventHandler: {
        pattern: /const\s+(handle\w+)\s*=|function\s+(handle\w+)\s*\(/g,
        type: 'eventHandlers',
        description: 'Event handler functions'
      },
      onEventProp: {
        pattern: /on[A-Z]\w+\s*=\s*{/g,
        type: 'eventHandlers',
        description: 'Event prop usage'
      }
    };
  }

  /**
   * Analyze patterns across the codebase
   */
  async analyzePatterns() {
    console.log('🔍 Analyzing code patterns...');
    const startTime = Date.now();
    
    // Discover and analyze files
    await this.discoverFiles();
    await this.extractPatterns();
    
    // Find inconsistencies
    this.findInconsistencies();
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
        const analysis = this.analyzeFile(filePath, content);
        this.fileAnalysis.set(filePath, analysis);
      } catch (error) {
        // Skip unreadable files
      }
    }
    
    this.results.summary.totalFiles = this.fileAnalysis.size;
  }

  analyzeFile(filePath, content) {
    const relativePath = path.relative(this.options.rootDir, filePath);
    
    return {
      path: filePath,
      relativePath,
      type: this.determineFileType(relativePath),
      content,
      size: content.length,
      lines: content.split('\n').length,
      patterns: {}
    };
  }

  determineFileType(relativePath) {
    if (relativePath.includes('/hooks/') || relativePath.includes('use-')) {
      return 'hook';
    } else if (relativePath.includes('/components/') || relativePath.endsWith('.tsx')) {
      return 'component';
    } else if (relativePath.includes('/utils/') || relativePath.includes('/lib/')) {
      return 'utility';
    } else if (relativePath.includes('/api/') || relativePath.includes('/services/')) {
      return 'service';
    } else if (relativePath.includes('/types/') || relativePath.endsWith('.d.ts')) {
      return 'types';
    } else if (relativePath.includes('test') || relativePath.includes('spec')) {
      return 'test';
    } else {
      return 'other';
    }
  }

  async extractPatterns() {
    Object.entries(this.patternTemplates).forEach(([patternName, template]) => {
      // Skip if focusing on specific pattern type
      if (this.options.focus !== 'all' && this.options.focus !== template.type) {
        return;
      }
      
      const patternInstances = [];
      
      this.fileAnalysis.forEach((analysis, filePath) => {
        const matches = this.findPatternMatches(analysis.content, template, analysis);
        matches.forEach(match => {
          patternInstances.push({
            file: analysis.relativePath,
            fileType: analysis.type,
            line: match.line,
            code: match.code,
            context: match.context,
            signature: this.generateSignature(match.code, template.type)
          });
        });
      });
      
      if (patternInstances.length > 0) {
        this.results.patterns[template.type].push({
          name: patternName,
          description: template.description,
          count: patternInstances.length,
          instances: patternInstances,
          consistency: this.analyzePatternConsistency(patternInstances)
        });
      }
    });
  }

  findPatternMatches(content, template, fileAnalysis) {
    const matches = [];
    const lines = content.split('\n');
    
    let match;
    while ((match = template.pattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const lineNumber = content.substring(0, matchIndex).split('\n').length;
      const line = lines[lineNumber - 1];
      
      matches.push({
        line: lineNumber,
        code: match[0],
        fullMatch: match,
        context: this.getContext(lines, lineNumber - 1, 2)
      });
    }
    
    // Reset regex for next use
    template.pattern.lastIndex = 0;
    
    return matches;
  }

  generateSignature(code, patternType) {
    // Generate a normalized signature for comparison
    switch (patternType) {
      case 'hooks':
        return code.replace(/\s+/g, ' ').toLowerCase();
      case 'components':
        return code.replace(/\s+/g, ' ').replace(/['"]/g, '');
      case 'errorHandling':
        return 'try-catch';
      case 'apiCalls':
        return code.includes('fetch') ? 'fetch' : code.includes('axios') ? 'axios' : 'api-call';
      default:
        return code.replace(/\s+/g, ' ').toLowerCase();
    }
  }

  analyzePatternConsistency(instances) {
    if (instances.length < 2) return { score: 100, issues: [] };
    
    const signatures = instances.map(i => i.signature);
    const uniqueSignatures = [...new Set(signatures)];
    
    const consistencyScore = Math.round((1 - (uniqueSignatures.length - 1) / instances.length) * 100);
    const issues = [];
    
    if (uniqueSignatures.length > 1) {
      // Find most common pattern
      const signatureCounts = {};
      signatures.forEach(sig => {
        signatureCounts[sig] = (signatureCounts[sig] || 0) + 1;
      });
      
      const mostCommon = Object.entries(signatureCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      // Find deviations
      instances.forEach(instance => {
        if (instance.signature !== mostCommon) {
          issues.push({
            file: instance.file,
            line: instance.line,
            deviation: `Different pattern: ${instance.signature} (expected: ${mostCommon})`
          });
        }
      });
    }
    
    return { score: consistencyScore, issues };
  }

  findInconsistencies() {
    Object.values(this.results.patterns).flat().forEach(pattern => {
      if (pattern.consistency.score < 80 && pattern.count > 2) {
        this.results.inconsistencies.push({
          pattern: pattern.name,
          description: pattern.description,
          totalInstances: pattern.count,
          consistencyScore: pattern.consistency.score,
          issues: pattern.consistency.issues.slice(0, 5), // Top 5 issues
          severity: this.calculateSeverity(pattern.consistency.score, pattern.count)
        });
      }
    });
    
    this.results.summary.totalPatterns = Object.values(this.results.patterns)
      .flat().length;
    this.results.summary.inconsistentPatterns = this.results.inconsistencies.length;
    this.results.summary.consistentPatterns = this.results.summary.totalPatterns - 
      this.results.summary.inconsistentPatterns;
  }

  calculateSeverity(score, count) {
    if (score < 50 && count > 10) return 'high';
    if (score < 70 && count > 5) return 'medium';
    return 'low';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Inconsistency recommendations
    const highSeverity = this.results.inconsistencies.filter(i => i.severity === 'high');
    if (highSeverity.length > 0) {
      recommendations.push(`🚨 **Critical**: ${highSeverity.length} high-severity pattern inconsistencies need immediate attention`);
    }
    
    const mediumSeverity = this.results.inconsistencies.filter(i => i.severity === 'medium');
    if (mediumSeverity.length > 0) {
      recommendations.push(`⚠️ **Important**: ${mediumSeverity.length} medium-severity inconsistencies should be addressed`);
    }
    
    // Pattern-specific recommendations
    const hookPatterns = this.results.patterns.hooks || [];
    const componentPatterns = this.results.patterns.components || [];
    const errorPatterns = this.results.patterns.errorHandling || [];
    
    if (hookPatterns.some(p => p.consistency.score < 70)) {
      recommendations.push('🪝 **Hooks**: Standardize custom hook patterns for better maintainability');
    }
    
    if (componentPatterns.some(p => p.consistency.score < 70)) {
      recommendations.push('⚛️ **Components**: Improve component declaration consistency');
    }
    
    if (errorPatterns.some(p => p.consistency.score < 60)) {
      recommendations.push('🚨 **Error Handling**: Standardize error handling patterns across the codebase');
    }
    
    // Overall health recommendation
    const overallConsistency = this.results.summary.totalPatterns > 0 ? 
      Math.round((this.results.summary.consistentPatterns / this.results.summary.totalPatterns) * 100) : 100;
    
    if (overallConsistency < 70) {
      recommendations.push(`📊 **Codebase Health**: ${overallConsistency}% pattern consistency - consider establishing coding standards`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ **Status**: Code patterns are consistent and well-maintained');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    const allPatterns = Object.values(this.results.patterns).flat();
    
    this.results.metrics = {
      ...this.results.metrics,
      filesAnalyzed: this.fileAnalysis.size,
      patternsFound: allPatterns.length,
      averageConsistency: allPatterns.length > 0 ? 
        Math.round(allPatterns.reduce((sum, p) => sum + p.consistency.score, 0) / allPatterns.length) : 100,
      mostInconsistentPattern: this.results.inconsistencies.length > 0 ? 
        this.results.inconsistencies.sort((a, b) => a.consistencyScore - b.consistencyScore)[0].pattern : 'None',
      totalInconsistencies: this.results.inconsistencies.reduce((sum, i) => sum + i.issues.length, 0)
    };
  }

  getContext(lines, lineIndex, contextLines = 2) {
    const start = Math.max(0, lineIndex - contextLines);
    const end = Math.min(lines.length, lineIndex + contextLines + 1);
    return lines.slice(start, end).join('\n');
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { summary, patterns, inconsistencies, recommendations, metrics } = this.results;
    
    return `# Pattern Analysis 🔍

**Analysis Time**: ${metrics.analysisTime}

## 📊 Pattern Summary
- **Total Files**: ${summary.totalFiles}
- **Patterns Found**: ${metrics.patternsFound}
- **Consistent Patterns**: ${summary.consistentPatterns}
- **Inconsistent Patterns**: ${summary.inconsistentPatterns}
- **Average Consistency**: ${metrics.averageConsistency}%

## 🎯 Pattern Types

${Object.entries(patterns).map(([type, typePatterns]) => {
  if (typePatterns.length === 0) return '';
  return `### ${type.charAt(0).toUpperCase() + type.slice(1)}
${typePatterns.map(pattern => 
  `- **${pattern.name}**: ${pattern.count} instances (${pattern.consistency.score}% consistent)`
).join('\n')}`;
}).filter(section => section).join('\n\n')}

## ⚠️ Inconsistencies (${inconsistencies.length})
${inconsistencies.length === 0 ? 'No significant inconsistencies detected!' : inconsistencies.slice(0, 8).map(issue => 
  `- **${issue.pattern}** (${issue.severity.toUpperCase()}): ${issue.consistencyScore}% consistent, ${issue.issues.length} deviations
  ${issue.issues.slice(0, 2).map(dev => `  - ${dev.file}:${dev.line} - ${dev.deviation}`).join('\n')}`
).join('\n\n')}
${inconsistencies.length > 8 ? `\n... and ${inconsistencies.length - 8} more inconsistencies` : ''}

## 💡 Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📊 Analysis Metrics
- **Files Analyzed**: ${metrics.filesAnalyzed}
- **Patterns Found**: ${metrics.patternsFound}
- **Average Consistency**: ${metrics.averageConsistency}%
- **Most Inconsistent**: ${metrics.mostInconsistentPattern}
- **Total Issues**: ${metrics.totalInconsistencies}

## 🎯 Quick Actions
1. **High Priority**: Address ${inconsistencies.filter(i => i.severity === 'high').length} high-severity inconsistencies
2. **Medium Priority**: Standardize ${inconsistencies.filter(i => i.severity === 'medium').length} medium-severity patterns
3. **Long-term**: Establish pattern guidelines for ${metrics.averageConsistency < 80 ? 'improving' : 'maintaining'} consistency

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
  
  const analyzer = new PatternAnalyzer({
    rootDir: process.cwd(),
    ...options
  });

  analyzer.analyzePatterns().then(() => {
    const report = analyzer.generateReport();
    const reportPath = path.join(outputDir, 'pattern-analysis.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'patterns.json');
      fs.writeFileSync(jsonPath, JSON.stringify(analyzer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = PatternAnalyzer;