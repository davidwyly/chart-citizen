# Engine State Management

## User Story
Centralized, predictable 3D engine state management (configuration, scenes, operational status) for consistent features and stability.

## Acceptance Criteria
- Engine state can be initialized, started, and stopped programmatically.
- Configuration settings (e.g., debug mode, FPS, antialiasing) can be dynamically updated.
- Scenes can be added, removed, and set as current, with error handling.
- Engine provides clear status indicators (initialization, running state).

## High-Level Implementation Strategy
- Use Zustand for global `useEngineStore`.
- Define `EngineState`/`EngineConfig` interfaces for type safety.
- Implement actions (`setConfig`, `addScene`, `removeScene`, `setCurrentScene`, `initialize`, `start`, `stop`, `setError`) to modify state.
- Store references to active scenes and current scene ID.

## High-Level Testing Approach
- Unit tests for `useEngineStore` actions (state transitions, error handling).
- Mock Zustand's `create` to isolate store logic.
- Verify `initialize` sets `isInitialized` to true and `start` sets `isRunning` to true.
- Confirm errors thrown for starting before initialization or non-existent scenes. 