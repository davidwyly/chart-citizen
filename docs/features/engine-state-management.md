# Engine State Management

## User Story
As a developer, I want a centralized and predictable way to manage the core state of the 3D engine, including its configuration, active scenes, and operational status, so I can build features consistently and maintain application stability.

## Acceptance Criteria
- The engine state can be initialized, started, and stopped programmatically.
- Configuration settings (e.g., debug mode, FPS, antialiasing) can be dynamically updated.
- Scenes can be added, removed, and set as current, with appropriate error handling.
- The engine provides clear status indicators for initialization and running state.

## High-Level Implementation Strategy
- Utilize Zustand, a lightweight state-management library, to create a global `useEngineStore`.
- Define `EngineState` and `EngineConfig` interfaces to ensure type safety and clarity of state structure.
- Implement actions (`setConfig`, `addScene`, `removeScene`, `setCurrentScene`, `initialize`, `start`, `stop`, `setError`) to modify the state in a controlled manner.
- Store references to active scenes and the current scene ID within the store.

## High-Level Testing Approach
- Unit tests for each action in `useEngineStore` to verify state transitions and error handling.
- Mock Zustand's `create` function to isolate the store's logic during testing.
- Ensure that `initialize` sets `isInitialized` to true and `start` sets `isRunning` to true.
- Verify that attempting to start before initialization or setting a non-existent scene throws appropriate errors. 