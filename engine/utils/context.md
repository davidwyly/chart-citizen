# Utils Context

This directory contains utility functions and helpers used throughout the engine:

- `stellar-zones.ts`: Calculates habitable zones and snow lines for stars based on their spectral type and luminosity, supporting both single and binary star systems
- `orbital-mechanics-calculator.ts`: **Comprehensive orbital mechanics system** that ensures proper scaling and positioning across all view modes (realistic, navigational, profile). Features: **fixed orbital scaling** for consistent view modes, **improved classification logic** (differentiates gas giants from terrestrial planets), **proportional parent-child scaling** for realistic moon sizing, **belt positioning** between correct orbital positions, **collision detection** to prevent overlaps, and **memoization** for performance. Implements proportional scaling where moons are sized relative to their parent planets in realistic mode.

## Tests
- `__tests__/orbital-mechanics-calculator.test.ts`: Core functionality tests for orbital mechanics calculations
- `__tests__/orbital-mechanics-flow.test.ts`: **Comprehensive step-by-step flow analysis** testing object loading → view mode scaling → orbital positioning → belt positioning → collision detection to ensure system integrity across all view modes
- `__tests__/stellar-zones.test.ts`: Tests for stellar habitable zone calculations