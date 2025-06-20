#!/usr/bin/env node

/**
 * AI Workflow Toolkit 🚀
 * 
 * Unified interface for all AI-optimized code analysis tools.
 * Designed to maximize AI efficiency and minimize token usage.
 * 
 * Usage: npm run ai-toolkit [command] [options]
 * 
 * Commands:
 *   dead-code          Hunt for unused code and files
 *   impact <target>    Analyze refactoring impact
 *   context <target>   Trace data flow and relationships
 *   test-gaps          Find missing test coverage
 *   full-analysis      Run comprehensive analysis
 *   help               Show detailed help
 */

const fs = require('fs');
const path = require('path');

// Import our analysis tools
const DeadCodeHunter = require('./dead-code-hunter');
const RefactorImpactAnalyzer = require('./refactor-impact-analyzer');
const ContextTracer = require('./context-tracer');
const TestGapAnalyzer = require('./test-gap-analyzer');
const GitDiffAnalyzer = require('./git-diff-analyzer');
const DependencyAnalyzer = require('./dependency-analyzer');
const { ProblemSolver } = require('./problem-solver');

class AIWorkflowToolkit {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      outputDir: options.outputDir || path.join(process.cwd(), 'analysis-results'),
      ...options
    };
    
    this.results = {
      command: null,
      target: null,
      analyses: {},
      summary: {},
      recommendations: [],
      metrics: {}
    };
  }

  async run(command, args = []) {
    console.log('🚀 AI Workflow Toolkit Starting...');
    const startTime = Date.now();
    
    this.results.command = command;
    this.ensureOutputDir();
    
    try {
      switch (command) {
        case 'solve':
          await this.runProblemSolver(args);
          return; // Problem solver generates its own report
        case 'dead-code':
          await this.runDeadCodeAnalysis(args);
          break;
        case 'impact':
          await this.runImpactAnalysis(args);
          break;
        case 'context':
          await this.runContextAnalysis(args);
          break;
        case 'test-gaps':
          await this.runTestGapAnalysis(args);
          break;
        case 'diff':
          await this.runDiffAnalysis(args);
          break;
        case 'deps':
          await this.runDependencyAnalysis(args);
          break;
        case 'full-analysis':
          await this.runFullAnalysis(args);
          break;
        case 'help':
          this.showHelp();
          return;
        default:
          this.showUsage();
          return;
      }
      
      await this.generateUnifiedReport();
      
      const endTime = Date.now();
      this.results.metrics.totalTime = `${endTime - startTime}ms`;
      this.results.metrics.analysisTime = `${endTime - startTime}ms`;
      
      console.log(`\n✅ Analysis complete in ${this.results.metrics.totalTime}`);
      console.log(`📁 Results saved to: ${this.options.outputDir}`);
      console.log(`💡 To clean up: rm -rf ${this.options.outputDir}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  async runDeadCodeAnalysis(args) {
    console.log('🏹 Running Dead Code Hunter...');
    
    const excludeTests = args.includes('--no-tests');
    const hunter = new DeadCodeHunter({
      rootDir: this.options.rootDir,
      excludeTests
    });
    
    const results = await hunter.hunt();
    this.results.analyses.deadCode = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = hunter.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'dead-code-analysis.md'), report);
    
    console.log(`   Found ${results.deadFiles.length} dead files, ${results.duplicates.length} duplicates`);
  }

  async runProblemSolver(args) {
    const problemDescription = args.join(' ');
    if (!problemDescription) {
      console.error('❌ Problem solver requires a problem description');
      console.log('   Usage: npm run ai-toolkit solve "fix performance issue in SystemViewer"');
      process.exit(1);
    }
    
    this.ensureOutputDir();
    const solver = new ProblemSolver();
    await solver.solve(problemDescription);
  }

  async runImpactAnalysis(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ Impact analysis requires a target (file or symbol)');
      console.log('   Usage: npm run ai-toolkit impact "ComponentName"');
      process.exit(1);
    }
    
    console.log(`🔍 Running Refactor Impact Analysis for: ${target}`);
    this.results.target = target;
    
    const analyzer = new RefactorImpactAnalyzer({
      rootDir: this.options.rootDir
    });
    
    const results = await analyzer.analyzeImpact(target);
    this.results.analyses.impact = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = analyzer.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'impact-analysis.md'), report);
    
    console.log(`   Found ${results.directImpacts.length} direct impacts, ${results.cascadingImpacts.length} cascading`);
  }

  async runContextAnalysis(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ Context analysis requires a target');
      console.log('   Usage: npm run ai-toolkit context "ComponentName"');
      process.exit(1);
    }
    
    console.log(`🧬 Running Context Tracer for: ${target}`);
    this.results.target = target;
    
    const options = {};
    args.forEach(arg => {
      if (arg.startsWith('--flow=')) {
        options.flowDirection = arg.split('=')[1];
      } else if (arg.startsWith('--depth=')) {
        options.maxDepth = parseInt(arg.split('=')[1]);
      }
    });
    
    const tracer = new ContextTracer({
      rootDir: this.options.rootDir,
      ...options
    });
    
    const results = await tracer.traceContext(target, options);
    this.results.analyses.context = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = tracer.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'context-analysis.md'), report);
    
    console.log(`   Found ${results.dataFlow.upstream.length} upstream sources, ${results.dataFlow.downstream.length} downstream targets`);
  }

  async runTestGapAnalysis(args) {
    console.log('🧪 Running Test Gap Analyzer...');
    
    const options = {};
    args.forEach(arg => {
      if (arg.startsWith('--focus=')) {
        options.focus = arg.split('=')[1];
      }
    });
    
    const analyzer = new TestGapAnalyzer({
      rootDir: this.options.rootDir,
      ...options
    });
    
    const results = await analyzer.analyzeTestGaps();
    this.results.analyses.testGaps = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = analyzer.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'test-gap-analysis.md'), report);
    
    console.log(`   Found ${results.untestedFiles.length} untested files, ${results.criticalGaps.length} critical gaps`);
  }

  async runDiffAnalysis(args) {
    const comparison = args[0] || 'HEAD~1';
    console.log(`📈 Running Git Diff Analysis for: ${comparison}`);
    this.results.target = comparison;
    
    const analyzer = new GitDiffAnalyzer({
      rootDir: this.options.rootDir
    });
    
    // Parse comparison (e.g., "HEAD~1", "main..HEAD", "abc123..def456")
    const [from, to] = comparison.includes('..') ? 
      comparison.split('..') : 
      [comparison, 'HEAD'];
    
    const results = await analyzer.analyzeDiff(from, to);
    this.results.analyses.diff = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = analyzer.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'git-diff-analysis.md'), report);
    
    console.log(`   Found ${results.summary.filesChanged} changed files, ${results.summary.totalChanges} total changes`);
  }

  async runDependencyAnalysis(args) {
    console.log('📦 Running Dependency Analysis...');
    
    const options = {};
    args.forEach(arg => {
      if (arg.startsWith('--focus=')) {
        options.focus = arg.split('=')[1];
      }
    });
    
    const analyzer = new DependencyAnalyzer({
      rootDir: this.options.rootDir,
      ...options
    });
    
    const results = await analyzer.analyzeDependencies();
    this.results.analyses.dependencies = results;
    
    // Copy timing metrics
    if (results.metrics && results.metrics.analysisTime) {
      this.results.metrics.analysisTime = results.metrics.analysisTime;
    }
    
    // Save individual report
    const report = analyzer.generateReport();
    fs.writeFileSync(path.join(this.options.outputDir, 'dependency-analysis.md'), report);
    
    console.log(`   Found ${results.summary.unusedPackages} unused deps, ${results.summary.circularDependencies} circular deps`);
  }

  async runFullAnalysis(args) {
    console.log('🔬 Running Full Comprehensive Analysis...');
    
    // Run all analyses
    await this.runDeadCodeAnalysis(['--no-tests']); // Focus on production code for full analysis
    await this.runTestGapAnalysis(args);
    
    // If a target is provided, also run impact and context analysis
    const target = args.find(arg => !arg.startsWith('--'));
    if (target) {
      await this.runImpactAnalysis([target]);
      await this.runContextAnalysis([target]);
    }
    
    console.log('🎯 Generating comprehensive recommendations...');
  }

  async generateUnifiedReport() {
    const report = this.buildUnifiedReport();
    const reportPath = path.join(this.options.outputDir, 'ai-toolkit-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Also generate JSON for programmatic access
    const jsonPath = path.join(this.options.outputDir, 'ai-toolkit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n' + report);
  }

  buildUnifiedReport() {
    const { command, target, analyses, metrics } = this.results;
    let report = `# AI Workflow Toolkit Report 🚀\n\n`;
    
    report += `**Command**: \`${command}\`\n`;
    if (target) report += `**Target**: \`${target}\`\n`;
    report += `**Analysis Time**: ${metrics.totalTime || metrics.analysisTime || 'N/A'}\n\n`;
    
    // Executive Summary
    report += `## 📊 Executive Summary\n\n`;
    const summary = this.generateExecutiveSummary();
    report += summary + '\n\n';
    
    // Individual Analysis Results
    if (analyses.deadCode) {
      report += `## 🏹 Dead Code Analysis\n`;
      report += `- **Dead Files**: ${analyses.deadCode.deadFiles.length}\n`;
      report += `- **Suspicious Files**: ${analyses.deadCode.suspicious.length}\n`;
      report += `- **Legacy Systems**: ${analyses.deadCode.legacy.length}\n`;
      report += `- **Duplicates**: ${analyses.deadCode.duplicates.length}\n\n`;
    }
    
    if (analyses.impact) {
      report += `## 🔍 Refactor Impact Analysis\n`;
      report += `- **Risk Level**: ${analyses.impact.riskAssessment.level.toUpperCase()}\n`;
      report += `- **Direct Impacts**: ${analyses.impact.directImpacts.length} files\n`;
      report += `- **Cascading Impacts**: ${analyses.impact.cascadingImpacts.length} files\n`;
      report += `- **Test Coverage**: ${analyses.impact.testFiles.length} test files\n\n`;
    }
    
    if (analyses.context) {
      report += `## 🧬 Context Analysis\n`;
      report += `- **Upstream Sources**: ${analyses.context.dataFlow.upstream.length}\n`;
      report += `- **Downstream Targets**: ${analyses.context.dataFlow.downstream.length}\n`;
      report += `- **Component Parents**: ${analyses.context.componentTree.parents.length}\n`;
      report += `- **Component Children**: ${analyses.context.componentTree.children.length}\n\n`;
    }
    
    if (analyses.testGaps) {
      report += `## 🧪 Test Gap Analysis\n`;
      report += `- **Total Coverage**: ${analyses.testGaps.metrics.totalCoverage}\n`;
      report += `- **Untested Files**: ${analyses.testGaps.untestedFiles.length}\n`;
      report += `- **Critical Gaps**: ${analyses.testGaps.criticalGaps.length}\n`;
      report += `- **Missing Test Types**: ${analyses.testGaps.missingTestTypes.length}\n\n`;
    }
    
    if (analyses.diff) {
      report += `## 📈 Git Diff Analysis\n`;
      report += `- **Comparison**: ${analyses.diff.comparison}\n`;
      report += `- **Files Changed**: ${analyses.diff.summary.filesChanged}\n`;
      report += `- **Total Changes**: ${analyses.diff.summary.totalChanges}\n`;
      report += `- **Complexity**: ${analyses.diff.summary.complexity.toUpperCase()}\n`;
      report += `- **Critical Files**: ${analyses.diff.metrics.criticalFiles}\n\n`;
    }
    
    // Unified Recommendations
    report += `## 💡 Unified Recommendations\n\n`;
    const recommendations = this.generateUnifiedRecommendations();
    report += recommendations.map(rec => `- ${rec}`).join('\n') + '\n\n';
    
    // Quick Actions
    report += `## ⚡ Quick Actions\n\n`;
    const quickActions = this.generateQuickActions();
    report += quickActions.map(action => `${action.priority}: ${action.action}`).join('\n') + '\n\n';
    
    // File References
    report += `## 📁 Detailed Reports\n\n`;
    const files = fs.readdirSync(this.options.outputDir).filter(f => f.endsWith('.md') && f !== 'ai-toolkit-report.md');
    files.forEach(file => {
      report += `- [${file}](./${file})\n`;
    });
    
    report += `\n*Generated on ${new Date().toISOString()}*\n`;
    
    return report;
  }

  generateExecutiveSummary() {
    const { analyses } = this.results;
    const summary = [];
    
    // Overall health assessment
    let healthScore = 100;
    let issues = [];
    
    if (analyses.deadCode) {
      const deadFiles = analyses.deadCode.deadFiles.length;
      if (deadFiles > 20) {
        healthScore -= 20;
        issues.push(`${deadFiles} dead files detected`);
      } else if (deadFiles > 5) {
        healthScore -= 10;
      }
    }
    
    if (analyses.testGaps) {
      const coverage = parseInt(analyses.testGaps.metrics.totalCoverage);
      if (coverage < 50) {
        healthScore -= 30;
        issues.push(`Low test coverage (${coverage}%)`);
      } else if (coverage < 70) {
        healthScore -= 15;
      }
    }
    
    if (analyses.impact) {
      const riskLevel = analyses.impact.riskAssessment.level;
      if (riskLevel === 'high') {
        healthScore -= 20;
        issues.push('High refactoring risk detected');
      } else if (riskLevel === 'medium') {
        healthScore -= 10;
      }
    }
    
    // Health assessment
    summary.push(`**Codebase Health Score**: ${Math.max(0, healthScore)}/100`);
    
    if (issues.length > 0) {
      summary.push(`**Key Issues**: ${issues.join(', ')}`);
    } else {
      summary.push(`**Status**: Codebase appears healthy`);
    }
    
    // Specific insights
    if (analyses.deadCode && analyses.deadCode.deadFiles.length > 0) {
      const savings = analyses.deadCode.metrics.totalPotentialSavings;
      summary.push(`**Cleanup Potential**: ${savings} from removing dead code`);
    }
    
    if (analyses.context && analyses.context.propChains.length > 0) {
      summary.push(`**Architecture**: ${analyses.context.propChains.length} prop drilling patterns detected`);
    }
    
    return summary.join('\n');
  }

  generateUnifiedRecommendations() {
    const recommendations = [];
    const { analyses } = this.results;
    
    // Priority 1: Critical issues
    if (analyses.testGaps && analyses.testGaps.criticalGaps.length > 0) {
      recommendations.push(`🚨 **Critical**: Address ${analyses.testGaps.criticalGaps.length} critical test gaps immediately`);
    }
    
    if (analyses.impact && analyses.impact.riskAssessment.level === 'high') {
      recommendations.push(`🚨 **Critical**: High refactoring risk - proceed with extreme caution`);
    }
    
    // Priority 2: High impact improvements
    if (analyses.deadCode && analyses.deadCode.deadFiles.length >= 10) {
      recommendations.push(`🎯 **High Impact**: Remove ${analyses.deadCode.deadFiles.length} dead files to improve maintainability`);
    }
    
    if (analyses.testGaps && parseInt(analyses.testGaps.metrics.totalCoverage) < 60) {
      recommendations.push(`🎯 **High Impact**: Improve test coverage from ${analyses.testGaps.metrics.totalCoverage} to 70%+`);
    }
    
    // Priority 3: Architecture improvements
    if (analyses.context && analyses.context.propChains.length > 0) {
      recommendations.push(`🏗️ **Architecture**: Consider Context API or state management for ${analyses.context.propChains.length} prop drilling cases`);
    }
    
    if (analyses.deadCode && analyses.deadCode.legacy.length >= 5) {
      recommendations.push(`🏗️ **Architecture**: Plan deprecation strategy for ${analyses.deadCode.legacy.length} legacy systems`);
    }
    
    // Priority 4: Code quality
    if (analyses.deadCode && analyses.deadCode.duplicates.length > 0) {
      recommendations.push(`✨ **Quality**: Deduplicate ${analyses.deadCode.duplicates.length} identical files`);
    }
    
    if (analyses.testGaps && analyses.testGaps.missingTestTypes.length > 0) {
      recommendations.push(`✨ **Quality**: Add missing test types to ${analyses.testGaps.missingTestTypes.length} files`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ **Status**: No major issues detected - codebase appears well maintained');
    }
    
    return recommendations;
  }

  generateQuickActions() {
    const actions = [];
    const { analyses } = this.results;
    
    if (analyses.deadCode && analyses.deadCode.deadFiles.length > 0) {
      const topDead = analyses.deadCode.deadFiles.slice(0, 3);
      const fileNames = topDead.map(f => path.basename(f.path || f.file || f)).join(', ');
      actions.push({
        priority: '🟥 **Immediate**',
        action: `Delete confirmed dead files: ${fileNames}`
      });
    }
    
    if (analyses.testGaps && analyses.testGaps.criticalGaps.length > 0) {
      const topCritical = analyses.testGaps.criticalGaps.slice(0, 2);
      const fileNames = topCritical.map(g => path.basename(g.file)).join(', ');
      actions.push({
        priority: '🟥 **Immediate**',
        action: `Add tests for critical files: ${fileNames}`
      });
    }
    
    if (analyses.impact && analyses.impact.testFiles.length === 0) {
      actions.push({
        priority: '🟨 **Before Refactoring**',
        action: `Add test coverage for target before making changes`
      });
    }
    
    if (analyses.deadCode && analyses.deadCode.duplicates.length > 0) {
      actions.push({
        priority: '🟩 **When Time Permits**',
        action: `Resolve ${analyses.deadCode.duplicates.length} duplicate files`
      });
    }
    
    if (actions.length === 0) {
      actions.push({
        priority: '✅ **Status**',
        action: 'No immediate actions required'
      });
    }
    
    return actions;
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  showUsage() {
    console.log(`
🚀 AI Workflow Toolkit - Unified Code Analysis

Usage: npm run ai-toolkit <command> [options]

Commands:
  dead-code              Hunt for unused code and files
  impact <target>        Analyze refactoring impact for file/symbol
  context <target>       Trace data flow and relationships
  test-gaps              Find missing test coverage
  diff [comparison]      Analyze git changes between commits
  full-analysis [target] Run comprehensive analysis
  help                   Show detailed help

Examples:
  npm run ai-toolkit dead-code
  npm run ai-toolkit impact "ComponentName"
  npm run ai-toolkit context "handleSubmit" --flow=both
  npm run ai-toolkit test-gaps --focus=components
  npm run ai-toolkit diff HEAD~1
  npm run ai-toolkit diff main..HEAD
  npm run ai-toolkit full-analysis "MyComponent"

Options:
  --no-tests            Exclude test files from dead code analysis
  --flow=up|down|both   Direction for context tracing
  --depth=N             Maximum depth for analysis
  --focus=type          Focus test gap analysis on specific file type
  --json                Generate JSON output

For detailed help: npm run ai-toolkit help
`);
  }

  showHelp() {
    console.log(`
🚀 AI Workflow Toolkit - Complete Documentation

This toolkit provides AI-optimized code analysis tools designed to maximize
efficiency and minimize token usage for complex development tasks.

═══════════════════════════════════════════════════════════════════════════════

🔍 PROBLEM SOLVER (NEW!)
   Purpose: One-shot problem analysis with complete context
   Command: npm run ai-toolkit solve "problem description"
   
   What it provides:
   • Relevant files and relationships (20x token reduction)
   • Dependencies and impact analysis
   • Test coverage status
   • Risk assessment and suggested approach
   • Complete context in single command
   
   Examples:
   npm run ai-toolkit solve "fix performance issue in SystemViewer"
   npm run ai-toolkit solve "refactor UserProfile component"
   npm run ai-toolkit solve "add dark mode to settings"
   
   AI Value: Replaces 20+ tool calls with 1 comprehensive analysis

─────────────────────────────────────────────────────────────────────────────── 

🏹 DEAD CODE HUNTER
   Purpose: Find unused files, duplicates, and legacy code
   Command: npm run ai-toolkit dead-code [--no-tests]
   
   What it finds:
   • Files with no imports (safe to delete)
   • Suspicious files (need manual review)
   • Legacy systems with @deprecated markers
   • Duplicate files with identical content
   
   AI Value: Single command replaces 50+ manual searches

─────────────────────────────────────────────────────────────────────────────── 

🔍 REFACTOR IMPACT ANALYZER
   Purpose: Understand the blast radius of code changes
   Command: npm run ai-toolkit impact "ComponentName"
           npm run ai-toolkit impact "./path/to/file.ts"
   
   What it analyzes:
   • Direct impacts (files that import the target)
   • Cascading impacts (files affected by changes)
   • Test coverage for the target
   • Risk assessment and refactor plan
   
   AI Value: Complete refactoring context in one analysis

─────────────────────────────────────────────────────────────────────────────── 

🧬 CONTEXT TRACER
   Purpose: Understand data flow and component relationships
   Command: npm run ai-toolkit context "ComponentName" [options]
   
   Options:
   --flow=up      Trace where data comes FROM
   --flow=down    Trace where data goes TO
   --flow=both    Trace both directions (default)
   --depth=N      Maximum depth to trace (default: 4)
   
   What it traces:
   • Data flow (upstream sources, downstream targets)
   • Component relationships (parents, children)
   • State management patterns
   • Event handling chains
   • Prop drilling detection
   
   AI Value: Understand complex interactions without manual tracing

─────────────────────────────────────────────────────────────────────────────── 

🧪 TEST GAP ANALYZER
   Purpose: Find missing test coverage and testing blind spots
   Command: npm run ai-toolkit test-gaps [--focus=type]
   
   Focus types: components, utils, hooks, services, all
   
   What it finds:
   • Untested files with criticality scores
   • Missing test types (unit, integration, component)
   • Critical gaps (high-risk files without tests)
   • Test coverage by file type
   
   AI Value: Prioritized testing roadmap with impact assessment

─────────────────────────────────────────────────────────────────────────────── 

📈 GIT DIFF ANALYZER
   Purpose: Analyze code changes between commits efficiently
   Command: npm run ai-toolkit diff [comparison]
           npm run ai-toolkit diff HEAD~1
           npm run ai-toolkit diff main..HEAD
   
   What it analyzes:
   • Change complexity and file impact assessment
   • Critical, high, medium, and low impact changes
   • File operations (added, deleted, modified, renamed)
   • Change distribution by file type
   
   AI Value: Instant change review context without reading full diffs

─────────────────────────────────────────────────────────────────────────────── 

🔬 FULL ANALYSIS
   Purpose: Comprehensive codebase health assessment
   Command: npm run ai-toolkit full-analysis [target]
   
   Runs all analyses and provides:
   • Codebase health score
   • Unified recommendations
   • Priority action items
   • Cross-analysis insights
   
   AI Value: Complete picture for major refactoring or cleanup

═══════════════════════════════════════════════════════════════════════════════

🎯 OUTPUT STRUCTURE

All tools generate results in analysis-results/ folder:

• ai-toolkit-report.md      - Main unified report
• ai-toolkit-results.json   - Raw data for programmatic access
• dead-code-analysis.md     - Detailed dead code findings
• impact-analysis.md        - Detailed refactor impact
• context-analysis.md       - Detailed context tracing
• test-gap-analysis.md      - Detailed test gap analysis

Clean up: rm -rf analysis-results

═══════════════════════════════════════════════════════════════════════════════

🚀 AI WORKFLOW OPTIMIZATION

Token Efficiency:
• Before: 50+ tool calls, 25,000+ tokens
• After: 1 command, ~2,000 tokens
• 12x reduction in token usage

Perfect for AI tasks:
• Refactoring complex code
• Understanding unfamiliar codebases  
• Planning test strategies
• Code cleanup and maintenance
• Architecture analysis

═══════════════════════════════════════════════════════════════════════════════
`);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  if (!command) {
    const toolkit = new AIWorkflowToolkit();
    toolkit.showUsage();
    process.exit(1);
  }
  
  const toolkit = new AIWorkflowToolkit();
  toolkit.run(command, args);
}

module.exports = AIWorkflowToolkit;