# Celestial Viewer Components

This directory contains components for the celestial viewer feature, which allows users to explore and interact with different celestial objects in the Chart-Citizen application.

## Files

- `celestial-viewer.tsx`: Main component that orchestrates the celestial viewer interface, including the 3D canvas and sidebars, with support for special objects like black holes and protostars
- `object-catalog.tsx`: Component for displaying and selecting different celestial objects, organized by category with collapsible sections and search functionality
- `object-controls.tsx`: Component for adjusting shader parameters and object properties through native HTML range sliders
- `object-info.tsx`: Component for displaying detailed information about the selected celestial object including physical and visual properties

## Purpose

The celestial viewer serves as an educational and development tool, allowing users to:
1. Explore different types of celestial objects (stars, planets, etc.)
2. Adjust shader parameters to see their effect on rendering
3. Learn about object properties and characteristics
4. Test and debug shader implementations

The viewer is particularly useful for:
- Understanding how different parameters affect object appearance
- Debugging shader issues
- Learning about celestial object properties
- Quick iteration on shader development 