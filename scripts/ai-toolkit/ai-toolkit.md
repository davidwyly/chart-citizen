# AI Workflow Toolkit: Philosophy and Tool Guide

This document explains the purpose and design philosophy behind each tool in the AI Workflow Toolkit. The toolkit is built on the core principle of **token efficiency**. Each tool is designed to be a small, precise, and composable primitive that answers a specific question about the codebase. This allows an AI agent to perform complex analysis and development tasks with minimal token consumption.

---

## 🔎 Code Discovery & Exploration

These tools are designed to help an AI agent (or a human developer) quickly understand the structure and content of the codebase. They are the starting point for most tasks.

### `overview`
- **Command:** `npm run ai-toolkit overview`
- **Answers:** "What kind of project is this and where are the important files?"
- **Why it exists:** Provides a high-level, zero-token summary of the project's architecture, key directories, and technologies. It's the most efficient way to get initial orientation in an unfamiliar codebase without reading any file content.

### `code-search`
- **Command:** `npm run ai-toolkit code-search "<keyword>"`
- **Answers:** "Which files mention this specific keyword?"
- **Why it exists:** To find all occurrences of a string or keyword across the entire project. It's a broad but fast search that uses `ripgrep` for maximum speed. It returns only file paths, saving a massive number of tokens compared to returning the content of each match.

### `list-symbols`
- **Command:** `npm run ai-toolkit list-symbols <file-path>`
- **Answers:** "What is the public API of this specific file?"
- **Why it exists:** Provides a "table of contents" for a single file, listing all its exported symbols (functions, classes, types, etc.) without their implementation details. This allows an agent to see what can be imported from a module without wasting tokens on its source code.

### `schema`
- **Command:** `npm run ai-toolkit schema <file-path>:<symbol-name>`
- **Answers:** "What is the detailed structure of this specific interface, type, or class?"
- **Why it exists:** To extract the precise source code for a single schema definition. This is the most token-efficient way to get the detailed structure of an object or a component's props when that level of detail is required for a task like refactoring or fixing a type error.

### `find-usages`
- **Command:** `npm run ai-toolkit find-usages <file-path>:<symbol-name>`
- **Answers:** "Where is this specific function or component being used in the codebase?"
- **Why it exists:** To quickly find all references to a specific symbol (function, class, type, etc.) across the entire project. This is crucial for understanding the impact of a change, finding where a component is rendered, or tracing how a function is used without manually searching or relying on less precise text-based searches. It uses the TypeScript compiler for accuracy.

---

## 🔧 Code Analysis & Maintenance

These tools analyze the codebase for potential issues, from dependency conflicts to dead code, providing actionable insights for improvement.

### `imports`
- **Command:** `npm run ai-toolkit imports <subcommand>`
- **Answers:** "Are the imports in this project correct, and can I fix them in bulk?"
- **Why it exists:** Provides a comprehensive suite for analyzing and fixing broken or outdated import statements. It can scan the entire project for issues or perform bulk find-and-replace operations, which is dramatically more efficient than manual searching or `grep`.

### `deps`
- **Command:** `npm run ai-toolkit deps`
- **Answers:** "Are there any issues with this project's dependencies?"
- **Why it exists:** To analyze the project's `package.json` and code to find issues like unused packages or circular dependencies. This helps maintain codebase health and can reduce bundle size and build times.

### `dead-code`
- **Command:** `npm run ai-toolkit dead-code`
- **Answers:** "Is there any unused or duplicated code in this project?"
- **Why it exists:** To automatically hunt for files that are no longer imported anywhere, as well as files that are exact duplicates. It provides a clear, actionable list of files that can be safely removed, reducing codebase complexity and cognitive load.

---

## 📊 Quality & Testing

These tools focus on assessing and summarizing the quality and test coverage of the code.

### `lint-summary`
- **Command:** `npm run ai-toolkit lint-summary`
- **Answers:** "What is the overall code quality according to the linter?"
- **Why it exists:** To compress verbose linter output into a token-efficient JSON summary. It provides a quick overview of error and warning counts, helping to assess code quality at a glance without parsing thousands of lines of raw log output.

### `test-summary`
- **Command:** `npm run ai-toolkit test-summary`
- **Answers:** "Did the tests pass, and if not, what were the critical errors?"
- **Why it exists:** To compress verbose test runner output into a token-efficient summary. It extracts the most critical information—pass/fail counts, cleaned error messages, and performance warnings—so an agent can quickly understand the test results without being overwhelmed by noisy stack traces.

### `test-gaps`
- **Command:** `npm run ai-toolkit test-gaps`
- **Answers:** "Where are the biggest gaps in our test coverage?"
- **Why it exists:** To identify high-risk areas of the codebase that lack sufficient testing. It analyzes the relationship between source files and test files to find critical components, hooks, or services that are untested, providing a prioritized roadmap for improving test coverage.

---

## ⚙️ Build & Compatibility

These tools help diagnose and prevent issues related to the build process and package ecosystem.

### `analyze-error`
- **Command:** `npm run ai-toolkit analyze-error "<error-message>"`
- **Answers:** "I have a build error. What does it mean and how do I fix it?"
- **Why it exists:** To provide intelligent, context-aware diagnostics for common build and runtime errors, especially within the `three.js` ecosystem. It analyzes the error message and suggests specific causes and solutions, saving significant debugging time.

### `check-compatibility`
- **Command:** `npm run ai-toolkit check-compatibility`
- **Answers:** "Are my package versions compatible with each other?"
- **Why it exists:** To proactively check for known version conflicts between critical packages (like `react`, `three`, `@react-three/fiber`, `@react-three/drei`). It helps prevent subtle bugs and build failures before they happen.

---

## 🧬 Refactoring & Change Analysis

These tools provide deep insights into the codebase to support safe and effective refactoring.

### `impact`
- **Command:** `npm run ai-toolkit impact "<symbol-or-file>"`
- **Answers:** "If I change this, what else will break?"
- **Why it exists:** To analyze the "blast radius" of a potential code change. It traces dependencies to show which other parts of the system will be affected by modifying a specific component or function, providing a complete risk assessment before a refactor begins.

### `context`
- **Command:** `npm run ai-toolkit context "<symbol>"`
- **Answers:** "How does data flow to and from this function or component?"
- **Why it exists:** To trace the flow of data and component relationships. It can identify where props come from (upstream) and where they are passed to (downstream), making it invaluable for understanding complex interactions and identifying issues like prop drilling.

### `diff`
- **Command:** `npm run ai-toolkit diff <comparison>`
- **Answers:** "What has changed between these two versions of the code?"
- **Why it exists:** To provide a token-efficient summary of `git diff` output. Instead of providing the full, verbose diff, it analyzes the changes to assess complexity, identify critical file modifications, and summarize the nature of the changes (e.g., bug fix, feature, refactor).

### `full-analysis`
- **Command:** `npm run ai-toolkit full-analysis`
- **Answers:** "What is the overall health of this entire codebase?"
- **Why it exists:** To run a comprehensive suite of analyses and generate a unified report. It combines insights from multiple tools to provide a holistic overview of codebase health, including a list of key issues and prioritized recommendations. It's the most powerful command for getting a complete picture before a major cleanup or refactoring effort. 