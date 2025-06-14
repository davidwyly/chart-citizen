# Utils Context

This directory contains utility functions and helpers used throughout the engine:

- `stellar-zones.ts`: Calculates habitable zones and snow lines for stars based on their spectral type and luminosity, supporting both single and binary star systems
- `orbital-mechanics-calculator.ts`: Unified orbital mechanics system that prevents orbit intersections by calculating all visual sizes first, then placing orbits sequentially with proper clearance including moon systems; accounts for effective orbital radius (object + outermost moon) when determining clearance; memoizes results to avoid recalculation and ensures orbital paths are determined before rendering