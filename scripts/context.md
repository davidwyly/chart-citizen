# Scripts Directory

This directory contains utility scripts for development, validation, and maintenance of the Chart-Citizen application.

## Files
- `verify-catalog-objects.js`: Script to verify that all objects defined in the local object catalog (components/debug-viewer/object-catalog.ts) have corresponding entries in the engine catalog files (public/data/engine/object-catalog/*.json).
- `convert-orbital-system.ts`: Script to convert legacy catalog-based system data to the new self-contained orbital system format.
- `standardize-radius-to-km.js`: Script to standardize all celestial object radius values to kilometers for consistent scaling across view modes. 