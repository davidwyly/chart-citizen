🚀 AI Workflow Toolkit - Complete Documentation

This toolkit provides a suite of AI-optimized, token-efficient, and composable
code analysis tools. Each tool is designed to do one thing well, providing
a reliable and low-cost primitive for complex AI-driven development tasks.

═══════════════════════════════════════════════════════════════════════════════

⭐ STRATEGY GUIDE: A RECOMMENDED WORKFLOW ⭐

To maximize token efficiency and get to solutions faster, follow this structured approach. The goal is to use low-cost analysis tools to gain high confidence *before* reading expensive file contents.

### Phase 1: Scoping (Low-Token Discovery)
*   **Goal**: To identify a primary candidate file/component, not solve the whole problem.
*   **When**: The entry point is unclear (e.g., a visual bug, vague requirement).
*   **Primary Tool**: `code-search "keyword"`
    *   Finds files containing a keyword without reading their content. It's the most efficient way to start any investigation.

### Phase 2: Targeted Analysis (Code-Aware Navigation)
*   **Goal**: To understand relationships and validate hypotheses without reading code.
*   **When**: You have a candidate file/component from Phase 1.
*   **Primary Tools**:
    *   `impact <file-path>`: To see **what uses** your candidate file. An empty result is a powerful clue that a file is unused.
    *   `dead-code`: To find all unused files and other code smells across the project.
    *   `context <file-path>`: To trace data flow and component relationships.
    *   `list-symbols <file-path>`: To see a file's public API (all its exports).

### Phase 3: Code Reading (High-Token Confirmation)
*   **Goal**: To understand the specific implementation details that need to be changed.
*   **When**: The analysis tools have given you high confidence about where the problem is.
*   **Tool**: Read the file contents in your editor.

By following this `Scoping -> Analysis -> Reading` workflow, you reserve the most expensive operation (reading files) for the very end, leading to faster, cheaper, and more accurate solutions.

═══════════════════════════════════════════════════════════════════════════════

🔎 SCHEMA EXTRACTOR (NEW!)
   Purpose: Extract a single schema (type, interface, class, enum) from a file.
   Command: npm run ai-toolkit schema <file-path>:<symbol-name>
   
   What it provides:
   • The precise, trimmed source code for a single schema definition.
   • Outputs compact JSON containing the file, symbol, and schema.
   • Avoids reading entire files just to get a type definition.
   
   Examples:
   npm run ai-toolkit schema "engine/types/engine.ts:EngineConfig"
   npm run ai-toolkit schema "components/ui/button.tsx:ButtonProps"
   
   AI Value: Massive token savings for one of the most common developer lookups.

───────────────────────────────────────────────────────────────────────────────

🔧 IMPORT ANALYZER (NEW!)
   Purpose: Comprehensive import analysis and bulk fixing
   Command: npm run ai-toolkit imports <check|fix|batch|project>
   
   Subcommands:
   • check <file>               - Validate all imports in a file
   • fix <old> <new> [--dry-run] - Bulk replace import patterns
   • batch <files...>           - Analyze multiple files at once
   • project                    - Scan entire project for broken imports
   
   Examples:
   npm run ai-toolkit imports check gas-giant-renderer.tsx
   npm run ai-toolkit imports fix "../planets/materials" "./materials"
   npm run ai-toolkit imports project
   
   AI Value: 80% token reduction vs manual find/grep commands

─────────────────────────────────────────────────────────────────────────────── 

🚨 ERROR ANALYZER (NEW!)
   Purpose: Smart analysis of build and runtime errors with automatic solutions
   Command: npm run ai-toolkit analyze-error "error message"
   
   What it analyzes:
   • Missing export errors (BatchedMesh, WebGPURenderer, etc.)
   • Version compatibility issues
   • Import/dependency conflicts
   • Peer dependency problems
   
   Examples:
   npm run ai-toolkit analyze-error "BatchedMesh is not exported from 'three'"
   npm run ai-toolkit analyze-error "Cannot resolve module '@react-three/drei'"
   
   AI Value: Instant diagnosis with specific fix commands - 90% token reduction

─────────────────────────────────────────────────────────────────────────────── 

🔍 COMPATIBILITY CHECKER (NEW!)
   Purpose: Proactive detection of package version conflicts
   Command: npm run ai-toolkit check-compatibility
   
   What it checks:
   • Three.js ecosystem compatibility (drei, fiber, three-mesh-bvh)
   • React version synchronization
   • TypeScript compatibility
   • Peer dependency conflicts
   
   Example:
   npm run ai-toolkit check-compatibility
   
   AI Value: Prevents issues before they occur - finds conflicts in seconds

