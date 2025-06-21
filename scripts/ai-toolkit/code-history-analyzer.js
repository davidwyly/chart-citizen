const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodeHistoryAnalyzer {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.debug = Boolean(options.debug);
    if (this.debug) {
      console.log(`[CodeHistoryAnalyzer DEBUG] Debug mode enabled`);
    }
  }

  async analyze(filePath, symbolName = null, startLine = null, endLine = null) {
    const absolutePath = path.resolve(this.rootDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    let blameCommand = `git blame --porcelain "${absolutePath}"`;

    // If line range is specified, use it
    if (startLine !== null && endLine !== null) {
      blameCommand = `git blame -L ${startLine},${endLine} --porcelain "${absolutePath}"`;
    } else if (symbolName) {
      // Implement logic to find line range for a symbol name
      const fileContent = fs.readFileSync(absolutePath, 'utf-8');
      const symbolLines = this._findSymbolLineRange(fileContent, symbolName);
      if (symbolLines) {
        startLine = symbolLines.start;
        endLine = symbolLines.end;
        this.log(`Found symbol '${symbolName}' at lines ${startLine}-${endLine}.`);
        blameCommand = `git blame -L ${startLine},${endLine} --porcelain "${absolutePath}"`;
      } else {
        this.log(`Warning: Could not find symbol '${symbolName}' in ${filePath}. Analyzing entire file.`);
      }
    }

    this.log(`Executing: ${blameCommand}`);

    const blameOutput = await this._executeCommand(blameCommand);
    const blames = this._parseBlamePorcelain(blameOutput);

    const history = [];
    const processedCommits = new Set();

    for (const blame of blames) {
      if (!processedCommits.has(blame.commit)) {
        const commitDetails = await this._getCommitDetails(blame.commit);
        history.push({
          commit: blame.commit,
          author: blame.author,
          date: blame.authorTime,
          summary: commitDetails.summary,
          body: commitDetails.body,
          linesAffected: 1 // Placeholder, actual lines affected is harder without full diff
        });
        processedCommits.add(blame.commit);
      }
    }

    // If a symbol name was provided without specific line numbers,
    // we could potentially filter the blames by looking for the symbol's presence
    // in the line content, but this is less accurate than line ranges.
    // For this initial implementation, we prioritize explicit line ranges.

    return {
      file: filePath,
      history: history.sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date descending
      totalCommits: history.length
    };
  }

  _findSymbolLineRange(content, symbolName) {
    const lines = content.split('\n');
    let startLine = -1;
    let braceCount = 0;
    let inSymbol = false;

    // More robust regex for function or class declaration (matches only the declaration line)
    // Handles `function name() {`, `const name = () => {`, `class Name {`
    const symbolDeclarationRegex = new RegExp(
      `^(?:(?:export|function|class|const|let|var)\\s+)?${symbolName}\\s*(?:=\\s*|\\([^)]*\\))?[^\\n]*?{`,
      'm' // Multiline mode to match start of line
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this.log(`Processing line ${i + 1}: ${line.trim()}`);

      if (line.match(symbolDeclarationRegex) && !inSymbol) {
        startLine = i + 1;
        inSymbol = true;
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        this.log(`Found start of symbol '${symbolName}' at line ${startLine}. Initial braceCount: ${braceCount}`);

        // Handle single-line declarations that don't have braces (e.g., type aliases or simple variable assignments)
        if (braceCount === 0 && line.includes(';')) {
          this.log(`Single-line symbol found at line ${startLine}.`);
          return { start: startLine, end: startLine };
        }
      } else if (inSymbol) {
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        this.log(`In symbol. Current line: ${i + 1}, Brace count: ${braceCount}`);
        if (braceCount === 0) {
          this.log(`Found end of symbol '${symbolName}' at line ${i + 1}.`);
          return { start: startLine, end: i + 1 };
        }
      }
    }
    this.log(`Symbol '${symbolName}' not found or block not closed.`);
    return null; // Symbol not found or block not closed
  }

  _executeCommand(command) {
    return new Promise((resolve, reject) => {
      this.log(`Executing git command: ${command}`);
      exec(command, { cwd: this.rootDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`stderr: ${stderr}`);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  _parseBlamePorcelain(output) {
    const lines = output.split('\n');
    const blames = [];
    let currentBlame = {};

    for (const line of lines) {
      if (line.match(/^[0-9a-f]{40} /)) {
        // New blame entry
        if (currentBlame.commit) {
          blames.push(currentBlame);
        }
        currentBlame = {
          commit: line.substring(0, 40),
          originalLine: parseInt(line.split(' ')[1], 10),
          finalLine: parseInt(line.split(' ')[2], 10),
          numLines: parseInt(line.split(' ')[3], 10)
        };
      } else if (line.startsWith('author ')) {
        currentBlame.author = line.substring(7);
      } else if (line.startsWith('author-mail ')) {
        currentBlame.authorMail = line.substring(12);
      } else if (line.startsWith('author-time ')) {
        currentBlame.authorTime = new Date(parseInt(line.substring(12), 10) * 1000).toISOString();
      } else if (line.startsWith('summary ')) {
        currentBlame.summary = line.substring(8);
      } else if (line.startsWith('\t')) {
        // This is the actual code line
        currentBlame.code = line.substring(1);
        blames.push(currentBlame);
        currentBlame = {}; // Reset for next block
      }
      // We skip other fields like committer, filename, etc. for brevity.
    }
    return blames;
  }

  async _getCommitDetails(commitHash) {
    const command = `git show --no-patch --format=%B "${commitHash}"`;
    const output = await this._executeCommand(command);
    const lines = output.split('\n').filter(line => line.trim() !== '');
    return {
      summary: lines[0] || '',
      body: lines.slice(1).join('\n').trim()
    };
  }

  log(message) {
    if (this.debug) {
      console.log(`[CodeHistoryAnalyzer DEBUG] ${message}`);
    }
  }
}

module.exports = CodeHistoryAnalyzer; 