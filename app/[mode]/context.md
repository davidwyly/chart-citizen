# Dynamic Mode Route Context

This directory handles dynamic routing for different viewing modes (e.g., realistic, star-citizen) and contains the entry point for each mode.

## Key Files and Directories

- `page.tsx`: Selects and renders the appropriate mode-specific viewer based on the dynamic `[mode]` URL parameter.
- `realistic/`: Contains the page component and related files for the realistic celestial simulation mode.
- `star-citizen/`: Contains the page component and related files for the Star Citizen universe exploration mode.
- `starmap/`: Contains the starmap navigation interface and components for system selection within a given mode.
