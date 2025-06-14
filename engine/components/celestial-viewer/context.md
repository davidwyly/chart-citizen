# Celestial Viewer Components

This directory contains components for the celestial viewer feature, which allows users to explore and interact with different celestial objects in the Chart-Citizen application.

## Files

- `celestial-viewer.tsx`: Main component that orchestrates the celestial viewer interface, including the 3D canvas and sidebars, with support for special objects like black holes and protostars
- `object-catalog.tsx`: Component for displaying and selecting different celestial objects, organized by category with collapsible sections and search functionality
- `object-controls.tsx`: Component for adjusting shader parameters and object properties through native HTML range sliders, including habitability parameters for habitable planets
- `object-info.tsx`: Component for displaying detailed information about the selected celestial object including physical and visual properties

## Purpose

The celestial viewer serves as an educational and development tool, allowing users to:
1. Explore different types of celestial objects (stars, planets, habitable worlds, etc.)
2. Adjust shader parameters to see their effect on rendering
3. Dynamically modify habitability parameters (humidity, temperature, population) for habitable planets
4. Learn about object properties and characteristics
5. Test and debug shader implementations

The viewer is particularly useful for:
- Understanding how different parameters affect object appearance
- Real-time experimentation with habitable planet characteristics
- Debugging shader issues
- Learning about celestial object properties
- Quick iteration on shader development 