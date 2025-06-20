/**
 * Shader Scaling Service
 * ======================
 * 
 * Provides dynamic shader parameter scaling based on the new orbital mechanics architecture.
 * Integrates with view mode strategies to ensure proper visual consistency across all view modes.
 */

import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ScalingResult } from '@/engine/core/view-modes/strategies/view-mode-strategy';
import type { RenderingConfiguration } from '@/engine/core/configuration/rendering-configuration';

export interface ShaderScalingParameters {
  // Base scaling parameters
  readonly visualRadius: number;
  readonly geometryScale: number;
  readonly shaderScale: number;
  
  // Noise scaling parameters
  readonly terrainScale: number;
  readonly cloudScale: number;
  readonly atmosphereScale: number;
  readonly noiseFrequency: number;
  
  // Detail level parameters
  readonly detailLevel: 'low' | 'medium' | 'high';
  readonly textureResolution: number;
  readonly geometrySegments: number;
  
  // View mode specific parameters
  readonly distanceToCamera: number;
  readonly viewModeScaling: number;
  readonly lodLevel: number;
}

export interface AtmosphereScalingParameters {
  readonly atmosphereThickness: number;
  readonly scatteringIntensity: number;
  readonly fresnelPower: number;
  readonly rimLightIntensity: number;
}

export interface StormScalingParameters {
  readonly stormSize: number;
  readonly stormIntensity: number;
  readonly turbulenceScale: number;
  readonly animationSpeed: number;
}

export interface RingScalingParameters {
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly particleSize: number;
  readonly particleDensity: number;
  readonly noiseScale: number;
}

export class ShaderScalingService {
  private readonly config: RenderingConfiguration;

  constructor(config: RenderingConfiguration) {
    this.config = config;
  }

  /**
   * Calculate base shader scaling parameters for an object
   */
  calculateShaderScaling(
    object: CelestialObject,
    visualSize: ScalingResult,
    viewType: ViewType,
    distanceToCamera: number = 100
  ): ShaderScalingParameters {
    const { visual } = this.config;
    
    // Base scaling factors from view mode
    const viewModeScaling = this.getViewModeScaling(viewType);
    const geometryScale = visualSize.visualRadius;
    
    // Calculate shader scale - inverse relationship with geometry scale
    // Larger objects need less detailed noise to look good
    const shaderScale = this.calculateShaderScale(geometryScale, object);
    
    // Calculate level of detail based on distance and visual size
    const lodLevel = this.calculateLOD(geometryScale, distanceToCamera, viewType);
    
    // Calculate noise scaling based on object type and size
    const noiseScaling = this.calculateNoiseScaling(object, geometryScale, viewType);
    
    // Determine detail level based on LOD and performance settings
    const detailLevel = this.getDetailLevel(lodLevel, viewType);
    
    return {
      visualRadius: visualSize.visualRadius,
      geometryScale,
      shaderScale,
      terrainScale: noiseScaling.terrain,
      cloudScale: noiseScaling.cloud,
      atmosphereScale: noiseScaling.atmosphere,
      noiseFrequency: noiseScaling.frequency,
      detailLevel,
      textureResolution: this.getTextureResolution(detailLevel),
      geometrySegments: this.getGeometrySegments(detailLevel, geometryScale),
      distanceToCamera,
      viewModeScaling,
      lodLevel
    };
  }

  /**
   * Calculate atmosphere-specific scaling parameters
   */
  calculateAtmosphereScaling(
    baseParams: ShaderScalingParameters,
    object: CelestialObject
  ): AtmosphereScalingParameters {
    const physical = object.properties || {};
    const features = object.features || {};
    
    // Base atmosphere thickness scales with planet size
    const baseThickness = 0.02 + (baseParams.geometryScale * 0.01);
    
    // Scale thickness based on atmospheric pressure
    const atmosphericPressure = physical.atmospheric_pressure || 0;
    const pressureScale = Math.min(atmosphericPressure / 101.325, 2.0); // Normalized to Earth pressure
    
    const atmosphereThickness = baseThickness * (0.5 + pressureScale * 0.5);
    
    // Scattering intensity based on atmosphere composition
    const scatteringIntensity = this.calculateScatteringIntensity(features);
    
    // Fresnel power based on atmosphere density
    const fresnelPower = 2.0 + (atmosphereThickness * 4.0);
    
    // Rim lighting intensity
    const rimLightIntensity = 0.3 + (scatteringIntensity * 0.4);
    
    return {
      atmosphereThickness,
      scatteringIntensity,
      fresnelPower,
      rimLightIntensity
    };
  }

  /**
   * Calculate storm-specific scaling parameters for gas giants
   */
  calculateStormScaling(
    baseParams: ShaderScalingParameters,
    object: CelestialObject
  ): StormScalingParameters {
    const features = object.features || {};
    const stormIntensity = features.storm_intensity || 0.5;
    
    // Storm size scales with planet size but has minimum and maximum bounds
    const baseStormSize = baseParams.geometryScale * 0.15;
    const stormSize = Math.max(0.05, Math.min(baseStormSize, 0.3));
    
    // Turbulence scale - smaller for larger planets to maintain detail
    const turbulenceScale = 2.0 / Math.sqrt(baseParams.geometryScale);
    
    // Animation speed inversely related to planet size (larger planets have slower storms)
    const animationSpeed = 0.5 / baseParams.geometryScale;
    
    return {
      stormSize,
      stormIntensity,
      turbulenceScale,
      animationSpeed
    };
  }

