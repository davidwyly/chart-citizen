#!/usr/bin/env node

/**
 * Context Tracer 🧬
 * 
 * AI-optimized tool for understanding data flow and component relationships.
 * Essential for debugging and understanding complex interactions.
 * 
 * Usage: npm run trace-context -- "ComponentName" --flow=both
 *        npm run trace-context -- "handleSubmit" --depth=3
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class ContextTracer {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || [
        'node_modules/**', 
        'dist/**', 
        'build/**', 
        '.next/**',
        'analysis-results/**'
      ],
      maxDepth: options.maxDepth || 4,
      flowDirection: options.flowDirection || 'both', // 'up', 'down', 'both'
      ...options
    };
    
    this.results = {
      target: null,
      dataFlow: {
        upstream: [],   // Where data comes FROM
        downstream: [], // Where data goes TO
      },
      componentTree: {
        parents: [],    // Components that use this
        children: [],   // Components this uses
      },
      stateFlow: [],    // State management patterns
      eventFlow: [],    // Event handling chains
      propChains: [],   // Prop drilling analysis
      recommendations: [],
      metrics: {}
    };
    
    this.fileCache = new Map();
    this.symbolMap = new Map();
  }

  /**
   * Trace context for a given symbol/component
   */
  async traceContext(target, options = {}) {
    console.log(`🧬 Tracing context for: ${target}`);
    const startTime = Date.now();
    
    this.results.target = target;
    this.options = { ...this.options, ...options };
    
    // Build file and symbol maps
    await this.buildContextMaps();
    
    // Trace different types of context
    await this.traceDataFlow(target);
    await this.traceComponentRelationships(target);
    await this.traceStateFlow(target);
    await this.traceEventFlow(target);
    await this.analyzePropChains(target);
    
    this.generateRecommendations();
    this.calculateMetrics();
    
    const endTime = Date.now();
    this.results.metrics.analysisTime = `${endTime - startTime}ms`;
    
    return this.results;
  }

  async buildContextMaps() {
    const files = await this.discoverFiles();
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeFile(filePath, content);
        this.fileCache.set(filePath, analysis);
        
        // Build symbol location map
        analysis.symbols.forEach(symbol => {
          if (!this.symbolMap.has(symbol.name)) {
            this.symbolMap.set(symbol.name, []);
          }
          this.symbolMap.get(symbol.name).push({
            file: filePath,
            type: symbol.type,
            line: symbol.line,
            context: symbol.context
          });
        });
        
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  analyzeFile(filePath, content) {
    const lines = content.split('\n');
    
    return {
      path: filePath,
      isReact: this.isReactFile(content),
      isHook: filePath.includes('hook') || /use[A-Z]/.test(content),
      symbols: this.extractSymbols(content, lines),
      imports: this.extractImports(content, filePath),
      exports: this.extractExports(content),
      props: this.extractProps(content),
      state: this.extractStateUsage(content),
      events: this.extractEventHandlers(content),
      apiCalls: this.extractApiCalls(content),
      hooks: this.extractHookUsage(content)
    };
  }

  extractSymbols(content, lines) {
    const symbols = [];
    const patterns = [
      { regex: /(?:function|const|let|var)\s+(\w+)/g, type: 'function' },
      { regex: /class\s+(\w+)/g, type: 'class' },
      { regex: /interface\s+(\w+)/g, type: 'interface' },
      { regex: /type\s+(\w+)/g, type: 'type' },
      { regex: /<(\w+)[\s>]/g, type: 'component' },
      { regex: /\.(\w+)\s*\(/g, type: 'method' },
      { regex: /(\w+):\s*\w+/g, type: 'property' }
    ];

    lines.forEach((line, lineNum) => {
      patterns.forEach(({ regex, type }) => {
        let match;
        regex.lastIndex = 0; // Reset regex
        while ((match = regex.exec(line)) !== null) {
          const symbol = match[1];
          if (symbol && symbol.length > 1 && !this.isCommonKeyword(symbol)) {
            symbols.push({
              name: symbol,
              type,
              line: lineNum + 1,
              context: line.trim()
            });
          }
        }
      });
    });

    return symbols;
  }

  extractProps(content) {
    const props = [];
    
    // React prop patterns
    const propPatterns = [
      /(\w+):\s*[\w\[\]<>|&\s]+[,}]/g,  // TypeScript props
      /props\.(\w+)/g,                   // props.something
      /{\s*(\w+)\s*}/g,                  // Destructured props (context dependent)
    ];

    propPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 0) { // TypeScript interface props
          props.push({ name: match[1], type: 'interface', source: 'definition' });
        } else if (index === 1) { // props.something
          props.push({ name: match[1], type: 'access', source: 'usage' });
        }
      }
    });

    return props;
  }

  extractStateUsage(content) {
    const stateUsage = [];
    const patterns = [
      /useState\s*<([^>]+)>\s*\(\s*([^)]*)\s*\)/g,     // useState<T>(initial)
      /useState\s*\(\s*([^)]*)\s*\)/g,                 // useState(initial)
      /useReducer\s*\(/g,                              // useReducer
      /useContext\s*\(\s*(\w+)/g,                      // useContext(Context)
      /(\w+)Store\s*\(/g,                              // Zustand stores
      /use\w+Store\s*\(/g,                             // Store hooks
      /setState\s*\(/g,                                // setState calls
      /set\w+\s*\(/g,                                  // Setter functions
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let type = 'unknown';
        let details = {};
        
        switch (index) {
          case 0: // useState with type
            type = 'useState';
            details = { stateType: match[1], initial: match[2] };
            break;
          case 1: // useState without type
            type = 'useState';
            details = { initial: match[1] };
            break;
          case 2: // useReducer
            type = 'useReducer';
            break;
          case 3: // useContext
            type = 'useContext';
            details = { context: match[1] };
            break;
          case 4: // Zustand store
            type = 'zustand';
            details = { store: match[1] };
            break;
          case 5: // Store hooks
            type = 'store-hook';
            break;
          case 6: // setState
            type = 'setState';
            break;
          case 7: // Setters
            type = 'setter';
            break;
        }
        
        stateUsage.push({ type, details, context: match[0] });
      }
    });

    return stateUsage;
  }

  extractEventHandlers(content) {
    const events = [];
    const patterns = [
      /on(\w+)=\{([^}]+)\}/g,           // onClick={handler}
      /handle(\w+)/g,                   // handleSubmit, handleClick
      /(\w+)\.addEventListener/g,       // addEventListener
      /(\w+)\.on\(/g,                   // .on( event listeners
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let type = 'unknown';
        let details = {};
        
        switch (index) {
          case 0: // React event props
            type = 'react-event';
            details = { event: match[1], handler: match[2] };
            break;
          case 1: // Handle functions
            type = 'handler-function';
            details = { event: match[1] };
            break;
          case 2: // addEventListener
            type = 'dom-event';
            details = { element: match[1] };
            break;
          case 3: // Event emitter pattern
            type = 'event-emitter';
            details = { emitter: match[1] };
            break;
        }
        
        events.push({ type, details, context: match[0] });
      }
    });

    return events;
  }

  extractApiCalls(content) {
    const apiCalls = [];
    const patterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,    // fetch calls
      /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g, // axios calls
      /api\.\w+\s*\(/g,                        // api.something()
      /use\w+Query\s*\(/g,                     // React Query hooks
      /useSWR\s*\(/g,                          // SWR hooks
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let type = 'unknown';
        let details = {};
        
        switch (index) {
          case 0: // fetch
            type = 'fetch';
            details = { url: match[1] };
            break;
          case 1: // axios
            type = 'axios';
            details = { url: match[1] };
            break;
          case 2: // api methods
            type = 'api-method';
            break;
          case 3: // React Query
            type = 'react-query';
            break;
          case 4: // SWR
            type = 'swr';
            break;
        }
        
        apiCalls.push({ type, details, context: match[0] });
      }
    });

    return apiCalls;
  }

  extractHookUsage(content) {
    const hooks = [];
    const pattern = /use\w+\s*\(/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const hookName = match[0].replace(/\s*\($/, '');
      hooks.push({
        name: hookName,
        context: match[0]
      });
    }
    
    return hooks;
  }

  async traceDataFlow(target) {
    const locations = this.symbolMap.get(target) || [];
    
    for (const location of locations) {
      const fileAnalysis = this.fileCache.get(location.file);
      
      // Trace upstream (where data comes from)
      if (this.options.flowDirection === 'up' || this.options.flowDirection === 'both') {
        await this.traceUpstream(target, location, fileAnalysis, 0);
      }
      
      // Trace downstream (where data goes to)
      if (this.options.flowDirection === 'down' || this.options.flowDirection === 'both') {
        await this.traceDownstream(target, location, fileAnalysis, 0);
      }
    }
  }

  async traceUpstream(target, location, fileAnalysis, depth) {
    if (depth >= this.options.maxDepth) return;
    
    // Find where this symbol gets its data from
    const sources = [];
    
    // Check props
    fileAnalysis.props.forEach(prop => {
      if (prop.name === target || prop.name.includes(target)) {
        sources.push({
          type: 'prop',
          source: `Parent component`,
          file: this.relativePath(location.file),
          depth,
          details: prop
        });
      }
    });
    
    // Check state
    fileAnalysis.state.forEach(state => {
      if (state.context.includes(target)) {
        sources.push({
          type: 'state',
          source: `${state.type} in ${this.relativePath(location.file)}`,
          file: this.relativePath(location.file),
          depth,
          details: state
        });
      }
    });
    
    // Check API calls
    fileAnalysis.apiCalls.forEach(api => {
      if (api.context.includes(target)) {
        sources.push({
          type: 'api',
          source: `${api.type} call`,
          file: this.relativePath(location.file),
          depth,
          details: api
        });
      }
    });
    
    this.results.dataFlow.upstream.push(...sources);
  }

  async traceDownstream(target, location, fileAnalysis, depth) {
    if (depth >= this.options.maxDepth) return;
    
    // Find where this symbol's data goes
    const destinations = [];
    
    // Check if it's passed as props
    for (const [filePath, analysis] of this.fileCache) {
      analysis.imports.forEach(imp => {
        if (imp.symbol === target && imp.path === location.file) {
          destinations.push({
            type: 'import',
            destination: `Imported in ${this.relativePath(filePath)}`,
            file: this.relativePath(filePath),
            depth,
            details: imp
          });
        }
      });
    }
    
    // Check if it's used in JSX
    const content = fs.readFileSync(location.file, 'utf8');
    const jsxPattern = new RegExp(`<\\w+[^>]*\\b${target}\\b[^>]*>`, 'g');
    let match;
    while ((match = jsxPattern.exec(content)) !== null) {
      destinations.push({
        type: 'jsx-prop',
        destination: `Passed as prop in JSX`,
        file: this.relativePath(location.file),
        depth,
        context: match[0]
      });
    }
    
    this.results.dataFlow.downstream.push(...destinations);
  }

  async traceComponentRelationships(target) {
    const locations = this.symbolMap.get(target) || [];
    
    for (const location of locations) {
      if (location.type === 'component') {
        await this.findComponentParents(target, location);
        await this.findComponentChildren(target, location);
      }
    }
  }

  async findComponentParents(target, location) {
    // Find components that use this component
    for (const [filePath, analysis] of this.fileCache) {
      const content = fs.readFileSync(filePath, 'utf8');
      const componentPattern = new RegExp(`<${target}[\\s>]`, 'g');
      
      if (componentPattern.test(content)) {
        this.results.componentTree.parents.push({
          component: this.getComponentName(filePath),
          file: this.relativePath(filePath),
          usage: 'JSX element'
        });
      }
      
      // Check imports
      analysis.imports.forEach(imp => {
        if (imp.symbol === target) {
          this.results.componentTree.parents.push({
            component: this.getComponentName(filePath),
            file: this.relativePath(filePath),
            usage: 'Import'
          });
        }
      });
    }
  }

  async findComponentChildren(target, location) {
    // Find components that this component uses
    const fileAnalysis = this.fileCache.get(location.file);
    const content = fs.readFileSync(location.file, 'utf8');
    
    // Find JSX components used
    const jsxPattern = /<(\w+)[\s>]/g;
    let match;
    while ((match = jsxPattern.exec(content)) !== null) {
      const childComponent = match[1];
      if (childComponent[0] === childComponent[0].toUpperCase()) { // React component
        this.results.componentTree.children.push({
          component: childComponent,
          file: this.relativePath(location.file),
          usage: 'JSX element'
        });
      }
    }
    
    // Find imported components
    fileAnalysis.imports.forEach(imp => {
      if (imp.type === 'named' || imp.type === 'default') {
        this.results.componentTree.children.push({
          component: imp.symbol,
          file: this.relativePath(location.file),
          usage: 'Import'
        });
      }
    });
  }

  async traceStateFlow(target) {
    // Trace state management patterns
    for (const [filePath, analysis] of this.fileCache) {
      analysis.state.forEach(state => {
        if (state.context.includes(target) || state.details.context === target) {
          this.results.stateFlow.push({
            type: state.type,
            file: this.relativePath(filePath),
            details: state.details,
            context: state.context
          });
        }
      });
    }
  }

  async traceEventFlow(target) {
    // Trace event handling patterns
    for (const [filePath, analysis] of this.fileCache) {
      analysis.events.forEach(event => {
        if (event.context.includes(target) || event.details.handler === target) {
          this.results.eventFlow.push({
            type: event.type,
            file: this.relativePath(filePath),
            details: event.details,
            context: event.context
          });
        }
      });
    }
  }

  async analyzePropChains(target) {
    // Find prop drilling patterns
    const propUsages = [];
    
    for (const [filePath, analysis] of this.fileCache) {
      analysis.props.forEach(prop => {
        if (prop.name === target || prop.name.includes(target)) {
          propUsages.push({
            file: this.relativePath(filePath),
            type: prop.type,
            source: prop.source
          });
        }
      });
    }
    
    // Analyze if props are being passed through multiple levels
    if (propUsages.length > 2) {
      this.results.propChains.push({
        prop: target,
        levels: propUsages.length,
        files: propUsages.map(usage => usage.file),
        recommendation: 'Consider using Context API or state management'
      });
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Data flow recommendations
    if (this.results.dataFlow.upstream.length > 5) {
      recommendations.push('Complex data flow - consider simplifying data sources');
    }
    
    if (this.results.dataFlow.downstream.length > 8) {
      recommendations.push('Wide data distribution - consider using Context or global state');
    }
    
    // Component recommendations
    if (this.results.componentTree.children.length > 10) {
      recommendations.push('Large component - consider breaking into smaller components');
    }
    
    // Prop drilling recommendations
    if (this.results.propChains.length > 0) {
      recommendations.push('Prop drilling detected - consider Context API or state management');
    }
    
    // State recommendations
    const stateTypes = [...new Set(this.results.stateFlow.map(s => s.type))];
    if (stateTypes.length > 3) {
      recommendations.push('Multiple state patterns - consider standardizing state management');
    }
    
    this.results.recommendations = recommendations;
  }

  calculateMetrics() {
    this.results.metrics = {
      ...this.results.metrics,
      upstreamSources: this.results.dataFlow.upstream.length,
      downstreamTargets: this.results.dataFlow.downstream.length,
      parentComponents: this.results.componentTree.parents.length,
      childComponents: this.results.componentTree.children.length,
      statePatterns: this.results.stateFlow.length,
      eventHandlers: this.results.eventFlow.length,
      propChainsDetected: this.results.propChains.length,
      filesAnalyzed: this.fileCache.size
    };
  }

  // Helper methods
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

    return [...new Set(allFiles)];
  }

  extractImports(content, fromFile) {
    const imports = [];
    const importPattern = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))?\s*from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      if (this.isLocalImport(importPath)) {
        const resolved = this.resolveImportPath(fromFile, importPath);
        if (resolved) {
          // Extract imported symbols
          const symbolMatch = content.match(new RegExp(`import\\s+([^}]+)\\s+from\\s+['"\`]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`));
          if (symbolMatch) {
            const symbolsPart = symbolMatch[1];
            if (symbolsPart.includes('{')) {
              // Named imports
              const namedImports = symbolsPart.match(/{([^}]+)}/);
              if (namedImports) {
                const symbols = namedImports[1].split(',').map(s => s.trim().split(' as ')[0]);
                symbols.forEach(symbol => {
                  imports.push({ symbol, path: resolved, type: 'named' });
                });
              }
            } else {
              // Default import
              const symbol = symbolsPart.trim();
              imports.push({ symbol, path: resolved, type: 'default' });
            }
          }
        }
      }
    }

    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g,
      /export\s+default\s+(\w+)/g
    ];

    exportPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (index === 1) { // Export list
          const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
          names.forEach(name => exports.push({ name, type: 'named' }));
        } else {
          exports.push({ name: match[1], type: index === 2 ? 'default' : 'named' });
        }
      }
    });

    return exports;
  }

  isReactFile(content) {
    return content.includes('React') || content.includes('JSX') || content.includes('tsx');
  }

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
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    for (const ext of extensions) {
      if (fs.existsSync(path.join(resolved, 'index' + ext))) {
        return path.join(resolved, 'index' + ext);
      }
    }
    
    return fs.existsSync(resolved) ? resolved : null;
  }

  getComponentName(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.charAt(0).toUpperCase() + basename.slice(1);
  }

  isCommonKeyword(word) {
    const keywords = ['if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function', 'class', 'import', 'export', 'from', 'as', 'in', 'of', 'true', 'false', 'null', 'undefined'];
    return keywords.includes(word.toLowerCase()) || word.length < 2;
  }

  relativePath(filePath) {
    return path.relative(this.options.rootDir, filePath);
  }

  /**
   * Generate AI-optimized report
   */
  generateReport() {
    const { target, dataFlow, componentTree, stateFlow, eventFlow, propChains, recommendations, metrics } = this.results;
    
    return `# Context Trace Analysis 🧬

**Target**: \`${target}\`
**Analysis Time**: ${metrics.analysisTime}

## 🌊 Data Flow Summary
- **Upstream Sources**: ${metrics.upstreamSources} (where data comes FROM)
- **Downstream Targets**: ${metrics.downstreamTargets} (where data goes TO)
- **Component Parents**: ${metrics.parentComponents} 
- **Component Children**: ${metrics.childComponents}
- **State Patterns**: ${metrics.statePatterns}
- **Event Handlers**: ${metrics.eventHandlers}

## 📥 Upstream Data Flow (${dataFlow.upstream.length} sources)
${dataFlow.upstream.length === 0 ? 'No upstream sources found.' : dataFlow.upstream.slice(0, 8).map(source => 
  `- **${source.type}**: ${source.source} (${source.file})`
).join('\n')}
${dataFlow.upstream.length > 8 ? `\n... and ${dataFlow.upstream.length - 8} more` : ''}

## 📤 Downstream Data Flow (${dataFlow.downstream.length} destinations)
${dataFlow.downstream.length === 0 ? 'No downstream destinations found.' : dataFlow.downstream.slice(0, 8).map(dest => 
  `- **${dest.type}**: ${dest.destination} (${dest.file})`
).join('\n')}
${dataFlow.downstream.length > 8 ? `\n... and ${dataFlow.downstream.length - 8} more` : ''}

## 🏗️ Component Relationships

### Parents (${componentTree.parents.length} components use this)
${componentTree.parents.length === 0 ? 'No parent components found.' : componentTree.parents.slice(0, 6).map(parent => 
  `- **${parent.component}** (${parent.file}) - ${parent.usage}`
).join('\n')}

### Children (${componentTree.children.length} components used by this)
${componentTree.children.length === 0 ? 'No child components found.' : componentTree.children.slice(0, 6).map(child => 
  `- **${child.component}** - ${child.usage}`
).join('\n')}

## 🔄 State Management (${stateFlow.length} patterns)
${stateFlow.length === 0 ? 'No state patterns found.' : stateFlow.slice(0, 5).map(state => 
  `- **${state.type}** in ${state.file}`
).join('\n')}

## ⚡ Event Handling (${eventFlow.length} handlers)
${eventFlow.length === 0 ? 'No event handlers found.' : eventFlow.slice(0, 5).map(event => 
  `- **${event.type}** in ${event.file}`
).join('\n')}

## 🔗 Prop Chains (${propChains.length} chains detected)
${propChains.length === 0 ? 'No prop drilling detected.' : propChains.map(chain => 
  `- **${chain.prop}** passed through ${chain.levels} levels\n  Files: ${chain.files.slice(0, 3).join(' → ')}${chain.files.length > 3 ? '...' : ''}\n  💡 ${chain.recommendation}`
).join('\n\n')}

## 💡 Recommendations
${recommendations.length === 0 ? 'No specific recommendations.' : recommendations.map(rec => `- ${rec}`).join('\n')}

## 📊 Analysis Metrics
- **Files Analyzed**: ${metrics.filesAnalyzed}
- **Upstream Sources**: ${metrics.upstreamSources}
- **Downstream Targets**: ${metrics.downstreamTargets}
- **Component Relationships**: ${metrics.parentComponents + metrics.childComponents}
- **Prop Chains**: ${metrics.propChainsDetected}

*Generated on ${new Date().toISOString()}*
`;
  }
}

// CLI interface
if (require.main === module) {
  const target = process.argv[2];
  
  if (!target) {
    console.log('Usage: npm run trace-context -- "ComponentName"');
    console.log('       npm run trace-context -- "handleSubmit" --flow=both --depth=3');
    process.exit(1);
  }
  
  const options = {};
  const args = process.argv.slice(3);
  
  args.forEach(arg => {
    if (arg.startsWith('--flow=')) {
      options.flowDirection = arg.split('=')[1];
    } else if (arg.startsWith('--depth=')) {
      options.maxDepth = parseInt(arg.split('=')[1]);
    }
  });
  
  const outputDir = path.join(process.cwd(), 'analysis-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const tracer = new ContextTracer({
    rootDir: process.cwd(),
    ...options
  });

  tracer.traceContext(target, options).then(() => {
    const report = tracer.generateReport();
    const reportPath = path.join(outputDir, 'context-trace-report.md');
    fs.writeFileSync(reportPath, report);
    
    if (process.argv.includes('--json')) {
      const jsonPath = path.join(outputDir, 'context-trace.json');
      fs.writeFileSync(jsonPath, JSON.stringify(tracer.results, null, 2));
    }
    
    console.log('\n' + report);
    console.log(`\n📁 Report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = ContextTracer;