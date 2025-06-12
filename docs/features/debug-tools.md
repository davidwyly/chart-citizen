# Debug Tools

A comprehensive set of debugging tools for monitoring and analyzing the 3D scene, shader performance, and object properties.

## Shader Performance View

The Shader Performance View provides real-time monitoring of shader performance metrics, helping identify performance bottlenecks and optimize rendering.

### Features

- Real-time FPS monitoring per shader
- Frame time tracking
- Quality level display
- Draw call counting
- Triangle count tracking
- Expandable detailed view

### Usage

```typescript
import { ShaderPerformanceView } from '@/components/debug/shader-performance-view'

function DebugOverlay() {
  return (
    <div>
      <ShaderPerformanceView />
    </div>
  )
}
```

### Metrics

| Metric | Description | Warning Threshold |
|--------|-------------|-------------------|
| FPS | Frames per second | < 30 FPS |
| Frame Time | Time per frame in milliseconds | > 33ms |
| Draw Calls | Number of draw calls per frame | > 1000 |
| Triangles | Total triangles rendered | > 1M |

## Object Viewer

The Object Viewer is a powerful debugging tool that allows inspection and manipulation of 3D objects in the scene.

### Features

- Object hierarchy visualization
- Property inspection and editing
- Transform manipulation
- Material inspection
- Shader uniform modification
- Performance impact analysis

### Usage

```typescript
import { ObjectViewer } from '@/components/debug/object-viewer'

function DebugPanel() {
  return (
    <div className="debug-panel">
      <ObjectViewer
        target={selectedObject}
        onPropertyChange={handlePropertyChange}
      />
    </div>
  )
}
```

### Object Properties

The Object Viewer displays and allows editing of:

1. **Transform**
   - Position (x, y, z)
   - Rotation (x, y, z)
   - Scale (x, y, z)

2. **Material**
   - Shader type
   - Uniform values
   - Texture maps
   - Quality settings

3. **Geometry**
   - Vertex count
   - Face count
   - Bounding box
   - Wireframe toggle

4. **Performance**
   - Draw calls
   - Triangle count
   - Memory usage
   - Shader complexity

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + D` | Toggle debug panel |
| `Ctrl + Shift + P` | Toggle performance view |
| `Ctrl + Shift + O` | Toggle object viewer |
| `Ctrl + Shift + W` | Toggle wireframe mode |

### Best Practices

1. **Performance Monitoring**
   - Use the Shader Performance View to identify bottlenecks
   - Monitor draw calls and triangle counts
   - Watch for sudden FPS drops
   - Check memory usage patterns

2. **Object Inspection**
   - Use the Object Viewer for detailed property inspection
   - Verify transform hierarchies
   - Check material settings
   - Validate shader uniforms

3. **Debug Workflow**
   - Start with performance monitoring
   - Identify problematic objects
   - Use Object Viewer for detailed inspection
   - Make targeted optimizations

### Integration

The debug tools can be integrated into your development workflow:

1. **Development Mode**
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     return <DebugOverlay />
   }
   ```

2. **Hot Keys**
   ```typescript
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if (e.ctrlKey && e.shiftKey && e.key === 'D') {
         toggleDebugPanel()
       }
     }
     window.addEventListener('keydown', handleKeyPress)
     return () => window.removeEventListener('keydown', handleKeyPress)
   }, [])
   ```

3. **Performance Logging**
   ```typescript
   const logPerformance = (metrics: ShaderMetrics) => {
     if (metrics.fps < 30) {
       console.warn(`Low FPS detected: ${metrics.fps}`)
     }
   }
   ```

### Troubleshooting

1. **Performance Issues**
   - Check shader complexity
   - Monitor draw calls
   - Verify geometry optimization
   - Review texture sizes

2. **Visual Artifacts**
   - Inspect material settings
   - Check shader uniforms
   - Verify transform hierarchy
   - Validate UV maps

3. **Memory Problems**
   - Monitor texture memory
   - Check geometry buffers
   - Verify material disposal
   - Review shader program caching 