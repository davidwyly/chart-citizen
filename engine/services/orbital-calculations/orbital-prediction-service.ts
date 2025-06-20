/**
 * Orbital Prediction Service
 * ===========================
 * 
 * Provides predictive positioning for smooth camera tracking.
 * Calculates where an object will be based on orbital mechanics
 * instead of relying on current Three.js positions.
 * 
 * This eliminates camera jitter by predicting object positions
 * using the same mathematical models used for initial positioning.
 */

import * as THREE from 'three';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { ViewType } from '@/lib/types/effects-level';

export interface PredictedPosition {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  timeStamp: number;
  confidence: number; // 0-1 scale
}

export class OrbitalPredictionService {
  private predictionCache = new Map<string, PredictedPosition>();
  private cacheValidityMs = 16; // Cache for one frame at 60fps
  
  /**
   * Predict where an object will be at the current time based on orbital mechanics
   * This provides the camera with a smooth, mathematically consistent target
   */
  async predictPosition(
    object: CelestialObject,
    parentObject: CelestialObject | null,
    currentTime: number,
    viewMode: ViewType,
    objects: CelestialObject[]
  ): Promise<PredictedPosition> {
    const cacheKey = `${object.id}-${currentTime}-${viewMode}`;
    const cached = this.predictionCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && (Date.now() - cached.timeStamp) < this.cacheValidityMs) {
      return cached;
    }
    
    let predictedPosition: THREE.Vector3;
    let velocity: THREE.Vector3;
    let confidence: number;
    
    if (!object.orbit || !parentObject) {
      // Static object (like stars) - no prediction needed
      predictedPosition = new THREE.Vector3(0, 0, 0);
      velocity = new THREE.Vector3(0, 0, 0);
      confidence = 1.0;
    } else {
      // Calculate predicted orbital position
      const prediction = await this.calculateOrbitalPrediction(
        object,
        parentObject,
        currentTime,
        viewMode,
        objects
      );
      
      predictedPosition = prediction.position;
      velocity = prediction.velocity;
      confidence = prediction.confidence;
    }
    
    const result: PredictedPosition = {
      position: predictedPosition,
      velocity,
      timeStamp: Date.now(),
      confidence
    };
    
    // Cache the result
    this.predictionCache.set(cacheKey, result);
    
    // Clean old cache entries
    this.cleanupCache();
    
