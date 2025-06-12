# App Directory Context

This directory contains the Next.js application routes and pages. It follows the Next.js 13+ App Router convention.

## Key Files and Directories

- `[mode]/`: Dynamic route for different viewing modes (realistic, star-citizen)
  - `realistic/`: Contains the realistic mode view component for scientifically accurate simulation
  - `star-citizen/`: Contains the Star Citizen mode view component for game-inspired universe exploration
  - `starmap/`: Starmap navigation interface for system selection
- `layout.tsx`: Root layout component that wraps all pages
- `page.tsx`: Root page component
- `globals.css`: Global styles and CSS variables
- `not-found.tsx`: Custom 404 page component
- `test-profile/`: Test page for the profile mode view of star systems
- `test-orbit-spacing/`: Test page demonstrating orbital path spacing differences between view modes
- `viewer/`: Object viewer pages for individual celestial objects

## File Organization Rules

1. Each route should be in its own directory
2. Dynamic routes should use square bracket notation (e.g., `[mode]`)
3. Mode-specific components should be in their respective mode directories
4. Shared layouts should be in `layout.tsx` files
5. Page components should be in `page.tsx` files
6. Route-specific components should be in the route directory

## Next.js Guidelines

1. Use the App Router conventions
2. Keep pages focused and minimal
3. Move complex logic to components
4. Use TypeScript for all files
5. Follow Next.js best practices for routing and layouts
6. Keep route-specific state in the appropriate route
7. Mode-specific logic should be contained within mode directories 