─────────────────────────────────────────────────────────────────────────────── 

🧪 TEST OUTPUT ANALYZER (NEW!)
   Purpose: Compress verbose test output into token-efficient summaries
   Command: npm run ai-toolkit test-summary [options]
   
   What it analyzes:
   • Test results (passed/failed/skipped counts)
   • Failure details with cleaned error messages
   • Performance analysis (slow/fast tests)
   • Warning categorization and deduplication
   • Coverage information
   
   Options:
   --failures-only        Show only test failures (ultra-compact)
   --log="file.log"       Analyze existing test log file
   --command="test cmd"   Custom test command
   --timeout=120          Timeout in seconds (default: 120)
   
   Examples:
   npm run ai-toolkit test-summary
   npm run ai-toolkit test-summary --failures-only
   npm run ai-toolkit test-summary --log="test-output.log"
   npm run ai-toolkit test-summary --timeout=60
   
   AI Value: 95% token reduction vs raw test output - essential errors preserved

─────────────────────────────────────────────────────────────────────────────── 

🧪 LINT SUMMARY ANALYZER (NEW!)
   Purpose: Compress verbose linter output into a token-efficient summary.
   Command: npm run ai-toolkit lint-summary
   
   What it provides:
   • Counts of errors and warnings.
   • A list of files with issues and their severity.
   • A high-level summary of code quality.
   
   Examples:
   npm run ai-toolkit lint-summary
   
   AI Value: 98% token reduction vs raw lint output, providing actionable quality metrics.

─────────────────────────────────────────────────────────────────────────────── 

🌳 SYMBOL LISTER (NEW!)
   Purpose: List all exported symbols (classes, functions, types) from a single file.
   Command: npm run ai-toolkit list-symbols <file-path>
   
   What it provides:
   • A JSON object containing all `export` and `re-export` statements.
   • A token-efficient way to discover a file's public API without reading its content.
   
   Examples:
   npm run ai-toolkit list-symbols "engine/core/engine-state.ts"
   npm run ai-toolkit list-symbols "components/ui/button.tsx"
   
   AI Value: Perfect for quickly understanding module boundaries and available imports.

─────────────────────────────────────────────────────────────────────────────── 

🔍 FIND USAGES (NEW!)
   Purpose: Find all usages of a given symbol across the codebase.
   Command: npm run ai-toolkit find-usages <symbol-name>
   
   What it provides:
   • A list of files and line numbers where the symbol is used.
   • Supports various symbol types (functions, classes, variables, etc.).
   
   Examples:
   npm run ai-toolkit find-usages "MyComponent"
   npm run ai-toolkit find-usages "utilityFunction"
   
   AI Value: Quickly understand the impact of changes to a specific symbol.

─────────────────────────────────────────────────────────────────────────────── 

✂️ CODE EXTRACTOR (NEW!)
   Purpose: Extract specific code snippets (functions, classes, imports, etc.) from files for highly token-efficient analysis.
   Command: npm run ai-toolkit extract-code <subcommand> <file-path> [symbol-name]
   
   Subcommands:
   • function <file> <name>           - Extract a specific function's code.
   • class <file> <name>              - Extract a specific class's code.
   • imports <file>                   - Extract all import statements.
   • exports <file>                   - Extract all export statements.
   • minified <file>                  - Extract minified code (no comments/excess whitespace).
   • types <file>                     - Extract all interface/type definitions.
   • component-signature <file> <name>- Extract React component props and return type.
   • component-props <file> <name>    - Extract only the props interface of a React component.
   • state-management <file>          - Extract state management related code (e.g., Zustand store definitions).
   
   Examples:
   npm run ai-toolkit extract-code function "engine/core/camera.ts" "updateCameraPosition"
   npm run ai-toolkit extract-code class "engine/core/engine.ts" "Engine"
   npm run ai-toolkit extract-code imports "app/layout.tsx"
   npm run ai-toolkit extract-code minified "engine/components/celestial-viewer.tsx"
   
   AI Value: Massive token savings when only specific code blocks are relevant, enabling highly targeted analysis.

─────────────────────────────────────────────────────────────────────────────── 

🏹 DEAD CODE HUNTER
   Purpose: Find unused files, duplicates, and legacy code
   Command: npm run ai-toolkit dead-code [--no-tests]
   
   What it finds:
   • Files with no imports (safe to delete)
   • Suspicious files (need manual review)
   • Legacy systems with @deprecated markers
   • Duplicate files with identical content
   
   AI Value: Single command replaces 50+ manual searches

