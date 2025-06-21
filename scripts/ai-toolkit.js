#!/usr/bin/env node

/**
 * AI Workflow Toolkit 🚀
 * 
 * Unified interface for all AI-optimized code analysis tools.
 * Designed to maximize AI efficiency and minimize token usage.
 * 
 * Usage: see ai-toolkit/USAGE.md
 */

const fs = require('fs');
const path = require('path');

// Import our analysis tools
const DeadCodeHunter = require('./ai-toolkit/dead-code-hunter');
const RefactorImpactAnalyzer = require('./ai-toolkit/refactor-impact-analyzer');
const ContextTracer = require('./ai-toolkit/context-tracer');
const TestGapAnalyzer = require('./ai-toolkit/test-gap-analyzer');
const GitDiffAnalyzer = require('./ai-toolkit/git-diff-analyzer');
const DependencyAnalyzer = require('./ai-toolkit/dependency-analyzer');
const { CompatibilityAnalyzer } = require('./ai-toolkit/compatibility-analyzer');
const { TestOutputAnalyzer } = require('./ai-toolkit/test-output-analyzer');
const { ImportAnalyzer } = require('./ai-toolkit/import-analyzer');
const { ProjectOverview } = require('./ai-toolkit/project-overview');
const { CodeSearcher } = require('./ai-toolkit/code-searcher');
const SchemaExtractor = require('./ai-toolkit/schema-extractor');
const { LintSummaryAnalyzer } = require('./ai-toolkit/lint-summary-analyzer');
const { SymbolLister } = require('./ai-toolkit/symbol-lister');
const UsageFinder = require('./ai-toolkit/usage-finder');
const PatternAnalyzer = require('./ai-toolkit/pattern-analyzer');

// --- NEW CONSTANTS/HELPERS FOR TOKEN-EFFICIENT OUTPUT ------------------------------------
// Utility that prints compact JSON without spacing – drastically reduces tokens vs pretty print.
function printCompactJSON(obj) {
  console.log(JSON.stringify(obj));
}

