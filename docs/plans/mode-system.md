# Mode System

## Overview
Core feature enabling switching between Reality/Star Citizen viewing modes, maintaining separate states, features, and data sources.

## User Story
Switch between Reality/Star Citizen modes to view astronomical objects with different visualizations/information, comparing scientific data with game representations.

## Acceptance Criteria
1. Users can switch between Reality/Star Citizen modes.
2. Each mode maintains its own feature set, data source, and view mode settings.
3. View mode scaling adjusts automatically based on current mode.
4. Seamless mode switching without affecting core engine functionality.
5. Data sources remain separate, no leakage between modes.

## Implementation Details

### Core Components

#### Mode System Store (`mode-system.ts`)
- Manages current mode state, handles mode switching, controls feature toggles, manages data sources.

#### View Modes (`view-modes.ts`)
- Defines scaling constants, provides view mode switching, maintains separate scaling configurations.

#### Types (`types.ts`)
- Defines interfaces for mode state, mode features, view mode state, data source structure.

### Key Features

#### Mode Switching
```typescript
const store = useSystemStore();
store.setMode('reality'); // Switch to reality mode
store.setMode('star-citizen'); // Switch to Star Citizen mode
```

#### Feature Management
```typescript
const store = useSystemStore();
store.toggleFeature('scientificInfo'); // Toggle scientific info feature
```

#### View Mode Integration
```typescript
const viewMode = useViewMode(); // Get current view mode settings
const { scaling } = viewMode; // Access scaling configuration
```

#### Data Source Management
```typescript
const store = useSystemStore();
store.setDataSource('reality', { /* data */ }); // Set mode-specific data
```

## Testing Strategy

### Unit Tests
- Mode switching, feature toggling, view mode scaling, data source management, state isolation.

### Integration Tests
- Mode system with view modes, mode system with data sources, engine integration.

## Performance Considerations
- Instantaneous mode switching, optimized view mode scaling for rendering, memory-efficient data source management.

## Security Considerations
- Data sources strictly isolated, no cross-mode data access, external data validated.

## Future Enhancements
1. Additional viewing modes
2. Custom scaling configurations
3. Mode-specific feature sets
4. Enhanced data source validation
5. Performance optimizations for large datasets 