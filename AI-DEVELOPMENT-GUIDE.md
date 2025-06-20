# AI Development Best Practices Guide 🧠

**Preventing Context Drift & Architectural Decay**

## 🎯 **The Context Drift Problem**

Context drift occurs when AI assistants lose architectural awareness across sessions, leading to:
- Mixed implementation patterns
- Duplicate functionality
- Legacy code accumulation  
- Architectural boundary violations
- Inconsistent coding styles

## 🚀 **Solution: Persistent Architectural Intelligence**

Our toolkit maintains project intelligence across AI sessions through:

### 📊 **Project Intelligence Engine**
- **Purpose**: Maintains persistent architectural knowledge
- **Usage**: `npm run project-intel` (weekly) or `npm run project-intel --update` (after major changes)
- **Output**: `PROJECT-INTELLIGENCE.md` (full context) + `AI-CONTEXT.md` (quick reference)

### 🤖 **Agent Coordination System**
- **Purpose**: Parallel analysis for comprehensive understanding  
- **Usage**: `npm run coordinate-agents` (before major work) or `--quick` (daily)
- **Output**: Multi-perspective analysis with synthesized recommendations

## 🎯 **Workflow for AI Sessions**

### **Phase 1: Context Loading (ALWAYS)**
```bash
# Quick context check (30 seconds)
cat AI-CONTEXT.md

# OR comprehensive context (if major changes planned)  
npm run coordinate-agents --quick
```

**Critical**: Read architectural context BEFORE starting any development work.

### **Phase 2: Change Planning**
```bash
# For single file changes
npm run ai-toolkit impact "TargetFile"

# For component changes  
npm run ai-toolkit context "ComponentName"

# For refactoring
npm run ai-toolkit impact "Symbol" && npm run ai-toolkit context "Symbol"
```

### **Phase 3: Implementation**
- Follow established patterns identified in `AI-CONTEXT.md`
- Reference core components before creating new ones
- Avoid duplicate implementations
- Update legacy system markers

### **Phase 4: Validation**
```bash
# After significant changes
npm run coordinate-agents --quick

# Update intelligence if architecture changed
npm run project-intel --update
```

## 🧠 **Parallel Agent Strategy**

### **Use Case: Major Refactoring**
Run multiple agents concurrently to build complete picture:

```bash
# Terminal 1: Impact Analysis
npm run ai-toolkit impact "ComponentName"

# Terminal 2: Context Tracing  
npm run ai-toolkit context "ComponentName"

# Terminal 3: Dependency Analysis
npm run ai-toolkit deps

# Terminal 4: Pattern Analysis
npm run ai-toolkit patterns

# Then synthesize with coordinator
npm run coordinate-agents
```

**Token Efficiency**: 4 parallel agents = ~8,000 tokens vs 50+ sequential searches = ~30,000 tokens

### **Use Case: Code Review**
```bash
# Analyze recent changes
npm run ai-toolkit diff HEAD~3

# Check for pattern drift
npm run ai-toolkit patterns

# Validate health  
npm run coordinate-agents --quick
```

## 📐 **Architectural Preservation Rules**

### **1. Pattern Consistency**
- ✅ **DO**: Follow patterns in `AI-CONTEXT.md` established patterns
- ❌ **DON'T**: Create new patterns without team consensus
- **Check**: `npm run ai-toolkit patterns` for consistency

### **2. Component Boundaries**
- ✅ **DO**: Respect Engine-Component Architecture boundaries
- ❌ **DON'T**: Mix engine and app-specific code
- **Check**: Review `PROJECT-INTELLIGENCE.md` integration rules

### **3. Legacy Migration**
- ✅ **DO**: Gradually replace deprecated systems
- ❌ **DON'T**: Build on top of legacy systems
- **Check**: Monitor legacy systems in intelligence reports

### **4. Dependency Health**
- ✅ **DO**: Use existing dependencies when possible
- ❌ **DON'T**: Add new dependencies without reviewing alternatives
- **Check**: `npm run ai-toolkit deps` before adding packages

## 🎯 **Token Optimization Strategies**

### **High-Efficiency Workflows**

#### **Daily Development (2,000 tokens)**
```bash
cat AI-CONTEXT.md                           # 500 tokens
npm run ai-toolkit impact "specific-file"   # 800 tokens  
# Make changes following established patterns
npm run ai-toolkit test-gaps                # 700 tokens
```

