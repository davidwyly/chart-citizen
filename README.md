# 🪐 Chart Citizen – Project Overview & Architecture

Chart Citizen is an interactive web application for exploring and visualising celestial systems. It is built with **Next.js 14**, **React Three Fiber** and a custom **Celestial Rendering Engine**. The repository is a **monorepo** that separates concerns across clearly-defined top-level folders:

```text
.
├── app/            # Next.js app-router entry point (pages, layouts, metadata)
├── apps/           # Stand-alone example apps (e.g. realistic mode, star-citizen mode)
├── components/     # Re-usable React components (UI, 3D UI, system viewer, sidebar…)
├── engine/         # Low-level rendering engine (Three.js abstractions, materials, effects)
├── lib/            # Framework-agnostic utilities and shared TypeScript types
│   └── types/      # Centralised type definitions (incl. @lib/types/effects-level)
├── hooks/          # Shared React hooks
├── public/         # Static assets (textures, models, data)
├── docs/           # Feature & architecture documentation
└── test/ or __tests__/  # Unit & integration tests (Vitest + React Testing Library)
```

## 🌌 Architectural Layers

1. **Next.js Application Layer (`app/`, `apps/`)**
   • Handles routing, data fetching and overall page composition.

2. **Presentation Layer (`components/`, `hooks/`)**
   • Provides declarative React components and hooks that connect UI state to the engine.

3. **Rendering Engine (`engine/`)**
   • Pure rendering logic written on top of Three.js / React Three Fiber.
   • Organised by celestial object type (`renderers/stars`, `renderers/planets`, …).
   • Uses a Factory Pattern (`object-factory.tsx`) to instantiate the correct renderer.

4. **Shared Utilities & Types (`lib/`)**
   • Pure TypeScript helpers (`utils.ts`, `performance-monitor.ts`, …).
   • **`@lib/types/effects-level`** – canonical source for:
     – `ViewType` – allowed view modes (realistic, navigational, game).
     – `EffectsLevel` – quality presets (low, medium, high).
     – `EFFECTS_LEVELS` – config object consumed by UI & engine.

## 🚫 Post-Processing Policy

**Post-processing passes are permanently disabled in this project.**

- Do NOT introduce screen-space effects such as chromatic aberration, bloom, depth-of-field, vignette, tone-mapping passes, etc.
- Visual flair **must** be implemented by per-object materials/shaders or component-scoped effects (e.g. star corona, atmospheric storms).
- Pull requests that add `@react-three/postprocessing`, `three/examples/jsm/postprocessing`, or any similar libraries will be rejected.

## 🔗 Key Workflows

• **Switching View / Effects Quality**
  1. UI dispatches a `setViewType` / `setEffectsLevel` action to a Zustand store (see `src/stores/`).
  2. Components subscribe to the store and pass the selected level to engine renderers.
  3. Renderers reference `@lib/types/effects-level` to map the level to material uniforms.

• **Adding a New Celestial Object**
  1. Create `engine/renderers/<object>/` with a renderer, `materials/`, and `effects/` sub-folders.
  2. Export the renderer and register it inside `engine/object-factory.tsx`.
  3. (Optional) expose object-specific React components in `components/`.

## 🧪 Testing Strategy

Tests live alongside the feature they cover:
• Engine calculations ⇒ `engine/__tests__/`
• Component behaviour ⇒ `components/__tests__/`
• End-to-end integration (Vitest + React Testing Library) ⇒ `__tests__/suites/`

A dedicated test ensures **panels never overlap** (`components/__tests__/panel-overlap.test.tsx`).

## 📦 Scripts (package.json)

```bash
pnpm dev        # Next.js dev server
pnpm test       # Run vitest in watch mode
pnpm build      # Build Next.js production bundle
```

---

### 🙌 Contributing

1. Read each folder's `context.md` for a one-line purpose statement.
2. When adding files, append a summary to the local `context.md` (see workspace rules).
3. Keep docs & tests in lock-step with code changes. 