  /**
   * Calculate ring system scaling parameters
   */
  calculateRingScaling(
    baseParams: ShaderScalingParameters,
    object: CelestialObject
  ): RingScalingParameters {
    const features = object.features || {};
    const ringSystem = features.ring_system || 0.5;
    
    // Ring radii scale with planet size
    const planetRadius = baseParams.geometryScale;
    const innerRadius = planetRadius * 1.3;
    const outerRadius = planetRadius * (2.0 + ringSystem * 1.5);
    
    // Particle size inversely scales with distance for consistent visual density
    const particleSize = 0.02 / Math.sqrt(planetRadius);
    
    // Particle density based on ring prominence
    const particleDensity = ringSystem * 0.8;
    
    // Noise scale for ring structure variation
    const noiseScale = 4.0 / planetRadius;
    
    return {
      innerRadius,
      outerRadius,
      particleSize,
      particleDensity,
      noiseScale
    };
  }

  /**
   * Get view mode specific scaling factor
   */
  private getViewModeScaling(viewType: ViewType): number {
    const { orbital } = this.config;
    
    switch (viewType) {
      case 'explorational':
        return orbital.scaling.explorational;
      case 'navigational':
        return orbital.scaling.navigational;
      case 'profile':
        return orbital.scaling.profile;
      case 'scientific':
        return orbital.scaling.scientific;
      default:
        return 1.0;
    }
  }

  /**
   * Calculate shader scale based on geometry scale and object type
   */
  private calculateShaderScale(geometryScale: number, object: CelestialObject): number {
    const baseScale = 1.0;
    
    // Adjust based on object classification
    switch (object.classification) {
      case 'star':
        // Stars need less detailed noise at large scales
        return baseScale / Math.sqrt(geometryScale);
      case 'planet':
        // Planets need moderate scaling
        return baseScale / Math.pow(geometryScale, 0.3);
      case 'moon':
        // Moons can have more detailed noise
        return baseScale * Math.sqrt(geometryScale);
      default:
        return baseScale;
    }
  }

  /**
   * Calculate Level of Detail based on visual size and distance
   */
  private calculateLOD(
    visualSize: number,
    distanceToCamera: number,
    viewType: ViewType
  ): number {
    // Apparent size on screen determines LOD
    const apparentSize = visualSize / distanceToCamera;
    
    // View mode affects LOD calculation
    const viewModeMultiplier = viewType === 'scientific' ? 1.5 : 1.0;
    
    const lod = Math.min(apparentSize * viewModeMultiplier, 1.0);
    return Math.max(lod, 0.1); // Minimum LOD of 0.1
  }

  /**
   * Calculate noise scaling parameters
   */
  private calculateNoiseScaling(
    object: CelestialObject,
    geometryScale: number,
    viewType: ViewType
  ): {
    terrain: number;
    cloud: number;
    atmosphere: number;
    frequency: number;
  } {
    const baseScale = 2.0;
    const features = object.features || {};
    
    // Terrain roughness from object features
    const terrainRoughness = features.terrain_roughness || 1.0;
    
    // Scale noise based on object size - larger objects need lower frequency
    const sizeScaling = Math.pow(geometryScale, -0.2);
    
    // View mode affects noise detail
    const viewModeScaling = viewType === 'scientific' ? 1.2 : 1.0;
    
    const terrain = baseScale * terrainRoughness * sizeScaling * viewModeScaling;
    const cloud = terrain * 0.7; // Clouds are smoother than terrain
    const atmosphere = terrain * 0.5; // Atmosphere is smoothest
    const frequency = terrain * 4.0; // Base frequency for noise functions
    
    return { terrain, cloud, atmosphere, frequency };
  }

  /**
   * Calculate atmospheric scattering intensity
   */
  private calculateScatteringIntensity(features: any): number {
    const atmosphereType = features.atmosphere_type || 'thin';
    
    switch (atmosphereType) {
      case 'thick':
        return 1.0;
      case 'moderate':
        return 0.7;
      case 'thin':
        return 0.4;
      case 'trace':
        return 0.1;
      default:
        return 0.5;
    }
  }

  /**
   * Get detail level based on LOD and view mode
   */
  private getDetailLevel(lod: number, viewType: ViewType): 'low' | 'medium' | 'high' {
    const performanceMode = this.config.performance.enablePerformanceMode;
    
    if (performanceMode) {
      return lod > 0.7 ? 'medium' : 'low';
    }
    
    if (viewType === 'scientific') {
      return lod > 0.3 ? 'high' : 'medium';
    }
    
    if (lod > 0.6) return 'high';
    if (lod > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Get texture resolution based on detail level
   */
  private getTextureResolution(detailLevel: 'low' | 'medium' | 'high'): number {
    switch (detailLevel) {
      case 'high':
        return 1024;
      case 'medium':
        return 512;
      case 'low':
        return 256;
    }
  }

  /**
   * Get geometry segments based on detail level and scale
   */
  private getGeometrySegments(detailLevel: 'low' | 'medium' | 'high', scale: number): number {
    const baseSegments = (() => {
      switch (detailLevel) {
        case 'high':
          return 128;
        case 'medium':
          return 64;
        case 'low':
          return 32;
      }
    })();
    
    // Scale segments based on object size, but cap at reasonable limits
    const scaledSegments = Math.round(baseSegments * Math.sqrt(scale));
    return Math.max(16, Math.min(scaledSegments, 256));
  }
}