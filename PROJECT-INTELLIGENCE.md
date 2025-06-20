# Project Intelligence Report 🧠

*Last Updated: 2025-06-20T18:30:57.808Z*

## 🏗️ Architectural Overview

**Project Type**: Next.js Application
**Architectural Style**: Engine-Component Architecture
**Primary Frameworks**: React, Next.js, React Three Fiber, Three.js, TypeScript, Tailwind CSS, Vitest

### Health Metrics
- **Architectural Health**: 100/100
- **Context Complexity**: 1/10
- **Integration Risk**: MEDIUM

## 🎯 Core Components (12)

- **app/page.tsx** (entryPoint) - Application Entry
- **app/layout.tsx** (entryPoint) - Application Entry
- **@/engine/types/orbital-system** (coreModule) - Shared Component - 78 imports
- **@/lib/utils** (coreModule) - Shared Component - 45 imports
- **@/engine/system-loader** (coreModule) - Shared Component - 21 imports
- **../types** (coreModule) - Shared Component - 14 imports
- **@/engine/core/view-modes/strategies/view-mode-strategy** (coreModule) - Shared Component - 12 imports
- **./types** (coreModule) - Shared Component - 11 imports
- **@/engine/core/mode-system/mode-system** (coreModule) - Shared Component - 11 imports
- **@/lib/types/effects-level** (coreModule) - Shared Component - 10 imports
- **../types/orbital-system** (coreModule) - Shared Component - 9 imports
- **@/engine/core/pipeline** (coreModule) - Shared Component - 8 imports

## 📐 Established Patterns (7)

- **React Hooks**: 57 usages
- **Custom Hooks**: 11 usages
- **Render Props**: 37 usages
- **Component Composition**: 16 usages
- **Factory Pattern**: 95 usages
- **Observer Pattern**: 12 usages
- **Module Pattern**: 234 usages

## 🔄 Data Flow Architecture

- **component-props**: Props flowing between React components (medium complexity)
- **api-calls**: Data flowing through API endpoints (low complexity)
- **state-management**: State updates and subscriptions (medium complexity)

## ⚠️ Legacy Systems (5)

- **scripts/project-intelligence.js** - 4 deprecation markers
- **scripts/dead-code-hunter.js** - 1 deprecation markers
- **scripts/ai-workflow-toolkit.js** - 1 deprecation markers
- **engine/core/view-modes/index.ts** - 1 deprecation markers
- **engine/core/view-modes/compatibility.ts** - 2 deprecation markers


## 🚀 Architectural Guidelines

### Core Principles
1. **Engine-Component Architecture** - Maintain this architectural style consistently
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
- Use `npm run project-intel --update` to refresh understanding
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
