import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

export const SpaceCurvatureMaterial = shaderMaterial(
  {
    time: 0.0,
    spherePosition: new THREE.Vector3(0, 0, 0),
    sphereRadius: 1.0,
    intensity: 1.0,
    gridScale: 0.1,
    glowColor: new THREE.Color(0.4, 0.7, 1.0),
    gridColor: new THREE.Color(0.0, 0.8, 1.0),
  },
  // Vertex shader - gravitational distortion
  `
    uniform vec3 spherePosition;
    uniform float sphereRadius;
    uniform float time;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vOriginalPosition;
    varying float vDepth;
    
    void main() {
      vUv = uv;
      
      // Get world position
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vOriginalPosition = worldPosition.xyz;
      
      // Calculate 2D distance from sphere center on the XZ plane
      vec2 offset = worldPosition.xz - spherePosition.xz;
      float distance = length(offset);
      
      // Create a gravitational well shape
      float wellRadius = sphereRadius * 6.0; // Well extends 6x the planet radius
      float maxDepth = sphereRadius * 0.72; // Maximum depth is 72% of the planet radius
      
      float displacement = 0.0;
      
      if (distance <= wellRadius) {
        // Normalized distance from 0 (center) to 1 (edge of well)
        float normalizedDist = distance / wellRadius;
        
        // Create gravitational curve - steeper near planet, flatter at edges
        // Using inverse square relationship: 1/(1+r²)
        float gravityFactor = 1.0 / (1.0 + 6.0 * normalizedDist * normalizedDist);
        
        // Apply easing at the very edge for smooth transition to flat
        float edgeFade = 1.0 - smoothstep(0.8, 1.0, normalizedDist);
        
        displacement = maxDepth * gravityFactor * edgeFade;
      }
      
      // Apply displacement downward
      worldPosition.y -= displacement;
      vDepth = displacement;
      
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // Fragment shader - glowing grid with natural fade
  `
    uniform float time;
    uniform vec3 spherePosition;
    uniform float sphereRadius;
    uniform float intensity;
    uniform vec3 glowColor;
    uniform vec3 gridColor;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vOriginalPosition;
    varying float vDepth;
    
    void main() {
      // Create grid based on original position (before displacement)
      float gridSpacing = sphereRadius * 2.0;
      vec2 gridPos = vOriginalPosition.xz / gridSpacing;
      
      // Create glowing wireframe using sine waves and exponential falloff
      vec2 scp = sin(2.0 * 6.2831 * gridPos);
      
      vec3 wir = vec3(0.0);
      // Primary bright lines
      wir += 1.0 * exp(-12.0 * abs(scp.x));
      wir += 1.0 * exp(-12.0 * abs(scp.y));
      // Secondary softer glow
      wir += 0.5 * exp(-4.0 * abs(scp.x));
      wir += 0.5 * exp(-4.0 * abs(scp.y));
      
      // Distance from planet center for natural fading
      float distanceFromCenter = length(vOriginalPosition.xz - spherePosition.xz);
      float wellRadius = sphereRadius * 6.0;
      
      // Multi-layer natural fade
      // Start fading earlier and extend beyond well radius
      float fade1 = 1.0 - smoothstep(wellRadius * 0.5, wellRadius * 1.2, distanceFromCenter);
      
      // Additional exponential distance fade for very natural falloff
      float fade2 = exp(-0.3 * distanceFromCenter / sphereRadius);
      
      // Combine fades for natural transition
      float fade = fade1 * fade2;
      
      // Apply fade to wireframe
      wir *= fade;
      
      // Color intensity based on depth (deeper = more intense)
      float maxDepth = sphereRadius * 0.65;
      float depthIntensity = vDepth / maxDepth;
      
      // Mix colors based on depth
      vec3 finalGridColor = mix(gridColor, glowColor, depthIntensity * 0.6);
      
      // Subtle pulse animation
      float pulse = sin(time * 1.5) * 0.1 + 0.9;
      
      // Apply the glowing wireframe effect
      vec3 finalColor = finalGridColor * wir * pulse;
      float alpha = length(wir) * fade * intensity;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
)
