#!/usr/bin/env node

/**
 * Project Intelligence Engine 🧠
 * 
 * Maintains persistent architectural knowledge to prevent context drift.
 * Creates a living document of project structure, patterns, and integration flows.
 * 
 * Usage: npm run project-intel
 *        npm run project-intel --update
 *        npm run project-intel --validate
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class ProjectIntelligence {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      intelFile: options.intelFile || path.join(process.cwd(), 'PROJECT-INTELLIGENCE.md'),
      configFile: options.configFile || path.join(process.cwd(), '.project-intel.json'),
      writeFiles: options.writeFiles || false,
      ...options
    };
    
    this.intelligence = {
      lastUpdated: null,
      architecture: {
        coreComponents: [],
        dataFlow: [],
        integrationPoints: [],
        boundaryRules: []
      },
      patterns: {
        established: [],
        deprecated: [],
        emerging: []
      },
      legacy: {
        systems: [],
        migrations: [],
        deadEnds: []
      },
      context: {
        projectType: null,
        primaryFrameworks: [],
        architecturalStyle: null,
        keyDirectories: []
      },
      metrics: {
        architecturalHealth: 0,
        contextComplexity: 0,
        integrationRisk: 'low'
      }
    };
    
    this.config = {
      architecturalRules: [],
      criticalPaths: [],
      boundaryDefinitions: {},
      deprecationPolicy: {},
      contextPreservation: {}
    };
  }

  /**
   * Build or update project intelligence
   */
  async buildIntelligence(mode = 'analyze') {
    console.log('🧠 Building Project Intelligence...');
    const startTime = Date.now();
    
    // Load existing intelligence if available
    if (mode === 'update') {
      await this.loadExistingIntelligence();
    }
    
    // Analyze current project state
    await this.analyzeProjectStructure();
    await this.identifyArchitecturalPatterns();
    await this.mapDataFlows();
    await this.detectLegacySystems();
    await this.assessArchitecturalHealth();
    
    // Generate persistent documentation
    await this.generateIntelligenceReport();
    await this.updateContextualGuidance();
    
    const endTime = Date.now();
    console.log(`✅ Intelligence built in ${endTime - startTime}ms`);
    
    return this.intelligence;
  }

  async loadExistingIntelligence() {
    try {
      if (fs.existsSync(this.options.configFile)) {
        const content = fs.readFileSync(this.options.configFile, 'utf8');
        const existing = JSON.parse(content);
        
        // Preserve historical context
        this.intelligence.patterns.deprecated = existing.patterns?.deprecated || [];
        this.intelligence.legacy.migrations = existing.legacy?.migrations || [];
        this.intelligence.architecture.boundaryRules = existing.architecture?.boundaryRules || [];
      }
    } catch (error) {
      console.warn('⚠️ Could not load existing intelligence, starting fresh');
    }
  }

  async analyzeProjectStructure() {
    const packageJson = await this.loadPackageJson();
    const directories = await this.analyzeDirectoryStructure();
    
    // Identify project type and core frameworks
    this.intelligence.context = {
      projectType: this.identifyProjectType(packageJson, directories),
      primaryFrameworks: this.identifyFrameworks(packageJson),
      architecturalStyle: this.identifyArchitecturalStyle(directories),
      keyDirectories: directories.important
    };
    
    // Identify core components
    this.intelligence.architecture.coreComponents = await this.identifyCoreComponents(directories);
  }

  async loadPackageJson() {
    try {
      const content = fs.readFileSync(path.join(this.options.rootDir, 'package.json'), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  async analyzeDirectoryStructure() {
    const dirs = glob.sync('*/', { cwd: this.options.rootDir });
    const analysis = {
      all: dirs,
      important: [],
      patterns: {}
    };
    
    // Identify important directories
    const importantPatterns = [
      'src', 'app', 'pages', 'components', 'engine', 'lib', 'utils',
      'services', 'hooks', 'types', 'api', 'core', 'features'
    ];
    
    dirs.forEach(dir => {
      const cleanDir = dir.replace('/', '');
      if (importantPatterns.some(pattern => cleanDir.includes(pattern))) {
        analysis.important.push(cleanDir);
      }
    });
    
    // Analyze directory patterns
    analysis.patterns = {
      hasComponents: dirs.some(d => d.includes('component')),
      hasEngine: dirs.some(d => d.includes('engine')),
      hasFeatures: dirs.some(d => d.includes('feature')),
      hasServices: dirs.some(d => d.includes('service')),
      hasTypes: dirs.some(d => d.includes('type'))
    };
    
    return analysis;
  }

  identifyProjectType(packageJson, directories) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['next'] || deps['@next/']) return 'Next.js Application';
    if (deps['react'] && deps['@react-three/fiber']) return '3D React Application';
    if (deps['react'] && !deps['next']) return 'React Application';
    if (deps['vue']) return 'Vue Application';
    if (deps['angular']) return 'Angular Application';
    if (deps['express'] || deps['fastify']) return 'Node.js API';
    
    return 'JavaScript Project';
  }

  identifyFrameworks(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const frameworks = [];
    
    if (deps['react']) frameworks.push('React');
    if (deps['next']) frameworks.push('Next.js');
    if (deps['@react-three/fiber']) frameworks.push('React Three Fiber');
    if (deps['three']) frameworks.push('Three.js');
    if (deps['typescript']) frameworks.push('TypeScript');
    if (deps['tailwindcss']) frameworks.push('Tailwind CSS');
    if (deps['vitest']) frameworks.push('Vitest');
    
    return frameworks;
  }

  identifyArchitecturalStyle(directories) {
    const patterns = directories.patterns;
    
    if (patterns.hasEngine && patterns.hasComponents) return 'Engine-Component Architecture';
    if (patterns.hasFeatures) return 'Feature-Based Architecture';
    if (patterns.hasServices) return 'Service-Oriented Architecture';
    if (patterns.hasComponents) return 'Component-Based Architecture';
    
    return 'Modular Architecture';
  }

  async identifyCoreComponents(directories) {
    const coreComponents = [];
    
    // Find main entry points
    const entryPoints = [
      'app/page.tsx', 'app/layout.tsx', 'src/index.ts', 'src/main.ts',
      'index.ts', 'index.js', 'pages/index.tsx'
    ];
    
    for (const entry of entryPoints) {
      if (fs.existsSync(path.join(this.options.rootDir, entry))) {
        coreComponents.push({
          type: 'entryPoint',
          file: entry,
          role: 'Application Entry'
        });
      }
    }
    
    // Find core engine/service files
    const engineFiles = glob.sync('**/engine/**/*.{ts,tsx}', {
      cwd: this.options.rootDir,
      ignore: ['**/__tests__/**', '**/node_modules/**']
    });
    
    // Identify the most imported files as core components
    const importCounts = new Map();
    const allFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.options.rootDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
    });
    
    allFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(this.options.rootDir, file), 'utf8');
        const localImports = this.extractLocalImports(content);
        
        localImports.forEach(imp => {
          importCounts.set(imp, (importCounts.get(imp) || 0) + 1);
        });
      } catch (error) {
        // Skip unreadable files
      }
    });
    
    // Top 10 most imported files are likely core components
    const topImports = Array.from(importCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    topImports.forEach(([file, count]) => {
      if (count > 3) { // Only if imported by multiple files
        coreComponents.push({
          type: 'coreModule',
          file,
          role: 'Shared Component',
          importCount: count
        });
      }
    });
    
    return coreComponents;
  }

  extractLocalImports(content) {
    const imports = [];
    const importPattern = /import.*from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        imports.push(importPath);
      }
    }
    
    return imports;
  }

  async identifyArchitecturalPatterns() {
    const patterns = {
      established: [],
      deprecated: [],
      emerging: []
    };
    
    // Scan for common patterns
    const allFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.options.rootDir,
      ignore: ['**/node_modules/**', '**/dist/**']
    });
    
    const patternCounts = {
      'React Hooks': 0,
      'Context API': 0,
      'Custom Hooks': 0,
      'Higher-Order Components': 0,
      'Render Props': 0,
      'Component Composition': 0,
      'Factory Pattern': 0,
      'Observer Pattern': 0,
      'Module Pattern': 0
    };
    
    allFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(this.options.rootDir, file), 'utf8');
        
        // Count pattern usage
        if (content.includes('useState') || content.includes('useEffect')) patternCounts['React Hooks']++;
        if (content.includes('createContext') || content.includes('useContext')) patternCounts['Context API']++;
        if (/export\s+function\s+use[A-Z]/.test(content)) patternCounts['Custom Hooks']++;
        if (content.includes('Higher-Order') || /\w+\(Component\)/.test(content)) patternCounts['Higher-Order Components']++;
        if (content.includes('children') && content.includes('render')) patternCounts['Render Props']++;
        if (content.includes('composition') || content.includes('compose')) patternCounts['Component Composition']++;
        if (content.includes('Factory') || content.includes('create') && content.includes('()')) patternCounts['Factory Pattern']++;
        if (content.includes('Observer') || content.includes('subscribe')) patternCounts['Observer Pattern']++;
        if (content.includes('module.exports') || content.includes('export')) patternCounts['Module Pattern']++;
        
      } catch (error) {
        // Skip unreadable files
      }
    });
    
    // Categorize patterns by usage
    Object.entries(patternCounts).forEach(([pattern, count]) => {
      if (count > 10) patterns.established.push({ name: pattern, usage: count });
      else if (count > 3) patterns.emerging.push({ name: pattern, usage: count });
    });
    
    this.intelligence.patterns = patterns;
  }

  async mapDataFlows() {
    const dataFlows = [];
    
    // Find React component prop flows
    const componentFlows = await this.analyzeComponentDataFlow();
    dataFlows.push(...componentFlows);
    
    // Find service/API data flows  
    const serviceFlows = await this.analyzeServiceDataFlow();
    dataFlows.push(...serviceFlows);
    
    // Find state management flows
    const stateFlows = await this.analyzeStateDataFlow();
    dataFlows.push(...stateFlows);
    
    this.intelligence.architecture.dataFlow = dataFlows;
  }

  async analyzeComponentDataFlow() {
    // This would analyze how props flow between components
    // For now, return basic structure
    return [
      {
        type: 'component-props',
        description: 'Props flowing between React components',
        complexity: 'medium'
      }
    ];
  }

  async analyzeServiceDataFlow() {
    // This would analyze API calls and service interactions
    return [
      {
        type: 'api-calls',
        description: 'Data flowing through API endpoints',
        complexity: 'low'
      }
    ];
  }

  async analyzeStateDataFlow() {
    // This would analyze state management patterns
    return [
      {
        type: 'state-management',
        description: 'State updates and subscriptions',
        complexity: 'medium'
      }
    ];
  }

  async detectLegacySystems() {
    const legacySystems = [];
    
    // CRITICAL: Whitelist essential project files
    const essentialFiles = [
      'CLAUDE.md',
      'README.md',
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'AI-DEVELOPMENT-GUIDE.md',
      'PROJECT-INTELLIGENCE.md',
      'AI-CONTEXT.md'
    ];
    
    // Look for deprecated markers
    const allFiles = glob.sync('**/*.{ts,tsx,js,jsx,md}', {
      cwd: this.options.rootDir,
      ignore: ['**/node_modules/**']
    });
    
    allFiles.forEach(file => {
      try {
        // Skip essential project files
        const fileName = path.basename(file);
        if (essentialFiles.includes(fileName)) return;
        
        const content = fs.readFileSync(path.join(this.options.rootDir, file), 'utf8');
        
        if (content.includes('@deprecated') || content.includes('TODO: remove') || 
            content.includes('LEGACY') || content.includes('FIXME')) {
          legacySystems.push({
            file,
            type: 'deprecated-code',
            markers: this.extractDeprecationMarkers(content)
          });
        }
      } catch (error) {
        // Skip unreadable files
      }
    });
    
    this.intelligence.legacy.systems = legacySystems;
  }

  extractDeprecationMarkers(content) {
    const markers = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('@deprecated') || line.includes('TODO: remove') || 
          line.includes('LEGACY') || line.includes('FIXME')) {
        markers.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    return markers;
  }

  async assessArchitecturalHealth() {
    let health = 100;
    let complexity = 0;
    let risk = 'low';
    
    // Deduct for legacy systems
    const legacyCount = this.intelligence.legacy.systems.length;
    if (legacyCount > 10) health -= 30;
    else if (legacyCount > 5) health -= 15;
    
    // Assess pattern consistency
    const establishedPatterns = this.intelligence.patterns.established.length;
    const emergingPatterns = this.intelligence.patterns.emerging.length;
    
    if (emergingPatterns > establishedPatterns) {
      health -= 20;
      complexity += 2;
    }
    
    // Assess core component coupling
    const coreComponents = this.intelligence.architecture.coreComponents.length;
    if (coreComponents > 20) {
      complexity += 3;
      risk = 'high';
    } else if (coreComponents > 10) {
      complexity += 1;
      risk = 'medium';
    }
    
    this.intelligence.metrics = {
      architecturalHealth: Math.max(0, health),
      contextComplexity: complexity,
      integrationRisk: risk
    };
  }

  async generateIntelligenceReport() {
    const { architecture, patterns, legacy, context, metrics } = this.intelligence;
    
    const report = `# Project Intelligence Report 🧠

*Last Updated: ${new Date().toISOString()}*

## 🏗️ Architectural Overview

**Project Type**: ${context.projectType}
**Architectural Style**: ${context.architecturalStyle}
**Primary Frameworks**: ${context.primaryFrameworks.join(', ')}

### Health Metrics
- **Architectural Health**: ${metrics.architecturalHealth}/100
- **Context Complexity**: ${metrics.contextComplexity}/10
- **Integration Risk**: ${metrics.integrationRisk.toUpperCase()}

## 🎯 Core Components (${architecture.coreComponents.length})

${architecture.coreComponents.map(comp => 
  `- **${comp.file}** (${comp.type}) - ${comp.role}${comp.importCount ? ` - ${comp.importCount} imports` : ''}`
).join('\n')}

## 📐 Established Patterns (${patterns.established.length})

${patterns.established.map(pattern => 
  `- **${pattern.name}**: ${pattern.usage} usages`
).join('\n')}

## 🔄 Data Flow Architecture

${architecture.dataFlow.map(flow => 
  `- **${flow.type}**: ${flow.description} (${flow.complexity} complexity)`
).join('\n')}

## ⚠️ Legacy Systems (${legacy.systems.length})

${legacy.systems.slice(0, 5).map(system => 
  `- **${system.file}** - ${system.markers.length} deprecation markers`
).join('\n')}
${legacy.systems.length > 5 ? `\n... and ${legacy.systems.length - 5} more legacy files` : ''}

## 🚀 Architectural Guidelines

### Core Principles
1. **${context.architecturalStyle}** - Maintain this architectural style consistently
2. **Component Boundaries** - Keep components focused and composable  
3. **Data Flow** - Follow established patterns for state and props
4. **Legacy Migration** - Gradually replace deprecated systems

### Integration Rules
- All new components should follow established patterns
- Avoid creating new architectural patterns without team consensus
- Deprecate legacy systems gradually with migration plans
- Maintain clear boundaries between engine and application code

### Context Preservation
- This intelligence should be updated after major architectural changes
- Use \`npm run project-intel --update\` to refresh understanding
- Reference this document before major refactoring decisions
- Validate changes against established patterns

## 🎯 AI Development Guidelines

### Before Making Changes
1. Review this intelligence report for context
2. Run impact analysis on affected components  
3. Verify changes align with established patterns
4. Check for legacy system interactions

### During Development
1. Follow established architectural patterns
2. Avoid creating duplicate implementations
3. Update deprecation markers for old code
4. Maintain component boundary rules

### After Changes
1. Update this intelligence if architecture changed
2. Document new patterns if introduced
3. Update legacy system status
4. Validate overall architectural health

*This document maintains AI context across sessions to prevent architectural drift.*
`;

    if (this.options.writeFiles) {
      fs.writeFileSync(this.options.intelFile, report);
      
      const intelligence = {
        ...this.intelligence,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.options.configFile, JSON.stringify(intelligence, null, 2));
      
      console.log(`📄 Intelligence report saved to: ${this.options.intelFile}`);
    } else {
      console.log(report);
    }
  }

  async updateContextualGuidance() {
    // Create a concise AI context file for immediate reference
    const contextFile = path.join(this.options.rootDir, 'AI-CONTEXT.md');
    
    const context = `# AI Development Context 🧠

**Quick Reference for AI Assistants**

## Project Type: ${this.intelligence.context.projectType}
**Architecture**: ${this.intelligence.context.architecturalStyle}
**Health**: ${this.intelligence.metrics.architecturalHealth}/100

## 🎯 Core Components to Preserve
${this.intelligence.architecture.coreComponents.slice(0, 5).map(comp => 
  `- ${comp.file} (${comp.role})`
).join('\n')}

## 📐 Established Patterns (Use These)
${this.intelligence.patterns.established.slice(0, 3).map(pattern => 
  `- ${pattern.name}`
).join('\n')}

## ⚠️ Legacy Systems (Migrate Away)
${this.intelligence.legacy.systems.slice(0, 3).map(system => 
  `- ${system.file}`
).join('\n')}

## 🚨 Critical Rules
1. Maintain ${this.intelligence.context.architecturalStyle}
2. Follow established patterns only
3. Do not create duplicate implementations
4. Migrate legacy systems gradually

*Run \`npm run project-intel\` for full intelligence report*
`;

    if (this.options.writeFiles) {
      fs.writeFileSync(contextFile, context);
      console.log(`🎯 AI context saved to: ${contextFile}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args.includes('--update') ? 'update' : 
               args.includes('--validate') ? 'validate' : 'analyze';
  const writeFiles = args.includes('--write-files');
  
  const intel = new ProjectIntelligence({ writeFiles });
  
  intel.buildIntelligence(mode).then(() => {
    console.log('🧠 Project Intelligence complete!');
    if (writeFiles) {
      console.log('📄 Check PROJECT-INTELLIGENCE.md for full context');
      console.log('🎯 Check AI-CONTEXT.md for quick AI reference');
    }
  }).catch(error => {
    console.error('❌ Intelligence building failed:', error);
    process.exit(1);
  });
}

module.exports = ProjectIntelligence;