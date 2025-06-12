import { describe, it, expect, beforeEach, vi } from 'vitest'
import { materialRegistry } from '../material-registry'
import { ShaderMaterial } from 'three'

describe('Material Registry', () => {
  beforeEach(() => {
    // Clear the registry before each test
    materialRegistry['materials'].clear()
  })

  it('should register and retrieve materials', () => {
    const testMaterial = new ShaderMaterial()
    materialRegistry.registerMaterial({
      name: 'test',
      low: testMaterial
    })

    expect(materialRegistry.getMaterial('test', 'low')).toBe(testMaterial)
  })

  it('should fall back to lower quality materials', () => {
    const lowMaterial = new ShaderMaterial()
    materialRegistry.registerMaterial({
      name: 'test',
      low: lowMaterial
    })

    expect(materialRegistry.getMaterial('test', 'high')).toBe(lowMaterial)
    expect(materialRegistry.getMaterial('test', 'medium')).toBe(lowMaterial)
  })

  it('should validate material progression correctly', () => {
    // Valid progression
    materialRegistry.registerMaterial({
      name: 'valid',
      low: new ShaderMaterial(),
      medium: new ShaderMaterial(),
      high: new ShaderMaterial()
    })
    expect(materialRegistry.validateMaterialProgression('valid')).toBe(true)

    // Invalid progression - missing medium
    materialRegistry.registerMaterial({
      name: 'invalid1',
      low: new ShaderMaterial(),
      high: new ShaderMaterial()
    })
    expect(materialRegistry.validateMaterialProgression('invalid1')).toBe(false)

    // Invalid progression - missing high
    materialRegistry.registerMaterial({
      name: 'invalid2',
      low: new ShaderMaterial(),
      medium: new ShaderMaterial()
    })
    expect(materialRegistry.validateMaterialProgression('invalid2')).toBe(false)

    // Valid - only high quality
    materialRegistry.registerMaterial({
      name: 'valid2',
      high: new ShaderMaterial()
    })
    expect(materialRegistry.validateMaterialProgression('valid2')).toBe(true)

    // Valid - medium and high quality
    materialRegistry.registerMaterial({
      name: 'valid3',
      medium: new ShaderMaterial(),
      high: new ShaderMaterial()
    })
    expect(materialRegistry.validateMaterialProgression('valid3')).toBe(true)
  })

  it('should return undefined for non-existent materials', () => {
    expect(materialRegistry.getMaterial('nonexistent', 'low')).toBeUndefined()
  })

  it('should return all registered materials', () => {
    const material1 = { name: 'test1', low: new ShaderMaterial() }
    const material2 = { name: 'test2', high: new ShaderMaterial() }

    materialRegistry.registerMaterial(material1)
    materialRegistry.registerMaterial(material2)

    const allMaterials = materialRegistry.getAllMaterials()
    expect(allMaterials).toHaveLength(2)
    expect(allMaterials).toContainEqual(material1)
    expect(allMaterials).toContainEqual(material2)
  })
}) 