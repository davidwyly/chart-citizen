# Terrestrial Planet Shader

A high-performance, quality-configurable shader for rendering realistic terrestrial planets with dynamic effects.

## Features

- Procedural terrain generation with quality-based detail levels
- Animated cloud systems with realistic movement
- Ocean/land masking with specular highlights
- Dynamic night lights for inhabited areas
- Atmospheric effects and lighting
- Quality levels for performance optimization

## Quality Levels

The shader supports three quality levels that affect various aspects of the rendering:

### High Quality
- 8 iterations of noise for terrain generation
- Full cloud detail with multiple layers
- Detailed night light patterns
- Complete atmospheric effects
- Best for high-end systems and close-up views

### Medium Quality
- 4 iterations of noise for terrain
- Simplified cloud system
- Basic night light patterns
- Reduced atmospheric effects
- Balanced performance and visual quality

### Low Quality
- 2 iterations of noise for terrain
- Minimal cloud coverage
- Basic night lights
- Essential atmospheric effects
- Optimized for performance

## Performance Impact

| Quality Level | GPU Memory | FPS Impact | Best For |
|--------------|------------|------------|----------|
| High         | ~100MB     | -30%       | Close-ups, high-end systems |
| Medium       | ~50MB      | -15%       | General viewing, mid-range systems |
| Low          | ~25MB      | -5%        | Distant views, low-end systems |

## Usage

```typescript
import { createTerrestrialPlanetMaterial } from '@/engine/renderers/planets/materials/terrestrial-planet-material'

// Create material with desired quality level
const material = createTerrestrialPlanetMaterial('high') // or 'medium' or 'low'

// Customize material properties
material.landColor = new THREE.Color(0.05, 0.4, 0.05)
material.seaColor = new THREE.Color(0.0, 0.18, 0.45)
material.cloudOpacity = 0.6
material.terrainScale = 2.0
```

## Example Configurations

### Earth-like Planet
```typescript
const earthMaterial = createTerrestrialPlanetMaterial('high')
earthMaterial.landColor = new THREE.Color(0.05, 0.4, 0.05)
earthMaterial.seaColor = new THREE.Color(0.0, 0.18, 0.45)
earthMaterial.sandColor = new THREE.Color(0.9, 0.66, 0.3)
earthMaterial.snowColor = new THREE.Color(1.0, 1.0, 1.0)
earthMaterial.atmosphereColor = new THREE.Color(0.05, 0.8, 1.0)
earthMaterial.terrainScale = 2.0
earthMaterial.cloudScale = 1.5
earthMaterial.nightLightIntensity = 0.8
```

### Arid Planet
```typescript
const aridMaterial = createTerrestrialPlanetMaterial('medium')
aridMaterial.landColor = new THREE.Color(0.6, 0.4, 0.1)
aridMaterial.seaColor = new THREE.Color(0.1, 0.3, 0.2)
aridMaterial.sandColor = new THREE.Color(0.8, 0.7, 0.4)
aridMaterial.snowColor = new THREE.Color(0.9, 0.9, 0.8)
aridMaterial.atmosphereColor = new THREE.Color(0.8, 0.6, 0.4)
aridMaterial.terrainScale = 3.0
aridMaterial.cloudScale = 0.8
aridMaterial.nightLightIntensity = 0.4
```

### Performance-Optimized Planet
```typescript
const optimizedMaterial = createTerrestrialPlanetMaterial('low')
optimizedMaterial.terrainScale = 1.5
optimizedMaterial.cloudScale = 1.0
optimizedMaterial.cloudOpacity = 0.4
optimizedMaterial.nightLightIntensity = 0.6
```

## Performance Monitoring

The shader includes built-in performance monitoring that can be accessed through the `usePerformanceMonitor` hook:

```typescript
import { usePerformanceMonitor } from '@/lib/performance-monitor'

function PlanetViewer() {
  const { fps, performanceLevel } = usePerformanceMonitor()
  
  // Automatically adjust quality based on performance
  const qualityLevel = performanceLevel === 'critical' ? 'low' 
    : performanceLevel === 'warning' ? 'medium' 
    : 'high'
    
  const material = createTerrestrialPlanetMaterial(qualityLevel)
  
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} />
    </mesh>
  )
}
```

## Best Practices

1. **Quality Selection**
   - Use high quality for close-up views and important planets
   - Use medium quality for general viewing
   - Use low quality for distant objects and background planets

2. **Performance Optimization**
   - Monitor FPS and adjust quality level accordingly
   - Reduce terrain and cloud scale for distant objects
   - Lower cloud opacity for better performance
   - Consider disabling night lights for very distant objects

3. **Memory Management**
   - Dispose of materials when no longer needed
   - Reuse materials for similar planets
   - Monitor GPU memory usage with different quality levels

## Troubleshooting

### Common Issues

1. **Low FPS**
   - Reduce quality level
   - Lower terrain and cloud scale
   - Reduce cloud opacity
   - Disable night lights for distant objects

2. **Visual Artifacts**
   - Increase quality level
   - Adjust terrain scale
   - Check for GPU driver updates
   - Verify WebGL 2.0 support

3. **Memory Issues**
   - Monitor material instances
   - Dispose unused materials
   - Use lower quality for background objects
   - Implement level-of-detail system 