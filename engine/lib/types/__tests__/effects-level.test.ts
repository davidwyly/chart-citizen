import { describe, it, expect } from 'vitest'
import { validateMaterialQualityProgression } from '../effects-level'

describe('Material Quality Progression Validation', () => {
  it('should validate correct progression when all levels exist', () => {
    expect(validateMaterialQualityProgression(true, true, true)).toBe(true)
  })

  it('should validate when only high quality exists', () => {
    expect(validateMaterialQualityProgression(false, false, true)).toBe(true)
  })

  it('should validate when medium and high quality exist', () => {
    expect(validateMaterialQualityProgression(false, true, true)).toBe(true)
  })

  it('should invalidate when low exists but medium is missing', () => {
    expect(validateMaterialQualityProgression(true, false, true)).toBe(false)
  })

  it('should invalidate when low exists but high is missing', () => {
    expect(validateMaterialQualityProgression(true, true, false)).toBe(false)
  })

  it('should invalidate when medium exists but high is missing', () => {
    expect(validateMaterialQualityProgression(false, true, false)).toBe(false)
  })

  it('should invalidate when only low exists', () => {
    expect(validateMaterialQualityProgression(true, false, false)).toBe(false)
  })

  it('should invalidate when only medium exists', () => {
    expect(validateMaterialQualityProgression(false, true, false)).toBe(false)
  })
}) 