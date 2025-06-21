const fs = require('fs');
const path = require('path');

class SchemaExtractor {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.verbose = Boolean(options.verbose);
  }

  async extractSchema(filePath, symbolName) {
    if (!filePath || !symbolName) {
      console.error('❌ Invalid target. Use format: <file-path>:<symbol-name>');
      process.exit(1);
    }

    const absolutePath = path.resolve(this.rootDir, filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ File not found: ${absolutePath}`);
      process.exit(1);
    }

    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      const schema = this.findSchemaInContent(content, symbolName);

      if (schema) {
        console.log(JSON.stringify({ file: filePath, symbol: symbolName, schema: schema.trim() }));
      } else {
        console.error(`❌ Could not find symbol "${symbolName}" in ${filePath}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error);
      process.exit(1);
    }
  }

  findSchemaInContent(content, symbolName) {
    // Regex to find interfaces, types, enums, or classes
    const patterns = [
      `interface ${symbolName}[\\s\\w<>]*\\s*{[^}]*}`,
      `type ${symbolName}[\\s\\w<>]*\\s*=[\\s\\w\\W]*?;`,
      `enum ${symbolName}\\s*{[^}]*}`,
      `class ${symbolName}[\\s\\w<>]*\\s*{[^}]*}`
    ];
    
    // A more robust regex to handle nested braces for interfaces/classes
    const blockPattern = `(interface|class|enum)\\s+${symbolName}[^{]*{([^{}]|{[^{}]*})*}`;

    const contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // Try to find a block definition (interface, class, enum)
    const blockRegex = new RegExp(`(export\\s+|declare\\s+)?(interface|class|enum)\\s+${symbolName}[^{]*{`);
    let match = contentWithoutComments.match(blockRegex);

    if (match) {
        let startIndex = match.index;
        let openBraces = 0;
        let endIndex = -1;

        for (let i = startIndex; i < contentWithoutComments.length; i++) {
            if (contentWithoutComments[i] === '{') {
                openBraces++;
            } else if (contentWithoutComments[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }

        if (endIndex !== -1) {
            return contentWithoutComments.substring(startIndex, endIndex);
        }
    }
    
    // Fallback for simple type aliases
    const typeRegex = new RegExp(`(export\\s+)?type\\s+${symbolName}[^=]*=[^;]*;`, 'm');
    match = contentWithoutComments.match(typeRegex);

    if (match) {
      return match[0];
    }

    return null;
  }
}

module.exports = SchemaExtractor; 