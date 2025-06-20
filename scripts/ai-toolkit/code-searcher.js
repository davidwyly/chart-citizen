#!/usr/bin/env node

/**
 * Code Searcher 🔎
 *
 * A token-efficient, first-class search tool for the AI toolkit.
 * It intelligently searches for a keyword across the source code and
 * returns a simple JSON array of matching file paths.
 */

const { exec } = require('child_process');
const path = require('path');

class CodeSearcher {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      ...options,
    };
    this.verbose = Boolean(options.verbose);
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  // New helper function to check if a command exists
  commandExists(command) {
    return new Promise((resolve) => {
      exec(`command -v ${command}`, (error) => {
        resolve(!error);
      });
    });
  }

  async search(keyword) {
    this.log(`🔎 Searching for keyword: "${keyword}"`);
    const startTime = Date.now();
    
    const useRg = await this.commandExists('rg');
    
    // The `find` command is more robust for selecting files, and we pipe to `grep`.
    // This avoids issues with shell globbing in the `grep` command itself.
    const searchCommand = useRg
      ? `rg -l --ignore-case "${keyword}"`
      : `find . -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \\) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./build/*" -not -path "./.next/*" -not -path "./coverage/*" -not -path "./analysis-results/*" | xargs grep -il "${keyword}"`;

    try {
      const stdout = await this.runCommand(searchCommand);
      const files = stdout.split('\n').filter(Boolean);
      
      const endTime = Date.now();
      this.log(`✅ Found ${files.length} matching files in ${endTime - startTime}ms.`);
      
      // Output compact JSON
      console.log(JSON.stringify(files));
      return files;

    } catch (error) {
      console.error('❌ Search failed:', error.message);
      // Output an empty array on failure to avoid breaking downstream AI workflows
      console.log(JSON.stringify([]));
      return [];
    }
  }

  runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.options.rootDir }, (error, stdout, stderr) => {
        // A non-zero exit code from grep/rg often just means "no results found", which is not a true error for us.
        if (error && error.code > 1) {
          reject(new Error(stderr));
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// CLI Execution
if (require.main === module) {
  const keyword = process.argv[2];
  if (!keyword) {
    console.error('❌ Please provide a keyword to search for.');
    console.log('Usage: node scripts/ai-toolkit/code-searcher.js "myFunction"');
    process.exit(1);
  }
  const searcher = new CodeSearcher();
  searcher.search(keyword);
}

module.exports = { CodeSearcher }; 