/**
 * Enhanced Terrestrial Planet Material
 * ===================================
 * 
 * Advanced shader material that integrates with the new orbital mechanics architecture.
 * Supports dynamic scaling, view mode optimization, and LOD-based quality adjustment.
 */

import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";
import type { ShaderScalingParameters, AtmosphereScalingParameters } from '@/engine/services/shader-scaling/shader-scaling-service';

export interface TerrestrialPlanetUniforms {
  // Time and animation
  time: number;
  rotationSpeed: number;
  
  // Scaling parameters
  planetRadius: number;
  terrainScale: number;
  cloudScale: number;
  atmosphereScale: number;
  shaderScale: number;
  
  // Colors
  landColor: THREE.Color;
  seaColor: THREE.Color;
  sandColor: THREE.Color;
  snowColor: THREE.Color;
  atmosphereColor: THREE.Color;
  
  // Lighting
  lightDirection: THREE.Vector3;
  
  // Surface features
  hasOceans: number;
  hasAtmosphere: number;
  hasClouds: number;
  hasNightLights: number;
  
  // Detail levels
  noiseOctaves: number;
  cloudDensity: number;
  nightLightIntensity: number;
  nightLightScale: number;
  
  // Atmosphere parameters
  atmosphereThickness: number;
  scatteringIntensity: number;
  fresnelPower: number;
  rimLightIntensity: number;
  
  // Quality settings
  qualityLevel: number;
  enableHighQuality: number;
}

