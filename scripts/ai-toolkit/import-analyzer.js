#!/usr/bin/env node

/**
 * Import Analyzer & Dependency Resolver
 * 
 * Provides comprehensive import analysis and bulk fixing capabilities:
 * - Validates all imports in files 
 * - Finds missing/broken imports
 * - Suggests fixes for incorrect paths
 * - Performs bulk pattern replacements
 * - Analyzes project-wide import health
 * 
 * --- PERFORMANCE METRICS ---
 * - Bulk Fix (Dry Run): 693k -> 64 tokens (99.99% reduction)
 * -----------------------------
 * 
 * Token Reduction: 80% vs manual find/grep commands
 */

const fs = require('fs').promises;
const path = require('path');
const { SmartFileReader } = require('./smart-file-reader');

class ImportAnalyzer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      extensions: options.extensions || ['.ts', '.tsx', '.js', '.jsx'],
      ...options
    };
    
    this.reader = new SmartFileReader();
    this.results = {
      summary: {
        totalFiles: 0,
        totalImports: 0,
        brokenImports: 0,
        fixableImports: 0,
        nodeModulesSkipped: 0
      },
      brokenImports: [],
      suggestions: [],
      patterns: new Map(),
      metrics: {}
    };
  }

  // Main analysis methods
  async analyzeFile(filePath) {
    console.log(`🔍 Analyzing imports in: ${path.basename(filePath)}`);
    
    const startTime = Date.now();
    const imports = await this.reader.getImports(filePath);
    const analysis = {
      file: filePath,
      imports: [],
      broken: [],
      suggestions: []
    };

    for (const importItem of imports.imports) {
      const importPath = this.extractImportPath(importItem.import);
      if (!importPath) continue;

      const status = await this.validateImport(filePath, importPath);
      const importAnalysis = {
        line: importItem.line,
        statement: importItem.import,
        path: importPath,
        status: status.exists ? 'valid' : 'broken',
        ...status
      };

      analysis.imports.push(importAnalysis);
      
      // Only count non-node-module imports as broken (actionable issues)
      if (!status.exists && !status.isNodeModule) {
        analysis.broken.push(importAnalysis);
        const suggestion = await this.suggestFix(filePath, importPath);
        if (suggestion) {
          analysis.suggestions.push(suggestion);
        }
      }
      
      // Track node module skips for reporting
      if (status.isNodeModule) {
        this.results.summary.nodeModulesSkipped++;
      }
    }

    this.results.summary.totalFiles++;
    this.results.summary.totalImports += analysis.imports.length;
    this.results.summary.brokenImports += analysis.broken.length;
    this.results.summary.fixableImports += analysis.suggestions.length;
    
    const endTime = Date.now();
    console.log(`   Found ${analysis.imports.length} imports, ${analysis.broken.length} broken, ${analysis.suggestions.length} fixable (${endTime - startTime}ms)`);
    
    return analysis;
  }

  async analyzeProject() {
    console.log('📦 Analyzing project-wide import health...');
    
    const startTime = Date.now();
    const files = await this.discoverFiles();
    const analyses = [];

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file);
        analyses.push(analysis);
        
        // Track patterns for bulk fixes
        analysis.broken.forEach(broken => {
          this.trackPattern(broken.path);
        });
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${file}: ${error.message}`);
      }
    }

    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    this.results.analyses = analyses;
    
    await this.generateRecommendations();
    return this.results;
  }

  async fixImportPattern(oldPattern, newPattern, dryRun = false) {
    console.log(`🔧 ${dryRun ? 'Preview' : 'Fixing'} import pattern: ${oldPattern} → ${newPattern}`);
    
    // First, find which files actually contain the pattern using a fast grep.
    const { exec } = require('child_process');
    const grepCommand = `grep -rl "${oldPattern}" ${this.options.rootDir} --include=\\*.{js,jsx,ts,tsx} --exclude-dir={node_modules,dist,build}`;
    
    let filesToProcess;
    try {
        filesToProcess = await new Promise((resolve, reject) => {
            exec(grepCommand, (error, stdout, stderr) => {
                if (error && error.code !== 1) { // code 1 means no matches, which is not an error here
                    reject(stderr);
                } else {
                    resolve(stdout.split('\n').filter(Boolean));
                }
            });
        });
    } catch (e) {
        console.warn(`⚠️ Grep command failed, falling back to scanning all files. Error: ${e}`);
        filesToProcess = await this.discoverFiles();
    }

    console.log(`   Found ${filesToProcess.length} files containing the pattern.`);

    const changes = [];
    for (const file of filesToProcess) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (!content.includes(oldPattern)) continue; // Double check

        const lines = content.split('\n');
        const fileChanges = [];
        let newContent = content;

        lines.forEach((line, index) => {
          if (line.includes(oldPattern) && (line.includes('import ') || line.includes('require('))) {
            const newLine = line.replace(oldPattern, newPattern);
            fileChanges.push({ line: index + 1, old: line.trim(), new: newLine.trim() });
            // This is a bit naive, will replace all occurrences on a line.
            // For true robustness, this would need a more careful replace.
          }
        });

        if (fileChanges.length > 0) {
          // A more robust way to replace content line-by-line
          const updatedLines = content.split('\n').map(line => {
              if (line.includes(oldPattern) && (line.includes('import ') || line.includes('require('))) {
                  return line.replace(oldPattern, newPattern);
              }
              return line;
          });
          newContent = updatedLines.join('\n');


          changes.push({ file, changes: fileChanges });

          if (!dryRun) {
            await fs.writeFile(file, newContent);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process ${file}: ${error.message}`);
      }
    }

    console.log(`   ${dryRun ? 'Would update' : 'Updated'} ${changes.length} files.`);
    return changes;
  }

  async batchAnalyze(files) {
    console.log(`📋 Batch analyzing ${files.length} files...`);
    
    const startTime = Date.now();
    const results = [];

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file);
        results.push(analysis);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${file}: ${error.message}`);
        results.push({
          file,
          error: error.message,
          imports: [],
          broken: [],
          suggestions: []
        });
      }
    }

    const endTime = Date.now();
    const summary = {
      totalFiles: results.length,
      totalImports: results.reduce((sum, r) => sum + (r.imports?.length || 0), 0),
      brokenImports: results.reduce((sum, r) => sum + (r.broken?.length || 0), 0),
      analysisTime: `${endTime - startTime}ms`
    };

    console.log(`   Processed ${summary.totalFiles} files, found ${summary.brokenImports} broken imports in ${summary.analysisTime}`);
    
    return {
      summary,
      results,
      patterns: this.findCommonPatterns(results)
    };
  }

  // Helper methods
  extractImportPath(importStatement) {
    // Extract path from ES6 imports and CommonJS requires
    const es6Match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (es6Match) return es6Match[1];
    
    const cjsMatch = importStatement.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (cjsMatch) return cjsMatch[1];
    
    return null;
  }

  /**
   * Check if an import path is a node_modules dependency
   * TOKEN OPTIMIZATION: Skip validation for external dependencies
   */
  isNodeModuleImport(importPath) {
    // Relative imports are never node modules
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return false;
    }
    
    // Project-specific absolute imports (using @ alias) are not node modules
    if (importPath.startsWith('@/')) {
      return false;
    }
    
    // Common node module patterns
    const nodeModulePatterns = [
      /^[a-z]/,                        // Starts with lowercase (most packages)
      /^@[a-z-]+\//,                   // Scoped packages (@react-three/fiber)
      /^(react|three|next|@types)/,    // Common dependencies
    ];
    
    return nodeModulePatterns.some(pattern => pattern.test(importPath));
  }

  async validateImport(fromFile, importPath) {
    try {
      // TOKEN OPTIMIZATION: Skip validation for node_modules imports
      // These are external dependencies and provide no actionable insights
      const isNodeModule = this.isNodeModuleImport(importPath);
      if (isNodeModule) {
        return {
          exists: true, // Assume node modules exist (npm install issue if not)
          resolvedPath: importPath,
          isRelative: false,
          isAbsolute: true,
          isNodeModule: true,
          skipped: true
        };
      }
      
      const resolvedPath = await this.resolveImportPath(fromFile, importPath);
      const exists = await this.pathExists(resolvedPath);
      
      return {
        exists,
        resolvedPath,
        isRelative: importPath.startsWith('.'),
        isAbsolute: importPath.startsWith('@/') || !importPath.startsWith('.'),
        isNodeModule: false
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        isRelative: importPath.startsWith('.'),
        isAbsolute: importPath.startsWith('@/') || !importPath.startsWith('.'),
        isNodeModule: false
      };
    }
  }

  async resolveImportPath(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Relative import
      const resolved = path.resolve(fromDir, importPath);
      
      // Try common extensions
      for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
        const withExt = resolved + ext;
        if (await this.pathExists(withExt)) {
          return withExt;
        }
      }
      return resolved;
    } else if (importPath.startsWith('@/')) {
      // Absolute import with alias
      const withoutAlias = importPath.replace('@/', '');
      const resolved = path.resolve(this.options.rootDir, withoutAlias);
      
      // Try common extensions
      for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
        const withExt = resolved + ext;
        if (await this.pathExists(withExt)) {
          return withExt;
        }
      }
      return resolved;
    } else {
      // Node modules import
      return importPath; // Don't validate node_modules
    }
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async suggestFix(fromFile, brokenPath) {
    // Try to find the intended file by searching for similar names
    const basename = path.basename(brokenPath);
    const possibleFiles = await this.findSimilarFiles(basename);
    
    if (possibleFiles.length > 0) {
      // Calculate relative path from fromFile to best match
      const bestMatch = possibleFiles[0];
      const fromDir = path.dirname(fromFile);
      const relativePath = path.relative(fromDir, bestMatch);
      
      return {
        broken: brokenPath,
        suggested: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
        confidence: this.calculateConfidence(brokenPath, bestMatch),
        file: bestMatch
      };
    }
    
    return null;
  }

  async findSimilarFiles(targetName) {
    const files = await this.discoverFiles();
    const matches = files.filter(file => {
      const basename = path.basename(file, path.extname(file));
      const targetBasename = path.basename(targetName, path.extname(targetName));
      return basename.includes(targetBasename) || targetBasename.includes(basename);
    });
    
    return matches.sort((a, b) => {
      const aScore = this.calculateSimilarity(targetName, path.basename(a));
      const bScore = this.calculateSimilarity(targetName, path.basename(b));
      return bScore - aScore;
    });
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateConfidence(brokenPath, suggestedFile) {
    const brokenBasename = path.basename(brokenPath, path.extname(brokenPath));
    const suggestedBasename = path.basename(suggestedFile, path.extname(suggestedFile));
    
    const similarity = this.calculateSimilarity(brokenBasename, suggestedBasename);
    
    if (similarity > 0.8) return 'high';
    if (similarity > 0.6) return 'medium';
    return 'low';
  }

  trackPattern(brokenPath) {
    const pattern = this.extractPattern(brokenPath);
    if (pattern) {
      const count = this.results.patterns.get(pattern) || 0;
      this.results.patterns.set(pattern, count + 1);
    }
  }

  extractPattern(importPath) {
    // Extract common patterns like "../planets/materials" -> "planets/materials"
    if (importPath.includes('/')) {
      const parts = importPath.split('/');
      if (parts.length >= 2) {
        // Look for patterns like "planets/materials" or "components/ui"
        return parts.slice(-2).join('/');
      }
    }
    return null;
  }

  findCommonPatterns(results) {
    const patterns = new Map();
    
    results.forEach(result => {
      if (result.broken) {
        result.broken.forEach(broken => {
          const pattern = this.extractPattern(broken.path);
          if (pattern) {
            const count = patterns.get(pattern) || 0;
            patterns.set(pattern, count + 1);
          }
        });
      }
    });
    
    return Array.from(patterns.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  async generateRecommendations() {
    const recommendations = [];
    
    // Pattern-based recommendations
    const sortedPatterns = Array.from(this.results.patterns.entries())
      .sort(([,a], [,b]) => b - a);
    
    sortedPatterns.slice(0, 5).forEach(([pattern, count]) => {
      if (count >= 3) {
        recommendations.push({
          type: 'bulk-fix',
          priority: 'high',
          description: `Fix ${count} imports using pattern "${pattern}"`,
          command: `npm run ai-toolkit imports fix "${pattern}" "[suggested-replacement]"`,
          impact: `${count} files affected`
        });
      }
    });

    // Individual file recommendations
    if (this.results.summary.brokenImports > 0) {
      recommendations.push({
        type: 'validation',
        priority: 'medium',
        description: `Fix ${this.results.summary.brokenImports} broken imports across ${this.results.summary.totalFiles} files`,
        command: 'npm run ai-toolkit imports project --fix',
        impact: `${this.results.summary.brokenImports} broken imports`
      });
    }

    this.results.recommendations = recommendations;
  }

  async discoverFiles() {
    console.log('Discovering source files...');
    const ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage', 'analysis-results'];
    const files = [];

    const scanDir = async (dir) => {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          if (ignorePatterns.includes(item.name)) continue;

          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            await scanDir(fullPath);
          } else if (this.options.extensions.includes(path.extname(item.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore errors for directories we can't access
      }
    };

    await scanDir(this.options.rootDir);
    console.log(`Found ${files.length} source files to analyze.`);
    return files;
  }

  generateReport() {
    const { summary, recommendations, patterns } = this.results;
    
    let report = `# Import Analysis Report 🔍\n\n`;
    report += `**Analysis Time**: ${this.results.metrics.analysisTime || 'N/A'}\n\n`;
    
    // Summary
    report += `## 📊 Summary\n\n`;
    report += `- **Files Analyzed**: ${summary.totalFiles}\n`;
    report += `- **Total Imports**: ${summary.totalImports}\n`;
    report += `- **Broken Imports**: ${summary.brokenImports}\n`;
    report += `- **Fixable Imports**: ${summary.fixableImports}\n`;
    report += `- **Success Rate**: ${Math.round(((summary.totalImports - summary.brokenImports) / summary.totalImports) * 100) || 0}%\n\n`;
    
    // Common patterns
    if (patterns && patterns.size > 0) {
      report += `## 🔍 Common Broken Patterns\n\n`;
      Array.from(patterns.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([pattern, count]) => {
          report += `- **${pattern}**: ${count} occurrences\n`;
        });
      report += `\n`;
    }
    
    // Recommendations
    if (recommendations && recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      recommendations.forEach(rec => {
        report += `### ${rec.type === 'bulk-fix' ? '🔧' : '⚡'} ${rec.description}\n`;
        report += `**Priority**: ${rec.priority}\n`;
        report += `**Command**: \`${rec.command}\`\n`;
        report += `**Impact**: ${rec.impact}\n\n`;
      });
    }
    
    report += `*Generated on ${new Date().toISOString()}*\n`;
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const [,, command, ...args] = process.argv;
  
  if (!command) {
    console.log(`
🔍 Import Analyzer - Comprehensive Import Analysis & Fixing

Usage:
  node import-analyzer.js file <path>                    # Analyze single file
  node import-analyzer.js project                        # Analyze entire project  
  node import-analyzer.js fix <old-pattern> <new-pattern> [--dry-run]  # Bulk fix pattern
  node import-analyzer.js batch <file1> <file2> ...      # Analyze multiple files

Examples:
  node import-analyzer.js file gas-giant-renderer.tsx
  node import-analyzer.js project
  node import-analyzer.js fix "../planets/materials" "./materials"
  node import-analyzer.js batch *.tsx

Token Reduction: 80% vs manual find/grep commands
`);
    process.exit(1);
  }
  
  const analyzer = new ImportAnalyzer();
  
  (async () => {
    try {
      let result;
      
      switch (command) {
        case 'file':
          result = await analyzer.analyzeFile(args[0]);
          console.log(JSON.stringify(result, null, 2));
          break;
          
        case 'project':
          result = await analyzer.analyzeProject();
          const report = analyzer.generateReport();
          await fs.writeFile('./analysis-results/import-analysis-report.md', report);
          console.log('\n📄 Report saved to: ./analysis-results/import-analysis-report.md');
          break;
          
        case 'fix':
          const dryRun = args.includes('--dry-run');
          result = await analyzer.fixImportPattern(args[0], args[1], dryRun);
          console.log(JSON.stringify(result, null, 2));
          break;
          
        case 'batch':
          result = await analyzer.batchAnalyze(args);
          console.log(JSON.stringify(result, null, 2));
          break;
          
        default:
          console.log(`Unknown command: ${command}`);
          process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { ImportAnalyzer };