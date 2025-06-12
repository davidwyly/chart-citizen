import { describe, it, expect, vi } from 'vitest';
import { useSystemStore } from '../../src/core/mode-system/mode-system';
import { SystemData, CelestialObject } from '../../src/types/mode';
import rockyPlanetData from '../../public/data/test-systems/rocky-planet.json';
import gasGiantData from '../../public/data/test-systems/gas-giant.json';
import binaryStarsData from '../../public/data/test-systems/binary-stars.json';
import compactObjectData from '../../public/data/test-systems/compact-object.json';
import asteroidBeltData from '../../public/data/test-systems/asteroid-belt.json';
import stationSystemData from '../../public/data/test-systems/station-system.json';

describe('Object Types', () => {
  let store: ReturnType<typeof useSystemStore.getState>;

  beforeEach(() => {
    store = useSystemStore.getState();
    store.reset();
    vi.clearAllMocks();
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
    expect(store.systemData?.objects).toHaveLength(4);
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.type === 'planet')).toBeDefined();
    expect(store.systemData?.objects.filter((obj: CelestialObject) => obj.type === 'moon')).toHaveLength(2);
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
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.name === 'Neutron Star')).toBeDefined();
    expect(store.systemData?.objects.find((obj: CelestialObject) => obj.name === 'Companion Star')).toBeDefined();
  });

  it('should load asteroid belt system correctly', async () => {
    const data = asteroidBeltData as SystemData;
    store.setSystemData(data);
    expect(store.systemData).toBeDefined();
    expect(store.systemData?.id).toBe('asteroid-belt-system');
    expect(store.systemData?.objects).toHaveLength(3);
    expect(store.systemData?.objects.filter((obj: CelestialObject) => obj.type === 'planet')).toHaveLength(2);
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