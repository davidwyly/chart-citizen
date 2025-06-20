#!/usr/bin/env node

/**
 * Git Diff Analyzer 📈
 * 
 * AI-optimized tool for analyzing code changes against previous commits.
 * Essential for understanding change impact and planning reviews.
 * 
 * Usage: npm run analyze-diff -- HEAD~1
 *        npm run analyze-diff -- main..HEAD
 *        npm run analyze-diff -- abc123..def456
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GitDiffAnalyzer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      ...options
    };
    
    this.results = {
      comparison: null,
      summary: {
        totalChanges: 0,
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0,
        complexity: 'low'
      },
      changes: {
        modified: [],
        added: [],
        deleted: [],
        renamed: []
      },
      impact: {
        critical: [],
        high: [],
        medium: [],
        low: []
      },
      recommendations: [],
      metrics: {}
    };
  }

  /**
   * Analyze changes between commits
   */
  async analyzeDiff(fromCommit = 'HEAD~1', toCommit = 'HEAD') {
    console.log(`📈 Analyzing changes from ${fromCommit} to ${toCommit}...`);
    const startTime = Date.now();
    
    this.results.comparison = `${fromCommit}...${toCommit}`;
    
    try {
      // Get basic diff stats
      await this.getDiffStats(fromCommit, toCommit);
      
      // Get file changes
      await this.getFileChanges(fromCommit, toCommit);
      
      // Analyze change impact
      this.analyzeImpact();
      
      // Generate recommendations
      this.generateRecommendations();
      
      this.calculateMetrics();
      
      const endTime = Date.now();
      this.results.metrics.analysisTime = `${endTime - startTime}ms`;
      
      return this.results;
      
    } catch (error) {
      console.error(`❌ Git analysis failed: ${error.message}`);
      throw error;
    }
  }

  async getDiffStats(from, to) {
    try {
      const command = `git diff --stat ${from} ${to}`;
      const output = execSync(command, { 
        cwd: this.options.rootDir, 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Parse git diff --stat output
      const lines = output.trim().split('\n');
      if (lines.length === 0) {
        this.results.summary.totalChanges = 0;
        return;
      }
      
      // Last line contains summary like: "5 files changed, 123 insertions(+), 45 deletions(-)"
      const summaryLine = lines[lines.length - 1];
      
      const fileMatch = summaryLine.match(/(\d+) files? changed/);
      const addMatch = summaryLine.match(/(\d+) insertions?\(\+\)/);
      const deleteMatch = summaryLine.match(/(\d+) deletions?\(-\)/);
      
      this.results.summary.filesChanged = fileMatch ? parseInt(fileMatch[1]) : 0;
      this.results.summary.linesAdded = addMatch ? parseInt(addMatch[1]) : 0;
      this.results.summary.linesDeleted = deleteMatch ? parseInt(deleteMatch[1]) : 0;
      this.results.summary.totalChanges = this.results.summary.linesAdded + this.results.summary.linesDeleted;
      
      // Determine complexity
      const totalChanges = this.results.summary.totalChanges;
      if (totalChanges > 500) this.results.summary.complexity = 'very-high';
      else if (totalChanges > 200) this.results.summary.complexity = 'high';
      else if (totalChanges > 50) this.results.summary.complexity = 'medium';
      else this.results.summary.complexity = 'low';
      
    } catch (error) {
      // Fallback for empty diffs or git errors
      this.results.summary.totalChanges = 0;
    }
  }

  async getFileChanges(from, to) {
    try {
      // Get name-status to understand file operations
      const nameStatusCmd = `git diff --name-status ${from} ${to}`;
      const nameStatus = execSync(nameStatusCmd, { 
        cwd: this.options.rootDir, 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const lines = nameStatus.trim().split('\n').filter(line => line);
      
      for (const line of lines) {
        const [status, ...files] = line.split('\t');
        
        if (status === 'A') {
          // Added file
          this.results.changes.added.push({
            file: files[0],
            type: this.getFileType(files[0]),
            reason: 'New file added'
          });
        } else if (status === 'D') {
          // Deleted file  
          this.results.changes.deleted.push({
            file: files[0],
            type: this.getFileType(files[0]),
            reason: 'File deleted'
          });
        } else if (status.startsWith('R')) {
          // Renamed file
          this.results.changes.renamed.push({
            from: files[1],
            to: files[0],
            type: this.getFileType(files[0]),
            reason: 'File renamed/moved'
          });
        } else if (status === 'M') {
          // Modified file - get detailed changes
          const fileChanges = await this.getFileChangeDetails(files[0], from, to);
          this.results.changes.modified.push({
            file: files[0],
            type: this.getFileType(files[0]),
            ...fileChanges
          });
        }
      }
      
    } catch (error) {
      // Empty diff or git error
    }
  }

  async getFileChangeDetails(file, from, to) {
    try {
      const diffCmd = `git diff --unified=0 ${from} ${to} -- "${file}"`;
      const diffOutput = execSync(diffCmd, { 
        cwd: this.options.rootDir, 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const changes = this.parseDiffOutput(diffOutput);
      return {
        linesAdded: changes.added,
        linesDeleted: changes.deleted,
        chunks: changes.chunks,
        reason: this.describeChanges(changes)
      };
      
    } catch (error) {
      return {
        linesAdded: 0,
        linesDeleted: 0,
        chunks: 0,
        reason: 'Unable to analyze changes'
      };
    }
  }

  parseDiffOutput(diffOutput) {
    const lines = diffOutput.split('\n');
    let added = 0;
    let deleted = 0;
    let chunks = 0;
    
    for (const line of lines) {
      if (line.startsWith('@@')) {
        chunks++;
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        added++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deleted++;
      }
    }
    
    return { added, deleted, chunks };
  }

  describeChanges(changes) {
    const { added, deleted, chunks } = changes;
    
    if (added === 0 && deleted === 0) return 'No content changes';
    if (added > 0 && deleted === 0) return `Added ${added} lines`;
    if (added === 0 && deleted > 0) return `Removed ${deleted} lines`;
    if (chunks === 1) return `Modified ${added + deleted} lines`;
    return `${chunks} changes: +${added}/-${deleted} lines`;
  }

  getFileType(filePath) {
    const ext = path.extname(filePath);
    const relativePath = filePath;
    
    if (relativePath.includes('/test') || relativePath.includes('__tests__') || ext.includes('.test.') || ext.includes('.spec.')) {
      return 'test';
    } else if (relativePath.includes('/components/')) {
      return 'component';
    } else if (relativePath.includes('/utils/') || relativePath.includes('/lib/')) {
      return 'utility';
    } else if (relativePath.includes('/types/') || ext === '.d.ts') {
      return 'types';
    } else if (relativePath.includes('/api/') || relativePath.includes('/services/')) {
      return 'service';
    } else if (['.md', '.txt', '.json'].includes(ext)) {
      return 'config';
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return 'code';
    } else {
      return 'other';
    }
  }

  analyzeImpact() {
    const { modified, added, deleted, renamed } = this.results.changes;
    
    // Analyze each change for impact level
    [...modified, ...added].forEach(change => {
      const impact = this.assessFileImpact(change);
      this.results.impact[impact.level].push({
        file: change.file,
        type: change.type,
        reason: impact.reason,
        changes: change.reason || 'New file'
      });
    });
    
    deleted.forEach(change => {
      this.results.impact.high.push({
        file: change.file,
        type: change.type,
        reason: 'File deletion requires verification',
        changes: 'File deleted'
      });
    });
    
    renamed.forEach(change => {
      this.results.impact.medium.push({
        file: `${change.from} → ${change.to}`,
        type: change.type,
        reason: 'Rename may break imports',
        changes: 'File renamed/moved'
      });
    });
  }

  assessFileImpact(change) {
    const { file, type, linesAdded = 0, linesDeleted = 0 } = change;
    const totalChanges = linesAdded + linesDeleted;
    
    // Critical impact factors
    if (file.includes('package.json') || file.includes('.config.')) {
      return { level: 'critical', reason: 'Configuration change affects entire project' };
    }
    
    if (type === 'service' && totalChanges > 20) {
      return { level: 'critical', reason: 'Major service changes affect API contracts' };
    }
    
    // High impact factors
    if (type === 'component' && totalChanges > 50) {
      return { level: 'high', reason: 'Large component changes may affect UI/UX' };
    }
    
    if (type === 'types' && totalChanges > 10) {
      return { level: 'high', reason: 'Type changes cascade to dependent files' };
    }
    
    if (totalChanges > 100) {
      return { level: 'high', reason: 'Large changeset requires careful review' };
    }
    
    // Medium impact factors
    if (type === 'utility' && totalChanges > 30) {
      return { level: 'medium', reason: 'Utility changes affect multiple consumers' };
    }
    
    if (totalChanges > 30) {
      return { level: 'medium', reason: 'Moderate changes need review' };
    }
    
    // Low impact by default
    return { level: 'low', reason: 'Minor changes with limited scope' };
  }

  generateRecommendations() {
    const { summary, impact } = this.results;
    const recommendations = [];
    
    // Complexity-based recommendations
    if (summary.complexity === 'very-high') {
      recommendations.push('🚨 **Critical**: Very large changeset - consider breaking into smaller PRs');
      recommendations.push('🔍 **Process**: Require multiple reviewers for this change');
    } else if (summary.complexity === 'high') {
      recommendations.push('⚠️ **High Impact**: Large changes - ensure thorough testing');
    }
    
    // Impact-based recommendations
    if (impact.critical.length > 0) {
      recommendations.push(`🚨 **Critical**: ${impact.critical.length} critical changes require immediate attention`);
    }
    
    if (impact.high.length > 5) {
      recommendations.push(`⚠️ **High Impact**: ${impact.high.length} high-impact changes need careful review`);
    }
    
    // File type recommendations
    const hasTests = this.results.changes.modified.some(c => c.type === 'test') || 
                     this.results.changes.added.some(c => c.type === 'test');
    const hasCode = this.results.changes.modified.some(c => c.type === 'code') || 
                    this.results.changes.added.some(c => c.type === 'code');
    
    if (hasCode && !hasTests) {
      recommendations.push('🧪 **Testing**: Code changes without test updates - verify test coverage');
    }
    
    if (this.results.changes.deleted.length > 0) {
      recommendations.push('🗑️ **Cleanup**: File deletions detected - verify no breaking changes');
    }
    
    if (this.results.changes.renamed.length > 0) {
      recommendations.push('📝 **Imports**: File renames detected - check for broken imports');
    }
    
    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push('✅ **Status**: Changes appear safe and well-scoped');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    const { changes, impact } = this.results;
    
    this.results.metrics = {
      ...this.results.metrics,
      filesAnalyzed: changes.modified.length + changes.added.length + 
                     changes.deleted.length + changes.renamed.length,
      criticalFiles: impact.critical.length,
      highImpactFiles: impact.high.length,
      mediumImpactFiles: impact.medium.length,
      lowImpactFiles: impact.low.length,
      changeDistribution: this.getChangeDistribution()
    };
  }

  getChangeDistribution() {
    const distribution = {};
    const allChanges = [
      ...this.results.changes.modified,
      ...this.results.changes.added
    ];
    
    allChanges.forEach(change => {
      distribution[change.type] = (distribution[change.type] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { comparison, summary, changes, impact, recommendations, metrics } = this.results;
    
    return `# Git Diff Analysis 📈

**Comparison**: \`${comparison}\`
**Analysis Time**: ${metrics.analysisTime}

## 📊 Change Summary
- **Files Changed**: ${summary.filesChanged}
- **Lines Added**: ${summary.linesAdded}
- **Lines Deleted**: ${summary.linesDeleted}
- **Total Changes**: ${summary.totalChanges}
- **Complexity**: ${summary.complexity.toUpperCase()}

## 🎯 Impact Assessment
- **Critical**: ${metrics.criticalFiles} files
- **High Impact**: ${metrics.highImpactFiles} files
- **Medium Impact**: ${metrics.mediumImpactFiles} files
- **Low Impact**: ${metrics.lowImpactFiles} files

## 📁 File Changes

### Modified Files (${changes.modified.length})
${changes.modified.length === 0 ? 'None' : changes.modified.slice(0, 8).map(change => 
  `- \`${change.file}\` (${change.type}) - ${change.reason}`
).join('\n')}
${changes.modified.length > 8 ? `\n... and ${changes.modified.length - 8} more` : ''}

### Added Files (${changes.added.length})
${changes.added.length === 0 ? 'None' : changes.added.slice(0, 5).map(change => 
  `- \`${change.file}\` (${change.type}) - ${change.reason}`
).join('\n')}

### Deleted Files (${changes.deleted.length})
${changes.deleted.length === 0 ? 'None' : changes.deleted.slice(0, 5).map(change => 
  `- \`${change.file}\` (${change.type}) - ${change.reason}`
).join('\n')}

### Renamed Files (${changes.renamed.length})
${changes.renamed.length === 0 ? 'None' : changes.renamed.slice(0, 5).map(change => 
  `- \`${change.from}\` → \`${change.to}\` (${change.type})`
).join('\n')}

## 🚨 Critical Changes (${impact.critical.length})
${impact.critical.length === 0 ? 'None detected' : impact.critical.map(item => 
  `- **${item.file}** (${item.type}) - ${item.reason}`
).join('\n')}

## ⚠️ High Impact Changes (${impact.high.length})
${impact.high.length === 0 ? 'None detected' : impact.high.slice(0, 6).map(item => 
  `- **${item.file}** (${item.type}) - ${item.reason}`
).join('\n')}
${impact.high.length > 6 ? `\n... and ${impact.high.length - 6} more` : ''}

## 💡 Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📊 Change Distribution
${Object.entries(metrics.changeDistribution).map(([type, count]) => 
  `- **${type}**: ${count} files`
).join('\n')}

## 🎯 Review Checklist
- [ ] Verify all critical changes are intentional
- [ ] Check that high-impact changes have adequate testing
- [ ] Validate renamed/moved files don't break imports
- [ ] Confirm deleted files are no longer needed
- [ ] Review large changesets for potential splitting

*Generated on ${new Date().toISOString()}*
`;
  }
}

// CLI interface
if (require.main === module) {
  const comparison = process.argv[2] || 'HEAD~1';
  
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const analyzer = new GitDiffAnalyzer({
    rootDir: process.cwd()
  });

  // Parse comparison (e.g., "HEAD~1", "main..HEAD", "abc123..def456")
  const [from, to] = comparison.includes('..') ? 
    comparison.split('..') : 
    [comparison, 'HEAD'];

  analyzer.analyzeDiff(from, to).then(() => {
    const report = analyzer.generateReport();
    const reportPath = path.join(outputDir, 'git-diff-analysis.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'git-diff.json');
      fs.writeFileSync(jsonPath, JSON.stringify(analyzer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = GitDiffAnalyzer;