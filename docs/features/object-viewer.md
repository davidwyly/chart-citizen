# Object Viewer

## User Story
Inspect and modify 3D objects in real-time for debugging and fine-tuning.

## Acceptance Criteria
1. Displays panel with tabs for:
   - Transform (position, rotation, scale)
   - Material (type, shader uniforms)
   - Geometry (vertices, faces, draw range)
   - Performance (draw calls, triangles, memory usage)
2. Property changes immediately reflected on target object.
3. Supports shader material inspection.
4. Includes protostar shader preview for testing.
5. Collapsible to save screen space.
6. Works with any `THREE.Object3D` instance.

## Implementation Strategy
1. React component accepting target object and optional callback.
2. React Three Fiber for 3D rendering.
3. Tabbed interface with Tailwind CSS.
4. Real-time property updates with TypeScript.
5. Protostar shader preview for testing shader materials.
6. Performance monitoring capabilities.

## Testing Approach
1. Unit tests for:
   - Component rendering (with/without target)
   - Tab switching
   - Property change handling
   - Protostar preview toggling
   - Material, geometry, performance info display
2. Integration tests for:
   - Property updates affecting target object
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