/**
 * Command Chaining Test
 * Tests the new semicolon-based command chaining functionality
 */

const { spawn } = require('child_process');
const path = require('path');

describe('AI Toolkit Command Chaining', () => {
  const toolkitPath = path.join(__dirname, '..', '..', 'ai-toolkit.js');
  
  const runToolkit = (args) => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [toolkitPath, ...args], {
        cwd: path.join(__dirname, '..', '..', '..'),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timed out'));
      }, 30000);
    });
  };

  it('should execute single commands normally', async () => {
    const result = await runToolkit(['overview']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('projectType');
    expect(result.stdout).not.toContain('=== AI Toolkit Chained Analysis');
  });

  it('should detect and execute chained commands', async () => {
    const result = await runToolkit(['overview; check-compatibility']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('=== AI Toolkit Chained Analysis (2 commands) ===');
    expect(result.stdout).toContain('--- Command 1/2: overview ---');
    expect(result.stdout).toContain('--- Command 2/2: check-compatibility ---');
    expect(result.stdout).toContain('=== Chained Analysis Complete ===');
    expect(result.stdout).toContain('Commands executed: 2/2');
  });

  it('should handle three command chains', async () => {
    const result = await runToolkit(['overview; check-compatibility; lint-summary']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('=== AI Toolkit Chained Analysis (3 commands) ===');
    expect(result.stdout).toContain('--- Command 1/3: overview ---');
    expect(result.stdout).toContain('--- Command 2/3: check-compatibility ---');
    expect(result.stdout).toContain('--- Command 3/3: lint-summary ---');
    expect(result.stdout).toContain('Commands executed: 3/3');
  });

  it('should handle invalid commands in chains gracefully', async () => {
    const result = await runToolkit(['overview; invalid-command; check-compatibility']);
    
    expect(result.code).toBe(0); // Should not fail the entire chain
    expect(result.stdout).toContain('=== AI Toolkit Chained Analysis (3 commands) ===');
    expect(result.stdout).toContain('❌ Unknown command: invalid-command');
    expect(result.stdout).toContain('Commands executed: 2/3');
    expect(result.stdout).toContain('⚠️  Some commands failed:');
  });

  it('should provide timing information for chains', async () => {
    const result = await runToolkit(['overview; check-compatibility']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/Total time: \d+ms/);
    expect(result.stdout).toContain('Commands executed: 2/2');
  });

  it('should handle empty commands in chains', async () => {
    const result = await runToolkit(['overview;; check-compatibility']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('=== AI Toolkit Chained Analysis (2 commands) ==='); // Empty commands filtered out
  });

  it('should preserve command arguments in chains', async () => {
    const result = await runToolkit(['list-symbols engine/core/configuration/rendering-configuration.ts; check-compatibility']);
    
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('--- Command 1/2: list-symbols engine/core/configuration/rendering-configuration.ts ---');
    expect(result.stdout).toContain('--- Command 2/2: check-compatibility ---');
    expect(result.stdout).toContain('exports');
  });

  it('should maintain individual command output format', async () => {
    const result = await runToolkit(['overview; check-compatibility']);
    
    expect(result.code).toBe(0);
    
    // Should contain JSON output from overview
    expect(result.stdout).toContain('"projectType"');
    expect(result.stdout).toContain('"primaryFrameworks"');
    
    // Should contain output from check-compatibility
    expect(result.stdout).toContain('compatibility');
  });
});

// Simple test runner for Node.js (since we don't want to add jest as a dependency)
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    not: {
      toContain(expected) {
        if (actual.includes(expected)) {
          throw new Error(`Expected "${actual}" not to contain "${expected}"`);
        }
      }
    },
    toMatch(regex) {
      if (!regex.test(actual)) {
        throw new Error(`Expected "${actual}" to match ${regex}`);
      }
    }
  };
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  fn();
}

function it(name, fn) {
  return fn().then(() => {
    console.log(`  ✅ ${name}`);
  }).catch(error => {
    console.log(`  ❌ ${name}: ${error.message}`);
    throw error;
  });
}

// Export for manual testing
module.exports = { runToolkit };