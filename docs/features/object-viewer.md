# Object Viewer

## User Story
As a developer, I want to inspect and modify 3D objects in real-time, so that I can debug and fine-tune their properties, materials, and performance characteristics.

## Acceptance Criteria
1. The viewer should display a panel with tabs for different aspects of the object:
   - Transform (position, rotation, scale)
   - Material (type and shader uniforms)
   - Geometry (vertices, faces, draw range)
   - Performance (draw calls, triangles, memory usage)
2. Property changes should be immediately reflected on the target object
3. The viewer should support shader material inspection
4. The viewer should include a protoplanet shader preview for testing
5. The viewer should be collapsible to save screen space
6. The viewer should work with any THREE.Object3D instance

## Implementation Strategy
1. Create a React component that accepts a target object and optional callback
2. Use React Three Fiber for 3D rendering integration
3. Implement a tabbed interface using Tailwind CSS
4. Add real-time property updates with proper TypeScript typing
5. Include a protoplanet shader preview for testing shader materials
6. Add performance monitoring capabilities

## Testing Approach
1. Unit tests for:
   - Component rendering with and without target
   - Tab switching functionality
   - Property change handling
   - Protoplanet preview toggling
   - Material information display
   - Geometry information display
   - Performance information display
2. Integration tests for:
   - Property updates affecting the target object
   - Shader material uniform updates
   - Performance metrics accuracy

## Usage Example
```tsx
<ObjectViewer 
  target={yourObject} 
  onPropertyChange={(property, value) => {
    console.log(`Changed ${property} to ${value}`);
  }} 
/>
```

## Dependencies
- React
- Three.js
- React Three Fiber
- @react-three/drei
- Tailwind CSS 