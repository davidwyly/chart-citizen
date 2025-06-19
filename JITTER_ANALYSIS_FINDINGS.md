# JITTER ANALYSIS FINDINGS
## Chart Citizen - Fast Moving Small Objects (Titan Problem)

**Analysis Date:** 2025-01-19  
**Focus:** Understanding jitter issues with fast-moving small objects like Titan at 0.1x speed

---

## 🔍 RESEARCH SUMMARY

### Three.js & WebGL Limitations Discovered

**Floating Point Precision Limits:**
- WebGL uses 32-bit floating point values with ~8 significant digits precision
- **Critical threshold:** Values below `1×10^-5` cause visibility/tracking issues
- **Practical minimum:** `1×10^-6` for reliable WebGL operations
- **Optimal range:** `0.01` to `1×10^6` units

**Camera Distance Issues:**
- **Problematic range:** Camera distances < `0.01` units cause precision errors
- **Precision issues:** Camera distances < `0.0001` units are below WebGL practical limits

---

## 📊 TITAN CURRENT STATE ANALYSIS

### Visual Size by View Mode
| View Mode | Visual Size | Camera Distance | Performance Category |
|-----------|-------------|-----------------|---------------------|
| **Scientific** | `0.00001` units | `0.00004` units | 🔴 **PRECISION ISSUES** |
| **Explorational** | `0.04` units | `0.16` units | 🟡 **POTENTIAL JITTER** |
| **Navigational** | `0.6` units | `2.4` units | 🟢 **ACCEPTABLE** |
| **Profile** | `0.4` units | `1.6` units | 🟢 **ACCEPTABLE** |

### Movement Analysis (Orbital Motion)
**Titan orbital period:** 15.945 days (fast moon)

| Time Multiplier | Movement Delta/Frame | Status |
|----------------|---------------------|---------|
| **0.1x** | `1.52×10^-8` units | 🚫 **IGNORED** (below threshold) |
| **1.0x** | `1.52×10^-7` units | 🚫 **IGNORED** (below threshold) |
| **5.0x** | `7.60×10^-7` units | 🚫 **IGNORED** (below threshold) |
| **20.0x** | `3.04×10^-6` units | 🚫 **IGNORED** (below threshold) |

**Current movement threshold:** `0.001` units  
**Problem:** Even at 20x speed, Titan movement is only `0.003x` the threshold!

---

## 🚨 ROOT CAUSE ANALYSIS

### 1. **CRITICAL: Movement Detection Threshold Too High**
- **Current threshold:** `0.001` units/frame
- **Titan max movement:** `3.04×10^-6` units/frame (at 20x speed)
- **Impact:** ALL Titan orbital movement is filtered out as "micro-jitter"
- **Result:** Camera tracking appears static, causing visible object displacement

### 2. **HIGH: Scientific Mode Visual Size Too Small**
- **Current size:** `0.00001` units
- **Camera distance:** `0.00004` units  
- **Impact:** Below practical WebGL precision limits
- **Result:** Floating point precision errors in camera calculations

### 3. **MEDIUM: Fast Orbital Period Creates Micro-Movements**
- **Titan period:** 15.945 days vs typical planet periods (365+ days)
- **Impact:** Creates frequent, very small position updates
- **Result:** Falls into the problematic `10^-6` to `10^-3` range

### 4. **MEDIUM: Explorational Mode Close to Problem Zone**
- **Current size:** `0.04` units
- **Camera distance:** `0.16` units
- **Impact:** Close to `0.1` unit threshold where jitter becomes noticeable
- **Result:** Marginal tracking performance

---

## 🎯 OPTIMAL VISUAL SIZE RANGES

Based on Three.js/WebGL research and testing:

### **Recommended Minimum Visual Sizes:**
- **Scientific Mode:** Increase from `0.00001` → `0.0001` units (10x larger)
- **Explorational Mode:** Increase from `0.04` → `0.08` units (2x larger)  
- **Navigational/Profile:** Current sizes are acceptable

### **Movement Detection Thresholds:**
- **Current:** `0.001` units (too high for small objects)
- **Recommended:** `1×10^-6` units (allowing detection of Titan movement)
- **Alternative:** Adaptive threshold based on object size/speed

### **Camera Distance Guidelines:**
- **Minimum safe distance:** `0.1` units
- **Optimal range:** `1.0` to `10.0` units
- **Scientific mode multiplier:** Increase from `4.0x` → `40.0x` for small objects

---

## 📋 RECOMMENDED FIXES (Priority Order)

### **1. 🚨 CRITICAL: Adjust Movement Detection Threshold**
```typescript
// Current: 0.001 units
// Proposed: Adaptive threshold based on object visual size
const threshold = Math.max(visualSize * 0.01, 1e-6)
```

### **2. 🔴 HIGH: Increase Scientific Mode Minimum Size**
```typescript
// Current: minVisualSize = 0.00001
// Proposed: minVisualSize = 0.0001 (10x increase)
```

### **3. 🟡 MEDIUM: Improve Explorational Mode Scaling**
```typescript
// Current: minVisualSize = 0.02
// Proposed: minVisualSize = 0.05 (2.5x increase)
```

### **4. 🟡 MEDIUM: Adaptive Camera Distance for Small Objects**
```typescript
// Current: distance = visualSize * 4.0
// Proposed: distance = Math.max(visualSize * 4.0, 0.1)
```

---

## 🧪 VALIDATION APPROACH

### **Before Implementing Fixes:**
1. Create test cases for each proposed change
2. Validate movement detection with realistic orbital data
3. Test camera tracking stability across all view modes
4. Verify no regressions for normal-sized objects

### **Success Criteria:**
- Titan movement detected and tracked smoothly at 0.1x speed
- No precision-related jitter in any view mode  
- Camera distances remain above `0.01` units in all cases
- Normal objects (planets, large moons) unaffected

---

## 📈 EXPECTED OUTCOMES

**After implementing these fixes:**
- ✅ Titan tracking will be smooth at all speeds (0.1x - 20x)
- ✅ Scientific mode will have stable camera positioning  
- ✅ Explorational mode jitter will be eliminated
- ✅ All view modes will respect WebGL precision limits
- ✅ Fast-moving small objects will track correctly

**Performance Impact:** Minimal - mostly configuration changes to existing systems.