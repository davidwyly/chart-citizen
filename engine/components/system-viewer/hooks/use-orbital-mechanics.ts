/**
 * Hook for Orbital Mechanics Calculations
 * =======================================
 * 
 * Handles the async nature of the new orbital mechanics architecture
 * while providing a synchronous interface for React components.
 */

import { useState, useEffect, useRef } from 'react';
import { calculateSystemOrbitalMechanics, clearOrbitalMechanicsCache } from '@/engine/core/pipeline';
import type { ViewType } from '@lib/types/effects-level';
import type { CelestialObject } from '@/engine/types/orbital-system';
import type { LegacyCalculationResult } from '@/engine/core/pipeline';

/**
 * Custom hook that handles async orbital mechanics calculations
 */
export function useOrbitalMechanics(
  objects: CelestialObject[],
  viewType: ViewType
): Map<string, LegacyCalculationResult> | null {
  const [mechanics, setMechanics] = useState<Map<string, LegacyCalculationResult> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calculationIdRef = useRef(0);

  useEffect(() => {
    // Check if we have valid objects
    if (!objects || objects.length === 0) {
      setMechanics(new Map());
      setIsLoading(false);
      return;
    }

    // Increment calculation ID to handle race conditions
    const currentCalculationId = ++calculationIdRef.current;
    let isCancelled = false;

    // Clear cache when view type changes
    console.log(`🧹 CLEARING CACHE for viewType: ${viewType}`);
    clearOrbitalMechanicsCache();

    // Perform async calculation
    console.log(`🔄 RECALCULATING orbital mechanics for viewType: ${viewType}, objects: ${objects.length}`);
    setIsLoading(true);
    setError(null);

    // Add timeout to prevent infinite hanging
    const timeoutId = setTimeout(() => {
      if (!isCancelled && currentCalculationId === calculationIdRef.current) {
        console.error('Orbital mechanics calculation timed out');
        setError('Calculation timed out');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    calculateSystemOrbitalMechanics(objects, viewType)
      .then((result) => {
        clearTimeout(timeoutId);
        // Only update if this is still the latest calculation and not cancelled
        if (!isCancelled && currentCalculationId === calculationIdRef.current) {
          console.log(`📊 ORBITAL MECHANICS RESULT received, size: ${result.size}`);
          
          // Debug: Log each result to see what's being returned
          if (result.size === 0) {
            console.warn('🚨 ORBITAL MECHANICS: Empty result received!');
            console.log('🔍 Input objects:', objects.map(o => ({ id: o.id, name: o.name, classification: o.classification, orbit: o.orbit })));
          } else {
            console.log('🔍 ORBITAL MECHANICS: Results breakdown:');
            for (const [objectId, mechanics] of result) {
              console.log(`   📍 ${objectId}:`, mechanics);
            }
          }
          
          setMechanics(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Only update error if this is still the latest calculation and not cancelled
        if (!isCancelled && currentCalculationId === calculationIdRef.current) {
          console.error('Failed to calculate orbital mechanics:', err);
          console.error('Stack trace:', err.stack);
          console.log('🔍 Input objects that failed:', objects.map(o => ({ id: o.id, name: o.name, classification: o.classification, orbit: o.orbit })));
          setError(err.message);
          setIsLoading(false);
        }
      });

    // Cleanup function
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      // Mark this calculation as outdated
      if (currentCalculationId === calculationIdRef.current) {
        calculationIdRef.current++;
      }
    };
  }, [objects, viewType]);

  // Return null while loading or on error
  if (isLoading || error) {
    return null;
  }

  return mechanics;
}

/**
 * Hook that provides a default value while orbital mechanics are loading
 */
export function useOrbitalMechanicsWithDefault(
  objects: CelestialObject[],
  viewType: ViewType
): Map<string, LegacyCalculationResult> {
  const mechanics = useOrbitalMechanics(objects, viewType);

  // Return empty map while loading
  if (!mechanics) {
    return new Map();
  }

  return mechanics;
}