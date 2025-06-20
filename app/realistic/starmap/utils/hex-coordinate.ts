import { Vector3 } from 'three'
import { HexCoordinate } from '../types'

/**
 * Hexagonal coordinate system utility class
 * Based on Red Blob Games axial coordinate system
 * https://www.redblobgames.com/grids/hexagons/
 */
export class HexCoordinateUtils {
  /**
   * Create a hex coordinate from q and r values
   * s is automatically calculated as -(q + r)
   */
  static create(q: number, r: number): HexCoordinate {
    return {
      q,
      r,
      s: -(q + r)
    }
  }

  /**
   * Validate that a hex coordinate is valid (q + r + s = 0)
   */
  static isValid(hex: HexCoordinate): boolean {
    return Math.abs(hex.q + hex.r + hex.s) < 1e-10 // Account for floating point precision
  }

  /**
   * Convert hex coordinate to cartesian coordinates for 3D positioning
   * Uses flat-topped hexagon orientation
   */
  static toCartesian(hex: HexCoordinate, hexSize: number = 1): Vector3 {
    const x = hexSize * (3/2 * hex.q)
    const z = hexSize * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r)
    return new Vector3(x, 0, z)
  }

  /**
   * Convert cartesian coordinates to hex coordinate
   * Returns the nearest hex coordinate
   */
  static fromCartesian(position: Vector3, hexSize: number = 1): HexCoordinate {
    const q = (2/3 * position.x) / hexSize
    const r = (-1/3 * position.x + Math.sqrt(3)/3 * position.z) / hexSize
    return this.round(this.create(q, r))
  }

  /**
   * Round fractional hex coordinates to the nearest integer hex coordinate
   */
  static round(hex: HexCoordinate): HexCoordinate {
    let q = Math.round(hex.q)
    let r = Math.round(hex.r)
    let s = Math.round(hex.s)

    const qDiff = Math.abs(q - hex.q)
    const rDiff = Math.abs(r - hex.r)
    const sDiff = Math.abs(s - hex.s)

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -(r + s)
    } else if (rDiff > sDiff) {
      r = -(q + s)
    } else {
      s = -(q + r)
    }

    return { q, r, s }
  }

  /**
   * Calculate distance between two hex coordinates
   */
  static distance(a: HexCoordinate, b: HexCoordinate): number {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    )
  }

  /**
   * Add two hex coordinates
   */
  static add(a: HexCoordinate, b: HexCoordinate): HexCoordinate {
    return this.create(a.q + b.q, a.r + b.r)
  }

  /**
   * Subtract two hex coordinates
   */
  static subtract(a: HexCoordinate, b: HexCoordinate): HexCoordinate {
    return this.create(a.q - b.q, a.r - b.r)
  }

  /**
   * Scale a hex coordinate by a factor
   */
  static scale(hex: HexCoordinate, factor: number): HexCoordinate {
    return this.create(hex.q * factor, hex.r * factor)
  }

  /**
   * Get all neighbors of a hex coordinate
   */
  static neighbors(hex: HexCoordinate): HexCoordinate[] {
    const directions = [
      this.create(1, 0),   // East
      this.create(1, -1),  // Northeast
      this.create(0, -1),  // Northwest
      this.create(-1, 0),  // West
      this.create(-1, 1),  // Southwest
      this.create(0, 1)    // Southeast
    ]
    
    return directions.map(dir => this.add(hex, dir))
  }

  /**
   * Get hex coordinates in a spiral pattern around a center
   * Useful for force-directed layout algorithms
   */
  static spiral(center: HexCoordinate, radius: number): HexCoordinate[] {
    if (radius === 0) return [center]
    
    const results: HexCoordinate[] = [center]
    
    for (let r = 1; r <= radius; r++) {
      let hex = this.add(center, this.scale(this.create(-1, 1), r))
      
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < r; j++) {
          results.push(hex)
          hex = this.neighbors(hex)[i]
        }
      }
    }
    
    return results
  }

  /**
   * Get all hex coordinates within a certain radius
   */
  static range(center: HexCoordinate, radius: number): HexCoordinate[] {
    const results: HexCoordinate[] = []
    
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius)
      const r2 = Math.min(radius, -q + radius)
      
      for (let r = r1; r <= r2; r++) {
        results.push(this.add(center, this.create(q, r)))
      }
    }
    
    return results
  }

  /**
   * Linear interpolation between two hex coordinates
   */
  static lerp(a: HexCoordinate, b: HexCoordinate, t: number): HexCoordinate {
    return this.create(
      a.q * (1 - t) + b.q * t,
      a.r * (1 - t) + b.r * t
    )
  }

  /**
   * Get the line of hex coordinates between two points
   */
  static line(a: HexCoordinate, b: HexCoordinate): HexCoordinate[] {
    const distance = this.distance(a, b)
    const results: HexCoordinate[] = []
    
    for (let i = 0; i <= distance; i++) {
      const t = distance === 0 ? 0 : i / distance
      results.push(this.round(this.lerp(a, b, t)))
    }
    
    return results
  }

  /**
   * Check if two hex coordinates are equal
   */
  static equals(a: HexCoordinate, b: HexCoordinate): boolean {
    return a.q === b.q && a.r === b.r && a.s === b.s
  }

  /**
   * Convert hex coordinate to string representation
   */
  static toString(hex: HexCoordinate): string {
    return `(${hex.q}, ${hex.r}, ${hex.s})`
  }

  /**
   * Parse hex coordinate from string representation
   */
  static fromString(str: string): HexCoordinate | null {
    const match = str.match(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/)
    if (!match) return null
    
    const [, q, r, s] = match
    const hex = {
      q: parseFloat(q),
      r: parseFloat(r),
      s: parseFloat(s)
    }
    
    return this.isValid(hex) ? hex : null
  }
} 