# System Data Loading and Catalog Management

## User Story
As a user, I want the application to efficiently load and manage celestial system data and object catalogs, so I can seamlessly view and interact with different star systems and celestial bodies without performance issues.

## Acceptance Criteria
- The application can load system data (stars, planets, moons, jump points) for various modes (realistic, Star Citizen).
- It can efficiently retrieve detailed catalog information for individual celestial objects.
- Data loading is asynchronous and non-blocking, ensuring a smooth user experience.
- Loaded data is cached to minimize redundant requests and improve performance.

## High-Level Implementation Strategy
- Implement the `EngineSystemLoader` class to centralize data loading and caching logic.
- Utilize `fetch` API to retrieve JSON data from predefined `/data` endpoints.
- Implement caching mechanisms (e.g., `Map` objects) for both system data and catalog objects.
- Provide methods for checking loading status and clearing cache.

## High-Level Testing Approach
- Unit tests for `EngineSystemLoader` methods (`loadSystem`, `getCatalogObject`, `getAvailableSystems`, caching behavior) to ensure correct functionality and error handling.
- Integration tests to verify that the `SystemViewer` and mode views correctly interact with the `EngineSystemLoader`.
- Performance tests to measure data loading times and cache efficiency, especially with large datasets. 