export const EnhancedTerrestrialPlanetMaterial = shaderMaterial(
  // Default uniforms
  {
    time: 0.0,
    rotationSpeed: 0.2,
    planetRadius: 1.0,
    terrainScale: 2.0,
    cloudScale: 1.5,
    atmosphereScale: 1.0,
    shaderScale: 1.0,
    landColor: new THREE.Color(0.05, 0.4, 0.05),
    seaColor: new THREE.Color(0.0, 0.18, 0.45),
    sandColor: new THREE.Color(0.9, 0.66, 0.3),
    snowColor: new THREE.Color(1.0, 1.0, 1.0),
    atmosphereColor: new THREE.Color(0.05, 0.8, 1.0),
    lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
    hasOceans: 1.0,
    hasAtmosphere: 1.0,
    hasClouds: 1.0,
    hasNightLights: 1.0,
    noiseOctaves: 5.0,
    cloudDensity: 0.6,
    nightLightIntensity: 0.8,
    nightLightScale: 32.0,
    atmosphereThickness: 0.02,
    scatteringIntensity: 1.0,
    fresnelPower: 2.0,
    rimLightIntensity: 0.3,
    qualityLevel: 3.0,
    enableHighQuality: 1.0,
  },

  // Vertex Shader
  `
    uniform vec3 lightDirection;
    uniform float planetRadius;
    uniform float atmosphereThickness;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying float vAtmosphereDensity;

    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      
      // Calculate view direction for Fresnel effects
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewDirection = normalize(cameraPosition - worldPos);
      
      // Calculate atmosphere density based on distance from surface
      float distanceFromCenter = length(position);
      float normalizedDistance = (distanceFromCenter - planetRadius) / (atmosphereThickness * planetRadius);
      vAtmosphereDensity = exp(-normalizedDistance * 2.0);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // Fragment Shader
  `
    precision highp float;

    uniform float time;
    uniform float rotationSpeed;
    uniform float terrainScale;
    uniform float cloudScale;
    uniform float atmosphereScale;
    uniform float shaderScale;
    uniform vec3 landColor;
    uniform vec3 seaColor;
    uniform vec3 sandColor;
    uniform vec3 snowColor;
    uniform vec3 atmosphereColor;
    uniform vec3 lightDirection;
    uniform float hasOceans;
    uniform float hasAtmosphere;
    uniform float hasClouds;
    uniform float hasNightLights;
    uniform float noiseOctaves;
    uniform float cloudDensity;
    uniform float nightLightIntensity;
    uniform float nightLightScale;
    uniform float atmosphereThickness;
    uniform float scatteringIntensity;
    uniform float fresnelPower;
    uniform float rimLightIntensity;
    uniform float qualityLevel;
    uniform float enableHighQuality;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDirection;
    varying float vAtmosphereDensity;

    #define PI 3.14159265359

    // Enhanced hash function for better noise quality
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    // Improved noise function with quality scaling
    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      
      // Use smoother interpolation for high quality
      if (enableHighQuality > 0.5) {
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // Quintic interpolation
      } else {
        f = f * f * (3.0 - 2.0 * f); // Cubic interpolation
      }
      
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }

    // Fractal Brownian Motion with quality-based octave count
    float fbm(vec3 p) {
      float f = 0.0;
      float a = 0.5;
      int octaves = int(noiseOctaves * qualityLevel);
      
      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return f;
    }

    // Enhanced rotation function
    vec3 rotateY(vec3 p, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return vec3(
        c * p.x - s * p.z,
        p.y,
        s * p.x + c * p.z
      );
    }

    // Improved spherical UV mapping
    vec2 sphericalUV(vec3 p) {
      float r = length(p);
      vec3 n = p / r;
      return vec2(
        atan(n.z, n.x) / (2.0 * PI) + 0.5,
        acos(clamp(n.y, -1.0, 1.0)) / PI
      );
    }

    // Enhanced terrain height calculation
    float terrainHeight(vec3 p) {
      vec3 scaledPos = p * terrainScale * shaderScale;
      
      // Multi-scale terrain generation
      float height = fbm(scaledPos) - 0.5;
      
      // Add fine detail for high quality
      if (enableHighQuality > 0.5) {
        height += fbm(scaledPos * 4.0) * 0.1;
        height += fbm(scaledPos * 16.0) * 0.025;
      }
      
      return height;
    }

    // Climate and biome calculation
    vec2 terrainFactors(vec3 p, float h) {
      float latitude = abs(p.y);
      float temperature = 1.0 - latitude + fbm(p * 2.0) * 0.3;
      float humidity = 0.5 + fbm(p * 1.5) * 0.5;
      
      // Adjust for elevation
      temperature -= h * 2.0;
      humidity += h * 0.5;
      
      return vec2(temperature, humidity);
    }

    // Enhanced terrain color calculation
    vec3 getTerrainColor(vec3 p, vec2 tf, float h) {
      if (hasOceans > 0.5 && h < 0.0) {
        // Ocean color with depth variation
        float depth = -h * 2.0;
        return mix(seaColor, seaColor * 0.3, clamp(depth, 0.0, 1.0));
      }
      
      // Land coloring based on climate
      float temperature = tf.x;
      float humidity = tf.y;
      
      // Snow
      if (temperature < 0.2) return snowColor;
      
      // Desert
      if (humidity < 0.3) return sandColor;
      
      // Vegetation color based on temperature and humidity
      vec3 baseVegetation = mix(sandColor, landColor, humidity);
      vec3 finalColor = mix(baseVegetation, snowColor, (1.0 - temperature) * 0.5);
      
      // Elevation shading
      finalColor *= (0.7 + h * 0.6);
      
      return finalColor;
    }

    // Enhanced night lights
    float nightLights(vec3 p, float h, vec2 tf) {
      if (hasNightLights < 0.5 || h < 0.0) return 0.0;
      
      vec3 scaledPos = p * nightLightScale * shaderScale;
      float lights = fbm(scaledPos) * 2.0;
      
      // More lights in temperate regions
      float climateFactor = tf.x * tf.y;
      lights *= climateFactor;
      
      // Coastal preference
      if (hasOceans > 0.5) {
        float coastalDistance = abs(h) * 4.0;
        lights *= exp(-coastalDistance);
      }
      
      return clamp(lights, 0.0, 1.0);
    }

    // Enhanced cloud layer
    float cloudLayer(vec3 p) {
      if (hasClouds < 0.5) return 0.0;
      
      vec3 scaledPos = p * cloudScale * shaderScale;
      
      // Multi-scale cloud formation
      float clouds = fbm(scaledPos);
      clouds += fbm(scaledPos * 2.0) * 0.5;
      clouds += fbm(scaledPos * 0.5) * 0.25;
      
      // Cloud density variation
      clouds *= cloudDensity;
      
      return clamp(clouds, 0.0, 1.0);
    }

    // Atmospheric scattering
    vec3 calculateAtmosphere(vec3 normal, vec3 lightDir, vec3 viewDir) {
      if (hasAtmosphere < 0.5) return vec3(0.0);
      
      float fresnel = pow(1.0 - dot(normal, viewDir), fresnelPower);
      float lightIntensity = max(dot(normal, lightDir), 0.0);
      
      // Rayleigh scattering simulation
      vec3 scattering = atmosphereColor * scatteringIntensity;
      scattering *= fresnel * (0.5 + lightIntensity * 0.5);
      
      return scattering * rimLightIntensity;
    }

    void main() {
      float angle = time * rotationSpeed;
      vec3 rotated = rotateY(normalize(vPosition), angle);

      float h = terrainHeight(rotated);
      vec2 tf = terrainFactors(rotated, h);
      vec3 baseColor = getTerrainColor(rotated, tf, h);

      vec3 lightDir = normalize(lightDirection);
      vec3 normal = normalize(vNormal);
      float diffuse = max(dot(normal, lightDir), 0.0);
      float ambient = 0.15;
      
      // Basic lighting
      vec3 color = baseColor * (diffuse + ambient);

      // Ocean specular highlights
      if (hasOceans > 0.5 && h < 0.0) {
        vec3 viewDir = normalize(vViewDirection);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        color += vec3(1.0) * spec * diffuse * 0.8;
      }

      // Night lights
      float night = nightLights(rotated, h, tf);
      float nightFactor = pow(1.0 - diffuse, 3.0);
      color += vec3(1.0, 0.8, 0.3) * night * nightFactor * nightLightIntensity;

      // Cloud layer
      float cloud = cloudLayer(rotated);
      vec3 cloudColor = vec3(0.9, 0.95, 1.0) * (diffuse + ambient);
      color = mix(color, cloudColor, clamp(cloud * 0.8, 0.0, 0.8));

      // Atmospheric effects
      vec3 atmosphere = calculateAtmosphere(normal, lightDir, normalize(vViewDirection));
      color += atmosphere * vAtmosphereDensity;

      // Atmospheric haze for distant viewing
      float distance = length(vWorldPosition - cameraPosition);
      float haze = exp(-distance * 0.001);
      color = mix(atmosphereColor * 0.3, color, haze);

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ EnhancedTerrestrialPlanetMaterial });

