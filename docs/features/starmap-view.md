# Starmap View

## User Story
Interactive map of star systems for route planning and quick system inspection.

## Acceptance Criteria
1. Starmap page accessible at `/{mode}/starmap` for all simulation modes.
2. Map renders every system from current mode's `starmap-systems.json`.
3. Toggle between:
   • 2-D top-down hex-grid view
   • 3-D spatial view (real distances).
4. Hovering a system highlights jump routes and shows side-panel with meta-data.
5. Clicking a system loads it in `SystemViewer`.
6. Breadcrumb in upper-left to return to starmap.
7. Route planner: ⇧ + sequential clicks build multi-leg route (must be connected).
   • Planned path drawn with glowing animated material.
   • ⌫ or Escape clears route.
8. Performance: >60 fps with up to 1,000 systems.
9. Covered by automated unit tests for route-validation and React component behavior.

## High-level Implementation Strategy

1. **Component hierarchy**
   ```
   StarmapPage (per-mode Next.js route)
     ├── StarmapViewer (Three.js Canvas)
     │     ├── SystemNodes (instanced spheres / sprites)
     │     ├── JumpRouteLines (instanced line segments)
     │     └── SkyBackdrop (simple starfield mat)
     ├── StarmapControls (UI overlay – 2D/3D toggle, clear route)
     └── SidePanel (system info & planned route list)
   ```
2. **Data loading**: reuse `engineSystemLoader.loadStarmap(mode)` for systems/jump routes.
3. **Positioning**:
   • 2-D hex grid: axial coords from sorted system ids (1.5×).
   • 3-D: use `position` from JSON (scaled for readability).
4. **Routing logic**: `validateRoute(routeIds, starmap)` utility for adjacency.
5. **State management**: local React state in StarmapPage; no global store.
6. **Navigation**: system selected → StarmapPage swaps to `SystemViewer`. Breadcrumb triggers `setSelected(null)`.
7. **Effects**: jump lines & route lines use custom shader material with pulsing opacity when hovered/active.
8. **Tests**: Jest + React Testing Library for utils/route-validation.

## High-level Testing Approach

1. **Unit**: `validateRoute` adjacency checks; view-mode toggle state.
2. **Component**: render StarmapViewer with mock starmap, ensure nodes count == systems.
3. **Integration**: simulate click → SystemViewer mount; breadcrumb click → return to starmap.
4. **Performance**: benchmark render time with 1k mock systems (<16 ms/frame). 