#### **Weekly Architecture Review (5,000 tokens)**  
```bash
npm run coordinate-agents --quick           # 3,000 tokens
npm run project-intel --update              # 2,000 tokens
```

#### **Major Refactoring (8,000 tokens)**
```bash
npm run coordinate-agents                   # 5,000 tokens
npm run ai-toolkit impact "major-component" # 1,500 tokens
npm run ai-toolkit context "major-component" # 1,500 tokens
```

### **Token Waste Prevention**
- ❌ **Avoid**: Reading full files when summaries exist
- ❌ **Avoid**: Repetitive pattern searches (use pattern analyzer)
- ❌ **Avoid**: Manual dependency tracing (use dependency analyzer)
- ❌ **Avoid**: Starting without context (always check `AI-CONTEXT.md`)

## 🚨 **Critical Context Preservation Points**

### **Before Major Changes**
1. **Load Context**: `cat AI-CONTEXT.md`
2. **Understand Impact**: `npm run ai-toolkit impact "target"`
3. **Check Dependencies**: `npm run ai-toolkit deps`
4. **Validate Patterns**: `npm run ai-toolkit patterns`

### **During Development**
1. **Follow Established Patterns**: Reference `AI-CONTEXT.md`
2. **Preserve Core Components**: Don't modify without impact analysis  
3. **Update Legacy Markers**: Add deprecation comments for old code
4. **Maintain Boundaries**: Respect architectural separation

### **After Significant Work**
1. **Quick Health Check**: `npm run coordinate-agents --quick`
2. **Update Intelligence**: `npm run project-intel --update`
3. **Validate Health**: Check architectural health score
4. **Document Changes**: Update pattern documentation if needed

## 🎯 **Specific Anti-Drift Measures**

### **1. Duplicate Prevention**
```bash
# Before creating new component
npm run ai-toolkit context "similar-component"
grep -r "ComponentName" --include="*.tsx" .
```

### **2. Pattern Enforcement**
```bash
# Check pattern consistency  
npm run ai-toolkit patterns --focus=components

# Find similar implementations
npm run ai-toolkit context "pattern-name"
```

### **3. Legacy Detection**
```bash
# Find deprecated code
npm run ai-toolkit dead-code

# Check for TODO/FIXME markers
grep -r "TODO\|FIXME\|@deprecated" --include="*.{ts,tsx}" .
```

### **4. Architectural Boundary Validation**
```bash
# Check dependency relationships
npm run ai-toolkit deps --focus=circular

# Validate integration points
npm run project-intel --validate
```

## 📊 **Health Monitoring**

### **Daily Indicators**
- Architectural Health Score > 80
- No new circular dependencies
- Pattern consistency > 85%
- Legacy system count not increasing

### **Weekly Review**
- Run full coordination analysis
- Update project intelligence
- Review and plan legacy migrations
- Check for architectural drift

### **Monthly Assessment**
- Deep architectural review
- Pattern standardization
- Dependency audit
- Documentation updates

## 🚀 **Emergency Context Recovery**

If context drift is detected:

### **Immediate Actions**
```bash
# 1. Build fresh intelligence
npm run project-intel

# 2. Run full analysis
npm run coordinate-agents --deep

# 3. Identify drift areas
npm run ai-toolkit patterns
npm run ai-toolkit deps
```

### **Recovery Planning**
1. **Assess Damage**: Review coordination report for issues
2. **Prioritize Fixes**: Start with critical architectural violations
3. **Plan Migration**: Create step-by-step legacy system removal
4. **Implement Gradually**: Fix patterns one component at a time
5. **Monitor Progress**: Run coordination after each major fix

## 🎯 **Success Metrics**

### **Context Preservation Success**
- ✅ Architectural health score > 85
- ✅ Pattern consistency > 90%  
- ✅ Zero new legacy systems
- ✅ Decreasing dependency count
- ✅ Consistent coding patterns

### **AI Efficiency Success**  
- ✅ < 5,000 tokens per major feature
- ✅ < 2,000 tokens per daily development session
- ✅ < 10 tool calls per feature implementation
- ✅ Zero duplicate implementations
- ✅ Consistent architectural decisions

---

**Remember**: Context preservation is cheaper than context recovery. Always invest in maintaining architectural awareness rather than fixing architectural drift after it occurs.

*This guide should be reviewed and updated as the project evolves.*