    return result;
  }
  
  /**
   * Calculate orbital position using the same mechanics as initial positioning
   */
  private async calculateOrbitalPrediction(
    object: CelestialObject,
    parentObject: CelestialObject,
    currentTime: number,
    viewMode: ViewType,
    objects: CelestialObject[]
  ): Promise<{ position: THREE.Vector3; velocity: THREE.Vector3; confidence: number }> {
    if (!object.orbit || !('semi_major_axis' in object.orbit)) {
      return {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        confidence: 0
      };
    }
    
    const orbit = object.orbit;
    
    // Get orbital parameters
    const semiMajorAxis = this.getScaledOrbitDistance(orbit.semi_major_axis, viewMode);
    const eccentricity = orbit.eccentricity || 0;
    const inclination = (orbit.inclination || 0) * (Math.PI / 180);
    const longitudeOfAscendingNode = (orbit.longitude_of_ascending_node || 0) * (Math.PI / 180);
    const argumentOfPeriapsis = (orbit.argument_of_periapsis || 0) * (Math.PI / 180);
    const orbitalPeriod = orbit.orbital_period || 365.25; // Default to Earth-like period
    
    // Calculate mean motion (radians per day)
    const meanMotion = (2 * Math.PI) / orbitalPeriod;
    
    // Calculate current mean anomaly
    const timeInDays = currentTime / (24 * 3600); // Convert simulation time to days
    const meanAnomaly = (meanMotion * timeInDays) % (2 * Math.PI);
    
    // Solve Kepler's equation for eccentric anomaly
    const eccentricAnomaly = this.solveKeplersEquation(meanAnomaly, eccentricity);
    
    // Calculate true anomaly
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );
    
    // Calculate distance from focus
    const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
    
    // Calculate position in orbital plane
    const xOrbital = radius * Math.cos(trueAnomaly);
    const yOrbital = radius * Math.sin(trueAnomaly);
    
    // Transform to 3D space using orbital elements
    const cosOmega = Math.cos(longitudeOfAscendingNode);
    const sinOmega = Math.sin(longitudeOfAscendingNode);
    const cosw = Math.cos(argumentOfPeriapsis);
    const sinw = Math.sin(argumentOfPeriapsis);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    
    // Rotation matrix for orbital plane to 3D space
    const x = xOrbital * (cosOmega * cosw - sinOmega * sinw * cosI) - yOrbital * (cosOmega * sinw + sinOmega * cosw * cosI);
    const y = xOrbital * (sinOmega * cosw + cosOmega * sinw * cosI) - yOrbital * (sinOmega * sinw - cosOmega * cosw * cosI);
    const z = xOrbital * sinw * sinI + yOrbital * cosw * sinI;
    
    const position = new THREE.Vector3(x, y, z);
    
    // Calculate velocity for motion prediction
    const velocity = this.calculateOrbitalVelocity(
      semiMajorAxis,
      eccentricity,
      trueAnomaly,
      meanMotion,
      longitudeOfAscendingNode,
      argumentOfPeriapsis,
      inclination
    );
    
    // High confidence for predictable orbital mechanics
    const confidence = 0.95;
    
    return { position, velocity, confidence };
  }
  
  /**
   * Solve Kepler's equation using iterative method
   */
  private solveKeplersEquation(meanAnomaly: number, eccentricity: number): number {
    let eccentricAnomaly = meanAnomaly;
    const tolerance = 1e-8;
    let iterations = 0;
    const maxIterations = 50;
    
    while (iterations < maxIterations) {
      const delta = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
      const correction = delta / (1 - eccentricity * Math.cos(eccentricAnomaly));
      eccentricAnomaly -= correction;
      
      if (Math.abs(correction) < tolerance) {
        break;
      }
      iterations++;
    }
    
    return eccentricAnomaly;
  }
  
  /**
   * Calculate orbital velocity vector
   */
  private calculateOrbitalVelocity(
    semiMajorAxis: number,
    eccentricity: number,
    trueAnomaly: number,
    meanMotion: number,
    longitudeOfAscendingNode: number,
    argumentOfPeriapsis: number,
    inclination: number
  ): THREE.Vector3 {
    // Simplified velocity calculation in orbital plane
    const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
    const velocityMagnitude = meanMotion * semiMajorAxis * semiMajorAxis / radius;
    
    // Velocity components in orbital plane
    const vxOrbital = -velocityMagnitude * Math.sin(trueAnomaly);
    const vyOrbital = velocityMagnitude * (eccentricity + Math.cos(trueAnomaly));
    
    // Transform to 3D space
    const cosOmega = Math.cos(longitudeOfAscendingNode);
    const sinOmega = Math.sin(longitudeOfAscendingNode);
    const cosw = Math.cos(argumentOfPeriapsis);
    const sinw = Math.sin(argumentOfPeriapsis);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    
    const vx = vxOrbital * (cosOmega * cosw - sinOmega * sinw * cosI) - vyOrbital * (cosOmega * sinw + sinOmega * cosw * cosI);
    const vy = vxOrbital * (sinOmega * cosw + cosOmega * sinw * cosI) - vyOrbital * (sinOmega * sinw - cosOmega * cosw * cosI);
    const vz = vxOrbital * sinw * sinI + vyOrbital * cosw * sinI;
    
    return new THREE.Vector3(vx, vy, vz);
  }
  
  /**
   * Get scaled orbit distance based on view mode
   */
  private getScaledOrbitDistance(realDistance: number, viewMode: ViewType): number {
    // Use same scaling factors as the orbital position calculator
    switch (viewMode) {
      case 'explorational':
        return realDistance * 50.0;
      case 'navigational':
        return realDistance * 40.0;
      case 'profile':
        return realDistance * 0.3;
      case 'scientific':
        return realDistance * 100.0; // 1 AU = 100 units
      default:
        return realDistance * 50.0;
    }
  }
  
  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.cacheValidityMs * 5; // Keep for 5 frames max
    
    for (const [key, prediction] of this.predictionCache.entries()) {
      if (now - prediction.timeStamp > maxAge) {
        this.predictionCache.delete(key);
      }
    }
  }
  
  /**
   * Clear all predictions (call when view mode changes)
   */
  clearPredictions(): void {
    this.predictionCache.clear();
  }
  
  /**
   * Get prediction for multiple objects efficiently
   */
  async predictMultiplePositions(
    objects: Array<{ object: CelestialObject; parent: CelestialObject | null }>,
    currentTime: number,
    viewMode: ViewType,
    allObjects: CelestialObject[]
  ): Promise<Map<string, PredictedPosition>> {
    const predictions = new Map<string, PredictedPosition>();
    
    // Process all objects in parallel
    const promises = objects.map(async ({ object, parent }) => {
      const prediction = await this.predictPosition(object, parent, currentTime, viewMode, allObjects);
      return { id: object.id, prediction };
    });
    
    const results = await Promise.all(promises);
    
    for (const { id, prediction } of results) {
      predictions.set(id, prediction);
    }
    
    return predictions;
  }
}