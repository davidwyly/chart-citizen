import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getViewModeScaling } from '../view-mode.constants'
import { ViewMode } from '../../../types/view-mode.types'

describe('View Mode Constants', () => {
  describe('getViewModeScaling', () => {
    it('should return correct scaling for realistic mode', () => {
      const scaling = getViewModeScaling('realistic')
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

    it('should handle invalid view mode by defaulting to realistic', () => {
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
      const viewModes: ViewMode[] = ['realistic', 'navigational', 'profile']
      
      for (const mode of viewModes) {
        const scaling = getViewModeScaling(mode)
        expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0)
        expect(scaling.STAR_SCALE).toBeGreaterThan(0)
        expect(scaling.PLANET_SCALE).toBeGreaterThan(0)
        expect(scaling.MOON_SCALE).toBeGreaterThan(0)
        expect(scaling.STAR_SHADER_SCALE).toBeGreaterThan(0)
      }
    })

    it('should maintain relative proportions between scales', () => {
      const viewModes: ViewMode[] = ['realistic', 'navigational', 'profile']
      
      for (const mode of viewModes) {
        const scaling = getViewModeScaling(mode)
        expect(scaling.STAR_SCALE).toBeGreaterThan(scaling.PLANET_SCALE)
        expect(scaling.PLANET_SCALE).toBeGreaterThan(scaling.MOON_SCALE)
      }
    })

    it('should return correct scaling for each view mode', () => {
      const modes: ViewMode[] = ['realistic', 'navigational', 'profile']
      for (const mode of modes) {
        const scaling = getViewModeScaling(mode)
        expect(scaling).toHaveProperty('STAR_SCALE')
        expect(scaling).toHaveProperty('PLANET_SCALE')
        expect(scaling).toHaveProperty('ORBITAL_SCALE')
        expect(scaling).toHaveProperty('STAR_SHADER_SCALE')
      }
    })

    it('should default to realistic scaling for invalid mode', () => {
      // @ts-expect-error
      const scaling = getViewModeScaling('invalid')
      expect(scaling).toEqual(getViewModeScaling('realistic'))
    })
  })
}) 