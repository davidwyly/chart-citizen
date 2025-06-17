import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"
import { extend } from "@react-three/fiber"

export const TerrestrialPlanetMaterial = shaderMaterial(
  {
    time: 0.0,
    planetRadius: 1.0,
    landColor: new THREE.Color(0.05, 0.4, 0.05),
    seaColor: new THREE.Color(0.0, 0.18, 0.45),
    sandColor: new THREE.Color(0.9, 0.66, 0.3),
    snowColor: new THREE.Color(1.0, 1.0, 1.0),
    atmosphereColor: new THREE.Color(0.05, 0.8, 1.0),
    lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
    rotationSpeed: 0.2,
    terrainScale: 2.0,
    cloudScale: 1.5,
    nightLightIntensity: 0.8,
    cloudOpacity: 0.6,
  },

  // Vertex Shader
  `
    uniform vec3 lightDirection;
    varying vec3 vPosition;

    void main() {
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // Fragment Shader
  `
    precision mediump float;

    uniform float time;
    uniform vec3 landColor;
    uniform vec3 seaColor;
    uniform vec3 sandColor;
    uniform vec3 snowColor;
    uniform vec3 atmosphereColor;
    uniform float rotationSpeed;
    uniform float terrainScale;
    uniform float cloudScale;
    uniform float nightLightIntensity;
    uniform float cloudOpacity;
    uniform vec3 lightDirection;

    varying vec3 vPosition;

    #define PI 3.14159265359

    float hash(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    vec3 rotateY(vec3 p, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return vec3(
        c * p.x - s * p.z,
        p.y,
        s * p.x + c * p.z
      );
    }

    vec2 sphericalUV(vec3 p) {
      float r = length(p);
      float y = clamp(p.y / r, -1.0, 1.0);
      return vec2(
        atan(-p.z, p.x) / (2.0 * PI) + 0.5,
        acos(y) / PI
      );
    }

    float terrainHeight(vec3 p) {
      return fbm(p * terrainScale * 4.0) - 0.5;
    }

    vec2 terrainFactors(vec3 p, float h) {
      float t = 1.0 - abs(p.y);
      float s = abs(p.y);
      t += fbm(p * 2.0);
      s += fbm(p * 2.0);
      return vec2(t, s);
    }

    vec3 getTerrainColor(vec3 p, vec2 tf, float h) {
      if (h < 0.0) return seaColor * (1.0 + h * 2.0);
      if (tf.x < 0.2) return snowColor;
      float f = clamp((tf.x + tf.y * 0.5) * 0.5, 0.0, 1.0);
      return mix(sandColor, landColor, pow(f, 2.0)) * (0.5 + h);
    }

    float nightLights(vec3 p, float h, vec2 tf) {
      float l = fbm(p * 32.0) * 2.0;
      return l * (tf.x > 0.2 ? tf.y : 0.0) * (h > 0.0 ? 1.0 : 0.0);
    }

    float cloudLayer(vec3 p) {
      float c = fbm(p * 8.0);
      c += fbm(p * 2.0) * 0.5;
      return clamp(c, 0.0, 1.0);
    }

    void main() {
      float angle = time * rotationSpeed;
      vec3 rotated = rotateY(normalize(vPosition), angle);

      float h = terrainHeight(rotated);
      vec2 tf = terrainFactors(rotated, h);
      vec3 baseColor = getTerrainColor(rotated, tf, h);

      vec3 lightDir = normalize(lightDirection);
      vec3 normal = normalize(rotated);
      float diffuse = max(dot(normal, lightDir), 0.0);
      float ambient = 0.15;
      vec3 color = baseColor * (diffuse + ambient);

      if (h < 0.0) {
        vec3 viewDir = normalize(-rotated);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 12.0);
        color += vec3(1.0) * spec * diffuse * 0.6;
      }

      float night = nightLights(rotated, h, tf);
      float nightFactor = pow(1.0 - diffuse, 2.0);
      color += vec3(1.0, 0.8, 0.3) * night * nightFactor * nightLightIntensity;

      float cloud = cloudLayer(rotated) * cloudOpacity;
      vec3 cloudColor = vec3(0.9, 0.95, 1.0) * (diffuse + ambient);
      color = mix(color, cloudColor, clamp(cloud, 0.0, 0.6));

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ TerrestrialPlanetMaterial })



// Helper function to create material with quality level
export function createTerrestrialPlanetMaterial(qualityLevel: EffectsLevel = 'high') {
  const iterations = qualityLevel === 'high' ? 8 : qualityLevel === 'medium' ? 4 : 2
  return new TerrestrialPlanetMaterial({
    qualityLevel: iterations
  })
}
