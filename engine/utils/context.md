# Utils Context

This directory contains utility functions and helpers used throughout the engine:

- `stellar-zones.ts`: Calculates habitable zones and snow lines for stars based on their spectral type and luminosity, supporting both single and binary star systems
- `view-mode-calculator.ts`: Legacy view mode scaling calculations for backward compatibility  
- `view-mode-calculator-km.ts`: New kilometer-based view mode system that properly handles object scaling and orbital distances for realistic, navigational, and profile view modes
- `orbital-mechanics-calculator.ts`: Comprehensive orbital mechanics system that ensures safe orbital positioning by guaranteeing orbits are always outside parent object visual radii, with proper scaling across all view modes (realistic, navigational, profile) 