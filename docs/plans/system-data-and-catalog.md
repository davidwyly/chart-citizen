# System Data Loading and Catalog Management

## User Story
Efficiently load and manage celestial system data and object catalogs for seamless viewing and interaction without performance issues.

## Acceptance Criteria
- Loads system data (stars, planets, moons, jump points) for various modes (realistic, Star Citizen).
- Efficiently retrieves detailed catalog information for individual celestial objects.
- Asynchronous, non-blocking data loading for smooth user experience.
- Loaded data cached to minimize redundant requests and improve performance.

## High-Level Implementation Strategy
- Implement `EngineSystemLoader` to centralize data loading/caching logic.
- Utilize `fetch` API for JSON data from `/data` endpoints.
- Implement caching mechanisms (e.g., `Map` objects) for system/catalog data.
- Provide methods for checking loading status and clearing cache.

## High-Level Testing Approach
- Unit tests for `EngineSystemLoader` methods (`loadSystem`, `getCatalogObject`, `getAvailableSystems`, caching behavior) for functionality/error handling.
- Integration tests to verify `SystemViewer`/mode views interact correctly with `EngineSystemLoader`.
- Performance tests to measure data loading times/cache efficiency (large datasets). 