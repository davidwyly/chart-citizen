import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfileView } from '../use-profile-view'
import type { OrbitalSystemData } from '@/engine/types/orbital-system'

// Mock system data
const mockSystemData: OrbitalSystemData = {
  id: 'sol',
  name: 'Sol System',
  description: 'Test system',
  lighting: { type: 'ambient', intensity: 1.0 },
  objects: [
    {
      id: 'sun',
      name: 'Sun',
      classification: 'star',
      geometry_type: 'star',
      position: [0, 0, 0],
      properties: {
        mass: 1.0,
        radius: 696000,
        luminosity: 1.0,
        temperature: 5778,
        stellar_class: 'G2V'
      },
      children: [
        {
          id: 'earth',
          name: 'Earth',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: {
            parent: 'sun',
            semi_major_axis: 149597870.7,
            eccentricity: 0.0167,
            inclination: 0,
            orbital_period: 365.25
          },
          properties: {
            mass: 1.0,
            radius: 6371,
            axial_tilt: 23.5,
            rotation_period: 24
          },
          children: [
            {
              id: 'moon',
              name: 'Moon',
              classification: 'moon',
              geometry_type: 'rocky',
              orbit: {
                parent: 'earth',
                semi_major_axis: 384400,
                eccentricity: 0.0549,
                inclination: 0,
                orbital_period: 27.3
              },
              properties: {
                mass: 0.012,
                radius: 1737,
                rotation_period: 655.7
              }
            }
          ]
        },
        {
          id: 'mars',
          name: 'Mars',
          classification: 'planet',
          geometry_type: 'terrestrial',
          orbit: {
            parent: 'sun',
            semi_major_axis: 227939366,
            eccentricity: 0.0934,
            inclination: 0,
            orbital_period: 687
          },
          properties: {
            mass: 0.107,
            radius: 3390,
            axial_tilt: 25.2,
            rotation_period: 24.6
          }
        }
      ]
    }
  ]
}

describe('useProfileView', () => {
  let mockSetTimeMultiplier: ReturnType<typeof vi.fn>
  let mockPauseSimulation: ReturnType<typeof vi.fn>
  let mockUnpauseSimulation: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSetTimeMultiplier = vi.fn()
    mockPauseSimulation = vi.fn()
    mockUnpauseSimulation = vi.fn()
  })

  describe('Profile View Initialization', () => {
    it('should initialize with parent star as focal point when entering profile view', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          true, // isProfileView
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      // Should set Sun as focal point
      expect(result.current.focalObjectId).toBe('sun')
      expect(result.current.focalObjectData?.name).toBe('Sun')
      expect(result.current.orbitingBodies).toHaveLength(2) // Earth and Mars
      expect(result.current.orbitingBodies[0].id).toBe('earth')
      expect(result.current.orbitingBodies[1].id).toBe('mars')
    })

    it('should switch to orthographic camera mode in profile view', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          true,
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      expect(result.current.cameraMode).toBe('orthographic')
    })

    it('should pause time controls when entering profile view', () => {
      renderHook(() =>
        useProfileView(
          mockSystemData,
          true,
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      expect(mockPauseSimulation).toHaveBeenCalled()
    })

    it('should not initialize profile view when not in profile mode', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          false, // isProfileView = false
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      expect(result.current.focalObjectId).toBeNull()
      expect(result.current.focalObjectData).toBeNull()
      expect(result.current.orbitingBodies).toHaveLength(0)
      expect(result.current.cameraMode).toBe('perspective')
    })
  })

  describe('Focal Point Management', () => {
    it('should change focal point when changeFocalPoint is called', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          true,
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      const mockEarthObject = {} as any // Mock THREE.Object3D

      act(() => {
        result.current.changeFocalPoint('earth', mockEarthObject)
      })

      expect(result.current.focalObjectId).toBe('earth')
      expect(result.current.focalObjectData?.name).toBe('Earth')
      expect(result.current.focalObject).toBe(mockEarthObject)
      expect(result.current.orbitingBodies).toHaveLength(1) // Moon
      expect(result.current.orbitingBodies[0].id).toBe('moon')
    })

    it('should handle invalid focal point changes gracefully', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          true,
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      const originalFocalId = result.current.focalObjectId

      act(() => {
        result.current.changeFocalPoint('invalid-id', {} as any)
      })

      // Should remain unchanged
      expect(result.current.focalObjectId).toBe(originalFocalId)
    })
  })

  describe('Profile Layout Calculation', () => {
    it('should calculate proper layout for focal object and orbiting bodies', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          true,
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      const layout = result.current.calculateProfileLayout()

      expect(layout).not.toBeNull()
      expect(layout!.focalObject.id).toBe('sun')
      expect(layout!.focalObject.position).toEqual([-8, 0, 0]) // Left side
      expect(layout!.focalObject.size).toBe(2.0) // Large size

      expect(layout!.orbitingBodies).toHaveLength(2)
      expect(layout!.orbitingBodies[0].id).toBe('earth')
      expect(layout!.orbitingBodies[0].size).toBe(0.8) // Medium size
      expect(layout!.orbitingBodies[1].id).toBe('mars')
      expect(layout!.orbitingBodies[1].size).toBe(0.8) // Medium size

      // Check equidistant spacing
      const earthX = layout!.orbitingBodies[0].position[0]
      const marsX = layout!.orbitingBodies[1].position[0]
      expect(marsX - earthX).toBe(3.0) // Spacing should be 3 units

      // Check camera position (45-degree bird's-eye view)
      expect(layout!.cameraPosition[1]).toBeGreaterThan(0) // Y should be positive (elevated)
      expect(layout!.cameraPosition[2]).toBeGreaterThan(0) // Z should be positive (behind)
    })

    it('should return null when no focal object or orbiting bodies', () => {
      const { result } = renderHook(() =>
        useProfileView(
          mockSystemData,
          false, // Not in profile view
          mockSetTimeMultiplier,
          mockPauseSimulation,
          mockUnpauseSimulation
        )
      )

      const layout = result.current.calculateProfileLayout()
      expect(layout).toBeNull()
    })
  })

  describe('Profile View Exit', () => {
    it('should restore previous state when exiting profile view', () => {
      const { result, rerender } = renderHook(
        ({ isProfileView }) =>
          useProfileView(
            mockSystemData,
            isProfileView,
            mockSetTimeMultiplier,
            mockPauseSimulation,
            mockUnpauseSimulation
          ),
        { initialProps: { isProfileView: true } }
      )

      // Verify profile view is active
      expect(result.current.focalObjectId).toBe('sun')
      expect(result.current.cameraMode).toBe('orthographic')

      // Exit profile view
      rerender({ isProfileView: false })

      expect(result.current.focalObjectId).toBeNull()
      expect(result.current.focalObjectData).toBeNull()
      expect(result.current.orbitingBodies).toHaveLength(0)
      expect(result.current.cameraMode).toBe('perspective')
      expect(mockUnpauseSimulation).toHaveBeenCalled()
    })
  })
})