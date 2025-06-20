#!/usr/bin/env node

/**
 * Project Overview Generator 🚀
 *
 * Generates a high-level, token-efficient summary of the project.
 * Ideal for quickly onboarding an AI to a codebase.
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');

class ProjectOverview {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      ...options,
    };
  }

  async generateSummary() {
    console.log('🚀 Generating project overview...');
    const startTime = Date.now();

    const packageJson = await this.loadPackageJson();
    const directories = await this.analyzeDirectoryStructure();
    const projectStats = await this.getProjectStats(directories.all);

    const summary = {
      projectType: this.identifyProjectType(packageJson),
      primaryFrameworks: this.identifyFrameworks(packageJson),
      architecturalStyle: this.identifyArchitecturalStyle(directories),
      keyDirectories: directories.important,
      projectStats,
    };

    const endTime = Date.now();
    console.log(`✅ Overview generated in ${endTime - startTime}ms`);
    
    // Output the compact JSON summary
    console.log(JSON.stringify(summary));

    return summary;
  }

  async loadPackageJson() {
    try {
      const content = await fs.readFile(path.join(this.options.rootDir, 'package.json'), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ package.json not found.');
      return {};
    }
  }

  async analyzeDirectoryStructure() {
    return new Promise((resolve, reject) => {
        glob('*/', { cwd: this.options.rootDir, ignore: ['node_modules/**', '.git/**'] })
        .then(dirs => {
            const analysis = { all: dirs, important: [], patterns: {} };
            const importantPatterns = [
                'src', 'app', 'pages', 'components', 'engine', 'lib', 'utils',
                'services', 'hooks', 'types', 'api', 'core', 'features', 'styles'
            ];
            
            dirs.forEach(dir => {
                const cleanDir = dir.replace('/', '');
                if (importantPatterns.some(pattern => cleanDir.includes(pattern))) {
                    analysis.important.push(cleanDir);
                }
            });
            
            analysis.patterns = {
                hasComponents: dirs.some(d => d.includes('component')),
                hasEngine: dirs.some(d => d.includes('engine')),
                hasFeatures: dirs.some(d => d.includes('feature')),
                hasServices: dirs.some(d => d.includes('service')),
            };
            
            resolve(analysis);
        })
        .catch(err => reject(err));
    });
  }
  
  identifyProjectType(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps['next']) return 'Next.js Application';
    if (deps['@react-three/fiber']) return 'React Three Fiber Application';
    if (deps['react']) return 'React Application';
    if (deps['express']) return 'Node.js API';
    return 'JavaScript Project';
  }

  identifyFrameworks(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const frameworks = [];
    const frameworkDeps = {
        'React': 'react', 'Next.js': 'next', 'React Three Fiber': '@react-three/fiber',
        'Three.js': 'three', 'TypeScript': 'typescript', 'Tailwind CSS': 'tailwindcss',
        'Vitest': 'vitest', 'ESLint': 'eslint'
    };
    for (const [name, dep] of Object.entries(frameworkDeps)) {
        if (deps[dep]) frameworks.push(name);
    }
    return frameworks;
  }

  identifyArchitecturalStyle(directories) {
    const { patterns } = directories;
    if (patterns.hasEngine && patterns.hasComponents) return 'Engine-Component Architecture';
    if (patterns.hasFeatures) return 'Feature-Based Architecture';
    if (patterns.hasServices) return 'Service-Oriented Architecture';
    return 'Component-Based Architecture';
  }

  async getProjectStats() {
    return new Promise((resolve, reject) => {
        const extensions = '{ts,tsx,js,jsx,css,md,json}';
        const command = `find . -type d \\( -name node_modules -o -name .git \\) -prune -o -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.css' -o -name '*.md' -o -name '*.json' \\) -print | wc -l && find . -type d \\( -name node_modules -o -name .git \\) -prune -o -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.css' -o -name '*.md' -o -name '*.json' \\) -print0 | xargs -0 cat | wc -l`;
        
        exec(command, { cwd: this.options.rootDir }, (err, stdout, stderr) => {
            if (err) {
                 console.warn('⚠️ Could not execute `wc`, skipping project stats.');
                 return resolve({ totalFiles: 0, totalLines: 0, totalTokens: 0 });
            }
            
            const [fileCount, lineCount] = stdout.trim().split('\n').map(s => parseInt(s.trim(), 10));
            
            resolve({
                totalFiles: fileCount || 0,
                totalLines: lineCount || 0,
                // Rough estimate of tokens
                totalTokens: Math.round((lineCount || 0) * 2.5 * 4) 
            });
        });
    });
  }
}

// CLI Execution
if (require.main === module) {
  const overview = new ProjectOverview();
  overview.generateSummary();
}

module.exports = { ProjectOverview }; 