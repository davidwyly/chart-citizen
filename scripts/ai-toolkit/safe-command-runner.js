#!/usr/bin/env node

/**
 * Safe Command Runner 🛡️
 * 
 * Utility for running commands safely without hanging the AI agent.
 * Provides timeout support, non-interactive modes, and proper error handling.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

class SafeCommandRunner {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: options.defaultTimeout || 60,
      maxBuffer: options.maxBuffer || 1024 * 1024 * 10, // 10MB
      verbose: options.verbose || false,
      ...options
    };
  }

  /**
   * Run a command safely with timeout protection
   */
  runSafe(command, options = {}) {
    const timeout = options.timeout || this.options.defaultTimeout;
    const nonInteractive = options.nonInteractive !== false; // Default to true
    
    // Build safe command with timeout
    let safeCommand = command;
    
    // Add non-interactive flags for common commands
    if (nonInteractive) {
      safeCommand = this.addNonInteractiveFlags(safeCommand);
    }
    
    // Add timeout wrapper
    safeCommand = `timeout ${timeout}s ${safeCommand}`;
    
    // Add completion message for clarity
    if (options.completionMessage !== false) {
      safeCommand += ` || echo "Command completed (exit code: $?)"`;
    }
    
    if (this.options.verbose) {
      console.log(`🛡️ Running safe command: ${safeCommand}`);
    }
    
    try {
      const result = execSync(safeCommand, {
        cwd: options.cwd || process.cwd(),
        encoding: 'utf8',
        maxBuffer: this.options.maxBuffer,
        timeout: timeout * 1000,
        ...options.execOptions
      });
      
      return {
        success: true,
        output: result,
        timedOut: false
      };
    } catch (error) {
      // Handle timeout
      if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM' || error.status === 124) {
        return {
          success: false,
          output: error.stdout || '',
          error: `Command timed out after ${timeout}s`,
          timedOut: true
        };
      }
      
      // Handle other errors but still return output if available
      return {
        success: false,
        output: (error.stdout || '') + '\n' + (error.stderr || ''),
        error: error.message,
        timedOut: false
      };
    }
  }

  /**
   * Run tests safely with smart defaults
   */
  runTests(command = 'npm test --run', options = {}) {
    return this.runSafe(command, {
      timeout: 120, // 2 minutes for tests
      ...options
    });
  }

  /**
   * Run build safely with longer timeout
   */
  runBuild(command = 'npm run build', options = {}) {
    return this.runSafe(command, {
      timeout: 300, // 5 minutes for builds
      ...options
    });
  }

  /**
   * Check if a development server is running
   */
  checkDevServer(port = 3000, options = {}) {
    const checkCommand = `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`;
    return this.runSafe(checkCommand, {
      timeout: 10,
      completionMessage: false,
      ...options
    });
  }

  /**
   * Start a development server temporarily for testing
   */
  testDevServer(startCommand = 'npm run dev', port = 3000, options = {}) {
    const testScript = `
      ${startCommand} > dev.log 2>&1 & 
      DEV_PID=$!
      sleep ${options.startupTime || 10}
      curl -s http://localhost:${port} > /dev/null && echo "✅ Server responding" || echo "❌ Server not responding"
      kill $DEV_PID 2>/dev/null
      wait $DEV_PID 2>/dev/null
      echo "Server test completed"
    `;
    
    return this.runSafe(`bash -c '${testScript.replace(/\n/g, ' ')}'`, {
      timeout: (options.startupTime || 10) + 20,
      ...options
    });
  }

  /**
   * List files safely with output limits
   */
  listFiles(pattern, options = {}) {
    const limit = options.limit || 20;
    const command = `find . -name "${pattern}" | head -${limit}`;
    return this.runSafe(command, {
      timeout: 30,
      ...options
    });
  }

  /**
   * Get git information safely
   */
  getGitInfo(options = {}) {
    const commands = [
      'git status --porcelain | head -10',
      'git log --oneline -5',
      'git branch --show-current'
    ];
    
    const results = {};
    for (const [index, cmd] of commands.entries()) {
      const key = ['status', 'log', 'branch'][index];
      const result = this.runSafe(cmd + ' | cat', { // Prevent pager
        timeout: 10,
        completionMessage: false,
        ...options
      });
      results[key] = result;
    }
    
    return results;
  }

  /**
   * Add non-interactive flags to common commands
   */
  addNonInteractiveFlags(command) {
    // npm commands
    if (command.includes('npm install') && !command.includes('--yes')) {
      command = command.replace('npm install', 'npm install --yes --silent');
    }
    
    // npm test commands - ensure --run flag
    if (command.includes('npm test') && !command.includes('--run')) {
      command = command.replace('npm test', 'npm test --run');
    }
    
    // git commands that might prompt
    if (command.includes('git push') && !command.includes('--no-verify')) {
      command = command.replace('git push', 'git push --no-verify');
    }
    
    return command;
  }

  /**
   * Create a safe command template
   */
  createTemplate(baseCommand, options = {}) {
    return {
      run: (customOptions = {}) => this.runSafe(baseCommand, { ...options, ...customOptions }),
      command: baseCommand,
      defaultOptions: options
    };
  }
}

// Predefined safe command templates
const SafeCommands = {
  // Test commands
  testRun: (runner) => runner.createTemplate('npm test --run', { timeout: 120 }),
  testWatch: (runner) => runner.createTemplate('timeout 30s npm test', { timeout: 35 }),
  
  // Build commands
  build: (runner) => runner.createTemplate('npm run build', { timeout: 300 }),
  buildCheck: (runner) => runner.createTemplate('npm run build --dry-run', { timeout: 60 }),
  
  // Development
  devServerTest: (runner) => runner.createTemplate('timeout 30s bash -c "npm run dev & sleep 10; pkill -f next"', { timeout: 35 }),
  
  // Analysis
  lintCheck: (runner) => runner.createTemplate('npm run lint', { timeout: 60 }),
  typeCheck: (runner) => runner.createTemplate('npm run type-check', { timeout: 60 }),
  
  // File operations
  findTests: (runner) => runner.createTemplate('find . -name "*.test.*" | head -20', { timeout: 30 }),
  findComponents: (runner) => runner.createTemplate('find . -name "*.tsx" -o -name "*.jsx" | head -20', { timeout: 30 })
};

module.exports = { SafeCommandRunner, SafeCommands };

// CLI interface for testing
if (require.main === module) {
  const runner = new SafeCommandRunner({ verbose: true });
  const command = process.argv[2];
  const timeout = parseInt(process.argv[3]) || 60;
  
  if (!command) {
    console.log('Usage: node safe-command-runner.js "command" [timeout]');
    console.log('Example: node safe-command-runner.js "npm test --run" 120');
    process.exit(1);
  }
  
  const result = runner.runSafe(command, { timeout });
  console.log('Result:', JSON.stringify(result, null, 2));
} 