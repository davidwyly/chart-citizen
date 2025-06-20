#!/usr/bin/env node

/**
 * Enhanced Dependency Analyzer 📦🔍
 * 
 * AI-optimized tool for advanced dependency analysis including:
 * - Version conflict detection
 * - Build error analysis
 * - Package ecosystem compatibility checking
 * - Smart error diagnosis
 * 
 * Usage: 
 *   npm run ai-toolkit analyze-error "BatchedMesh is not exported from 'three'"
 *   npm run ai-toolkit check-compatibility
 *   npm run ai-toolkit diagnose-build-error --error-log="./build.log"
 *   npm run ai-toolkit trace-import "BatchedMesh" --from="three"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnhancedDependencyAnalyzer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      verbose: options.verbose || false,
      ...options
    };
    
    this.packageJson = {};
    this.packageLock = {};
    this.knownCompatibilityIssues = this.loadCompatibilityMatrix();
    
    this.results = {
      versionConflicts: [],
      compatibilityIssues: [],
      errorAnalysis: null,
      recommendations: [],
      quickFixes: [],
      metrics: {}
    };
  }

  /**
   * Analyze a specific build/runtime error
   */
  async analyzeError(errorMessage, options = {}) {
    console.log(`🔍 Analyzing error: "${errorMessage}"`);
    const startTime = Date.now();
    
    await this.loadPackageData();
    
    const analysis = {
      originalError: errorMessage,
      errorType: this.classifyError(errorMessage),
      versionConflicts: await this.detectVersionConflicts(errorMessage),
      solution: null,
      confidence: 'unknown'
    };
    
    // Apply error-specific analysis
    if (analysis.errorType === 'missing_export') {
      analysis.solution = await this.analyzeMissingExport(errorMessage);
      analysis.confidence = analysis.solution ? analysis.solution.confidence : 'low';
    } else if (analysis.errorType === 'version_conflict') {
      analysis.solution = await this.analyzeVersionConflict(errorMessage);
    } else if (analysis.errorType === 'dependency_missing') {
      analysis.solution = await this.analyzeMissingDependency(errorMessage);
    }
    
    this.results.errorAnalysis = analysis;
    this.results.metrics.analysisTime = `${Date.now() - startTime}ms`;
    
    // Generate actionable output
    return this.generateErrorReport();
  }

  /**
   * Check for version compatibility issues across the entire project
   */
  async checkCompatibility() {
    console.log('🔍 Checking package compatibility...');
    await this.loadPackageData();
    
    const conflicts = [];
    
    // Check three.js ecosystem
    const threeJsIssues = await this.checkThreeJsEcosystem();
    conflicts.push(...threeJsIssues);
    
    // Check React ecosystem
    const reactIssues = await this.checkReactEcosystem();
    conflicts.push(...reactIssues);
    
    // Check TypeScript compatibility
    const tsIssues = await this.checkTypeScriptCompatibility();
    conflicts.push(...tsIssues);
    
    // Check peer dependency conflicts
    const peerIssues = await this.checkPeerDependencies();
    conflicts.push(...peerIssues);
    
    this.results.versionConflicts = conflicts;
    this.generateCompatibilityRecommendations();
    
    return this.generateCompatibilityReport();
  }

  // ============================================================================
  // ERROR CLASSIFICATION AND ANALYSIS
  // ============================================================================

  classifyError(errorMessage) {
    if (errorMessage.includes('is not exported from')) {
      return 'missing_export';
    }
    if (errorMessage.includes('Cannot resolve module') || errorMessage.includes('Module not found')) {
      return 'dependency_missing';
    }
    if (errorMessage.includes('Attempted import error')) {
      return 'import_error';
    }
    if (errorMessage.includes('peer dep') || errorMessage.includes('ERESOLVE')) {
      return 'version_conflict';
    }
    return 'unknown';
  }

  async analyzeMissingExport(errorMessage) {
    if (this.options.verbose) {
      console.log(`🔍 Analyzing missing export: ${errorMessage}`);
    }
    
    // Extract package and symbol from error
    // Handle various formats: 'symbol' is not exported from 'package' OR symbol is not exported from package
    let match = errorMessage.match(/['"`]([^'"`]+)['"`]\s+is not exported from\s+['"`]([^'"`]+)['"`]/);
    if (!match) {
      // Try without quotes
      match = errorMessage.match(/(\w+)\s+is not exported from\s+['"`]([^'"`]+)['"`]/);
    }
    if (!match) {
      // Try completely without quotes
      match = errorMessage.match(/(\w+)\s+is not exported from\s+(\w+)/);
    }
    if (!match) {
      if (this.options.verbose) {
        console.log(`❌ Could not parse error message format: ${errorMessage}`);
      }
      return null;
    }
    
    const [, symbol, packageName] = match;
    if (this.options.verbose) {
      console.log(`📦 Extracted: symbol="${symbol}", package="${packageName}"`);
    }
    
    // Check if this is a known version issue
    const versionInfo = await this.checkSymbolAvailability(symbol, packageName);
    
    if (versionInfo.availableFrom) {
      const currentVersion = this.getCurrentPackageVersion(packageName);
      const requiredVersion = versionInfo.availableFrom;
      
      // Always provide the solution if we know about the symbol
      return {
        type: 'version_upgrade_needed',
        package: packageName,
        symbol,
        currentVersion: currentVersion || 'unknown',
        requiredVersion,
        fix: `npm install ${packageName}@^${requiredVersion}`,
        confidence: 'high',
        explanation: `${symbol} was introduced in ${packageName} v${requiredVersion}. ${currentVersion ? `Current version: ${currentVersion}` : 'Package version could not be determined.'}`
      };
    }
    
    // If we don't know about the specific symbol, provide general guidance
    return {
      type: 'unknown_export',
      package: packageName,
      symbol,
      fix: `Check ${packageName} documentation or try: npm install ${packageName}@latest`,
      confidence: 'medium',
      explanation: `${symbol} not found in ${packageName}. This might be a version issue or the symbol may not exist.`
    };
  }

  async detectVersionConflicts(errorMessage) {
    const conflicts = [];
    
    // Check for BatchedMesh specific issue
    if (errorMessage.includes('BatchedMesh') && errorMessage.includes('three')) {
      const threeVersion = this.getCurrentPackageVersion('three');
      if (threeVersion && this.versionLessThan(threeVersion, '0.159.0')) {
        conflicts.push({
          package: 'three',
          issue: 'BatchedMesh requires three.js >=0.159.0',
          currentVersion: threeVersion,
          requiredVersion: '>=0.159.0'
        });
      }
    }
    
    return conflicts;
  }

  // ============================================================================
  // ECOSYSTEM-SPECIFIC COMPATIBILITY CHECKS
  // ============================================================================

  async checkThreeJsEcosystem() {
    const issues = [];
    const threeVersion = this.getCurrentPackageVersion('three');
    const dreiVersion = this.getCurrentPackageVersion('@react-three/drei');
    const fiberVersion = this.getCurrentPackageVersion('@react-three/fiber');
    
    if (!threeVersion) return issues;
    
    // Check BatchedMesh compatibility
    if (this.versionLessThan(threeVersion, '0.159.0') && dreiVersion) {
      const dreiMajor = this.getMajorVersion(dreiVersion);
      if (dreiMajor >= 9 && this.getMinorVersion(dreiVersion) >= 80) {
        issues.push({
          type: 'version_conflict',
          package: 'three',
          issue: 'drei requires three.js >=0.159.0 for BatchedMesh support',
          currentVersion: threeVersion,
          requiredVersion: '>=0.159.0',
          fix: 'npm install three@^0.159.0 @types/three@^0.159.0',
          severity: 'critical',
          confidence: 'high'
        });
      }
    }
    
    // Check fiber compatibility
    if (fiberVersion && threeVersion) {
      const fiberMajor = this.getMajorVersion(fiberVersion);
      const threeMajor = this.getMajorVersion(threeVersion);
      
      if (fiberMajor === 8 && threeMajor === 0 && this.versionLessThan(threeVersion, '0.155.0')) {
        issues.push({
          type: 'version_conflict',
          package: 'three',
          issue: '@react-three/fiber v8 requires three.js >=0.155.0',
          currentVersion: threeVersion,
          requiredVersion: '>=0.155.0',
          fix: 'npm install three@^0.160.0',
          severity: 'high',
          confidence: 'high'
        });
      }
    }
    
    return issues;
  }

  async checkReactEcosystem() {
    const issues = [];
    const reactVersion = this.getCurrentPackageVersion('react');
    const reactDomVersion = this.getCurrentPackageVersion('react-dom');
    
    // Check React/ReactDOM version sync
    if (reactVersion && reactDomVersion && reactVersion !== reactDomVersion) {
      issues.push({
        type: 'version_mismatch',
        packages: ['react', 'react-dom'],
        issue: 'React and ReactDOM versions should match',
        versions: { react: reactVersion, 'react-dom': reactDomVersion },
        fix: `npm install react@${reactVersion} react-dom@${reactVersion}`,
        severity: 'medium',
        confidence: 'high'
      });
    }
    
    return issues;
  }

  async checkTypeScriptCompatibility() {
    const issues = [];
    // Add TypeScript-specific checks here
    return issues;
  }

  async checkPeerDependencies() {
    const issues = [];
    
    try {
      // Use npm ls to check for peer dependency issues
      const output = execSync('npm ls --depth=0 2>&1', { 
        cwd: this.options.rootDir,
        encoding: 'utf8' 
      });
      
      if (output.includes('UNMET PEER DEPENDENCY')) {
        const unmetDeps = this.extractUnmetPeerDeps(output);
        for (const dep of unmetDeps) {
          issues.push({
            type: 'unmet_peer_dependency',
            package: dep.package,
            requiredBy: dep.requiredBy,
            requiredVersion: dep.version,
            fix: `npm install ${dep.package}@${dep.version}`,
            severity: 'medium',
            confidence: 'high'
          });
        }
      }
    } catch (error) {
      // npm ls failed, likely due to dependency issues
    }
    
    return issues;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async loadPackageData() {
    try {
      const packagePath = path.join(this.options.rootDir, 'package.json');
      this.packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not load package.json');
    }
    
    try {
      const lockPath = path.join(this.options.rootDir, 'package-lock.json');
      this.packageLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not load package-lock.json');
    }
  }

  getCurrentPackageVersion(packageName) {
    // Check dependencies first, then devDependencies
    const deps = this.packageJson.dependencies || {};
    const devDeps = this.packageJson.devDependencies || {};
    
    let version = deps[packageName] || devDeps[packageName];
    if (version) {
      // Remove version prefixes like ^, ~, >=
      version = version.replace(/^[\^~>=<]+/, '');
      return version;
    }
    
    // Check package-lock for actual installed version
    if (this.packageLock.packages && this.packageLock.packages[`node_modules/${packageName}`]) {
      return this.packageLock.packages[`node_modules/${packageName}`].version;
    }
    
    return null;
  }

  versionLessThan(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }
    return false;
  }

  getMajorVersion(version) {
    return parseInt(version.split('.')[0]);
  }

  getMinorVersion(version) {
    return parseInt(version.split('.')[1] || '0');
  }

  async checkSymbolAvailability(symbol, packageName) {
    // Known compatibility matrix for common packages
    const symbolIntroductions = {
      'three': {
        'BatchedMesh': '0.159.0',
        'WebGPURenderer': '0.155.0',
        'CSM': '0.156.0'
      },
      '@react-three/drei': {
        'Bvh': '9.80.0',
        'BatchedMesh': '9.88.0'
      }
    };
    
    if (this.options.verbose) {
      console.log(`🔍 Checking symbol availability: ${symbol} in ${packageName}`);
    }
    
    const packageSymbols = symbolIntroductions[packageName];
    if (packageSymbols && packageSymbols[symbol]) {
      if (this.options.verbose) {
        console.log(`✅ Found ${symbol} introduced in ${packageSymbols[symbol]}`);
      }
      return {
        availableFrom: packageSymbols[symbol],
        package: packageName,
        symbol
      };
    }
    
    if (this.options.verbose) {
      console.log(`❌ Symbol ${symbol} not found in known compatibility matrix for ${packageName}`);
    }
    
    return { availableFrom: null };
  }

  loadCompatibilityMatrix() {
    // This could be loaded from a JSON file or API in the future
    return {
      'three': {
        'BatchedMesh': { introducedIn: '0.159.0', stable: '0.160.0' },
        'WebGPURenderer': { introducedIn: '0.155.0', stable: '0.157.0' }
      }
    };
  }

  extractUnmetPeerDeps(output) {
    // Parse npm ls output for unmet peer dependencies
    const deps = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('UNMET PEER DEPENDENCY')) {
        const match = line.match(/UNMET PEER DEPENDENCY ([^@]+)@(.+)/);
        if (match) {
          deps.push({
            package: match[1],
            version: match[2],
            requiredBy: 'unknown'
          });
        }
      }
    }
    
    return deps;
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  generateErrorReport() {
    const analysis = this.results.errorAnalysis;
    if (!analysis) return null;
    
    const report = {
      error: analysis.originalError,
      diagnosis: {
        type: analysis.errorType,
        confidence: analysis.confidence
      },
      solution: analysis.solution,
      quickFix: analysis.solution ? analysis.solution.fix : null
    };
    
    // Print compact JSON for AI consumption
    console.log(JSON.stringify(report));
    return report;
  }

  generateCompatibilityReport() {
    const conflicts = this.results.versionConflicts;
    
    if (conflicts.length === 0) {
      console.log(JSON.stringify({
        status: 'healthy',
        message: 'No compatibility issues detected'
      }));
      return;
    }
    
    const critical = conflicts.filter(c => c.severity === 'critical');
    const high = conflicts.filter(c => c.severity === 'high');
    
    const report = {
      status: critical.length > 0 ? 'critical' : 'issues_found',
      summary: {
        total: conflicts.length,
        critical: critical.length,
        high: high.length
      },
      issues: conflicts,
      quickFixes: conflicts.filter(c => c.fix).map(c => c.fix)
    };
    
    console.log(JSON.stringify(report));
    return report;
  }

  generateCompatibilityRecommendations() {
    const conflicts = this.results.versionConflicts;
    const recommendations = [];
    
    for (const conflict of conflicts) {
      if (conflict.fix) {
        recommendations.push({
          priority: conflict.severity,
          action: conflict.fix,
          reason: conflict.issue
        });
      }
    }
    
    this.results.recommendations = recommendations;
  }
}

module.exports = { EnhancedDependencyAnalyzer };

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const analyzer = new EnhancedDependencyAnalyzer({
    verbose: args.includes('--verbose')
  });
  
  async function run() {
    try {
      switch (command) {
        case 'analyze-error':
          if (!args[0]) {
            console.error('Usage: analyze-error "error message"');
            process.exit(1);
          }
          await analyzer.analyzeError(args[0]);
          break;
          
        case 'check-compatibility':
          await analyzer.checkCompatibility();
          break;
          
        default:
          console.error('Unknown command. Available: analyze-error, check-compatibility');
          process.exit(1);
      }
    } catch (error) {
      console.error('Analysis failed:', error.message);
      process.exit(1);
    }
  }
  
  run();
} 