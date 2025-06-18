import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getViewModeScaling } from '../view-mode.constants'
import { ViewMode } from '../../../types/view-mode.types'

describe('View Mode Constants', () => {
  describe('getViewModeScaling', () => {
    it('should return correct scaling for explorational mode', () => {
      const scaling = getViewModeScaling('explorational')
      expect(scaling).toEqual({
        ORBITAL_SCALE: 200.0,
        STAR_SCALE: 1.0,
        PLANET_SCALE: 1.0,
        MOON_SCALE: 1.0,
        STAR_SHADER_SCALE: 1.0
      })
    })

    it('should return correct scaling for navigational mode', () => {
      const scaling = getViewModeScaling('navigational')
      expect(scaling).toEqual({
        ORBITAL_SCALE: 300.0,
        STAR_SCALE: 4.0,
        PLANET_SCALE: 3.0,
        MOON_SCALE: 2.0,
        STAR_SHADER_SCALE: 0.5
      })
    })

    it('should return correct scaling for profile mode', () => {
      const scaling = getViewModeScaling('profile')
      expect(scaling).toEqual({
        ORBITAL_SCALE: 400.0,
        STAR_SCALE: 6.0,
        PLANET_SCALE: 4.0,
        MOON_SCALE: 3.0,
        STAR_SHADER_SCALE: 1.0
      })
    })

    it('should return correct scaling for scientific mode', () => {
      const scaling = getViewModeScaling('scientific')
      expect(scaling).toEqual({
        ORBITAL_SCALE: 1.0,
        STAR_SCALE: 1.0,
        PLANET_SCALE: 1.0,
        MOON_SCALE: 1.0,
        STAR_SHADER_SCALE: 1.0
      })
    })

    it('should handle invalid view mode by defaulting to explorational', () => {
      const scaling = getViewModeScaling('invalid' as ViewMode)
      expect(scaling).toEqual({
        ORBITAL_SCALE: 200.0,
        STAR_SCALE: 1.0,
        PLANET_SCALE: 1.0,
        MOON_SCALE: 1.0,
        STAR_SHADER_SCALE: 1.0
      })
    })

    it('should ensure all scaling values are positive', () => {
      const viewModes: ViewMode[] = ['explorational', 'navigational', 'profile', 'scientific']
      
      for (const mode of viewModes) {
        const scaling = getViewModeScaling(mode)
        expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0)
        expect(scaling.STAR_SCALE).toBeGreaterThan(0)
        expect(scaling.PLANET_SCALE).toBeGreaterThan(0)
        expect(scaling.MOON_SCALE).toBeGreaterThan(0)
        expect(scaling.STAR_SHADER_SCALE).toBeGreaterThan(0)
      }
    })

    it('should maintain relative proportions between scales for modes where scaling differs', () => {
      // Check navigational mode (where scaling is different)
      const navScaling = getViewModeScaling('navigational')
      expect(navScaling.STAR_SCALE).toBeGreaterThan(navScaling.PLANET_SCALE)
      expect(navScaling.PLANET_SCALE).toBeGreaterThan(navScaling.MOON_SCALE)
      
      // Check profile mode (where scaling is different)  
      const profileScaling = getViewModeScaling('profile')
      expect(profileScaling.STAR_SCALE).toBeGreaterThan(profileScaling.PLANET_SCALE)
      expect(profileScaling.PLANET_SCALE).toBeGreaterThan(profileScaling.MOON_SCALE)
      
      // Note: explorational and scientific modes have equal scaling (1.0) for STAR, PLANET, and MOON
      const explorationScaling = getViewModeScaling('explorational')
      expect(explorationScaling.STAR_SCALE).toBe(explorationScaling.PLANET_SCALE)
      expect(explorationScaling.PLANET_SCALE).toBe(explorationScaling.MOON_SCALE)
      
      const scientificScaling = getViewModeScaling('scientific')
      expect(scientificScaling.STAR_SCALE).toBe(scientificScaling.PLANET_SCALE)
      expect(scientificScaling.PLANET_SCALE).toBe(scientificScaling.MOON_SCALE)
      expect(scientificScaling.ORBITAL_SCALE).toBe(1.0) // True-to-life orbital scaling
    })

    it('should return correct scaling for each view mode', () => {
      const modes: ViewMode[] = ['explorational', 'navigational', 'profile', 'scientific']
      for (const mode of modes) {
        const scaling = getViewModeScaling(mode)
        expect(scaling).toHaveProperty('STAR_SCALE')
        expect(scaling).toHaveProperty('PLANET_SCALE')
        expect(scaling).toHaveProperty('ORBITAL_SCALE')
        expect(scaling).toHaveProperty('STAR_SHADER_SCALE')
      }
    })

    it('should default to explorational scaling for invalid mode', () => {
      // @ts-expect-error
      const scaling = getViewModeScaling('invalid')
      expect(scaling).toEqual(getViewModeScaling('explorational'))
    })
  })
}) 