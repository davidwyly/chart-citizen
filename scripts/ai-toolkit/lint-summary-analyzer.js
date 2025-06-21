const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class LintSummaryAnalyzer {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.verbose = Boolean(options.verbose);
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  async analyze() {
    this.log('📊 Running linter and generating summary...');
    
    // Using a file for output is more reliable with `next lint`
    const lintOutputFile = path.join(this.rootDir, 'lint-results.json');
    const lintCommand = `npx next lint --format json --output-file ${lintOutputFile}`;

    try {
      await this.runCommand(lintCommand);
      
      if (!fs.existsSync(lintOutputFile)) {
        // This can happen if there are no lint errors
        this.log('✅ No lint errors found, output file was not created.');
        const summary = {
          totalErrors: 0,
          totalWarnings: 0,
          files: [],
          summary: 'No lint issues detected.'
        };
        console.log(JSON.stringify(summary));
        return;
      }

      const lintOutput = fs.readFileSync(lintOutputFile, 'utf-8');
      fs.unlinkSync(lintOutputFile); // Clean up the file

      const results = JSON.parse(lintOutput);
      const summary = this.summarize(results);
      
      console.log(JSON.stringify(summary));

    } catch (error) {
      // next lint exits with status 1 if there are any issues, so we check stderr
      this.log(`Lint command finished. Exit code: ${error.code}`);
      
      if (fs.existsSync(lintOutputFile)) {
        const lintOutput = fs.readFileSync(lintOutputFile, 'utf-8');
        fs.unlinkSync(lintOutputFile); // Clean up
        
        const results = JSON.parse(lintOutput);
        const summary = this.summarize(results);
        console.log(JSON.stringify(summary));
        return;
      }
      
      console.error('❌ Failed to run or parse lint analysis:', error.stderr || error.message);
      process.exit(1);
    }
  }

  runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.rootDir }, (error, stdout, stderr) => {
        // `next lint` exits with 1 on warnings, and potentially other non-zero codes on errors.
        // We will inspect the generated file regardless, so we don't reject here unless there's no error object.
        if (error) {
            // This is an expected condition when lint issues are found.
            // We resolve because the command did run, and we'll check the output file.
            resolve({ stdout, stderr, code: error.code });
            return;
        }
        resolve({ stdout, stderr, code: 0 });
      });
    });
  }

  summarize(results) {
    let totalErrors = 0;
    let totalWarnings = 0;
    const files = [];

    results.forEach(fileResult => {
      totalErrors += fileResult.errorCount;
      totalWarnings += fileResult.warningCount;

      if (fileResult.errorCount > 0 || fileResult.warningCount > 0) {
        files.push({
          path: path.relative(this.rootDir, fileResult.filePath),
          errors: fileResult.errorCount,
          warnings: fileResult.warningCount,
          messages: fileResult.messages.map(m => `L${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'warn'} - ${m.message} (${m.ruleId})`).slice(0, 5) // Top 5 messages
        });
      }
    });
    
    const summaryString = `${totalErrors} errors, ${totalWarnings} warnings in ${files.length} files.`;

    return {
      totalErrors,
      totalWarnings,
      files,
      summary: summaryString
    };
  }
}

module.exports = { LintSummaryAnalyzer }; 