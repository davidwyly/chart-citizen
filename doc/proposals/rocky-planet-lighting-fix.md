# Proposal: Fix for Black Shaders on Rocky Planets

## 1. Issue

Rocky planets and other celestial bodies in the system viewer can appear black or unlit. This is because the lighting in the scene does not correctly use the positions of the stars in the system as light sources.

## 2. Root Cause Analysis

The investigation identified the following key issues:

-   **Hardcoded Light Positions**: The `SceneLighting` component in `engine/components/system-viewer/components/scene-lighting.tsx` was using hardcoded positions for its `pointLight` sources. For all non-profile views, the light was at `[0, 500, 0]`. This meant that any object far from this specific point in space would not be illuminated by the primary light source, causing it to appear black.
-   **Profile View Exception**: The component had a special case for `profile` view, using a different hardcoded position `[-600, 500, 0]`. While also flawed, this indicates that profile view has unique lighting requirements.
-   **`RockyRenderer` uses Standard Material**: The renderer for rocky planets, `RockyRenderer`, uses Three.js's `meshStandardMaterial`. This material requires scene lighting to be visible. It does not use a custom shader that could have its own bugs. The issue is therefore not a "black shader" bug, but a lack of light hitting the object.

The combination of `meshStandardMaterial` and incorrect lighting positions is the root cause of the issue.

## 3. Proposed Solution

The proposed solution is to refactor the `SceneLighting` component to use the actual position of star objects as the source for `pointLight` components.

### 3.1. Code Changes

The file `engine/components/system-viewer/components/scene-lighting.tsx` will be modified as follows:

-   **Dynamic Light Positioning**: For general system views (e.g., `explorational`), the component will now iterate through all objects classified as stars in the `systemData`. For each star, it will create a `pointLight` at the star's actual `position`.
-   **Profile View Preservation**: The special lighting for `profile` view will be preserved to avoid unintended side effects. This lighting is likely designed for a "studio" view of a single object and should be addressed as a separate task to make it relative to the focused object.
-   **Enhanced Lighting Properties**:
    -   The light's `distance` will be significantly increased to ensure it can illuminate large star systems.
    -   The light's `intensity` will be scaled by the star's `luminosity` property, if available.
    -   The light's `color` will be taken from the star's `color` property.
    -   Ambient light will be slightly increased to make the dark side of objects faintly visible.

This change will ensure that all objects in the system are correctly illuminated by the stars in that system, resolving the "black planets" issue.

## 4. Impact

-   **Visuals**: Rocky planets and other celestial bodies will be correctly lit in the system viewer. The overall visual fidelity of the application will be improved.
-   **Performance**: The performance impact is negligible. The number of light sources is still small (equal to the number of stars in a system).
-   **Profile View**: The lighting in profile view remains unchanged. A separate effort may be required to improve it. 