/**
 * Create enhanced terrestrial planet material with scaling parameters
 */
export function createEnhancedTerrestrialPlanetMaterial(
  scalingParams: ShaderScalingParameters,
  atmosphereParams: AtmosphereScalingParameters,
  additionalUniforms: Partial<TerrestrialPlanetUniforms> = {}
): any {
  const uniforms: TerrestrialPlanetUniforms = {
    time: 0.0,
    rotationSpeed: 0.2,
    planetRadius: scalingParams.visualRadius,
    terrainScale: scalingParams.terrainScale,
    cloudScale: scalingParams.cloudScale,
    atmosphereScale: scalingParams.atmosphereScale,
    shaderScale: scalingParams.shaderScale,
    landColor: new THREE.Color(0.05, 0.4, 0.05),
    seaColor: new THREE.Color(0.0, 0.18, 0.45),
    sandColor: new THREE.Color(0.9, 0.66, 0.3),
    snowColor: new THREE.Color(1.0, 1.0, 1.0),
    atmosphereColor: new THREE.Color(0.05, 0.8, 1.0),
    lightDirection: new THREE.Vector3(1.0, 0.0, 1.0),
    hasOceans: 1.0,
    hasAtmosphere: 1.0,
    hasClouds: 1.0,
    hasNightLights: 1.0,
    noiseOctaves: scalingParams.detailLevel === 'high' ? 6.0 : 
                  scalingParams.detailLevel === 'medium' ? 4.0 : 2.0,
    cloudDensity: 0.6,
    nightLightIntensity: 0.8,
    nightLightScale: 32.0 / scalingParams.shaderScale,
    atmosphereThickness: atmosphereParams.atmosphereThickness,
    scatteringIntensity: atmosphereParams.scatteringIntensity,
    fresnelPower: atmosphereParams.fresnelPower,
    rimLightIntensity: atmosphereParams.rimLightIntensity,
    qualityLevel: scalingParams.detailLevel === 'high' ? 1.0 : 
                  scalingParams.detailLevel === 'medium' ? 0.7 : 0.4,
    enableHighQuality: scalingParams.detailLevel === 'high' ? 1.0 : 0.0,
    ...additionalUniforms
  };

  return new EnhancedTerrestrialPlanetMaterial(uniforms);
}