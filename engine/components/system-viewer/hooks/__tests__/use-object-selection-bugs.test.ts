import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useObjectSelection } from '../use-object-selection';
import type { OrbitalSystemData } from '@/engine/types/orbital-system';
import * as THREE from 'three';

// Mock Three.js objects
const mockObject3D = {
  uuid: 'mock-uuid',
  name: 'mock-object',
  position: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
} as unknown as THREE.Object3D;

describe('useObjectSelection Bug Tests', () => {
  let mockSystemData: OrbitalSystemData;
  let mockSetTimeMultiplier: ReturnType<typeof vi.fn>;
  let mockPauseSimulation: ReturnType<typeof vi.fn>;
  let mockUnpauseSimulation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetTimeMultiplier = vi.fn();
    mockPauseSimulation = vi.fn();
    mockUnpauseSimulation = vi.fn();

    mockSystemData = {
      id: 'test-system',
      name: 'Test System',
      objects: [
        {
          id: 'star1',
          name: 'Test Star',
          classification: 'star',
          geometry_type: 'star',
          properties: { mass: 1.0, radius: 695700, temperature: 5778 },
          position: [0, 0, 0]
        },
        {
          id: 'planet1',
          name: 'Test Planet',
          classification: 'planet',
          geometry_type: 'terrestrial',
          properties: { mass: 1.0, radius: 6371, temperature: 288 },
          orbit: {
            parent: 'star1',
            semi_major_axis: 1.0,
            eccentricity: 0.0,
            inclination: 0.0,
            orbital_period: 365.25
          }
        }
      ],
      lighting: { ambient_level: 0.1 },
      metadata: { version: '1.0', last_updated: '2024-01-01', coordinate_system: 'heliocentric', distance_unit: 'au' }
    };
  });

  describe('null/undefined system data bugs', () => {
    it('should handle null systemData gracefully', () => {
      const { result } = renderHook(() => 
        useObjectSelection(null, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Should not crash with null system data
      expect(result.current.selectedObjectId).toBeNull();
      expect(result.current.selectedObjectData).toBeNull();

      // Calling selection functions should not crash
      act(() => {
        result.current.handleObjectSelect('non-existent', mockObject3D, 'Test');
      });

      expect(result.current.selectedObjectId).toBe('non-existent');
      expect(result.current.selectedObjectData).toBeNull(); // Can't find object in null system
    });

    it('should handle systemData with undefined objects array', () => {
      const malformedSystemData = {
        ...mockSystemData,
        objects: undefined as any
      };

      const { result } = renderHook(() => 
        useObjectSelection(malformedSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Test Star');
      });

      // Should handle gracefully - selectedObjectData should be null
      expect(result.current.selectedObjectData).toBeNull();
    });

    it('should handle systemData with empty objects array', () => {
      const emptySystemData = {
        ...mockSystemData,
        objects: []
      };

      const { result } = renderHook(() => 
        useObjectSelection(emptySystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('non-existent', mockObject3D, 'Test');
      });

      expect(result.current.selectedObjectData).toBeNull();
    });
  });

  describe('object reference map bugs', () => {
    it('should handle objects with duplicate IDs', () => {
      const duplicateIdSystemData = {
        ...mockSystemData,
        objects: [
          ...mockSystemData.objects,
          {
            id: 'planet1', // Duplicate ID!
            name: 'Duplicate Planet',
            classification: 'planet',
            geometry_type: 'terrestrial',
            properties: { mass: 2.0, radius: 7000, temperature: 300 },
            orbit: {
              parent: 'star1',
              semi_major_axis: 2.0,
              eccentricity: 0.0,
              inclination: 0.0,
              orbital_period: 500
            }
          }
        ]
      };

      const { result } = renderHook(() => 
        useObjectSelection(duplicateIdSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('planet1', mockObject3D, 'Test Planet');
      });

      // Bug: Which object data gets returned for duplicate IDs?
      // Array.find() returns the first match, but this could be confusing
      expect(result.current.selectedObjectData).toBeDefined();
      expect(result.current.selectedObjectData?.name).toBe('Test Planet'); // First one
    });
  });

  describe('animation state management bugs', () => {
    it('should handle animation completion without prior animation start', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Call animation complete without starting animation
      act(() => {
        result.current.handleAnimationComplete();
      });

      // Should not call unpause since no animation was started
      expect(mockUnpauseSimulation).not.toHaveBeenCalled();
    });

    it('should handle rapid selection changes', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Rapidly select different objects
      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
        result.current.handleObjectSelect('planet1', mockObject3D, 'Planet');
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
      });

      // Animation state should be handled correctly
      expect(result.current.selectedObjectId).toBe('star1');
    });

    it('should handle selecting same object multiple times', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Select same object twice
      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
      });
      
      expect(mockPauseSimulation).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
      });

      // Bug: What should happen when selecting the same object?
      // Current logic suggests it should unpause if paused
      expect(result.current.selectedObjectId).toBe('star1');
    });
  });

  describe('pause state edge cases', () => {
    it('should handle pause/unpause when already in desired state', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, true) // Already paused
      );

      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
      });

      // Should not call pause again since already paused
      expect(mockPauseSimulation).not.toHaveBeenCalled();
    });
  });

  describe('hover state bugs', () => {
    it('should handle redundant hover events', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Hover same object multiple times
      act(() => {
        result.current.handleObjectHover('star1');
        result.current.handleObjectHover('star1');
        result.current.handleObjectHover('star1');
      });

      // Should only trigger state change once
      expect(result.current.hoveredObjectId).toBe('star1');
    });

    it('should handle null hover correctly', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectHover('star1');
        result.current.handleObjectHover(null);
      });

      expect(result.current.hoveredObjectId).toBeNull();
    });
  });

  describe('orbit data validation bugs', () => {
    it('should handle objects with malformed orbit data', () => {
      const malformedOrbitData = {
        ...mockSystemData,
        objects: [
          ...mockSystemData.objects,
          {
            id: 'malformed-planet',
            name: 'Malformed Planet',
            classification: 'planet',
            geometry_type: 'terrestrial',
            properties: { mass: 1.0, radius: 6371, temperature: 288 },
            orbit: {
              // Missing required fields
              parent: 'star1'
              // semi_major_axis missing!
            } as any
          }
        ]
      };

      const { result } = renderHook(() => 
        useObjectSelection(malformedOrbitData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('malformed-planet', mockObject3D, 'Malformed Planet');
      });

      // Should handle missing orbit data gracefully
      expect(result.current.selectedObjectData).toBeDefined();
      expect(result.current.focusedObjectOrbitRadius).toBeNull(); // Should be null for malformed orbit
    });

    it('should handle objects with non-orbit data in orbit field', () => {
      const invalidOrbitData = {
        ...mockSystemData,
        objects: [
          ...mockSystemData.objects,
          {
            id: 'invalid-orbit',
            name: 'Invalid Orbit',
            classification: 'planet',
            geometry_type: 'terrestrial',
            properties: { mass: 1.0, radius: 6371, temperature: 288 },
            orbit: 'not-an-orbit-object' as any // String instead of orbit object
          }
        ]
      };

      const { result } = renderHook(() => 
        useObjectSelection(invalidOrbitData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('invalid-orbit', mockObject3D, 'Invalid Orbit');
      });

      expect(result.current.focusedObjectOrbitRadius).toBeNull();
    });
  });

  describe('profile view state management bugs', () => {
    it('should handle back button when no previous state exists', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'profile', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Call back button without any previous state
      act(() => {
        result.current.handleBackButtonClick();
      });

      // Should not crash and state should remain unchanged
      expect(result.current.selectedObjectId).toBeNull();
    });

    it('should only store previous state for planets in profile view', () => {
      const { result } = renderHook(() => 
        useObjectSelection(mockSystemData, 'profile', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      // Select a star (not a planet)
      act(() => {
        result.current.handleObjectSelect('star1', mockObject3D, 'Star');
      });

      // Then select a planet
      act(() => {
        result.current.handleObjectSelect('planet1', mockObject3D, 'Planet');
      });

      // Back button should work
      act(() => {
        result.current.handleBackButtonClick();
      });

      expect(result.current.selectedObjectId).toBe('star1');
    });
  });

  describe('memory management bugs', () => {
    it('should clear object refs map when system data changes', () => {
      const { result, rerender } = renderHook(
        ({ systemData }) => useObjectSelection(systemData, 'explorational', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false),
        { initialProps: { systemData: mockSystemData } }
      );

      // Add some refs
      const mockRef = { id: 'test' } as THREE.Object3D;
      act(() => {
        result.current.objectRefsMap.set('test', mockRef);
      });

      expect(result.current.objectRefsMap.size).toBe(1);

      // Change system data
      const newSystemData = {
        ...mockSystemData,
        id: 'new-system'
      };

      rerender({ systemData: newSystemData });

      // Map should be cleared
      expect(result.current.objectRefsMap.size).toBe(0);
    });
  });

  describe('type safety edge cases', () => {
    it('should handle objects with missing classification', () => {
      const incompleteSystemData = {
        ...mockSystemData,
        objects: [
          {
            id: 'incomplete-object',
            name: 'Incomplete Object',
            // classification missing!
            geometry_type: 'terrestrial',
            properties: { mass: 1.0, radius: 6371, temperature: 288 }
          } as any
        ]
      };

      const { result } = renderHook(() => 
        useObjectSelection(incompleteSystemData, 'profile', mockSetTimeMultiplier, mockPauseSimulation, mockUnpauseSimulation, false)
      );

      act(() => {
        result.current.handleObjectSelect('incomplete-object', mockObject3D, 'Incomplete');
      });

      // Should handle gracefully without crashing
      expect(result.current.selectedObjectData).toBeDefined();
    });
  });
});