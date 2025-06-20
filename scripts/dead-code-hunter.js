#!/usr/bin/env node

/**
 * Dead Code Hunter 🏹
 * 
 * AI-optimized code analysis tool for efficient dead code detection.
 * Designed to minimize AI token usage while maximizing actionable insights.
 * 
 * Usage: npm run hunt-dead-code [options]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class DeadCodeHunter {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || [
        'node_modules/**', 
        'dist/**', 
        'build/**', 
        '.next/**',
        'analysis-results/**' // Exclude our output folder
      ],
      excludeTests: options.excludeTests || false,
      ...options
    };
    
    this.results = {
      deadFiles: [],           // Files with zero imports
      duplicates: [],          // Duplicate content
      legacy: [],              // Deprecated/legacy code
      suspicious: [],          // Potentially unused but needs review
      metrics: {}              // Key statistics
    };
  }

  /**
   * Main hunt - optimized for AI token efficiency
   */
  async hunt() {
    const startTime = Date.now();
    
    const files = await this.discoverFiles();
    const fileMap = await this.analyzeFiles(files);
    
    this.buildImportGraph(fileMap);
    this.findDeadCode(fileMap);
    this.findDuplicates(fileMap);
    this.findLegacyCode(fileMap);
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

    if (this.options.excludeTests) {
      return allFiles.filter(file => 
        !file.includes('.test.') && 
        !file.includes('.spec.') &&
        !file.includes('__tests__')
      );
    }

    return [...new Set(allFiles)];
  }

  async analyzeFiles(files) {
    const fileMap = new Map();
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        fileMap.set(filePath, analysis);
      } catch (error) {
        // Skip unreadable files silently
      }
    }
    
    return fileMap;
  }

  analyzeFile(filePath, content) {
    const analysis = {
      path: filePath,
      size: content.length,
      imports: this.extractImports(content, filePath),
      exports: this.extractExports(content),
      isTest: this.isTestFile(filePath, content),
      isConfig: this.isConfigFile(filePath),
      isEntry: this.isEntryPoint(filePath),
      legacyMarkers: this.findLegacyMarkers(content),
      contentHash: this.simpleHash(content)
    };
    
    return analysis;
  }

  extractImports(content, fromFile) {
    const imports = [];
    const importPatterns = [
      /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /dynamic\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        if (this.isLocalImport(importPath)) {
          const resolved = this.resolveImportPath(fromFile, importPath);
          if (resolved) imports.push(resolved);
        }
      }
    });

    return [...new Set(imports)]; // Deduplicate
  }

  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g,
      /export\s+\*\s+from/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].includes(',')) {
          const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
          exports.push(...names);
        } else if (match[1]) {
          exports.push(match[1]);
        } else {
          exports.push('*'); // Re-export
        }
      }
    });

    return exports;
  }

  buildImportGraph(fileMap) {
    this.importGraph = new Map();
    
    for (const [filePath, analysis] of fileMap) {
      this.importGraph.set(filePath, analysis.imports);
    }
  }

  findDeadCode(fileMap) {
    const allFiles = Array.from(fileMap.keys());
    const importedFiles = new Set();
    
    // Collect all imported files
    for (const analysis of fileMap.values()) {
      analysis.imports.forEach(imp => importedFiles.add(imp));
    }
    
    // Find files that are never imported
    for (const [filePath, analysis] of fileMap) {
      if (!importedFiles.has(filePath) && !analysis.isEntry && !analysis.isConfig) {
        const confidence = this.assessDeadCodeConfidence(analysis);
        
        if (confidence === 'high') {
          this.results.deadFiles.push({
            path: this.relativePath(filePath),
            size: analysis.size,
            reason: this.getDeadCodeReason(analysis),
            confidence
          });
        } else {
          this.results.suspicious.push({
            path: this.relativePath(filePath),
            size: analysis.size,
            reason: this.getDeadCodeReason(analysis),
            confidence
          });
        }
      }
    }
  }

  findDuplicates(fileMap) {
    const hashMap = new Map();
    
    for (const [filePath, analysis] of fileMap) {
      const hash = analysis.contentHash;
      if (hashMap.has(hash)) {
        this.results.duplicates.push({
          files: [
            this.relativePath(hashMap.get(hash)),
            this.relativePath(filePath)
          ],
          size: analysis.size
        });
      } else {
        hashMap.set(hash, filePath);
      }
    }
  }

  findLegacyCode(fileMap) {
    for (const [filePath, analysis] of fileMap) {
      if (analysis.legacyMarkers.length > 0) {
        this.results.legacy.push({
          path: this.relativePath(filePath),
          markers: analysis.legacyMarkers,
          severity: this.assessLegacySeverity(analysis.legacyMarkers)
        });
      }
    }
  }

  calculateMetrics() {
    const deadSize = this.results.deadFiles.reduce((sum, f) => sum + f.size, 0);
    const suspiciousSize = this.results.suspicious.reduce((sum, f) => sum + f.size, 0);
    const duplicateSize = this.results.duplicates.reduce((sum, d) => sum + d.size, 0);
    
    this.results.metrics = {
      ...this.results.metrics,
      deadFiles: this.results.deadFiles.length,
      deadSize: Math.round(deadSize / 1024) + ' KB',
      suspiciousFiles: this.results.suspicious.length,
      suspiciousSize: Math.round(suspiciousSize / 1024) + ' KB',
      legacyFiles: this.results.legacy.length,
      duplicateSets: this.results.duplicates.length,
      duplicateSize: Math.round(duplicateSize / 1024) + ' KB',
      totalPotentialSavings: Math.round((deadSize + duplicateSize) / 1024) + ' KB'
    };
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
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
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

  isTestFile(filePath, content) {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') || 
           filePath.includes('__tests__') ||
           /describe\s*\(|it\s*\(|test\s*\(/g.test(content);
  }

  isConfigFile(filePath) {
    const configPatterns = [
      /next\.config\./,
      /tailwind\.config\./,
      /vitest\.config\./,
      /jest\.setup\./,
      /vitest\.setup\./,
      /middleware\./,
      /next-env\.d\.ts$/
    ];
    return configPatterns.some(pattern => pattern.test(filePath));
  }

  isEntryPoint(filePath) {
    const entryPatterns = [
      /page\.(ts|tsx|js|jsx)$/,
      /layout\.(ts|tsx|js|jsx)$/,
      /route\.(ts|tsx|js|jsx)$/,
      /app\/(.*)\/(page|layout|route)\./
    ];
    return entryPatterns.some(pattern => pattern.test(filePath));
  }

  findLegacyMarkers(content) {
    const markers = [];
    const patterns = [
      /@deprecated/gi,
      /\/\/.*(?:deprecated|legacy|todo|fixme|hack)/gi,
      /\/\*.*(?:deprecated|legacy|todo|fixme|hack).*\*\//gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        markers.push(match[0].trim());
      }
    });

    return markers;
  }

  assessDeadCodeConfidence(analysis) {
    // High confidence if it's clearly unused
    if (analysis.isTest) return 'medium'; // Tests might be run by test runner
    if (analysis.exports.length === 0) return 'high'; // No exports = likely dead
    if (analysis.path.includes('/ui/')) return 'low'; // UI components often used dynamically
    if (analysis.path.includes('script')) return 'medium'; // Scripts might be run directly
    return 'high';
  }

  getDeadCodeReason(analysis) {
    if (analysis.isTest) return 'Test file with no imports';
    if (analysis.exports.length === 0) return 'No exports found';
    return 'No imports found';
  }

  assessLegacySeverity(markers) {
    const deprecatedCount = markers.filter(m => m.toLowerCase().includes('deprecated')).length;
    const todoCount = markers.filter(m => m.toLowerCase().includes('todo')).length;
    
    if (deprecatedCount > 0) return 'high';
    if (todoCount > 3) return 'medium';
    return 'low';
  }

  simpleHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { metrics, deadFiles, suspicious, legacy, duplicates } = this.results;
    
    return `# Dead Code Hunter Results 🏹

**Analysis completed in ${metrics.analysisTime}**

## Executive Summary
- **Dead Files**: ${metrics.deadFiles} files (${metrics.deadSize})
- **Suspicious Files**: ${metrics.suspiciousFiles} files (${metrics.suspiciousSize}) 
- **Legacy Systems**: ${metrics.legacyFiles} files
- **Duplicates**: ${metrics.duplicateSets} sets (${metrics.duplicateSize})
- **Total Savings**: ${metrics.totalPotentialSavings}

## 🗑️ Dead Files (High Confidence - Safe to Delete)

${deadFiles.length === 0 ? 'None found.' : deadFiles.map(f => 
  `- \`${f.path}\` (${Math.round(f.size/1024)}KB) - ${f.reason}`
).join('\n')}

