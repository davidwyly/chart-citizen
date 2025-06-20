# **Development Cycle Workflow Summary**

## **Overview**

A structured dev cycle for features, hotfixes, and bugs—ensuring clarity, quality, and traceable documentation.

---

## **Work Types and Branching Rules**

### **Bug**

* **Definition**: Issue found during current dev cycle on a *feature branch*
* **Branching**: *Do not* create a new branch — fix directly on the current feature branch
* **Docs**: Use `/docs/planning` for bug planning (`*_bugs_##.md`)

### **Hotfix**

* **Definition**: Defect discovered on `main` outside the current dev cycle
* **Branching**: Create branch `HOTFIX-####`
* **Docs Required**: `/docs/hotfixes/[####]-[defect-name-fix].hotfix.md`
* **Restrictions**: Do not create hotfix branch without this file

### **Feature**

* **Definition**: New functionality to be implemented
* **Branching**: Create branch `FEATURE-####`
* **Docs Required**: `/docs/features/[####]-[feature-name].feature.md`
* **Restrictions**: Do not create feature branch without this file

---

## **Workflow Phases**

### 1. **Branch Creation**

* Use naming based on work type: `FEATURE-####`, `HOTFIX-####`, or use current feature branch for bugs
* Branch from `main` unless fixing a bug on an active feature branch

### 2. **Brainstorming (Optional, for early concept work)**

* File: `/docs/brainstorms/[brainstorm-name].brainstorm.md`
* Used for early exploration of potential systems and features

### 3. **Planning, Architecture, and Design**

* File: `/docs/plans/[####]-[plan-name].plan.md`
* Break down brainstorm ideas into tasks, define order and dependencies
* Use Claude's Q\&A format to refine scope and resolve ambiguities

### 4. **Features (fully documented)**

* File: `/docs/features/[####]-[feature-name].feature.md`
* Use Q\&A to clarify, fix issues, and repeat as needed
* Multiple iterations allowed
* Follow same review and commit rules as implementation

### 5. **Hotfixes (defects off main branch)**

* File: `/docs/hotfixes/[####]-[defect-name-fix].hotfix.md`
* Use Q\&A to clarify, fix issues, and repeat as needed
* Multiple iterations allowed
* Follow same review and commit rules as implementation

### 6. **Plan Implementation**

* Finalize and commit planning docs first
* Implement features or fixes per plan
* Track progress in documents
* **No auto-commits**
* All potential commits must be approved by user manually [IMPORTANT] 

### 7. **Bug Fixing (bugs off feature branch)**

* File: `/docs/features/[####]-[feature-name].[bugfix-name].bugfix.md`
* Use Q\&A to clarify, fix issues, and repeat as needed
* Multiple iterations allowed
* Follow same review and commit rules as implementation

### 8. **Cycle Closure**

* Ensure all features/hotfixes and bugs resolved
* Move all docs to `completed/` folder
* Final commit, merge branch to `main`, delete branch
* Prepare for next cycle

---

## **Core Principles**

* **Branch only with supporting documentation**
* **Never auto-commit code**
* **Use structured Q\&A for clarity**
* **Document every decision and fix**
* **Commit only after review and approval**

---

## **Success Criteria**

* Plans are clear before implementation
* Bugs are minimal and expected
* Code is reviewed, clean, and maintainable
* Documentation supports future developers
