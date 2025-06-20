# Dependency Analysis 📦

**Analysis Time**: 23ms

## 📊 Dependency Summary
- **Total Packages**: 74
- **Used Packages**: 53 (72%)
- **Unused Packages**: 21
- **Circular Dependencies**: 0
- **Heavy Imports**: 12

## 🧹 Unused Dependencies (13)
- **@hookform/resolvers** (dependency) - No import statements found
- **@radix-ui/react-badge** (dependency) - No import statements found
- **@radix-ui/react-sheet** (dependency) - No import statements found
- **@radix-ui/react-table** (dependency) - No import statements found
- **date-fns** (dependency) - No import statements found
- **framer-motion** (dependency) - No import statements found
- **react-dom** (dependency) - No import statements found
- **zod** (dependency) - No import statements found
- **@testing-library/dom** (devDependency) - No import statements found
- **autoprefixer** (devDependency) - No import statements found

... and 3 more

## 🔄 Circular Dependencies (0)
No circular dependencies detected!


## 📦 Heavy Imports (12)
- **vitest** used in 139 files - Consider creating a centralized import/export file
- **@testing-library/react** used in 56 files - Consider creating a centralized import/export file
- **three** used in 88 files - Consider creating a centralized import/export file
- **react** used in 169 files - Consider creating a centralized import/export file
- **path** used in 18 files - Consider creating a centralized import/export file
- **fs** used in 17 files - Consider creating a centralized import/export file
- **next** used in 13 files - Review import strategy for optimization opportunities
- **@react-three/fiber** used in 61 files - Consider creating a centralized import/export file

## 💡 Recommendations
- 🧹 **Cleanup**: Remove 13 unused dependencies to reduce bundle size
- 📦 **Performance**: Optimize 12 heavy imports for better bundle size
- 📊 **Health**: 28% of dependencies are unused - consider dependency audit

## 📊 Analysis Metrics
- **Files Analyzed**: 379
- **Packages Tracked**: 60
- **Dependency Utilization**: 72%
- **Circular Complexity**: 0

## 🎯 Quick Actions
1. **Immediate**: Remove unused dependencies to reduce security surface
2. **Short-term**: Resolve circular dependencies starting with highest severity
3. **Medium-term**: Optimize heavy imports for better bundle performance
4. **Long-term**: Regular dependency audits to maintain health

*Generated on 2025-06-20T18:30:57.832Z*
