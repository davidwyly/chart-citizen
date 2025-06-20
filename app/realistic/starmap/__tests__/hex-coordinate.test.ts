import { Vector3 } from 'three'
import { HexCoordinateUtils } from '../utils/hex-coordinate'
import { HexCoordinate } from '../types'

describe('HexCoordinateUtils', () => {
  describe('create', () => {
    it('should create a valid hex coordinate', () => {
      const hex = HexCoordinateUtils.create(1, 2)
      expect(hex.q).toBe(1)
      expect(hex.r).toBe(2)
      expect(hex.s).toBe(-3)
    })

    it('should satisfy q + r + s = 0', () => {
      const hex = HexCoordinateUtils.create(5, -3)
      expect(hex.q + hex.r + hex.s).toBe(0)
    })
  })

  describe('isValid', () => {
    it('should validate correct hex coordinates', () => {
      const validHex = { q: 1, r: 2, s: -3 }
      expect(HexCoordinateUtils.isValid(validHex)).toBe(true)
    })

    it('should reject invalid hex coordinates', () => {
      const invalidHex = { q: 1, r: 2, s: 0 }
      expect(HexCoordinateUtils.isValid(invalidHex)).toBe(false)
    })

    it('should handle floating point precision', () => {
      const nearlyValidHex = { q: 1, r: 2, s: -3.0000000001 }
      expect(HexCoordinateUtils.isValid(nearlyValidHex)).toBe(true)
    })
  })

  describe('toCartesian', () => {
    it('should convert origin to (0, 0, 0)', () => {
      const origin = HexCoordinateUtils.create(0, 0)
      const cartesian = HexCoordinateUtils.toCartesian(origin)
      expect(cartesian.x).toBeCloseTo(0)
      expect(cartesian.y).toBe(0)
      expect(cartesian.z).toBeCloseTo(0)
    })

    it('should convert (1, 0) correctly', () => {
      const hex = HexCoordinateUtils.create(1, 0)
      const cartesian = HexCoordinateUtils.toCartesian(hex)
      expect(cartesian.x).toBeCloseTo(1.5)
      expect(cartesian.y).toBe(0)
      expect(cartesian.z).toBeCloseTo(Math.sqrt(3) / 2)
    })

    it('should handle custom hex size', () => {
      const hex = HexCoordinateUtils.create(1, 0)
      const cartesian = HexCoordinateUtils.toCartesian(hex, 2)
      expect(cartesian.x).toBeCloseTo(3)
      expect(cartesian.z).toBeCloseTo(Math.sqrt(3))
    })
  })

  describe('fromCartesian', () => {
    it('should convert cartesian back to hex', () => {
      const originalHex = HexCoordinateUtils.create(2, -1)
      const cartesian = HexCoordinateUtils.toCartesian(originalHex)
      const convertedHex = HexCoordinateUtils.fromCartesian(cartesian)
      
      expect(convertedHex.q).toBe(originalHex.q)
      expect(convertedHex.r).toBe(originalHex.r)
      expect(convertedHex.s).toBe(originalHex.s)
    })

    it('should handle origin conversion', () => {
      const origin = new Vector3(0, 0, 0)
      const hex = HexCoordinateUtils.fromCartesian(origin)
      expect(hex.q).toBe(0)
      expect(hex.r).toBe(0)
      expect(hex.s).toBe(0)
    })
  })

  describe('round', () => {
    it('should round fractional coordinates correctly', () => {
      const fractionalHex = { q: 1.2, r: 1.8, s: -3.0 }
      const rounded = HexCoordinateUtils.round(fractionalHex)
      
      expect(rounded.q).toBe(1)
      expect(rounded.r).toBe(2)
      expect(rounded.s).toBe(-3)
      expect(HexCoordinateUtils.isValid(rounded)).toBe(true)
    })

    it('should handle edge cases in rounding', () => {
      const edgeCase = { q: 0.6, r: 0.6, s: -1.2 }
      const rounded = HexCoordinateUtils.round(edgeCase)
      
      expect(HexCoordinateUtils.isValid(rounded)).toBe(true)
    })
  })

  describe('distance', () => {
    it('should calculate distance between adjacent hexes', () => {
      const hex1 = HexCoordinateUtils.create(0, 0)
      const hex2 = HexCoordinateUtils.create(1, 0)
      expect(HexCoordinateUtils.distance(hex1, hex2)).toBe(1)
    })

    it('should calculate distance between distant hexes', () => {
      const hex1 = HexCoordinateUtils.create(0, 0)
      const hex2 = HexCoordinateUtils.create(3, -1)
      expect(HexCoordinateUtils.distance(hex1, hex2)).toBe(3)
    })

    it('should return 0 for same hex', () => {
      const hex = HexCoordinateUtils.create(2, -1)
      expect(HexCoordinateUtils.distance(hex, hex)).toBe(0)
    })
  })

  describe('add', () => {
    it('should add hex coordinates correctly', () => {
      const hex1 = HexCoordinateUtils.create(1, 2)
      const hex2 = HexCoordinateUtils.create(3, -1)
      const result = HexCoordinateUtils.add(hex1, hex2)
      
      expect(result.q).toBe(4)
      expect(result.r).toBe(1)
      expect(result.s).toBe(-5)
      expect(HexCoordinateUtils.isValid(result)).toBe(true)
    })
  })

  describe('subtract', () => {
    it('should subtract hex coordinates correctly', () => {
      const hex1 = HexCoordinateUtils.create(3, -1)
      const hex2 = HexCoordinateUtils.create(1, 2)
      const result = HexCoordinateUtils.subtract(hex1, hex2)
      
      expect(result.q).toBe(2)
      expect(result.r).toBe(-3)
      expect(result.s).toBe(1)
      expect(HexCoordinateUtils.isValid(result)).toBe(true)
    })
  })

  describe('scale', () => {
    it('should scale hex coordinates correctly', () => {
      const hex = HexCoordinateUtils.create(2, -1)
      const scaled = HexCoordinateUtils.scale(hex, 3)
      
      expect(scaled.q).toBe(6)
      expect(scaled.r).toBe(-3)
      expect(scaled.s).toBe(-3)
      expect(HexCoordinateUtils.isValid(scaled)).toBe(true)
    })
  })

  describe('neighbors', () => {
    it('should return 6 neighbors', () => {
      const hex = HexCoordinateUtils.create(0, 0)
      const neighbors = HexCoordinateUtils.neighbors(hex)
      expect(neighbors).toHaveLength(6)
    })

    it('should return valid neighbors', () => {
      const hex = HexCoordinateUtils.create(1, -1)
      const neighbors = HexCoordinateUtils.neighbors(hex)
      
      neighbors.forEach(neighbor => {
        expect(HexCoordinateUtils.isValid(neighbor)).toBe(true)
        expect(HexCoordinateUtils.distance(hex, neighbor)).toBe(1)
      })
    })
  })

  describe('spiral', () => {
    it('should return only center for radius 0', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const spiral = HexCoordinateUtils.spiral(center, 0)
      expect(spiral).toHaveLength(1)
      expect(HexCoordinateUtils.equals(spiral[0], center)).toBe(true)
    })

    it('should return correct count for radius 1', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const spiral = HexCoordinateUtils.spiral(center, 1)
      expect(spiral).toHaveLength(7) // 1 center + 6 neighbors
    })

    it('should return correct count for radius 2', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const spiral = HexCoordinateUtils.spiral(center, 2)
      expect(spiral).toHaveLength(19) // 1 + 6 + 12
    })
  })

  describe('range', () => {
    it('should return only center for radius 0', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const range = HexCoordinateUtils.range(center, 0)
      expect(range).toHaveLength(1)
      expect(HexCoordinateUtils.equals(range[0], center)).toBe(true)
    })

    it('should return correct count for radius 1', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const range = HexCoordinateUtils.range(center, 1)
      expect(range).toHaveLength(7)
    })

    it('should include all hexes within range', () => {
      const center = HexCoordinateUtils.create(0, 0)
      const range = HexCoordinateUtils.range(center, 2)
      
      range.forEach(hex => {
        expect(HexCoordinateUtils.distance(center, hex)).toBeLessThanOrEqual(2)
      })
    })
  })

  describe('line', () => {
    it('should return single hex for same start and end', () => {
      const hex = HexCoordinateUtils.create(1, 1)
      const line = HexCoordinateUtils.line(hex, hex)
      expect(line).toHaveLength(1)
      expect(HexCoordinateUtils.equals(line[0], hex)).toBe(true)
    })

    it('should return correct line between adjacent hexes', () => {
      const start = HexCoordinateUtils.create(0, 0)
      const end = HexCoordinateUtils.create(1, 0)
      const line = HexCoordinateUtils.line(start, end)
      
      expect(line).toHaveLength(2)
      expect(HexCoordinateUtils.equals(line[0], start)).toBe(true)
      expect(HexCoordinateUtils.equals(line[1], end)).toBe(true)
    })

    it('should return valid line for distant hexes', () => {
      const start = HexCoordinateUtils.create(0, 0)
      const end = HexCoordinateUtils.create(3, -2)
      const line = HexCoordinateUtils.line(start, end)
      
      expect(line.length).toBe(4) // distance + 1
      expect(HexCoordinateUtils.equals(line[0], start)).toBe(true)
      expect(HexCoordinateUtils.equals(line[line.length - 1], end)).toBe(true)
      
      // All intermediate points should be valid
      line.forEach(hex => {
        expect(HexCoordinateUtils.isValid(hex)).toBe(true)
      })
    })
  })

  describe('equals', () => {
    it('should return true for identical coordinates', () => {
      const hex1 = HexCoordinateUtils.create(1, 2)
      const hex2 = HexCoordinateUtils.create(1, 2)
      expect(HexCoordinateUtils.equals(hex1, hex2)).toBe(true)
    })

    it('should return false for different coordinates', () => {
      const hex1 = HexCoordinateUtils.create(1, 2)
      const hex2 = HexCoordinateUtils.create(2, 1)
      expect(HexCoordinateUtils.equals(hex1, hex2)).toBe(false)
    })
  })

  describe('toString and fromString', () => {
    it('should convert to string and back', () => {
      const originalHex = HexCoordinateUtils.create(3, -1)
      const hexString = HexCoordinateUtils.toString(originalHex)
      const parsedHex = HexCoordinateUtils.fromString(hexString)
      
      expect(parsedHex).not.toBeNull()
      expect(HexCoordinateUtils.equals(originalHex, parsedHex!)).toBe(true)
    })

    it('should return null for invalid string', () => {
      const invalidString = 'not a hex coordinate'
      const result = HexCoordinateUtils.fromString(invalidString)
      expect(result).toBeNull()
    })

    it('should return null for invalid coordinate in string', () => {
      const invalidCoordString = '(1, 2, 0)' // q + r + s != 0
      const result = HexCoordinateUtils.fromString(invalidCoordString)
      expect(result).toBeNull()
    })
  })
}) 