─────────────────────────────────────────────────────────────────────────────── 

🔍 REFACTOR IMPACT ANALYZER
   Purpose: Understand the blast radius of code changes
   Command: npm run ai-toolkit impact "ComponentName"
           npm run ai-toolkit impact "./path/to/file.ts"
   
   What it analyzes:
   • Direct impacts (files that import the target)
   • Cascading impacts (files affected by changes)
   • Test coverage for the target
   • Risk assessment and refactor plan
   
   AI Value: Complete refactoring context in one analysis

─────────────────────────────────────────────────────────────────────────────── 

🧬 CONTEXT TRACER
   Purpose: Understand data flow and component relationships
   Command: npm run ai-toolkit context "ComponentName" [options]
   
   Options:
   --flow=up      Trace where data comes FROM
   --flow=down    Trace where data goes TO
   --flow=both    Trace both directions (default)
   --depth=N      Maximum depth to trace (default: 4)
   
   What it traces:
   • Data flow (upstream sources, downstream targets)
   • Component relationships (parents, children)
   • State management patterns
   • Event handling chains
   • Prop drilling detection
   
   AI Value: Understand complex interactions without manual tracing

─────────────────────────────────────────────────────────────────────────────── 

🧪 TEST GAP ANALYZER
   Purpose: Find missing test coverage and testing blind spots
   Command: npm run ai-toolkit test-gaps [--focus=type]
   
   Focus types: components, utils, hooks, services, all
   
   What it finds:
   • Untested files with criticality scores
   • Missing test types (unit, integration, component)
   • Critical gaps (high-risk files without tests)
   • Test coverage by file type
   
   AI Value: Prioritized testing roadmap with impact assessment

─────────────────────────────────────────────────────────────────────────────── 

📈 GIT DIFF ANALYZER
   Purpose: Analyze code changes between commits efficiently
   Command: npm run ai-toolkit diff [comparison]
           npm run ai-toolkit diff HEAD~1
           npm run ai-toolkit diff main..HEAD
   
   What it analyzes:
   • Change complexity and file impact assessment
   • Critical, high, medium, and low impact changes
   • File operations (added, deleted, modified, renamed)
   • Change distribution by file type
   
   AI Value: Instant change review context without reading full diffs

─────────────────────────────────────────────────────────────────────────────── 

📦 DEPENDENCY ANALYZER
   Purpose: Analyze project dependencies for issues like unused or circular dependencies.
   Command: npm run ai-toolkit deps [--focus=type]
   
   Focus types: packages, files, all
   
   What it analyzes:
   • Unused packages and their potential for removal.
   • Circular dependencies that can lead to code instability.
   • Dependency trees and relationships.
   
   AI Value: Streamlines dependency management and codebase health.

─────────────────────────────────────────────────────────────────────────────── 

🔬 FULL ANALYSIS
   Purpose: Comprehensive codebase health assessment
   Command: npm run ai-toolkit full-analysis [target]
   
   Runs all analyses and provides:
   • Codebase health score
   • Unified recommendations
   • Priority action items
   • Cross-analysis insights
   
   AI Value: Complete picture for major refactoring or cleanup

═══════════════════════════════════════════════════════════════════════════════

🎯 OUTPUT STRUCTURE

All tools generate results in analysis-results/ folder:

• ai-toolkit-report.md      - Main unified report
• ai-toolkit-results.json   - Raw data for programmatic access
• dead-code-analysis.md     - Detailed dead code findings
• impact-analysis.md        - Detailed refactor impact
• context-analysis.md       - Detailed context tracing
• test-gap-analysis.md      - Detailed test gap analysis

Clean up: rm -rf analysis-results

═══════════════════════════════════════════════════════════════════════════════

🚀 AI WORKFLOW OPTIMIZATION

Token Efficiency:
• Before: 50+ tool calls, 25,000+ tokens
• After: 1 command, ~2,000 tokens
• 12x reduction in token usage

Perfect for AI tasks:
• Refactoring complex code
• Understanding unfamiliar codebases  
• Planning test strategies
• Code cleanup and maintenance
• Architecture analysis

═══════════════════════════════════════════════════════════════════════════════

