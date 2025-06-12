# Mode System

## Overview
The Mode System is a core feature that enables switching between different viewing modes (Reality and Star Citizen) while maintaining separate states, features, and data sources for each mode.

## User Story
As a user, I want to switch between Reality and Star Citizen modes to view the same astronomical objects with different visualizations and information, so that I can compare scientific data with game representations.

## Acceptance Criteria
1. Users can switch between Reality and Star Citizen modes
2. Each mode maintains its own:
   - Feature set (scientific info, educational content, game info, jump point info)
   - Data source
   - View mode settings
3. View mode scaling adjusts automatically based on the current mode
4. Mode switching is seamless and doesn't affect the engine's core functionality
5. Data sources remain separate and don't leak between modes

## Implementation Details

### Core Components

#### Mode System Store (`mode-system.ts`)
- Manages the current mode state
- Handles mode switching
- Controls feature toggles
- Manages data sources

#### View Modes (`view-modes.ts`)
- Defines scaling constants for each mode
- Provides view mode switching functionality
- Maintains separate scaling configurations

#### Types (`types.ts`)
- Defines interfaces for:
  - Mode state
  - Mode features
  - View mode state
  - Data source structure

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
- Mode switching functionality
- Feature toggling
- View mode scaling
- Data source management
- State isolation between modes

### Integration Tests
- Mode system with view modes
- Mode system with data sources
- Engine integration

## Performance Considerations
- Mode switching should be instantaneous
- View mode scaling should be optimized for rendering
- Data source management should be memory efficient

## Security Considerations
- Data sources should be strictly isolated between modes
- No cross-mode data access should be possible
- External data should be validated before being set as a data source

## Future Enhancements
1. Additional viewing modes
2. Custom scaling configurations
3. Mode-specific feature sets
4. Enhanced data source validation
5. Performance optimizations for large datasets 