## ⚠️ Suspicious Files (Review Required)

${suspicious.length === 0 ? 'None found.' : suspicious.slice(0, 10).map(f => 
  `- \`${f.path}\` (${Math.round(f.size/1024)}KB) - ${f.reason}`
).join('\n')}
${suspicious.length > 10 ? `\n... and ${suspicious.length - 10} more` : ''}

## 🏚️ Legacy Systems (${legacy.length} files)

${legacy.length === 0 ? 'None found.' : legacy.slice(0, 5).map(l => 
  `- \`${l.path}\` (${l.severity} priority) - ${l.markers.length} markers`
).join('\n')}
${legacy.length > 5 ? `\n... and ${legacy.length - 5} more` : ''}

## 👥 Duplicates (${duplicates.length} sets)

${duplicates.length === 0 ? 'None found.' : duplicates.map(d => 
  `- ${d.files.join(' ↔ ')} (${Math.round(d.size/1024)}KB each)`
).join('\n')}

## 🎯 Recommended Actions

1. **Immediate**: Delete ${deadFiles.length} dead files (saves ${metrics.deadSize})
2. **Review**: Audit ${suspicious.length} suspicious files  
3. **Plan**: Address ${legacy.length} legacy systems
4. **Dedupe**: Resolve ${duplicates.length} duplicate sets

