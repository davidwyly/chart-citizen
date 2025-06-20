#!/usr/bin/env node

/**
 * AI Problem Solver - The Ultimate Token Reduction Tool
 * 
 * Takes a natural language problem description and provides ALL context needed:
 * - Relevant files and their relationships
 * - Similar patterns in codebase
 * - Test coverage status
 * - Dependencies and impact analysis
 * - Suggested implementation approach
 * 
 * Token Reduction: 20x (from 20+ tool calls to 1)
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProblemSolver {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      problem: '',
      relevantFiles: [],
      patterns: [],
      dependencies: [],
      testCoverage: {},
      riskAssessment: '',
      suggestedApproach: '',
      contextFiles: []
    };
  }

  async solve(problemDescription) {
    console.log('🔍 Analyzing problem:', problemDescription);
    
    this.results.problem = problemDescription;
    
    // Enhanced: Parse build errors and extract specific issues
    const buildError = this.parseBuildError(problemDescription);
    if (buildError) {
      console.log('🚨 Build error detected:', buildError.type);
      this.results.buildError = buildError;
      
      // For build errors, do targeted analysis
      await this.analyzeBuildError(buildError);
    } else {
      // Standard problem analysis flow
      const keywords = this.extractKeywords(problemDescription);
      console.log('🎯 Key terms:', keywords.join(', '));
      
      await this.findRelevantFiles(keywords);
    }
    
    // Analyze patterns related to the problem
    await this.findRelatedPatterns(this.results.keywords || []);
    
    // Enhanced: Deep dependency analysis with import validation
    await this.analyzeDependencies();
    
    // Assess test coverage for relevant areas
    await this.analyzeTestCoverage();
    
    // Generate risk assessment
    this.assessRisk();
    
    // Enhanced: Generate comprehensive fix suggestions
    await this.generateFixSuggestions();
    
    // Suggest implementation approach
    this.suggestApproach();
    
    // Generate comprehensive report
    await this.generateReport();
    
    return this.results;
  }

  extractKeywords(description) {
    // Extract component names, technical terms, action words
    const keywords = [];
    
    // Look for component names (PascalCase)
    const components = description.match(/[A-Z][a-zA-Z0-9]*/g) || [];
    keywords.push(...components);
    
    // Look for technical terms
    const techTerms = description.match(/\b(render|performance|bug|error|test|component|hook|state|prop|api|fetch|async|cache|memory|speed|slow|fast|optimization|refactor|fix)\b/gi) || [];
    keywords.push(...techTerms);
    
    // Look for file patterns
    const filePatterns = description.match(/\b[\w-]+\.(tsx?|jsx?|ts|js)\b/gi) || [];
    keywords.push(...filePatterns);
    
    return [...new Set(keywords.map(k => k.toLowerCase()))];
  }

  parseBuildError(description) {
    // Parse different types of build errors
    const patterns = {
      moduleNotFound: /Module not found.*Can't resolve\s+['"]([^'"]+)['"]/i,
      importError: /Cannot import.*from\s+['"]([^'"]+)['"]/i,
      typeError: /Type\s+['"]([^'"]+)['"]\s+has no property\s+['"]([^'"]+)['"]/i,
      syntaxError: /SyntaxError.*in\s+(.+?):/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = description.match(pattern);
      if (match) {
        const result = { type, rawError: description };
        
        switch (type) {
          case 'moduleNotFound':
            result.missingModule = match[1];
            result.affectedFile = this.extractFileFromError(description);
            break;
          case 'importError':
            result.importPath = match[1];
            result.affectedFile = this.extractFileFromError(description);
            break;
          case 'typeError':
            result.typeName = match[1];
            result.property = match[2];
            break;
          case 'syntaxError':
            result.affectedFile = match[1];
            break;
        }
        
        return result;
      }
    }
    
    return null;
  }

  extractFileFromError(errorMessage) {
    // Extract file path from common error message formats
    const patterns = [
      /\.\/([^:\s]+\.tsx?)/,
      /in\s+([^:\s]+\.tsx?)/,
      /at\s+([^:\s]+\.tsx?)/
    ];
    
    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  async analyzeBuildError(buildError) {
    console.log('🔧 Analyzing build error...');
    
    if (buildError.type === 'moduleNotFound' && buildError.affectedFile) {
      // Import the ImportAnalyzer for dependency analysis
      const { ImportAnalyzer } = require('./import-analyzer');
      const importAnalyzer = new ImportAnalyzer();
      
      try {
        // Analyze the specific file with the error
        const filePath = buildError.affectedFile.startsWith('./') 
          ? buildError.affectedFile.slice(2) 
          : buildError.affectedFile;
        
        const fullPath = require('path').join(process.cwd(), filePath);
        const analysis = await importAnalyzer.analyzeFile(fullPath);
        
        this.results.importAnalysis = analysis;
        this.results.relevantFiles = [{ 
          path: fullPath, 
          score: 100, 
          description: 'File with build error',
          analysis 
        }];
        
        // Find suggestions for the missing module
        const missingImport = analysis.broken.find(b => 
          b.path.includes(buildError.missingModule) || 
          buildError.missingModule.includes(b.path)
        );
        
        if (missingImport) {
          this.results.missingImport = missingImport;
          
          // Look for similar files that might be the correct import
          const suggestions = analysis.suggestions.filter(s => 
            s.broken.includes(buildError.missingModule.split('/').pop())
          );
          
          this.results.importSuggestions = suggestions;
        }
        
        this.results.keywords = [buildError.missingModule, require('path').basename(buildError.affectedFile)];
        
      } catch (error) {
        console.warn('⚠️ Could not analyze import error:', error.message);
        // Fallback to keyword-based analysis
        this.results.keywords = this.extractKeywords(buildError.rawError);
        await this.findRelevantFiles(this.results.keywords);
      }
    } else {
      // For other build errors, use keyword extraction
      this.results.keywords = this.extractKeywords(buildError.rawError);
      await this.findRelevantFiles(this.results.keywords);
    }
  }

  async generateFixSuggestions() {
    console.log('💡 Generating fix suggestions...');
    
    const suggestions = [];
    
    // Build error specific suggestions
    if (this.results.buildError) {
      const { buildError } = this.results;
      
      if (buildError.type === 'moduleNotFound') {
        suggestions.push({
          type: 'import-fix',
          priority: 'critical',
          description: `Fix missing import: ${buildError.missingModule}`,
          action: 'fix-import',
          details: {
            file: buildError.affectedFile,
            missingImport: buildError.missingModule,
            suggestions: this.results.importSuggestions || []
          }
        });
        
        // Check for pattern-based fixes
        if (this.results.importAnalysis?.broken.length > 1) {
          suggestions.push({
            type: 'bulk-fix',
            priority: 'high',
            description: `Fix ${this.results.importAnalysis.broken.length} broken imports in this file`,
            action: 'bulk-fix-imports',
            details: {
              file: buildError.affectedFile,
              brokenImports: this.results.importAnalysis.broken
            }
          });
        }
      }
    }
    
    // Pattern-based suggestions
    if (this.results.patterns?.includes('Performance Optimization')) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        description: 'Add performance monitoring and optimization',
        action: 'add-performance-monitoring'
      });
    }
    
    if (this.results.patterns?.includes('Testing')) {
      suggestions.push({
        type: 'testing',
        priority: 'medium',
        description: 'Enhance test coverage for affected components',
        action: 'add-comprehensive-tests'
      });
    }
    
    // Coverage-based suggestions
    if (this.results.testCoverage?.coverage < 50) {
      suggestions.push({
        type: 'testing',
        priority: 'high',
        description: `Improve test coverage from ${this.results.testCoverage.coverage}% to 70%+`,
        action: 'improve-test-coverage'
      });
    }
    
    this.results.fixSuggestions = suggestions;
  }

  async findRelevantFiles(keywords) {
    console.log('📁 Finding relevant files...');
    
    try {
      // Get all source files
      const files = await this.discoverFiles();
      const relevantFiles = [];
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file.path, 'utf8');
          const fileName = path.basename(file.path);
          
          let score = 0;
          
          // Score based on filename matches
          for (const keyword of keywords) {
            if (fileName.toLowerCase().includes(keyword)) {
              score += 10;
            }
            if (content.toLowerCase().includes(keyword)) {
              score += 1;
            }
          }
          
          // Boost score for certain file types
          if (file.path.includes('/components/')) score += 5;
          if (file.path.includes('/hooks/')) score += 3;
          if (file.path.includes('/utils/')) score += 2;
          
          if (score >= 5) {
            relevantFiles.push({
              path: file.path,
              score,
              size: content.length,
              description: this.analyzeFileContent(content, fileName)
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      // Sort by relevance score
      this.results.relevantFiles = relevantFiles
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10 most relevant
        
      console.log(`   Found ${this.results.relevantFiles.length} highly relevant files`);
    } catch (error) {
      console.error('Error finding relevant files:', error.message);
    }
  }

  analyzeFileContent(content, fileName) {
    const lines = content.split('\n').length;
    const isComponent = /export\s+(default\s+)?(?:function|const)\s+[A-Z]/.test(content);
    const isHook = fileName.startsWith('use-') || /export\s+function\s+use[A-Z]/.test(content);
    const isUtil = /export\s+(function|const)\s+[a-z]/.test(content);
    const hasTests = content.includes('describe(') || content.includes('test(') || content.includes('it(');
    
    const types = [];
    if (isComponent) types.push('Component');
    if (isHook) types.push('Hook');
    if (isUtil) types.push('Utility');
    if (hasTests) types.push('Test');
    
    return `${types.join(', ')} (${lines} lines)`;
  }

  async findRelatedPatterns(keywords) {
    console.log('🔍 Finding related patterns...');
    
    const patterns = new Set();
    
    for (const file of this.results.relevantFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        
        // Look for common patterns
        if (content.includes('useState')) patterns.add('React State Management');
        if (content.includes('useEffect')) patterns.add('React Effects');
        if (content.includes('useMemo') || content.includes('useCallback')) patterns.add('React Performance Optimization');
        if (content.includes('three/fiber') || content.includes('react-three')) patterns.add('React Three Fiber');
        if (content.includes('performance') || content.includes('memo')) patterns.add('Performance Optimization');
        if (content.includes('test') || content.includes('describe')) patterns.add('Testing');
        if (content.includes('async') || content.includes('await')) patterns.add('Async Operations');
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    this.results.patterns = Array.from(patterns);
    console.log(`   Found ${this.results.patterns.length} related patterns`);
  }

  async analyzeDependencies() {
    console.log('🔗 Analyzing dependencies...');
    
    const deps = new Set();
    
    for (const file of this.results.relevantFiles) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const imports = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];
        
        for (const imp of imports) {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          if (match) {
            const dep = match[1];
            if (dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')) {
              deps.add(dep);
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    this.results.dependencies = Array.from(deps).slice(0, 15);
    console.log(`   Found ${this.results.dependencies.length} key dependencies`);
  }

  async analyzeTestCoverage() {
    console.log('🧪 Analyzing test coverage...');
    
    let testedFiles = 0;
    let untestedFiles = 0;
    
    for (const file of this.results.relevantFiles) {
      const testPath = file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const testDir = path.join(path.dirname(file.path), '__tests__', path.basename(file.path));
      
      try {
        await fs.access(testPath);
        testedFiles++;
      } catch {
        try {
          await fs.access(testDir);
          testedFiles++;
        } catch {
          untestedFiles++;
        }
      }
    }
    
    this.results.testCoverage = {
      tested: testedFiles,
      untested: untestedFiles,
      coverage: Math.round((testedFiles / (testedFiles + untestedFiles)) * 100) || 0
    };
    
    console.log(`   Test coverage: ${this.results.testCoverage.coverage}%`);
  }

  assessRisk() {
    const { relevantFiles, testCoverage } = this.results;
    
    let risk = 'LOW';
    
    // High risk factors
    if (testCoverage.coverage < 50) risk = 'MEDIUM';
    if (testCoverage.coverage < 25) risk = 'HIGH';
    if (relevantFiles.some(f => f.path.includes('/system-viewer'))) risk = 'MEDIUM';
    if (relevantFiles.some(f => f.path.includes('/core/'))) risk = 'HIGH';
    if (relevantFiles.length > 8) risk = 'HIGH';
    
    this.results.riskAssessment = risk;
  }

  suggestApproach() {
    const { relevantFiles, patterns, riskAssessment } = this.results;
    
    const suggestions = [];
    
    // Risk-based suggestions
    if (riskAssessment === 'HIGH') {
      suggestions.push('⚠️ HIGH RISK: Write comprehensive tests before making changes');
      suggestions.push('🔍 Create detailed backup plan');
    } else if (riskAssessment === 'MEDIUM') {
      suggestions.push('⚠️ MEDIUM RISK: Add tests for modified functionality');
    }
    
    // Pattern-based suggestions
    if (patterns.includes('React Three Fiber')) {
      suggestions.push('🎯 Focus on Three.js performance implications');
    }
    if (patterns.includes('Performance Optimization')) {
      suggestions.push('📊 Measure performance before and after changes');
    }
    if (patterns.includes('Testing')) {
      suggestions.push('✅ Update existing tests to match changes');
    }
    
    // File-based suggestions
    if (relevantFiles.length <= 3) {
      suggestions.push('✅ Small scope - can implement directly');
    } else {
      suggestions.push('🔄 Large scope - break into smaller PRs');
    }
    
    this.results.suggestedApproach = suggestions.join('\n');
  }

  async discoverFiles() {
    const results = [];
    
    async function scanDir(dir) {
      try {
        const items = await fs.readdir(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            await scanDir(fullPath);
          } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(item)) {
            results.push({ path: fullPath, size: stat.size });
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDir(process.cwd());
    return results;
  }

  async generateReport() {
    const analysisTime = Date.now() - this.startTime;
    
    const report = `# Problem Solver Report 🔍

## Problem Analysis
**Description**: ${this.results.problem}
**Analysis Time**: ${analysisTime}ms
**Risk Level**: ${this.results.riskAssessment}

## 📁 Most Relevant Files (${this.results.relevantFiles.length})

${this.results.relevantFiles.map(f => 
  `- **${f.path}** (score: ${f.score}) - ${f.description}`
).join('\n')}

## 🔗 Key Dependencies (${this.results.dependencies.length})

${this.results.dependencies.map(d => `- ${d}`).join('\n')}

## 📐 Related Patterns (${this.results.patterns.length})

${this.results.patterns.map(p => `- ${p}`).join('\n')}

${this.results.buildError ? `
## 🚨 Build Error Analysis

**Error Type**: ${this.results.buildError.type}
**Missing Module**: ${this.results.buildError.missingModule || 'N/A'}
**Affected File**: ${this.results.buildError.affectedFile || 'N/A'}

${this.results.importSuggestions && this.results.importSuggestions.length > 0 ? `
### Import Suggestions
${this.results.importSuggestions.map(s => 
  `- Replace \`${s.broken}\` with \`${s.suggested}\` (${s.confidence} confidence)`
).join('\n')}
` : ''}
` : ''}

## 🧪 Test Coverage Analysis

- **Coverage**: ${this.results.testCoverage.coverage}%
- **Tested Files**: ${this.results.testCoverage.tested}
- **Untested Files**: ${this.results.testCoverage.untested}

${this.results.fixSuggestions && this.results.fixSuggestions.length > 0 ? `
## 🔧 Fix Suggestions

${this.results.fixSuggestions.map(fix => 
  `### ${fix.priority === 'critical' ? '🚨' : fix.priority === 'high' ? '⚠️' : '💡'} ${fix.description}
**Priority**: ${fix.priority}
**Type**: ${fix.type}
**Action**: ${fix.action}
${fix.details ? `**Details**: ${JSON.stringify(fix.details, null, 2)}` : ''}
`
).join('\n')}
` : ''}

## 💡 Suggested Implementation Approach

${this.results.suggestedApproach}

## 🎯 Context Files to Read

${this.results.relevantFiles.slice(0, 5).map(f => f.path).join('\n')}

---
*This report provides comprehensive context for the problem in a single analysis*
*Generated on ${new Date().toISOString()}*
`;

    await fs.writeFile('./analysis-results/problem-solver-report.md', report);
    console.log('\n✅ Problem analysis complete!');
    console.log('📄 Report saved to: ./analysis-results/problem-solver-report.md');
  }
}

// CLI interface
if (require.main === module) {
  const problemDescription = process.argv[2];
  
  if (!problemDescription) {
    console.log(`
🔍 AI Problem Solver - Ultimate Token Reduction Tool

Usage:
  npm run ai-toolkit solve "problem description"

Examples:
  npm run ai-toolkit solve "fix performance issue in SystemViewer"
  npm run ai-toolkit solve "refactor UserProfile component"
  npm run ai-toolkit solve "add dark mode to settings"
  npm run ai-toolkit solve "investigate test failures in orbital mechanics"

This tool provides ALL context needed in a single command:
• Relevant files and their relationships  
• Similar patterns in codebase
• Test coverage status
• Dependencies and impact analysis
• Risk assessment and suggested approach

Token Reduction: 20x fewer tool calls for complex investigations
`);
    process.exit(1);
  }

  const solver = new ProblemSolver();
  solver.solve(problemDescription).catch(console.error);
}

module.exports = { ProblemSolver };