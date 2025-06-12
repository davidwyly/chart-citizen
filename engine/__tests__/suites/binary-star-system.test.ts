import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '../../src/core/mode-system/mode-system';

describe('Binary Star System Features', () => {
  beforeEach(() => {
    useSystemStore.getState().reset();
  });

  it('should properly position binary stars to prevent occlusion', () => {
    const store = useSystemStore.getState();
    
    // Create primary star (Alpha Centauri A)
    const primaryStar = store.createStarObject({
      id: 'alpha-centauri-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 }, // Offset from center
      properties: {
        name: 'Alpha Centauri A',
        radius: 1.1,
        temperature: 5790,
        spectralType: 'G2V'
      }
    });

    // Create secondary star (Alpha Centauri B)
    const secondaryStar = store.createStarObject({
      id: 'alpha-centauri-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 }, // Offset from center in opposite direction
      properties: {
        name: 'Alpha Centauri B',
        radius: 0.9,
        temperature: 5260,
        spectralType: 'K1V'
      }
    });

    // Verify stars are created with correct positions
    const primaryProps = store.getObjectProperties('alpha-centauri-a');
    const secondaryProps = store.getObjectProperties('alpha-centauri-b');

    expect(primaryProps).toBeDefined();
    expect(secondaryProps).toBeDefined();
    expect(primaryProps?.position).toEqual({ x: -0.5, y: 0, z: 0 });
    expect(secondaryProps?.position).toEqual({ x: 0.5, y: 0, z: 0 });

    // Verify stars are not at the same position
    expect(primaryProps?.position).not.toEqual(secondaryProps?.position);
  });

  it('should properly handle triple star systems', () => {
    const store = useSystemStore.getState();
    
    // Create primary binary pair (Alpha Centauri A & B)
    const primaryStar = store.createStarObject({
      id: 'alpha-centauri-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri A',
        radius: 1.1,
        temperature: 5790,
        spectralType: 'G2V',
        isBinary: true
      }
    });

    const secondaryStar = store.createStarObject({
      id: 'alpha-centauri-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri B',
        radius: 0.9,
        temperature: 5260,
        spectralType: 'K1V',
        isBinary: true
      }
    });

    // Create tertiary star (Proxima Centauri)
    const tertiaryStar = store.createStarObject({
      id: 'proxima-centauri',
      type: 'star',
      position: { x: 0, y: 2, z: 0 }, // Positioned above the binary pair
      properties: {
        name: 'Proxima Centauri',
        radius: 0.15,
        temperature: 3042,
        spectralType: 'M5.5Ve',
        isTertiary: true
      }
    });

    // Verify all stars are created with correct positions
    const primaryProps = store.getObjectProperties('alpha-centauri-a');
    const secondaryProps = store.getObjectProperties('alpha-centauri-b');
    const tertiaryProps = store.getObjectProperties('proxima-centauri');

    expect(primaryProps).toBeDefined();
    expect(secondaryProps).toBeDefined();
    expect(tertiaryProps).toBeDefined();

    // Verify binary pair positions
    expect(primaryProps?.position).toEqual({ x: -0.5, y: 0, z: 0 });
    expect(secondaryProps?.position).toEqual({ x: 0.5, y: 0, z: 0 });

    // Verify tertiary star position
    expect(tertiaryProps?.position).toEqual({ x: 0, y: 2, z: 0 });

    // Verify no stars are at the same position
    expect(primaryProps?.position).not.toEqual(secondaryProps?.position);
    expect(primaryProps?.position).not.toEqual(tertiaryProps?.position);
    expect(secondaryProps?.position).not.toEqual(tertiaryProps?.position);

    // Verify binary relationship
    expect(primaryProps?.properties.isBinary).toBe(true);
    expect(secondaryProps?.properties.isBinary).toBe(true);
    expect(tertiaryProps?.properties.isTertiary).toBe(true);
  });

  it('should maintain proper triple star separation in different view modes', () => {
    const store = useSystemStore.getState();
    
    // Create triple star system
    store.createStarObject({
      id: 'star-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Star A',
        radius: 1.0,
        temperature: 6000,
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'star-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Star B',
        radius: 0.8,
        temperature: 5000,
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'star-c',
      type: 'star',
      position: { x: 0, y: 2, z: 0 },
      properties: {
        name: 'Star C',
        radius: 0.2,
        temperature: 3000,
        isTertiary: true
      }
    });

    // Test in realistic mode
    store.setViewMode('realistic');
    const realisticPositions = {
      starA: store.getObjectProperties('star-a')?.position,
      starB: store.getObjectProperties('star-b')?.position,
      starC: store.getObjectProperties('star-c')?.position
    };
    expect(realisticPositions.starA).not.toEqual(realisticPositions.starB);
    expect(realisticPositions.starA).not.toEqual(realisticPositions.starC);
    expect(realisticPositions.starB).not.toEqual(realisticPositions.starC);

    // Test in navigational mode
    store.setViewMode('navigational');
    const navigationalPositions = {
      starA: store.getObjectProperties('star-a')?.position,
      starB: store.getObjectProperties('star-b')?.position,
      starC: store.getObjectProperties('star-c')?.position
    };
    expect(navigationalPositions.starA).not.toEqual(navigationalPositions.starB);
    expect(navigationalPositions.starA).not.toEqual(navigationalPositions.starC);
    expect(navigationalPositions.starB).not.toEqual(navigationalPositions.starC);

    // Test in profile mode
    store.setViewMode('profile');
    const profilePositions = {
      starA: store.getObjectProperties('star-a')?.position,
      starB: store.getObjectProperties('star-b')?.position,
      starC: store.getObjectProperties('star-c')?.position
    };
    expect(profilePositions.starA).not.toEqual(profilePositions.starB);
    expect(profilePositions.starA).not.toEqual(profilePositions.starC);
    expect(profilePositions.starB).not.toEqual(profilePositions.starC);
  });

  it('should handle triple star system interactions correctly', () => {
    const store = useSystemStore.getState();
    
    // Create triple star system
    store.createStarObject({
      id: 'star-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Star A',
        radius: 1.0,
        temperature: 6000,
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'star-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Star B',
        radius: 0.8,
        temperature: 5000,
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'star-c',
      type: 'star',
      position: { x: 0, y: 2, z: 0 },
      properties: {
        name: 'Star C',
        radius: 0.2,
        temperature: 3000,
        isTertiary: true
      }
    });

    // Test selection of each star
    store.selectObject('star-a');
    expect(store.selectedObject).toBe('star-a');
    
    store.selectObject('star-b');
    expect(store.selectedObject).toBe('star-b');

    store.selectObject('star-c');
    expect(store.selectedObject).toBe('star-c');

    // Test hover state
    store.setHoveredObject('star-a');
    expect(store.getHoveredObject()).toBe('star-a');
    
    store.setHoveredObject('star-b');
    expect(store.getHoveredObject()).toBe('star-b');

    store.setHoveredObject('star-c');
    expect(store.getHoveredObject()).toBe('star-c');
  });

  it('should handle binary pair orbital parameters correctly', () => {
    const store = useSystemStore.getState();
    
    // Create binary pair with orbital parameters
    const primaryStar = store.createStarObject({
      id: 'alpha-centauri-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri A',
        radius: 1.1,
        temperature: 5790,
        spectralType: 'G2V',
        isBinary: true,
        orbitalParameters: {
          semiMajorAxis: 23.4, // AU
          eccentricity: 0.5179,
          period: 79.91, // years
          inclination: 79.205, // degrees
          ascendingNode: 204.85, // degrees
          periapsis: 231.65 // degrees
        }
      }
    });

    const secondaryStar = store.createStarObject({
      id: 'alpha-centauri-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri B',
        radius: 0.9,
        temperature: 5260,
        spectralType: 'K1V',
        isBinary: true,
        orbitalParameters: {
          semiMajorAxis: 23.4, // AU
          eccentricity: 0.5179,
          period: 79.91, // years
          inclination: 79.205, // degrees
          ascendingNode: 204.85, // degrees
          periapsis: 231.65 // degrees
        }
      }
    });

    // Verify orbital parameters
    const primaryProps = store.getObjectProperties('alpha-centauri-a');
    const secondaryProps = store.getObjectProperties('alpha-centauri-b');

    expect(primaryProps?.properties.orbitalParameters).toBeDefined();
    expect(secondaryProps?.properties.orbitalParameters).toBeDefined();
    expect(primaryProps?.properties.orbitalParameters.semiMajorAxis).toBe(23.4);
    expect(primaryProps?.properties.orbitalParameters.eccentricity).toBe(0.5179);
    expect(primaryProps?.properties.orbitalParameters.period).toBe(79.91);
  });

  it('should maintain proper separation for distant tertiary stars', () => {
    const store = useSystemStore.getState();
    
    // Create binary pair
    store.createStarObject({
      id: 'alpha-centauri-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri A',
        radius: 1.1,
        temperature: 5790,
        spectralType: 'G2V',
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'alpha-centauri-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri B',
        radius: 0.9,
        temperature: 5260,
        spectralType: 'K1V',
        isBinary: true
      }
    });

    // Create Proxima Centauri with proper separation (13000 AU)
    const proxima = store.createStarObject({
      id: 'proxima-centauri',
      type: 'star',
      position: { x: 0, y: 13000, z: 0 },
      properties: {
        name: 'Proxima Centauri',
        radius: 0.15,
        temperature: 3042,
        spectralType: 'M5.5Ve',
        isTertiary: true,
        separation: 13000 // AU
      }
    });

    // Verify separation
    const proximaProps = store.getObjectProperties('proxima-centauri');
    expect(proximaProps?.properties.separation).toBe(13000);
    expect(proximaProps?.position.y).toBe(13000);
  });

  it('should handle different star type visual effects', () => {
    const store = useSystemStore.getState();
    
    // Create stars with different spectral types
    const gType = store.createStarObject({
      id: 'g-type',
      type: 'star',
      position: { x: -1, y: 0, z: 0 },
      properties: {
        name: 'G-type Star',
        radius: 1.0,
        temperature: 5800,
        spectralType: 'G2V',
        visualEffects: {
          corona: true,
          prominences: true,
          surfaceFeatures: true
        }
      }
    });

    const kType = store.createStarObject({
      id: 'k-type',
      type: 'star',
      position: { x: 0, y: 0, z: 0 },
      properties: {
        name: 'K-type Star',
        radius: 0.8,
        temperature: 4000,
        spectralType: 'K1V',
        visualEffects: {
          corona: true,
          prominences: true,
          surfaceFeatures: true
        }
      }
    });

    const mType = store.createStarObject({
      id: 'm-type',
      type: 'star',
      position: { x: 1, y: 0, z: 0 },
      properties: {
        name: 'M-type Star',
        radius: 0.2,
        temperature: 3000,
        spectralType: 'M5.5Ve',
        visualEffects: {
          corona: true,
          prominences: false,
          surfaceFeatures: true
        }
      }
    });

    // Verify visual effects
    const gProps = store.getObjectProperties('g-type');
    const kProps = store.getObjectProperties('k-type');
    const mProps = store.getObjectProperties('m-type');

    expect(gProps?.properties.visualEffects.corona).toBe(true);
    expect(gProps?.properties.visualEffects.prominences).toBe(true);
    expect(gProps?.properties.visualEffects.surfaceFeatures).toBe(true);

    expect(kProps?.properties.visualEffects.corona).toBe(true);
    expect(kProps?.properties.visualEffects.prominences).toBe(true);
    expect(kProps?.properties.visualEffects.surfaceFeatures).toBe(true);

    expect(mProps?.properties.visualEffects.corona).toBe(true);
    expect(mProps?.properties.visualEffects.prominences).toBe(false);
    expect(mProps?.properties.visualEffects.surfaceFeatures).toBe(true);
  });

  it('should handle planets in triple star systems', () => {
    const store = useSystemStore.getState();
    
    // Create triple star system
    store.createStarObject({
      id: 'alpha-centauri-a',
      type: 'star',
      position: { x: -0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri A',
        radius: 1.1,
        temperature: 5790,
        spectralType: 'G2V',
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'alpha-centauri-b',
      type: 'star',
      position: { x: 0.5, y: 0, z: 0 },
      properties: {
        name: 'Alpha Centauri B',
        radius: 0.9,
        temperature: 5260,
        spectralType: 'K1V',
        isBinary: true
      }
    });

    store.createStarObject({
      id: 'proxima-centauri',
      type: 'star',
      position: { x: 0, y: 13000, z: 0 },
      properties: {
        name: 'Proxima Centauri',
        radius: 0.15,
        temperature: 3042,
        spectralType: 'M5.5Ve',
        isTertiary: true
      }
    });

    // Create planets around different stars
    const planetA = store.createPlanetObject({
      id: 'planet-a',
      type: 'planet',
      position: { x: -2, y: 0, z: 0 },
      properties: {
        name: 'Planet A',
        radius: 0.5,
        type: 'rocky',
        parentStar: 'alpha-centauri-a',
        orbitalParameters: {
          semiMajorAxis: 1.0,
          eccentricity: 0.1,
          period: 365.25
        }
      }
    });

    const planetB = store.createPlanetObject({
      id: 'planet-b',
      type: 'planet',
      position: { x: 2, y: 0, z: 0 },
      properties: {
        name: 'Planet B',
        radius: 0.7,
        type: 'gas-giant',
        parentStar: 'alpha-centauri-b',
        orbitalParameters: {
          semiMajorAxis: 5.0,
          eccentricity: 0.05,
          period: 4332.59
        }
      }
    });

    const planetC = store.createPlanetObject({
      id: 'planet-c',
      type: 'planet',
      position: { x: 0, y: 13001, z: 0 },
      properties: {
        name: 'Proxima Centauri b',
        radius: 0.3,
        type: 'rocky',
        parentStar: 'proxima-centauri',
        orbitalParameters: {
          semiMajorAxis: 0.05,
          eccentricity: 0.0,
          period: 11.2
        }
      }
    });

    // Verify planet properties and relationships
    const planetAProps = store.getObjectProperties('planet-a');
    const planetBProps = store.getObjectProperties('planet-b');
    const planetCProps = store.getObjectProperties('planet-c');

    expect(planetAProps?.properties.parentStar).toBe('alpha-centauri-a');
    expect(planetBProps?.properties.parentStar).toBe('alpha-centauri-b');
    expect(planetCProps?.properties.parentStar).toBe('proxima-centauri');

    // Verify orbital parameters
    expect(planetAProps?.properties.orbitalParameters.semiMajorAxis).toBe(1.0);
    expect(planetBProps?.properties.orbitalParameters.semiMajorAxis).toBe(5.0);
    expect(planetCProps?.properties.orbitalParameters.semiMajorAxis).toBe(0.05);

    // Verify positions relative to parent stars
    expect(planetAProps?.position.x).toBe(-2);
    expect(planetBProps?.position.x).toBe(2);
    expect(planetCProps?.position.y).toBe(13001);
  });
}); 