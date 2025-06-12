import { describe, it, expect } from 'vitest'
import { calculateViewModeScaling, calculateObjectSizing, validateScale } from './view-mode-calculator'
import type { ViewType } from '@lib/types/effects-level'

describe('View Mode Calculator', () => {
  describe('calculateViewModeScaling', () => {
    it('should return realistic scaling for realistic view type', () => {
      const scaling = calculateViewModeScaling('realistic')
      expect(scaling).toEqual({
        STAR_SCALE: 1.0,
        PLANET_SCALE: 0.5,
        ORBITAL_SCALE: 2.0,
        STAR_SHADER_SCALE: 1.0
      })
    })

    it('should return navigational scaling for navigational view type', () => {
      const scaling = calculateViewModeScaling('navigational')
      expect(scaling).toEqual({
        STAR_SCALE: 0.5,
        PLANET_SCALE: 0.25,
        ORBITAL_SCALE: 1.0,
        STAR_SHADER_SCALE: 0.5
      })
    })

    it('should return profile scaling for profile view type', () => {
      const scaling = calculateViewModeScaling('profile')
      expect(scaling).toEqual({
        STAR_SCALE: 0.75,
        PLANET_SCALE: 0.4,
        ORBITAL_SCALE: 1.5,
        STAR_SHADER_SCALE: 0.75
      })
    })

    it('should return realistic scaling for unknown view type', () => {
      const scaling = calculateViewModeScaling('unknown' as ViewType)
      expect(scaling).toEqual({
        STAR_SCALE: 1.0,
        PLANET_SCALE: 0.5,
        ORBITAL_SCALE: 2.0,
        STAR_SHADER_SCALE: 1.0
      })
    })
  })

  describe('calculateObjectSizing', () => {
    it('should calculate correct sizing for a star in realistic view', () => {
      const sizing = calculateObjectSizing('star', 10, 'realistic', 1.0)
      expect(sizing).toEqual({
        actualSize: 10,
        visualSize: 10
      })
    })

    it('should calculate correct sizing for a planet in navigational view', () => {
      const sizing = calculateObjectSizing('planet', 5, 'navigational', 1.0)
      expect(sizing).toEqual({
        actualSize: 1.25,
        visualSize: 0.625
      })
    })

    it('should calculate correct sizing for a moon in profile view', () => {
      const sizing = calculateObjectSizing('moon', 2, 'profile', 1.0)
      expect(sizing.actualSize).toBeCloseTo(0.4, 5)
      expect(sizing.visualSize).toBeCloseTo(0.3, 5)
    })

    it('should handle invalid base radius', () => {
      const sizing = calculateObjectSizing('star', -1, 'realistic', 1.0)
      expect(sizing).toEqual({
        actualSize: 1,
        visualSize: 1
      })
    })

    it('should handle invalid system scale', () => {
      const sizing = calculateObjectSizing('star', 10, 'realistic', -1)
      expect(sizing).toEqual({
        actualSize: 10,
        visualSize: 10
      })
    })
  })

  describe('validateScale', () => {
    it('should return the input value for valid scale', () => {
      expect(validateScale(1.5)).toBe(1.5)
    })

    it('should return fallback for undefined scale', () => {
      expect(validateScale(undefined)).toBe(1.0)
    })

    it('should return fallback for NaN scale', () => {
      expect(validateScale(NaN)).toBe(1.0)
    })

    it('should return fallback for negative scale', () => {
      expect(validateScale(-1)).toBe(1.0)
    })

    it('should return fallback for zero scale', () => {
      expect(validateScale(0)).toBe(1.0)
    })

    it('should use custom fallback value', () => {
      expect(validateScale(undefined, 2.0)).toBe(2.0)
    })
  })
}) 