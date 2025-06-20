#!/usr/bin/env node

/**
 * Parallel Agent Coordinator 🤖
 * 
 * Orchestrates multiple AI analysis agents to build comprehensive project understanding.
 * Prevents context drift by maintaining architectural awareness across sessions.
 * 
 * Usage: npm run coordinate-agents
 *        npm run coordinate-agents --quick
 *        npm run coordinate-agents --deep
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import all our analysis tools
const DeadCodeHunter = require('./dead-code-hunter');
const RefactorImpactAnalyzer = require('./refactor-impact-analyzer');
const ContextTracer = require('./context-tracer');
const TestGapAnalyzer = require('./test-gap-analyzer');
const GitDiffAnalyzer = require('./git-diff-analyzer');
const DependencyAnalyzer = require('./dependency-analyzer');
const ProjectIntelligence = require('./project-intelligence');

class AgentCoordinator {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      outputDir: options.outputDir || path.join(process.cwd(), 'analysis-results'),
      mode: options.mode || 'comprehensive', // 'quick', 'comprehensive', 'deep'
      preserveContext: options.preserveContext !== false,
      ...options
    };
    
    this.results = {
      coordination: {
        startTime: Date.now(),
        endTime: null,
        totalTime: null,
        agentsRun: 0,
        successfulAgents: 0,
        failedAgents: 0
      },
      intelligence: null,
      analyses: {},
      synthesis: {
        architecturalHealth: 0,
        criticalIssues: [],
        recommendations: [],
        contextualInsights: []
      },
      agentReports: {}
    };
    
    this.agents = this.initializeAgents();
  }

  initializeAgents() {
    return {
      // Always run these for context preservation
      core: [
        {
          name: 'project-intelligence',
          agent: ProjectIntelligence,
          method: 'buildIntelligence',
          args: ['update'],
          priority: 1,
          essential: true
        },
        {
          name: 'dependency-analysis', 
          agent: DependencyAnalyzer,
          method: 'analyzeDependencies',
          args: [],
          priority: 2,
          essential: true
        }
      ],
      
      // Quick analysis agents
      quick: [
        {
          name: 'dead-code',
          agent: DeadCodeHunter,
          method: 'hunt',
          args: [],
          priority: 3,
          essential: false
        },
        {
          name: 'test-gaps',
          agent: TestGapAnalyzer,
          method: 'analyzeTestGaps',
          args: [],
          priority: 4,
          essential: false
        }
      ],
      
      // Deep analysis agents (run when time permits)
      deep: [
        {
          name: 'git-diff',
          agent: GitDiffAnalyzer,
          method: 'analyzeDiff',
          args: ['HEAD~3', 'HEAD'], // Last 3 commits
          priority: 5,
          essential: false
        }
      ]
    };
  }

  /**
   * Coordinate multiple agents to build comprehensive understanding
   */
  async coordinateAgents() {
    console.log('🤖 Coordinating Analysis Agents...');
    console.log(`📋 Mode: ${this.options.mode.toUpperCase()}`);
    
    this.ensureOutputDir();
    
    try {
      // Step 1: Always build/update project intelligence first
      await this.runCoreAgents();
      
      // Step 2: Run analysis agents based on mode
      await this.runAnalysisAgents();
      
      // Step 3: Synthesize results
      await this.synthesizeResults();
      
      // Step 4: Generate coordinator report
      await this.generateCoordinatorReport();
      
      this.results.coordination.endTime = Date.now();
      this.results.coordination.totalTime = this.results.coordination.endTime - this.results.coordination.startTime;
      
      console.log(`✅ Agent coordination complete in ${this.results.coordination.totalTime}ms`);
      console.log(`🎯 ${this.results.coordination.successfulAgents}/${this.results.coordination.agentsRun} agents successful`);
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Agent coordination failed:', error);
      throw error;
    }
  }

  async runCoreAgents() {
    console.log('🧠 Running Core Intelligence Agents...');
    
    for (const agentConfig of this.agents.core) {
      await this.runAgent(agentConfig);
    }
  }

  async runAnalysisAgents() {
    const agentsToRun = [...this.agents.quick];
    
    if (this.options.mode === 'deep' || this.options.mode === 'comprehensive') {
      agentsToRun.push(...this.agents.deep);
    }
    
    console.log(`🔍 Running ${agentsToRun.length} Analysis Agents...`);
    
    // Run agents in parallel for efficiency
    const agentPromises = agentsToRun.map(agentConfig => 
      this.runAgent(agentConfig).catch(error => {
        console.warn(`⚠️ Agent ${agentConfig.name} failed:`, error.message);
        return null;
      })
    );
    
    await Promise.allSettled(agentPromises);
  }

  async runAgent(agentConfig) {
    const startTime = Date.now();
    this.results.coordination.agentsRun++;
    
    try {
      console.log(`  🔧 Running ${agentConfig.name}...`);
      
      const agent = new agentConfig.agent({
        rootDir: this.options.rootDir
      });
      
      const result = await agent[agentConfig.method](...agentConfig.args);
      
      this.results.analyses[agentConfig.name] = result;
      this.results.coordination.successfulAgents++;
      
      // Save individual report if agent supports it
      if (agent.generateReport) {
        const report = agent.generateReport();
        const reportPath = path.join(this.options.outputDir, `${agentConfig.name}-report.md`);
        fs.writeFileSync(reportPath, report);
        this.results.agentReports[agentConfig.name] = reportPath;
      }
      
      const endTime = Date.now();
      console.log(`    ✅ ${agentConfig.name} completed in ${endTime - startTime}ms`);
      
      return result;
      
    } catch (error) {
      this.results.coordination.failedAgents++;
      if (agentConfig.essential) {
        throw new Error(`Essential agent ${agentConfig.name} failed: ${error.message}`);
      }
      console.warn(`    ⚠️ ${agentConfig.name} failed: ${error.message}`);
      return null;
    }
  }

  async synthesizeResults() {
    console.log('🧠 Synthesizing Agent Results...');
    
    const synthesis = {
      architecturalHealth: 100,
      criticalIssues: [],
      recommendations: [],
      contextualInsights: []
    };
    
    // Synthesize from project intelligence
    if (this.results.analyses['project-intelligence']) {
      const intel = this.results.analyses['project-intelligence'];
      synthesis.architecturalHealth = intel.metrics.architecturalHealth;
      
      synthesis.contextualInsights.push({
        type: 'architecture',
        insight: `Project follows ${intel.context.architecturalStyle} with ${intel.architecture.coreComponents.length} core components`,
        impact: 'context-preservation'
      });
      
      if (intel.legacy.systems.length > 0) {
        synthesis.criticalIssues.push({
          type: 'legacy-systems',
          count: intel.legacy.systems.length,
          impact: 'high',
          description: 'Legacy systems detected that may cause architectural drift'
        });
      }
    }
    
    // Synthesize from dependency analysis
    if (this.results.analyses['dependency-analysis']) {
      const deps = this.results.analyses['dependency-analysis'];
      
      if (deps.summary.unusedPackages > 10) {
        synthesis.criticalIssues.push({
          type: 'dependency-bloat',
          count: deps.summary.unusedPackages,
          impact: 'medium',
          description: 'High number of unused dependencies'
        });
      }
      
      if (deps.summary.circularDependencies > 0) {
        synthesis.criticalIssues.push({
          type: 'circular-dependencies',
          count: deps.summary.circularDependencies,
          impact: 'high',
          description: 'Circular dependencies can cause architectural issues'
        });
      }
    }
    
    // Synthesize from dead code analysis
    if (this.results.analyses['dead-code']) {
      const deadCode = this.results.analyses['dead-code'];
      
      if (deadCode.deadFiles.length > 20) {
        synthesis.criticalIssues.push({
          type: 'code-bloat',
          count: deadCode.deadFiles.length,
          impact: 'medium',
          description: 'Significant dead code detected'
        });
      }
    }
    
    // Synthesize from test gaps
    if (this.results.analyses['test-gaps']) {
      const testGaps = this.results.analyses['test-gaps'];
      const coverage = parseInt(testGaps.metrics.totalCoverage);
      
      if (coverage < 50) {
        synthesis.criticalIssues.push({
          type: 'test-coverage',
          value: coverage,
          impact: 'high',
          description: 'Low test coverage increases risk of regressions'
        });
      }
    }
    
    // Generate recommendations based on synthesis
    synthesis.recommendations = this.generateSynthesizedRecommendations(synthesis);
    
    // Adjust health score based on issues
    synthesis.architecturalHealth = this.calculateOverallHealth(synthesis);
    
    this.results.synthesis = synthesis;
  }

  generateSynthesizedRecommendations(synthesis) {
    const recommendations = [];
    
    // Context preservation recommendations
    recommendations.push({
      priority: 'critical',
      category: 'context-preservation',
      action: 'Always run `npm run coordinate-agents` before major changes',
      reason: 'Maintains architectural awareness and prevents context drift'
    });
    
    // Issue-based recommendations
    synthesis.criticalIssues.forEach(issue => {
      if (issue.type === 'legacy-systems') {
        recommendations.push({
          priority: 'high',
          category: 'architecture',
          action: `Plan migration for ${issue.count} legacy systems`,
          reason: 'Legacy systems increase maintenance burden and architectural drift'
        });
      }
      
      if (issue.type === 'dependency-bloat') {
        recommendations.push({
          priority: 'medium',
          category: 'dependencies',
          action: `Remove ${issue.count} unused dependencies`,
          reason: 'Reduces bundle size and security surface'
        });
      }
      
      if (issue.type === 'test-coverage') {
        recommendations.push({
          priority: 'high',
          category: 'quality',
          action: `Increase test coverage from ${issue.value}% to 70%+`,
          reason: 'Prevents regressions during refactoring'
        });
      }
    });
    
    return recommendations;
  }

  calculateOverallHealth(synthesis) {
    let health = synthesis.architecturalHealth;
    
    // Deduct for critical issues
    synthesis.criticalIssues.forEach(issue => {
      if (issue.impact === 'high') health -= 15;
      else if (issue.impact === 'medium') health -= 8;
      else health -= 3;
    });
    
    return Math.max(0, Math.min(100, health));
  }

  async generateCoordinatorReport() {
    const { coordination, synthesis, agentReports } = this.results;
    
    const report = `# Agent Coordination Report 🤖

**Coordination Time**: ${coordination.totalTime}ms
**Agents Run**: ${coordination.agentsRun} (${coordination.successfulAgents} successful, ${coordination.failedAgents} failed)
**Mode**: ${this.options.mode.toUpperCase()}

## 🎯 Architectural Health: ${synthesis.architecturalHealth}/100

${synthesis.architecturalHealth >= 80 ? '✅ **HEALTHY** - Architecture is well-maintained' :
  synthesis.architecturalHealth >= 60 ? '⚠️ **NEEDS ATTENTION** - Some architectural issues detected' :
  '🚨 **CRITICAL** - Significant architectural problems need immediate attention'}

## 🧠 Contextual Insights

${synthesis.contextualInsights.map(insight => 
  `- **${insight.type}**: ${insight.insight}`
).join('\n')}

## 🚨 Critical Issues (${synthesis.criticalIssues.length})

${synthesis.criticalIssues.length === 0 ? 'No critical issues detected!' : 
  synthesis.criticalIssues.map(issue => 
    `- **${issue.type}** (${issue.impact.toUpperCase()}): ${issue.description}${issue.count ? ` (${issue.count})` : ''}`
  ).join('\n')}

## 💡 Synthesized Recommendations

${synthesis.recommendations.map(rec => 
  `- **${rec.priority.toUpperCase()}** [${rec.category}]: ${rec.action}
  *${rec.reason}*`
).join('\n\n')}

## 📊 Agent Results

${Object.entries(agentReports).map(([agent, reportPath]) => 
  `- [${agent}-report.md](./${path.basename(reportPath)})`
).join('\n')}

## 🎯 AI Development Workflow

### Before Starting Work
1. **Check AI-CONTEXT.md** for quick architectural overview
2. **Review this coordination report** for current health status
3. **Run specific impact analysis** if making significant changes

### During Development  
1. **Follow established patterns** identified in project intelligence
2. **Avoid creating duplicate implementations** 
3. **Reference core components** when building new features
4. **Update deprecation markers** for legacy code

### After Significant Changes
1. **Run coordination again**: \`npm run coordinate-agents --quick\`
2. **Update project intelligence**: \`npm run project-intel --update\`
3. **Validate architectural health** hasn't degraded
4. **Document new patterns** if introduced

## 🚀 Next Steps

${synthesis.architecturalHealth < 60 ? 
  '🚨 **IMMEDIATE**: Address critical issues before continuing development' :
  synthesis.criticalIssues.length > 0 ?
    '⚠️ **SHORT-TERM**: Plan to address identified issues in next sprint' :
    '✅ **MAINTAIN**: Continue current practices and monitor health'}

*This report provides comprehensive project understanding to prevent context drift.*
*Generated on ${new Date().toISOString()}*
`;

    const reportPath = path.join(this.options.outputDir, 'agent-coordination-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Coordination report saved to: ${reportPath}`);
    
    // Also create a concise summary for quick reference
    await this.generateQuickSummary();
  }

  async generateQuickSummary() {
    const summary = `# Quick Project Status 🚀

**Health**: ${this.results.synthesis.architecturalHealth}/100
**Issues**: ${this.results.synthesis.criticalIssues.length} critical
**Last Scan**: ${new Date().toLocaleString()}

## 🎯 Top Priorities
${this.results.synthesis.recommendations.slice(0, 3).map(rec => 
  `- ${rec.action}`
).join('\n')}

*Run \`npm run coordinate-agents\` for full analysis*
`;

    const summaryPath = path.join(this.options.outputDir, 'project-status.md');
    fs.writeFileSync(summaryPath, summary);
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const mode = args.includes('--quick') ? 'quick' :
               args.includes('--deep') ? 'deep' : 'comprehensive';
  
  const coordinator = new AgentCoordinator({ mode });
  
  coordinator.coordinateAgents().then(() => {
    console.log('\n🎉 Agent coordination complete!');
    console.log('📄 Check analysis-results/agent-coordination-report.md for full context');
    console.log('🎯 Check analysis-results/project-status.md for quick status');
  }).catch(error => {
    console.error('❌ Coordination failed:', error);
    process.exit(1);
  });
}

module.exports = AgentCoordinator;