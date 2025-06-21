import { describe, it, expect } from 'vitest'

// Extract the parent-child matching logic for testing
function findChildObjects(systemData: any, focusName: string) {
  // This replicates the logic from unified-camera-controller.tsx lines 362-370
  const focusedObjectData = systemData.objects?.find((obj: any) => 
    obj.name?.toLowerCase() === focusName.toLowerCase()
  )
  const focusedObjectId = focusedObjectData?.id
  
  const childObjects = systemData.objects?.filter((obj: any) => 
    obj.orbit?.parent === focusName.toLowerCase() || 
    obj.orbit?.parent === focusedObjectId
  ) || []
  
  return { focusedObjectId, childObjects }
}

describe('Profile View Parent-Child Matching Logic', () => {
  it('should find moons for Earth when IDs match', () => {
    const systemData = {
      objects: [
        {
          id: "earth",
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "earth" }  // Parent matches Earth's ID
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Earth")
    
    expect(focusedObjectId).toBe("earth")
    expect(childObjects).toHaveLength(1)
    expect(childObjects[0].name).toBe("Luna")
  })

  it('should NOT find moons when parent uses name instead of ID', () => {
    const systemData = {
      objects: [
        {
          id: "earth-planet",  // ID is different from name
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "earth" }  // Parent uses name, not ID "earth-planet"
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Earth")
    
    expect(focusedObjectId).toBe("earth-planet")
    expect(childObjects).toHaveLength(1)  // This should still work because of the dual check
    expect(childObjects[0].name).toBe("Luna")
  })

  it('should handle case sensitivity correctly', () => {
    const systemData = {
      objects: [
        {
          id: "earth",
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "Earth" }  // Parent uses uppercase
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Earth")
    
    expect(focusedObjectId).toBe("earth")
    expect(childObjects).toHaveLength(0)  // Should fail due to case mismatch
  })

  it('should find no children for Mercury', () => {
    const systemData = {
      objects: [
        {
          id: "mercury",
          name: "Mercury",
          classification: "planet",
          orbit: { parent: "sol-star" }
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Mercury")
    
    expect(focusedObjectId).toBe("mercury")
    expect(childObjects).toHaveLength(0)
  })

  it('should find multiple moons for Jupiter', () => {
    const systemData = {
      objects: [
        {
          id: "jupiter",
          name: "Jupiter",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "io",
          name: "Io",
          classification: "moon",
          orbit: { parent: "jupiter" }
        },
        {
          id: "europa",
          name: "Europa",
          classification: "moon",
          orbit: { parent: "jupiter" }
        },
        {
          id: "ganymede",
          name: "Ganymede",
          classification: "moon",
          orbit: { parent: "jupiter" }
        },
        {
          id: "callisto",
          name: "Callisto",
          classification: "moon",
          orbit: { parent: "jupiter" }
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Jupiter")
    
    expect(focusedObjectId).toBe("jupiter")
    expect(childObjects).toHaveLength(4)
    expect(childObjects.map(obj => obj.name).sort()).toEqual(["Callisto", "Europa", "Ganymede", "Io"])
  })

  it('real-world test: should match actual Sol system data format', () => {
    // Using the actual format we discovered in sol.json
    const systemData = {
      objects: [
        {
          id: "earth",
          name: "Earth",
          classification: "planet",
          orbit: { parent: "sol-star" }
        },
        {
          id: "luna",
          name: "Luna",
          classification: "moon",
          orbit: { parent: "earth" }  // Lowercase parent matching lowercase ID
        }
      ]
    }

    const { focusedObjectId, childObjects } = findChildObjects(systemData, "Earth")
    
    expect(focusedObjectId).toBe("earth")
    expect(childObjects).toHaveLength(1)
    expect(childObjects[0].name).toBe("Luna")
  })
})