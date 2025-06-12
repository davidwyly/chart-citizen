# Starmap View

## User Story

As an explorer I want to see an interactive map of all known star systems so that I can plan routes and quickly jump into any system to inspect its planets.

## Acceptance Criteria

1. A dedicated starmap page is accessible at `/{mode}/starmap` for all simulation modes (e.g. realistic, star-citizen).
2. The map renders every system from the current mode's `starmap-systems.json`.
3. Users can toggle between:
   • 2-D top-down hex-grid view
   • 3-D spatial view that respects real distances.
4. Hovering a system highlights its jump routes and shows a side-panel with system meta-data.
5. Clicking a system loads that system in the current page ( SystemViewer ).
6. A breadcrumb in the upper-left lets the user return to the starmap.
7. Route planner: holding ⇧ while clicking sequential systems builds a multi-leg route.
   • Each subsequent system must be directly connected to the previous one via a jump route; otherwise the click is ignored.
   • The current planned path is drawn with a glowing animated material.
   • Press ⌫ or Escape clears the route.
8. Performance: the map maintains >60 fps with up to 1 000 systems.
9. Feature is covered by automated unit tests for route-validation logic and React component behaviour (mount/unmount, mode toggle).

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
2. **Data loading** – reuse `engineSystemLoader.loadStarmap(mode)` to obtain systems + jump routes.
3. **Positioning**
   • 2-D hex grid: axial coords generated from sorted system ids. 1.5×
   • 3-D: use `position` from JSON (scaled for readability).
4. **Routing logic** – small util `validateRoute(routeIds, starmap)` ensuring adjacency.
5. **State management** – local React state inside StarmapPage; no global store required.
6. **Navigation** – when a system is selected, StarmapPage swaps to `SystemViewer`. Breadcrumb triggers `setSelected(null)`.
7. **Effects** – jump lines & route lines use custom shader material with pulsing opacity when hovered / active.
8. **Tests** – Jest + React Testing Library for utils and route-validation.

## High-level Testing Approach

1. **Unit** – `validateRoute` adjacency checks; view-mode toggle state.
2. **Component** – render StarmapViewer with mock starmap, ensure nodes count == systems.
3. **Integration** – simulate click → SystemViewer mount; breadcrumb click → return to starmap.
4. **Performance** – benchmark render time with 1 k mock systems (<16 ms/frame). 