📊 PROJECT OVERVIEW (NEW!)
   Purpose: Get a high-level, token-efficient summary of the project.
   Command: npm run ai-toolkit overview
   
   What it provides:
   • Project type and primary frameworks
   • Deduced architectural style
   • Key directories and overall project stats
   • Zero file-reads for maximum token efficiency
   
   AI Value: The perfect starting point for any new task in the codebase.

───────────────────────────────────────────────────────────────────────────────

🔎 CODE SEARCHER (NEW!)
   Purpose: Find files containing a keyword with maximum token efficiency.
   Command: npm run ai-toolkit code-search "keyword"
   
   What it provides:
   • A simple JSON array of file paths.
   • Uses 'ripgrep' for high speed and .gitignore awareness if available.
   • Reads zero file content, only returns paths.
   
   AI Value: The most efficient way to begin exploration for any task.

─────────────────────────────────────────────────────────────────────────────── 

🔬 PROJECT INTELLIGENCE (NEW!)
   Purpose: Maintains persistent architectural knowledge to prevent context drift.
   Command: npm run project-intel [--update|--validate]
   
   What it provides:
   • Living document of project structure, patterns, and integration flows.
   • Generates `PROJECT-INTELLIGENCE.md` and `AI-CONTEXT.md` for AI reference.
   • Prevents context drift and ensures architectural consistency.
   
   Examples:
   npm run project-intel
   npm run project-intel --update
   npm run project-intel --validate
   
   AI Value: Essential for maintaining AI context across sessions and guiding architectural decisions.

─────────────────────────────────────────────────────────────────────────────── 

🔎 PATTERN ANALYZER (NEW!)
   Purpose: Find inconsistent patterns and implementations across the codebase.
   Command: npm run ai-toolkit analyze-patterns [--focus=type]
   
   Focus types: hooks, components, utils, types, all
   
   What it analyzes:
   • React Hooks patterns (declarations, usage)
   • Component patterns (declarations, props interfaces)
   • Error handling patterns (try-catch, error boundaries)
   • API call patterns (fetch, axios)
   • State management patterns (useState, useReducer)
   • Event handler patterns (handle functions, onEvent props)
   
   AI Value: Identifies refactoring opportunities and enforces code consistency.

─────────────────────────────────────────────────────────────────────────────── 

❓ HELP
   Purpose: Display detailed help and usage instructions for the AI Workflow Toolkit.
   Command: npm run ai-toolkit help
   
   What it provides:
   • A comprehensive overview of all available commands and their options.
   • Examples for each command to guide proper usage.
   
   AI Value: A quick reference for all toolkit functionalities.

─────────────────────────────────────────────────────────────────────────────── 

#### Discovery & Exploration
-   **`overview`**: Get a high-level summary of the project's tech stack, architecture, and stats.
-   **`code-search <keyword>`**: Find all files containing a specific keyword.
-   **`list-symbols <file>`**: List all exported functions, classes, and types from a file.
-   **`find-usages <symbol-name>`**: Find all usages of a specific symbol.
-   **`schema <file>:<symbol>`**: Extract the detailed source code for a specific interface or type.
-   **`extract-code <subcommand> <file> [symbol]`**: Extract specific code snippets (functions, classes, imports, etc.) for highly token-efficient analysis.
-   **`code-history <file> [--symbol=<name> | --lines=<start>:<end>]`**: Analyze git history for specific code snippets, focusing on relevant commits.
-   **`context <file>:<symbol>`**: Trace the data flow and component relationships for a symbol.
-   **`impact <file>:<symbol>`**: Analyze the "blast radius" of changing a symbol.
-   **`help`**: Display detailed help and usage instructions for the AI Workflow Toolkit.

#### Code Analysis & Maintenance

Options:
  --no-tests            Exclude test files from dead code analysis
  --flow=up|down|both   Direction for context tracing
  --depth=N             Maximum depth for analysis
  --focus=type          Focus test gap analysis on specific file type
  --timeout=N           Command timeout in seconds (default: varies by command)
  --write-files         Persist detailed markdown/JSON reports (default: disabled)
  --debug               Show verbose status messages during execution
  --json                Generate JSON output (legacy)

For detailed help: npm run ai-toolkit help

**Note on flags with `npm run`:** When using flags for `ai-toolkit` commands that also start with `--`, you must separate them from the `npm run ai-toolkit` command with `--`. For example:
```bash
npm run ai-toolkit -- code-history path/to/file.ts --symbol=myFunc --debug
npm run ai-toolkit -- code-history path/to/file.ts --lines=10:25
```

─────────────────────────────────────────────────────────────────────────────── 