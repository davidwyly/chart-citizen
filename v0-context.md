# Root Directory Context

- **app/**: Next.js App Router directory containing dynamic route handlers and layout components for the multi-zone architecture.
- **apps/**: Mode-specific application components for realistic and star-citizen simulation modes.
- **components/**: Reusable React components for UI elements, 3D interactions, orbital mechanics, and system visualization.
- **engine/**: Core rendering engine with object factories, system loaders, and organized renderers for celestial objects.
- **lib/**: Utility libraries for system loading and planet customization logic.
- **public/**: Static assets including JSON data files for object catalogs, system definitions, and mode-specific content.
- **middleware.ts**: Next.js middleware that redirects root path requests to the default realistic mode.
- **v0-instructions.md**: Comprehensive project documentation outlining the multi-zone architecture and development guidelines.
