#!/usr/bin/env node

/**
 * Test Output Analyzer 🧪
 * 
 * AI-optimized tool for compressing verbose test output into token-efficient summaries.
 * Extracts only essential information while preserving all error details.
 * 
 * Usage:
 *   npm run ai-toolkit test-summary
 *   npm run ai-toolkit test-summary --failures-only
 *   npm run ai-toolkit test-summary --parse-log="test-output.log"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestOutputAnalyzer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      verbose: options.verbose || false,
      failuresOnly: options.failuresOnly || false,
      ...options
    };
    
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: null
      },
      failures: [],
      warnings: [],
      performance: {
        slowTests: [],
        fastTests: []
      },
      coverage: null,
      recommendations: []
    };
  }

  /**
   * Run tests and analyze output
   */
  async runTestAnalysis(command = 'npm test --run', timeoutSeconds = 120) {
    console.log('🧪 Running test analysis...');
    
    // Wrap command with timeout to prevent hanging
    const safeCommand = `timeout ${timeoutSeconds}s ${command} || echo "Tests completed or timed out"`;
    
    try {
      const output = execSync(safeCommand, {
        cwd: this.options.rootDir,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: timeoutSeconds * 1000 // Also set Node.js timeout
      });
      
      return this.analyzeTestOutput(output);
    } catch (error) {
      // Tests failed, but we still want to analyze the output
      if (error.stdout) {
        return this.analyzeTestOutput(error.stdout + '\n' + (error.stderr || ''));
      }
      
      // Handle timeout specifically
      if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
        console.log(`⏰ Test analysis timed out after ${timeoutSeconds}s`);
        return this.analyzeTestOutput('Tests timed out - no output to analyze');
      }
      
      throw error;
    }
  }

  /**
   * Analyze test output from a log file
   */
  async analyzeLogFile(logPath) {
    if (!fs.existsSync(logPath)) {
      throw new Error(`Log file not found: ${logPath}`);
    }
    
    const output = fs.readFileSync(logPath, 'utf8');
    return this.analyzeTestOutput(output);
  }

  /**
   * Main analysis function
   */
  analyzeTestOutput(output) {
    const lines = output.split('\n');
    
    // Parse test results
    this.parseTestSummary(lines);
    this.extractFailures(lines);
    this.extractWarnings(lines);
    this.analyzePerformance(lines);
    this.extractCoverage(lines);
    this.generateRecommendations();
    
    return this.generateCompactReport();
  }

  parseTestSummary(lines) {
    // Look for vitest summary patterns
    for (const line of lines) {
      // Pattern: "✓ 123 passed (456ms)"
      const passedMatch = line.match(/✓\s+(\d+)\s+passed/);
      if (passedMatch) {
        this.results.summary.passed = parseInt(passedMatch[1]);
      }
      
      // Pattern: "✗ 5 failed"
      const failedMatch = line.match(/✗\s+(\d+)\s+failed/);
      if (failedMatch) {
        this.results.summary.failed = parseInt(failedMatch[1]);
      }
      
      // Pattern: "⚠ 2 skipped"
      const skippedMatch = line.match(/⚠\s+(\d+)\s+skipped/);
      if (skippedMatch) {
        this.results.summary.skipped = parseInt(skippedMatch[1]);
      }
      
      // Pattern: "Tests completed in 1.23s"
      const durationMatch = line.match(/completed in ([\d.]+[ms|s])/);
      if (durationMatch) {
        this.results.summary.duration = durationMatch[1];
      }
    }
    
    this.results.summary.total = 
      this.results.summary.passed + 
      this.results.summary.failed + 
      this.results.summary.skipped;
  }

  extractFailures(lines) {
    let currentTest = null;
    let currentError = [];
    let inErrorBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect test failure start
      if (line.includes('FAIL') || line.includes('✗')) {
        if (currentTest && currentError.length > 0) {
          this.results.failures.push({
            test: currentTest,
            error: this.cleanErrorMessage(currentError.join('\n')),
            file: this.extractFileFromError(currentError)
          });
        }
        
        currentTest = this.extractTestName(line);
        currentError = [];
        inErrorBlock = true;
      }
      
      // Collect error details
      if (inErrorBlock && line.trim()) {
        // Skip redundant lines
        if (!this.isRedundantLine(line)) {
          currentError.push(line);
        }
      }
      
      // End of error block
      if (inErrorBlock && line.trim() === '' && currentError.length > 3) {
        inErrorBlock = false;
      }
    }
    
    // Handle last failure
    if (currentTest && currentError.length > 0) {
      this.results.failures.push({
        test: currentTest,
        error: this.cleanErrorMessage(currentError.join('\n')),
        file: this.extractFileFromError(currentError)
      });
    }
  }

  extractWarnings(lines) {
    for (const line of lines) {
      if (line.includes('Warning:') || line.includes('⚠️')) {
        const cleanWarning = this.cleanWarningMessage(line);
        if (cleanWarning && !this.isDuplicateWarning(cleanWarning)) {
          this.results.warnings.push(cleanWarning);
        }
      }
    }
    
    // Deduplicate and categorize warnings
    this.results.warnings = this.categorizeWarnings(this.results.warnings);
  }

  analyzePerformance(lines) {
    const testDurations = [];
    
    for (const line of lines) {
      // Pattern: "test-name (123ms)"
      const durationMatch = line.match(/(.+?)\s+\((\d+)ms\)/);
      if (durationMatch) {
        const testName = durationMatch[1].trim();
        const duration = parseInt(durationMatch[2]);
        testDurations.push({ test: testName, duration });
      }
    }
    
    // Sort by duration
    testDurations.sort((a, b) => b.duration - a.duration);
    
    // Extract slow tests (>1000ms)
    this.results.performance.slowTests = testDurations
      .filter(t => t.duration > 1000)
      .slice(0, 5);
    
    // Extract fast tests (<10ms) - good examples
    this.results.performance.fastTests = testDurations
      .filter(t => t.duration < 10)
      .slice(0, 3);
  }

  extractCoverage(lines) {
    for (const line of lines) {
      // Look for coverage summary
      const coverageMatch = line.match(/(\d+\.?\d*)%\s+coverage/i);
      if (coverageMatch) {
        this.results.coverage = `${coverageMatch[1]}%`;
        break;
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  extractTestName(line) {
    // Remove FAIL, ✗, and other prefixes
    return line
      .replace(/^.*?(FAIL|✗)\s*/, '')
      .replace(/\s*\(\d+ms\).*$/, '')
      .trim();
  }

  extractFileFromError(errorLines) {
    for (const line of errorLines) {
      // Look for file paths
      const fileMatch = line.match(/([^\/\s]+\.(test|spec)\.(ts|tsx|js|jsx))/);
      if (fileMatch) {
        return fileMatch[1];
      }
    }
    return null;
  }

  cleanErrorMessage(error) {
    return error
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove verbose stack traces (keep first few lines)
      .split('\n')
      .filter((line, index) => {
        // Keep error message and first few stack frames
        if (index < 10) return true;
        // Skip node_modules stack frames
        if (line.includes('node_modules')) return false;
        // Skip internal vitest frames
        if (line.includes('vitest') && line.includes('dist')) return false;
        return true;
      })
      .slice(0, 15) // Limit to 15 lines max
      .join('\n')
      .trim();
  }

  cleanWarningMessage(line) {
    return line
      .replace(/^.*?Warning:\s*/, '')
      .replace(/^\s*stderr\s*\|\s*/, '')
      .trim();
  }

  isDuplicateWarning(warning) {
    return this.results.warnings.some(existing => 
      existing.message === warning || 
      existing.includes(warning.substring(0, 50))
    );
  }

  categorizeWarnings(warnings) {
    const categories = {
      react: [],
      three: [],
      dom: [],
      other: []
    };
    
    for (const warning of warnings) {
      if (warning.includes('React') || warning.includes('component')) {
        categories.react.push(warning);
      } else if (warning.includes('Three.js') || warning.includes('three')) {
        categories.three.push(warning);
      } else if (warning.includes('DOM') || warning.includes('attribute')) {
        categories.dom.push(warning);
      } else {
        categories.other.push(warning);
      }
    }
    
    return categories;
  }

  isRedundantLine(line) {
    const redundantPatterns = [
      /^stdout \|/,
      /^stderr \|/,
      /^npm verbose/,
      /^npm info/,
      /^\s*at\s+.*node_modules/,
      /^\s*at\s+.*vitest.*dist/
    ];
    
    return redundantPatterns.some(pattern => pattern.test(line));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (this.results.performance.slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${this.results.performance.slowTests.length} slow tests detected (>1s)`,
        action: 'Consider optimizing or mocking heavy operations'
      });
    }
    
    // Warning recommendations
    const totalWarnings = Object.values(this.results.warnings).flat().length;
    if (totalWarnings > 10) {
      recommendations.push({
        type: 'warnings',
        priority: 'low',
        message: `${totalWarnings} warnings detected`,
        action: 'Consider cleaning up React prop warnings and DOM attributes'
      });
    }
    
    // Failure recommendations
    if (this.results.summary.failed > 0) {
      recommendations.push({
        type: 'failures',
        priority: 'high',
        message: `${this.results.summary.failed} test failures`,
        action: 'Review and fix failing tests'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  generateCompactReport() {
    const report = {
      status: this.results.summary.failed > 0 ? 'failed' : 'passed',
      summary: this.results.summary,
      ...(this.results.failures.length > 0 && { failures: this.results.failures }),
      ...(Object.values(this.results.warnings).flat().length > 0 && !this.options.failuresOnly && { 
        warnings: this.results.warnings 
      }),
      ...(this.results.performance.slowTests.length > 0 && !this.options.failuresOnly && { 
        performance: this.results.performance 
      }),
      ...(this.results.coverage && !this.options.failuresOnly && { coverage: this.results.coverage }),
      recommendations: this.results.recommendations
    };
    
    // Print compact JSON
    console.log(JSON.stringify(report));
    return report;
  }
}

module.exports = { TestOutputAnalyzer };

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const analyzer = new TestOutputAnalyzer({
    verbose: args.includes('--verbose'),
    failuresOnly: args.includes('--failures-only')
  });
  
  async function run() {
    try {
      switch (command) {
        case 'analyze':
          const testCommand = args.find(arg => arg.startsWith('--command='))?.split('=')[1] || 'npm test --run';
          await analyzer.runTestAnalysis(testCommand);
          break;
          
        case 'parse-log':
          const logFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1];
          if (!logFile) {
            console.error('Usage: parse-log --file="path/to/log"');
            process.exit(1);
          }
          await analyzer.analyzeLogFile(logFile);
          break;
          
        default:
          console.error('Unknown command. Available: analyze, parse-log');
          process.exit(1);
      }
    } catch (error) {
      console.error('Analysis failed:', error.message);
      process.exit(1);
    }
  }
  
  run();
} 