*Report generated on ${new Date().toISOString()}*
`;
  }

  /**
   * Generate detailed files for deeper analysis
   */
  generateDetailedReports() {
    const reports = {};
    
    // Detailed dead files list
    if (this.results.deadFiles.length > 0) {
      reports['dead-files.md'] = `# Dead Files Analysis\n\n${this.results.deadFiles.map(f => 
        `## ${f.path}\n- **Size**: ${f.size} bytes\n- **Reason**: ${f.reason}\n- **Confidence**: ${f.confidence}\n`
      ).join('\n')}`;
    }
    
    // Detailed legacy analysis  
    if (this.results.legacy.length > 0) {
      reports['legacy-systems.md'] = `# Legacy Systems Analysis\n\n${this.results.legacy.map(l => 
        `## ${l.path}\n- **Severity**: ${l.severity}\n- **Markers**: ${l.markers.length}\n${l.markers.map(m => `  - ${m}`).join('\n')}\n`
      ).join('\n')}`;
    }
    
    return reports;
  }
}

// CLI interface
if (require.main === module) {
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const hunter = new DeadCodeHunter({
    rootDir: process.cwd(),
    excludeTests: process.argv.includes('--exclude-tests')
  });

  hunter.hunt().then(() => {
    // Generate main report
    const report = hunter.generateReport();
    const reportPath = path.join(outputDir, 'dead-code-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Generate detailed reports
    const detailedReports = hunter.generateDetailedReports();
    for (const [filename, content] of Object.entries(detailedReports)) {
      fs.writeFileSync(path.join(outputDir, filename), content);
    }
    
    // Generate JSON for programmatic access
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'results.json');
      fs.writeFileSync(jsonPath, JSON.stringify(hunter.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Detailed reports saved to: ${outputDir}`);
    console.log(`💡 To clean up: rm -rf ${outputDir}`);
  }).catch(error => {
    console.error('❌ Hunt failed:', error);
    process.exit(1);
  });
}

module.exports = DeadCodeHunter;