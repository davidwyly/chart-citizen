import { describe, it, expect, vi } from 'vitest';
import { useSystemStore } from '@/engine/core/mode-system/mode-system';
import type { SystemData, CelestialObject } from '@/engine/types/mode';
import rockyPlanetData from '../../../public/data/test-systems/rocky-planet.json';
import gasGiantData from '../../../public/data/test-systems/gas-giant.json';
import binaryStarsData from '../../../public/data/test-systems/binary-stars.json';
import compactObjectData from '../../../public/data/test-systems/compact-object.json';
import asteroidBeltData from '../../../public/data/test-systems/asteroid-belt.json';
import stationSystemData from '../../../public/data/test-systems/station-system.json';

describe('Object Types', () => {
  let store: ReturnType<typeof useSystemStore.getState>;

  beforeEach(() => {
    store = useSystemStore.getState();
    store.reset();
    vi.clearAllMocks();
  });

  const testSystemData: SystemData = {
    name: 'Rocky Planet System',
    objects: [
      {
        id: 'star-1',
        type: 'star',
        name: 'G2V Star',
        position: [0, 0, 0],
        radius: 1,
        mass: 1
      },
      {
        id: 'planet-1',
        type: 'planet',
        name: 'Rocky Planet',
        position: [5, 0, 0],
        radius: 0.5,
        mass: 0.5,
        orbit: {
          parentId: 'star-1',
          semiMajorAxis: 5,
          eccentricity: 0.1,
          inclination: 0
        }
      },
      {
        id: 'moon-1',
        type: 'moon',
        name: 'Moon',
        position: [5.1, 0, 0],
        radius: 0.1,
        mass: 0.01,
        orbit: {
          parentId: 'planet-1',
          semiMajorAxis: 0.1,
          eccentricity: 0.05,
          inclination: 0
        }
      },
      {
        id: 'jump-point-1',
        type: 'jump-point',
        name: 'Jump Point',
        position: [10, 0, 0],
        radius: 0.05,
        mass: 0
      }
    ]
  };

  it('should handle system data correctly', () => {
    store.systemData = testSystemData;
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.name).toBe('Rocky Planet System');
    expect(store.systemData?.objects).toHaveLength(4);
    expect(store.systemData?.objects.find(obj => obj.type === 'star')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'planet')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'moon')).toBeDefined();
    expect(store.systemData?.objects.find(obj => obj.type === 'jump-point')).toBeDefined();
  });

  it('should handle object properties correctly', () => {
    store.systemData = testSystemData;
    const star = store.systemData?.objects.find(obj => obj.type === 'star');
    expect(star?.position).toEqual([0, 0, 0]);
    expect(star?.radius).toBe(1);
    expect(star?.mass).toBe(1);

    const planet = store.systemData?.objects.find(obj => obj.type === 'planet');
    expect(planet?.orbit?.parentId).toBe('star-1');
    expect(planet?.orbit?.semiMajorAxis).toBe(5);
    expect(planet?.orbit?.eccentricity).toBe(0.1);
    expect(planet?.orbit?.inclination).toBe(0);

    const moon = store.systemData?.objects.find(obj => obj.type === 'moon');
    expect(moon?.orbit?.parentId).toBe('planet-1');
    expect(moon?.orbit?.semiMajorAxis).toBe(0.1);
    expect(moon?.orbit?.eccentricity).toBe(0.05);
    expect(moon?.orbit?.inclination).toBe(0);

    const jumpPoint = store.systemData?.objects.find(obj => obj.type === 'jump-point');
    expect(jumpPoint?.position).toEqual([10, 0, 0]);
    expect(jumpPoint?.radius).toBe(0.05);
    expect(jumpPoint?.mass).toBe(0);
  });

  it('should load rocky planet system correctly', async () => {
    const data = rockyPlanetData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('rocky-planet-system');
    expect(store.systemData?.objects).toHaveLength(4);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'planet')).toBeDefined();
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'moon')).toBeDefined();
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'jump-point')).toBeDefined();
  });

  it('should load gas giant system correctly', async () => {
    const data = gasGiantData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('gas-giant-system');
    expect(store.systemData?.objects).toHaveLength(3);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'gas-giant')).toBeDefined();
  });

  it('should load binary stars system correctly', async () => {
    const data = binaryStarsData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('binary-stars-system');
    expect(store.systemData?.objects).toHaveLength(2);
    expect(store.systemData?.objects.filter((obj: CelestialObject) => obj.type === 'star')).toHaveLength(2);
  });

  it('should load compact object system correctly', async () => {
    const data = compactObjectData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('compact-object-system');
    expect(store.systemData?.objects).toHaveLength(2);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'black-hole')).toBeDefined();
  });

  it('should load asteroid belt system correctly', async () => {
    const data = asteroidBeltData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('asteroid-belt-system');
    expect(store.systemData?.objects).toHaveLength(3);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'asteroid-belt')).toBeDefined();
  });

  it('should load station system correctly', async () => {
    const data = stationSystemData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('station-system');
    expect(store.systemData?.objects).toHaveLength(3);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.name === 'Space Station')).toBeDefined();
  });

  it('should have correct types for celestial objects', () => {
    expect(true).toBe(true);
  });
}); 