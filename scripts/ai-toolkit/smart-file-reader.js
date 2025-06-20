#!/usr/bin/env node

/**
 * Smart File Reader - Ultimate Token Reduction
 * 
 * Uses filesystem-level filtering to extract only relevant parts of files
 * instead of sending entire files to AI for parsing.
 * 
 * Token Reduction: 80-90% for large files
 * 
 * Examples:
 * - Read just a function: getFunction(file, 'handleSubmit')
 * - Read just exports: getExports(file)
 * - Read just imports: getImports(file)
 * - Read just class: getClass(file, 'UserProfile')
 */

const fs = require('fs');
const path = require('path');

class SmartFileReader {
  constructor() {
    this.cache = new Map();
  }

  // Extract just a specific function from a file
  async getFunction(filePath, functionName) {
    const content = await this.getCachedContent(filePath);
    
    // Match function declarations and arrow functions
    const patterns = [
      // function handleSubmit() { ... }
      new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}`, 'g'),
      // const handleSubmit = () => { ... }
      new RegExp(`const\\s+${functionName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}`, 'g'),
      // export function handleSubmit() { ... }
      new RegExp(`export\\s+function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}`, 'g'),
      // handleSubmit: () => { ... }  (object method)
      new RegExp(`${functionName}\\s*:\\s*\\([^)]*\\)\\s*=>\\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}`, 'g')
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        return {
          function: matches[0],
          file: filePath,
          size: matches[0].length,
          originalSize: content.length,
          reduction: `${Math.round((1 - matches[0].length / content.length) * 100)}%`
        };
      }
    }

    return null;
  }

  // Extract just the exports from a file
  async getExports(filePath) {
    const content = await this.getCachedContent(filePath);
    
    const exports = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('export')) {
        // Get the export statement and any JSDoc above it
        const jsdocLines = [];
        let j = i - 1;
        while (j >= 0 && (lines[j].trim().startsWith('*') || lines[j].trim().startsWith('//'))) {
          jsdocLines.unshift(lines[j]);
          j--;
        }
        
        exports.push({
          line: i + 1,
          export: line.trim(),
          jsdoc: jsdocLines.join('\n'),
          full: jsdocLines.concat([line]).join('\n')
        });
      }
    }
    
    const exportText = exports.map(e => e.full).join('\n\n');
    
    return {
      exports,
      summary: exportText,
      file: filePath,
      size: exportText.length,
      originalSize: content.length,
      reduction: `${Math.round((1 - exportText.length / content.length) * 100)}%`
    };
  }

  // Extract just the imports from a file
  async getImports(filePath) {
    const content = await this.getCachedContent(filePath);
    
    const imports = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match both ES6 imports and CommonJS requires
      if (line.trim().startsWith('import ') || 
          line.includes('require(') && (line.includes('const ') || line.includes('let ') || line.includes('var '))) {
        imports.push({
          line: i + 1,
          import: line.trim()
        });
      }
    }
    
    const importText = imports.map(i => i.import).join('\n');
    
    return {
      imports,
      summary: importText,
      file: filePath,
      size: importText.length,
      originalSize: content.length,
      reduction: `${Math.round((1 - importText.length / content.length) * 100)}%`
    };
  }

  // Extract just a specific class from a file
  async getClass(filePath, className) {
    const content = await this.getCachedContent(filePath);
    
    // Match class declarations
    const classPattern = new RegExp(
      `class\\s+${className}\\s*(?:extends\\s+[^{]+)?\\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}`,
      'g'
    );
    
    const match = content.match(classPattern);
    if (match) {
      return {
        class: match[0],
        file: filePath,
        size: match[0].length,
        originalSize: content.length,
        reduction: `${Math.round((1 - match[0].length / content.length) * 100)}%`
      };
    }
    
    return null;
  }

  // Extract just the interface/type definitions
  async getTypes(filePath) {
    const content = await this.getCachedContent(filePath);
    
    const types = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('interface ') || 
          line.trim().startsWith('type ') ||
          line.trim().startsWith('export interface ') ||
          line.trim().startsWith('export type ')) {
        
        // Extract the full type definition
        let typeDefinition = line;
        let j = i + 1;
        let braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        
        while (j < lines.length && braceCount > 0) {
          typeDefinition += '\n' + lines[j];
          braceCount += (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
          j++;
        }
        
        types.push({
          startLine: i + 1,
          endLine: j,
          definition: typeDefinition
        });
        
        i = j - 1; // Skip the lines we just processed
      }
    }
    
    const typeText = types.map(t => t.definition).join('\n\n');
    
    return {
      types,
      summary: typeText,
      file: filePath,
      size: typeText.length,
      originalSize: content.length,
      reduction: `${Math.round((1 - typeText.length / content.length) * 100)}%`
    };
  }

  // Extract just the component props and return type (for React components)
  async getComponentSignature(filePath, componentName) {
    const content = await this.getCachedContent(filePath);
    
    // Look for component props interface
    const propsPattern = new RegExp(`interface\\s+${componentName}Props\\s*{[^}]*}`, 'g');
    const propsMatch = content.match(propsPattern);
    
    // Look for component definition
    const compPattern = new RegExp(
      `(?:export\\s+)?(?:default\\s+)?(?:function\\s+)?${componentName}\\s*[^{]*{`,
      'g'
    );
    const compMatch = content.match(compPattern);
    
    const signature = [];
    if (propsMatch) signature.push(propsMatch[0]);
    if (compMatch) signature.push(compMatch[0]);
    
    const signatureText = signature.join('\n');
    
    return {
      signature: signatureText,
      file: filePath,
      size: signatureText.length,
      originalSize: content.length,
      reduction: `${Math.round((1 - signatureText.length / content.length) * 100)}%`
    };
  }

  // Get file summary without comments/whitespace
  async getMinified(filePath) {
    const content = await this.getCachedContent(filePath);
    
    // Remove comments and excess whitespace
    const minified = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/^\s*$/gm, '') // Remove empty lines
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    return {
      minified,
      file: filePath,
      size: minified.length,
      originalSize: content.length,
      reduction: `${Math.round((1 - minified.length / content.length) * 100)}%`
    };
  }

  // Smart extraction based on what's needed
  async smartExtract(filePath, need = 'overview') {
    const results = {};
    
    switch (need) {
      case 'overview':
        results.imports = await this.getImports(filePath);
        results.exports = await this.getExports(filePath);
        results.types = await this.getTypes(filePath);
        break;
        
      case 'implementation':
        results.minified = await this.getMinified(filePath);
        break;
        
      case 'dependencies':
        results.imports = await this.getImports(filePath);
        break;
        
      case 'api':
        results.exports = await this.getExports(filePath);
        results.types = await this.getTypes(filePath);
        break;
    }
    
    return results;
  }

  async getCachedContent(filePath) {
    if (!this.cache.has(filePath)) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        this.cache.set(filePath, content);
      } catch (error) {
        throw new Error(`Cannot read file: ${filePath}`);
      }
    }
    return this.cache.get(filePath);
  }

  clearCache() {
    this.cache.clear();
  }

  // Extract a high-level summary of a file for maximum token efficiency
  async summarizeFile(filePath) {
    const content = await this.getCachedContent(filePath);
    const lines = content.split('\n');
    const summary = {
      filePath,
      imports: [],
      exports: [],
      classNames: [],
      functionSignatures: [],
      tokenEstimate: Math.round(content.length / 4) // Rough estimate
    };

    // Regex patterns for extraction
    const importPattern = /^(import|export)\s+.*?\s+from\s+['"](.*?)['"];?$/;
    const exportPattern = /^export\s+(?:(const|let|var|function|class|type|interface)\s+)?([A-Za-z0-9_{} ,*]+)/;
    const classPattern = /^class\s+([A-Za-z0-9_]+)/;
    const functionPattern = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(.*?\)/;
    const arrowFunctionPattern = /^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*\(.*?\)\s*=>/;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let match;
      if ((match = trimmedLine.match(importPattern))) {
        summary.imports.push(match[2]);
      } else if ((match = trimmedLine.match(exportPattern))) {
        summary.exports.push(match[2].replace(/{|}|,/g, '').trim());
      } else if ((match = trimmedLine.match(classPattern))) {
        summary.classNames.push(match[1]);
      } else if ((match = trimmedLine.match(functionPattern))) {
        summary.functionSignatures.push(match[1]);
      } else if ((match = trimmedLine.match(arrowFunctionPattern))) {
        summary.functionSignatures.push(match[1]);
      }
    });

    // Deduplicate and clean up results
    summary.imports = [...new Set(summary.imports)];
    summary.exports = [...new Set(summary.exports.flatMap(e => e.split(' ')).filter(Boolean))];
    summary.classNames = [...new Set(summary.classNames)];
    summary.functionSignatures = [...new Set(summary.functionSignatures)];

    return summary;
  }

  // Extract the props from a React component
  async getComponentProps(filePath, componentName) {
    const content = await this.getCachedContent(filePath);
    const props = {
      filePath,
      componentName,
      propCount: 0,
      propNames: [],
      hasReactMemo: false,
    };

    // Check if the component is wrapped in React.memo
    const memoPattern = new RegExp(`export default React\\.memo\\(${componentName}\\)`);
    if (memoPattern.test(content)) {
      props.hasReactMemo = true;
    }

    // Find the props type or interface
    // Look for: const ${componentName}: React.FC<${PropsType}> = ({...})
    const fcPattern = new RegExp(`const\\s+${componentName}:.*?React\\.FC<(.*?)>\\s*=\\s*\\(\\{([^}]+)\\}`, 's');
    const fcMatch = content.match(fcPattern);

    let propDefs;

    if (fcMatch) {
      propDefs = fcMatch[2];
    } else {
      // Look for: function ${componentName}({...}: Props)
      const funcPattern = new RegExp(`function\\s+${componentName}\\s*\\(\\{([^}]+)\\}`, 's');
      const funcMatch = content.match(funcPattern);
      if (funcMatch) {
        propDefs = funcMatch[1];
      }
    }
    
    if (propDefs) {
        // Extract prop names from the destructuring
        const propNames = propDefs.split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
        props.propNames = propNames;
        props.propCount = propNames.length;
    }

    return props;
  }

  // Detect which state management libraries are used in a file
  async getStateManagementInfo(filePath) {
    const content = await this.getCachedContent(filePath);
    const info = {
      filePath,
      libraries: [],
      storesUsed: [],
    };

    const statePatterns = {
      'Zustand': /create\(.*\)/,
      'Jotai': /atom\(.*\)/,
      'Redux': /createStore\(|configureStore\(|createSlice\(/,
      'React Context': /createContext\(.*\)/,
    };

    const importPatterns = {
      'Zustand': /['"]zustand['"]/,
      'Jotai': /['"]jotai['"]/,
      'Redux': /['"]@reduxjs\/toolkit['"]|['"]redux['"]/,
      'React Context': /['"]react['"]/,
    };

    const storePatterns = {
        'Zustand': /use[A-Z][a-zA-Z]*Store/g,
    };

    const lines = content.split('\n');
    let detectedLibs = new Set();

    for (const line of lines) {
      // First, check for imports to identify potential libraries
      for (const [lib, pattern] of Object.entries(importPatterns)) {
        if (pattern.test(line)) {
            detectedLibs.add(lib);
        }
      }
    }
    
    // Now, confirm usage to avoid flagging 'react' for context every time
    for (const lib of detectedLibs) {
        if (statePatterns[lib] && statePatterns[lib].test(content)) {
            info.libraries.push(lib);

            // If we found a library, try to find the specific store being used
            if (storePatterns[lib]) {
                const matches = content.match(storePatterns[lib]);
                if (matches) {
                    info.storesUsed.push(...matches);
                }
            }
        }
    }
    
    info.storesUsed = [...new Set(info.storesUsed)]; // Deduplicate
    
    return info;
  }
}

// CLI interface
if (require.main === module) {
  const [,, command, filePath, ...args] = process.argv;
  
  if (!command || !filePath) {
    console.log(`
🔍 Smart File Reader - Ultimate Token Reduction

Usage:
  node smart-file-reader.js function file.ts functionName
  node smart-file-reader.js exports file.ts
  node smart-file-reader.js imports file.ts  
  node smart-file-reader.js class file.ts ClassName
  node smart-file-reader.js types file.ts
  node smart-file-reader.js component file.tsx ComponentName
  node smart-file-reader.js minified file.ts
  node smart-file-reader.js smart file.ts [overview|implementation|dependencies|api]

Examples:
  node smart-file-reader.js function UserProfile.tsx handleSubmit
  node smart-file-reader.js exports SystemViewer.tsx
  node smart-file-reader.js smart SystemViewer.tsx overview

Token Reduction: 80-90% for large files by showing only relevant parts
`);
    process.exit(1);
  }

  const reader = new SmartFileReader();
  
  (async () => {
    try {
      let result;
      
      switch (command) {
        case 'function':
          result = await reader.getFunction(filePath, args[0]);
          break;
        case 'exports':
          result = await reader.getExports(filePath);
          break;
        case 'imports':
          result = await reader.getImports(filePath);
          break;
        case 'class':
          result = await reader.getClass(filePath, args[0]);
          break;
        case 'types':
          result = await reader.getTypes(filePath);
          break;
        case 'component':
          result = await reader.getComponentSignature(filePath, args[0]);
          break;
        case 'minified':
          result = await reader.getMinified(filePath);
          break;
        case 'smart':
          result = await reader.smartExtract(filePath, args[0] || 'overview');
          break;
        default:
          console.log(`Unknown command: ${command}`);
          process.exit(1);
      }
      
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { SmartFileReader };