// ------------------------------------------------------------------------------------------

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

    this.writeFiles = Boolean(options.writeFiles);
    this.verbose = Boolean(options.verbose);

    this.commands = {
      'imports': { handler: this.runImportAnalysis, description: 'Comprehensive import analysis and bulk fixing' },
      'code-search': { handler: this.runCodeSearch, description: 'Efficiently find files containing a keyword' },
      'overview': { handler: this.runProjectOverview, description: 'Generate a high-level, token-efficient project summary' },
      'schema': { handler: this.runSchemaExtractor, description: 'Extract a specific type/interface/class schema' },
      'analyze-error': { handler: this.runErrorAnalysis, description: 'Analyze specific build/runtime errors' },
      'check-compatibility': { handler: this.runCompatibilityCheck, description: 'Check for package version conflicts' },
      'test-summary': { handler: this.runTestSummary, description: 'Token-efficient test output analysis' },
      'lint-summary': { handler: this.runLintSummaryAnalysis, description: 'Generate a token-efficient summary of linting issues' },
      'list-symbols': { handler: this.runListSymbols, description: 'List all exported symbols from a file' },
      'find-usages': { handler: this.runFindUsages, description: 'Find all usages of a symbol' },
      'analyze-patterns': { handler: this.runPatternAnalysis, description: 'Find inconsistent patterns and implementations' },
      'dead-code': { handler: this.runDeadCodeAnalysis, description: 'Hunt for unused code and files', unifiedReport: true },
      'impact': { handler: this.runImpactAnalysis, description: 'Analyze refactoring impact', unifiedReport: true },
      'context': { handler: this.runContextAnalysis, description: 'Trace data flow and relationships' },
      'test-gaps': { handler: this.runTestGapAnalysis, description: 'Find missing test coverage', unifiedReport: true },
      'diff': { handler: this.runDiffAnalysis, description: 'Analyze git changes between commits', unifiedReport: true },
      'deps': { handler: this.runDependencyAnalysis, description: 'Analyze project dependencies', unifiedReport: true },
      'full-analysis': { handler: this.runFullAnalysis, description: 'Run comprehensive analysis', unifiedReport: true },
      'help': { handler: this.showHelp, description: 'Show detailed help' },
    };
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  async run(command, args = []) {
    // Detect CLI flags and strip from args so downstream logic is unaffected
    if (args.includes('--write-files')) {
      this.writeFiles = true;
      args = args.filter(a => a !== '--write-files');
    }
    if (args.includes('--verbose')) {
      this.verbose = true;
      args = args.filter(a => a !== '--verbose');
    }
    
    this.log(`🚀 AI Workflow Toolkit Starting...`);
    const startTime = Date.now();
    
    this.results.command = command;
    
    if (this.writeFiles) {
      this.ensureOutputDir();
    }
    
    try {
      const cmd = this.commands[command];

      if (cmd) {
        await cmd.handler.call(this, args);
        if (cmd.unifiedReport) {
          if (this.writeFiles) {
            await this.generateUnifiedReport();
          } else {
            this.printTokenEfficientSummary();
          }
        }
      } else {
        this.showUsage();
        return;
      }
      
      const endTime = Date.now();
      this.results.metrics.totalTime = `${endTime - startTime}ms`;
      this.results.metrics.analysisTime = `${endTime - startTime}ms`;
      
      this.log(`\n✅ Analysis complete in ${this.results.metrics.totalTime}`);
      if (this.writeFiles) {
        this.log(`📁 Results saved to: ${this.options.outputDir}`);
        this.log(`💡 To clean up: rm -rf ${this.options.outputDir}`);
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  async runDeadCodeAnalysis(args) {
    this.log('🏹 Running Dead Code Hunter...');
    
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
    if (this.writeFiles) {
      fs.writeFileSync(path.join(this.options.outputDir, 'dead-code-analysis.md'), report);
    }
    
    this.log(`   Found ${results.deadFiles.length} dead files, ${results.duplicates.length} duplicates`);
  }

  async runImportAnalysis(args) {
    const subCommand = args[0];
    
    if (!subCommand) {
      console.error('❌ Import analysis requires a subcommand');
      console.log('   Usage: npm run ai-toolkit imports <check|fix|batch|project> [options]');
      console.log('   Examples:');
      console.log('     npm run ai-toolkit imports check file.tsx');
      console.log('     npm run ai-toolkit imports fix "../old/path" "./new/path"');
      console.log('     npm run ai-toolkit imports batch file1.tsx file2.tsx');
      console.log('     npm run ai-toolkit imports project');
      process.exit(1);
    }

    if (this.writeFiles) {
      this.ensureOutputDir();
    }
    const analyzer = new ImportAnalyzer({ 
      rootDir: this.options.rootDir,
      writeFiles: this.writeFiles 
    });

    switch (subCommand) {
      case 'check':
        if (!args[1]) {
          console.error('❌ Import check requires a file path');
          process.exit(1);
        }
        console.log(`🔍 Checking imports in: ${args[1]}`);
        const analysis = await analyzer.analyzeFile(args[1]);
        console.log(JSON.stringify(analysis, null, 2));
        break;

      case 'fix':
        if (!args[1] || !args[2]) {
          console.error('❌ Import fix requires old and new patterns');
          console.log('   Usage: npm run ai-toolkit imports fix "old-pattern" "new-pattern" [--dry-run]');
          process.exit(1);
        }
        const dryRun = args.includes('--dry-run');
        this.log(`🔧 ${dryRun ? 'Preview' : 'Applying'} import fix: ${args[1]} → ${args[2]}`);
        const changes = await analyzer.fixImportPattern(args[1], args[2], dryRun);
        console.log(`\n📊 Summary: ${changes.length} files affected`);
        changes.slice(0, 5).forEach(change => {
          console.log(`\n📄 ${change.file}:`);
          change.changes.slice(0, 3).forEach(c => {
            console.log(`  Line ${c.line}: ${c.old} → ${c.new}`);
          });
        });
        break;

      case 'batch':
        if (args.length < 2) {
          console.error('❌ Batch analysis requires file paths');
          process.exit(1);
        }
        const files = args.slice(1);
        this.log(`📋 Batch analyzing ${files.length} files`);
        const batchResult = await analyzer.batchAnalyze(files);
        this.log(`\n📊 Batch Summary:`);
        this.log(`  Files: ${batchResult.summary.totalFiles}`);
        this.log(`  Imports: ${batchResult.summary.totalImports}`);
        this.log(`  Broken: ${batchResult.summary.brokenImports}`);
        break;

      case 'project':
        this.log('📦 Analyzing entire project for import issues');
        const projectResult = await analyzer.analyzeProject();
        const report = analyzer.generateReport();
        if (this.writeFiles) {
          const outputPath = path.join(this.options.outputDir, 'import-analysis-report.md');
          fs.writeFileSync(outputPath, report);
          this.log(`\n📄 Report saved to: ${outputPath}`);
        }
        this.log(`\n📊 Project Summary:`);
        this.log(`  Files: ${projectResult.summary.totalFiles}`);
        this.log(`  Imports: ${projectResult.summary.totalImports}`);
        this.log(`  Broken: ${projectResult.summary.brokenImports}`);
        this.log(`  Fixable: ${projectResult.summary.fixableImports}`);
        break;

      default:
        console.error(`❌ Unknown import subcommand: ${subCommand}`);
        process.exit(1);
    }
  }

  async runImpactAnalysis(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ Impact analysis requires a target (file or symbol)');
      console.log('   Usage: npm run ai-toolkit impact "ComponentName"');
      process.exit(1);
    }
    
    this.log(`🔍 Running Refactor Impact Analysis for: ${target}`);
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
    if (this.writeFiles) {
      fs.writeFileSync(path.join(this.options.outputDir, 'impact-analysis.md'), report);
    }
    
    this.log(`   Found ${results.directImpacts.length} direct impacts, ${results.cascadingImpacts.length} cascading`);
  }

  async runContextAnalysis(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ Context analysis requires a target');
      console.log('   Usage: npm run ai-toolkit context "ComponentName"');
      process.exit(1);
    }
    
    this.log(`🧬 Running Context Tracer for: ${target}`);
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
    
    await tracer.traceContext(target);
    // Instead of a generic summary, generate and print the detailed report.
    const report = tracer.generateReport();
    console.log(report);
  }

  async runTestGapAnalysis(args) {
    this.log('🧪 Running Test Gap Analyzer...');
    
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
    if (this.writeFiles) {
      fs.writeFileSync(path.join(this.options.outputDir, 'test-gap-analysis.md'), report);
    }
    
    this.log(`   Found ${results.untestedFiles.length} untested files, ${results.criticalGaps.length} critical gaps`);
  }

  async runDiffAnalysis(args) {
    const comparison = args[0] || 'HEAD~1';
    this.log(`📈 Running Git Diff Analysis for: ${comparison}`);
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
    if (this.writeFiles) {
      fs.writeFileSync(path.join(this.options.outputDir, 'git-diff-analysis.md'), report);
    }
    
    this.log(`   Found ${results.summary.filesChanged} changed files, ${results.summary.totalChanges} total changes`);
  }

  async runDependencyAnalysis(args) {
    this.log('📦 Running Dependency Analysis...');
    
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
    if (this.writeFiles) {
      fs.writeFileSync(path.join(this.options.outputDir, 'dependency-analysis.md'), report);
    }
    
    this.log(`   Found ${results.summary.unusedPackages} unused deps, ${results.summary.circularDependencies} circular deps`);
  }

  async runProjectOverview(args) {
    this.log('📊 Running Project Overview...');
    const overview = new ProjectOverview({ rootDir: this.options.rootDir });
    await overview.generateSummary();
  }

  async runLintSummaryAnalysis(args) {
    this.log('🧪 Running Lint Summary Analysis...');
    const analyzer = new LintSummaryAnalyzer({ 
      rootDir: this.options.rootDir, 
      verbose: this.verbose 
    });
    await analyzer.analyze();
  }

  async runListSymbols(args) {
    const filePath = args[0];
    if (!filePath) {
      console.error('❌ list-symbols requires a file path.');
      console.log('   Usage: npm run ai-toolkit list-symbols <file-path>');
      process.exit(1);
    }
    this.log(`🔎 Listing symbols for: ${filePath}`);
    const lister = new SymbolLister({ rootDir: this.options.rootDir, verbose: this.verbose });
    await lister.listSymbols(filePath);
  }

  async runFullAnalysis(args) {
    this.log('🔬 Running Full Comprehensive Analysis...');
    
    // Run all analyses
    await this.runDeadCodeAnalysis(['--no-tests']); // Focus on production code for full analysis
    await this.runTestGapAnalysis(args);
    
    // If a target is provided, also run impact and context analysis
    const target = args.find(arg => !arg.startsWith('--'));
    if (target) {
      await this.runImpactAnalysis([target]);
      await this.runContextAnalysis([target]);
    }
    
    this.log('🎯 Generating comprehensive recommendations...');
  }

  async generateUnifiedReport() {
    const report = this.buildUnifiedReport();
    const reportPath = path.join(this.options.outputDir, 'ai-toolkit-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Also generate JSON for programmatic access
    const jsonPath = path.join(this.options.outputDir, 'ai-toolkit-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    this.log('\n' + report);
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
    
    // Overall health assessment (now focusing on issues directly)
    let issues = [];
    
    if (analyses.deadCode) {
      const deadFiles = analyses.deadCode.deadFiles.length;
      if (deadFiles > 0) {
        issues.push(`${deadFiles} dead files detected`);
      }
    }
    
    if (analyses.testGaps) {
      const coverage = parseInt(analyses.testGaps.metrics.totalCoverage);
      if (coverage < 70) {
        issues.push(`Low test coverage (${coverage}%)`);
      }
    }
    
    if (analyses.impact) {
      const riskLevel = analyses.impact.riskAssessment.level;
      if (riskLevel === 'high' || riskLevel === 'medium') {
        issues.push(`${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} refactoring risk detected`);
      }
    }
    
    if (issues.length > 0) {
      summary.push(`**Key Issues**: ${issues.join(', ')}`);
    } else {
      summary.push(`**Status**: No critical issues detected`);
    }
    
    // Specific insights
    if (analyses.deadCode && analyses.deadCode.deadFiles.length > 0) {
      summary.push(`**Dead Code Impact**: Removing ${analyses.deadCode.deadFiles.length} dead files can significantly improve codebase clarity, reduce cognitive load, and potentially decrease build times and bundle sizes.`);
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
      recommendations.push('No major issues detected');
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
`);

    console.log('Commands:');
    const commandKeys = Object.keys(this.commands);
    // Find the longest command key for alignment
    const maxLength = Math.max(...commandKeys.map(key => key.length));
    
    commandKeys.forEach(key => {
        const command = this.commands[key];
        const paddedKey = key.padEnd(maxLength + 2, ' ');
        console.log(`  ${paddedKey}${command.description}`);
    });

    console.log(`
Examples:
  npm run ai-toolkit overview
  npm run ai-toolkit code-search "myFunction"
  npm run ai-toolkit schema "engine/types/engine.ts:EngineConfig"
  npm run ai-toolkit imports project
  npm run ai-toolkit analyze-error "BatchedMesh is not exported from 'three'"
  npm run ai-toolkit check-compatibility
  npm run ai-toolkit test-summary
  npm run ai-toolkit test-summary --failures-only
  npm run ai-toolkit lint-summary
  npm run ai-toolkit list-symbols "engine/core/engine-state.ts"
  npm run ai-toolkit dead-code
  npm run ai-toolkit impact "ComponentName"
  npm run ai-toolkit context "handleSubmit" --flow=both
  npm run ai-toolkit test-gaps --focus=components
  npm run ai-toolkit diff HEAD~1
  npm run ai-toolkit diff main..HEAD
  npm run ai-toolkit deps
  npm run ai-toolkit full-analysis "MyComponent"

Options:
  --no-tests            Exclude test files from dead code analysis
  --flow=up|down|both   Direction for context tracing
  --depth=N             Maximum depth for analysis
  --focus=type          Focus test gap analysis on specific file type
  --timeout=N           Command timeout in seconds (default: varies by command)
  --write-files         Persist detailed markdown/JSON reports (default: disabled)
  --verbose             Show verbose status messages during execution
  --json                Generate JSON output (legacy)

For detailed help: npm run ai-toolkit help
`);
  }

  showHelp() {
    try {
      const helpContent = fs.readFileSync(path.join(__dirname, 'ai-toolkit', 'USAGE.md'), 'utf8');
      console.log(helpContent);
    } catch (error) {
      console.error('❌ Could not load help documentation.', error);
      console.log('Please ensure "scripts/ai-toolkit/USAGE.md" exists.');
    }
  }

  printTokenEfficientSummary() {
    const executiveSummary = this.generateExecutiveSummary();
    const recommendations = this.generateUnifiedRecommendations();
    const quickActions = this.generateQuickActions();
    printCompactJSON({ executiveSummary, recommendations, quickActions });
  }

  async runCodeSearch(args) {
    const keyword = args[0];
    if (!keyword) {
      console.error('❌ Code search requires a keyword.');
      console.log('   Usage: npm run ai-toolkit code-search "myFunction"');
      process.exit(1);
    }
    const searcher = new CodeSearcher({ rootDir: this.options.rootDir, verbose: this.verbose });
    await searcher.search(keyword);
  }

  async runSchemaExtractor(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ Schema extractor requires a target. Use format: <file-path>:<symbol-name>');
      console.log('   Usage: npm run ai-toolkit schema "engine/types/engine.ts:EngineConfig"');
      process.exit(1);
    }
    this.log(`🔎 Extracting schema for: ${target}`);
    const extractor = new SchemaExtractor({ rootDir: this.options.rootDir, verbose: this.verbose });
    await extractor.extractSchema(target);
  }

  async runErrorAnalysis(args) {
    const errorMessage = args[0];
    if (!errorMessage) {
      console.error('❌ Error analysis requires an error message');
      console.log('   Usage: npm run ai-toolkit analyze-error "BatchedMesh is not exported from \'three\'"');
      process.exit(1);
    }
    
    this.log(`🔍 Analyzing error: ${errorMessage}`);
    const analyzer = new CompatibilityAnalyzer({ 
      rootDir: this.options.rootDir, 
      verbose: this.verbose 
    });
    
    await analyzer.analyzeError(errorMessage);
  }

  async runCompatibilityCheck(args) {
    this.log('🔍 Checking package compatibility...');
    const analyzer = new CompatibilityAnalyzer({ 
      rootDir: this.options.rootDir, 
      verbose: this.verbose 
    });
    
    await analyzer.checkCompatibility();
  }

  async runTestSummary(args) {
    this.log('🧪 Running test summary analysis...');
    const analyzer = new TestOutputAnalyzer({ 
      rootDir: this.options.rootDir, 
      verbose: this.verbose,
      failuresOnly: args.includes('--failures-only')
    });
    
    // Check if we should parse a log file
    const logFile = args.find(arg => arg.startsWith('--log='))?.split('=')[1];
    if (logFile) {
      await analyzer.analyzeLogFile(logFile);
    } else {
      // Run tests and analyze output
      const testCommand = args.find(arg => arg.startsWith('--command='))?.split('=')[1] || 'npm test --run';
      const timeout = parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '120');
      await analyzer.runTestAnalysis(testCommand, timeout);
    }
  }

  async runFindUsages(args) {
    const target = args[0];
    if (!target) {
      console.error('❌ find-usages requires a target in the format "file:symbol"');
      process.exit(1);
    }
    this.log(`🔎 Finding usages for: ${target}`);
    const finder = new UsageFinder({ rootDir: this.options.rootDir });
    const results = finder.findUsages(target);
    printCompactJSON(results);
  }

  async runPatternAnalysis(args) {
    this.log('🔬 Analyzing for architectural pattern inconsistencies...');
    
    // This is the targeted logic from our purpose-built script.
    // It's designed to find the exact kind of issue we faced.
    const targetDir = path.join(this.options.rootDir, 'engine/renderers/geometry-renderers');
    const filePattern = /-renderer\.tsx$/;

    // We need to define findInDir and other helpers here or import them. For now, let's assume they are available.
    // To make this runnable, I'll need to create a temporary file with the simple analyzer logic.
    
    // Since I cannot create a new file, I will have to add the logic directly here.
    const readFile = require('util').promisify(require('fs').readFile);
    const { findInDir } = require('./ai-toolkit/utils'); // This file exists.

    const IMPORT_REGEX = /import\s+.*\s+from\s+['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;

    async function analyzeFileImports(filePath) {
        try {
            const content = await readFile(filePath, 'utf8');
            const imports = new Set();
            let match;
            while ((match = IMPORT_REGEX.exec(content)) !== null) {
                imports.add(match[1]);
            }
            return imports;
        } catch (error) {
            return new Set();
        }
    }

    function classifyImports(imports) {
        const patterns = { enhanced: new Set(), standard: new Set() };
        for (const imp of imports) {
            if (imp.includes('enhanced')) patterns.enhanced.add(imp);
            else if (imp.includes('material')) patterns.standard.add(imp);
        }
        return patterns;
    }

    const files = await findInDir(targetDir, filePattern);
    const fileAnalyses = await Promise.all(files.map(async file => {
        const imports = await analyzeFileImports(file);
        return { file, patterns: classifyImports(imports) };
    }));

    const enhancedFiles = fileAnalyses.filter(f => f.patterns.enhanced.size > 0);
    const standardFiles = fileAnalyses.filter(f => f.patterns.standard.size > 0 && f.patterns.enhanced.size === 0);

    let inconsistencies = [];
    // If we have a mix of some files using enhanced materials and others using standard ones, we have a pattern drift.
    if (enhancedFiles.length > 0 && standardFiles.length > 0) {
        inconsistencies = standardFiles.map(({ file, patterns }) => ({
            file: path.relative(this.options.rootDir, file),
            type: 'DependencyOutlier',
            severity: 'High',
            message: `This component appears to be using an outdated standard material, while other components in this directory have been updated to an 'enhanced' material pattern.`,
            details: { used: [...patterns.standard] },
            recommendation: 'Review this file and consider upgrading its dependencies to align with the current architecture.'
        }));
    }

    if (inconsistencies.length === 0) {
        printCompactJSON({
            summary: "✅ No major architectural pattern inconsistencies were detected among peer components.",
            inconsistencies: []
        });
    } else {
        printCompactJSON({
            summary: `⚠️ Found ${inconsistencies.length} component(s) that deviate from the dominant architectural pattern.`,
            inconsistencies
        });
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  const toolkit = new AIWorkflowToolkit();

  if (!command || !toolkit.commands[command]) {
    toolkit.showUsage();
    process.exit(1);
  }

  toolkit.run(command, args);
}