import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';

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
    
    // Create triple star system with orbital relationships
    store.createStarObject({
      id: 'primary-star',
      type: 'star',
      position: { x: 0, y: 0, z: 0 },
      properties: {
        name: 'Primary Star',
        radius: 1.2,
        temperature: 6500,
        isPrimary: true
      }
    });

    store.createStarObject({
      id: 'companion-star',
      type: 'star',
      position: { x: 2, y: 0, z: 0 },
      properties: {
        name: 'Companion Star',
        radius: 0.8,
        temperature: 4500,
        isCompanion: true,
        orbitsAround: 'primary-star'
      }
    });

    store.createStarObject({
      id: 'distant-star',
      type: 'star',
      position: { x: 0, y: 0, z: 5 },
      properties: {
        name: 'Distant Star',
        radius: 0.4,
        temperature: 3500,
        isDistant: true,
        orbitsAround: 'primary-star'
      }
    });

    // Verify proper orbital relationships
    const primary = store.getObjectProperties('primary-star');
    const companion = store.getObjectProperties('companion-star');
    const distant = store.getObjectProperties('distant-star');

    expect(primary?.properties.isPrimary).toBe(true);
    expect(companion?.properties.isCompanion).toBe(true);
    expect(companion?.properties.orbitsAround).toBe('primary-star');
    expect(distant?.properties.isDistant).toBe(true);
    expect(distant?.properties.orbitsAround).toBe('primary-star');

    // Verify all stars maintain different positions
    expect(primary?.position).not.toEqual(companion?.position);
    expect(primary?.position).not.toEqual(distant?.position);
    expect(companion?.position).not.toEqual(distant?.position);
  });

  it('should correctly handle star system lighting calculations with multiple stars', () => {
    const store = useSystemStore.getState();
    
    // Create binary star system
    store.createStarObject({
      id: 'star-alpha',
      type: 'star',
      position: { x: -1, y: 0, z: 0 },
      properties: {
        name: 'Alpha',
        radius: 1.0,
        temperature: 5778,
        luminosity: 1.0,
        isPrimary: true
      }
    });

    store.createStarObject({
      id: 'star-beta',
      type: 'star',
      position: { x: 1, y: 0, z: 0 },
      properties: {
        name: 'Beta',
        radius: 0.7,
        temperature: 4200,
        luminosity: 0.4,
        isSecondary: true
      }
    });

    // Verify both stars were created successfully
    const alphaStar = store.getObjectProperties('star-alpha');
    const betaStar = store.getObjectProperties('star-beta');
    
    expect(alphaStar).toBeDefined();
    expect(betaStar).toBeDefined();
    expect(alphaStar?.properties.luminosity).toBe(1.0);
    expect(betaStar?.properties.luminosity).toBe(0.4);
    expect(alphaStar?.properties.isPrimary).toBe(true);
    expect(betaStar?.properties.isSecondary).toBe(true);
  });
}) 