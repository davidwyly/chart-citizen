// New index file acting as an entry point for the AI Workflow Toolkit
// Purpose: Provide a clean namespace (scripts/ai-toolkit) so that all toolkit-related
// scripts can be grouped in this directory. In the future, the auxiliary analysis modules
// (dead-code-hunter, context-tracer, etc.) can be relocated here without changing the
// consumer import path.

const path = require('path');

// Resolve to the original toolkit file (kept at root for backward compatibility)
const Toolkit = require(path.join('..', 'ai-workflow-toolkit.js'));

module.exports = Toolkit; 