/**
 * Stellar luminosity values relative to the Sun (L/L☉)
 */
export const SPECTRAL_TYPE_LUMINOSITY: Record<string, number> = {
  'O5': 100000,
  'B0': 20000,
  'B5': 800,
  'A0': 80,
  'A5': 25,
  'F0': 6.0,
  'F8': 1.5,
  'G2': 1.0, // Sun
  'K0': 0.6,
  'K5': 0.2,
  'M0': 0.08,
  'M5': 0.01,
  'M8': 0.001
};

/**
 * Calculates the inner edge of the habitable zone in AU
 * Based on Kopparapu model: HZ_inner = sqrt(L/1.37)
 */
export function calculateHabitableZoneInner(luminosity: number): number {
  return Math.sqrt(luminosity / 1.37);
}

/**
 * Calculates the outer edge of the habitable zone in AU
 * Based on Kopparapu model: HZ_outer = sqrt(L/0.95)
 */
export function calculateHabitableZoneOuter(luminosity: number): number {
  return Math.sqrt(luminosity / 0.95);
}

/**
 * Calculates the snow line in AU
 * Empirical estimate: Snow Line ≈ sqrt(L) × 2.7
 */
export function calculateSnowLine(luminosity: number): number {
  return Math.sqrt(luminosity) * 2.7;
}

/**
 * Gets the luminosity for a given spectral type
 * @throws Error if spectral type is not found
 */
export function getLuminosityForSpectralType(spectralType: string): number {
  const luminosity = SPECTRAL_TYPE_LUMINOSITY[spectralType];
  if (luminosity === undefined) {
    throw new Error(`Unknown spectral type: ${spectralType}`);
  }
  return luminosity;
}

/**
 * Calculates habitable zone and snow line for a given spectral type
 */
export function calculateHabitableZoneAndSnowLine(spectralType: string) {
  const luminosity = getLuminosityForSpectralType(spectralType);
  return {
    habitableZone: {
      inner: calculateHabitableZoneInner(luminosity),
      outer: calculateHabitableZoneOuter(luminosity)
    },
    snowLine: calculateSnowLine(luminosity)
  };
}

/**
 * Calculates habitable zone and snow line for a binary star system
 */
export function calculateBinarySystemZones(spectralType1: string, spectralType2: string) {
  const luminosity1 = getLuminosityForSpectralType(spectralType1);
  const luminosity2 = getLuminosityForSpectralType(spectralType2);
  const totalLuminosity = luminosity1 + luminosity2;

  return {
    habitableZone: {
      inner: calculateHabitableZoneInner(totalLuminosity),
      outer: calculateHabitableZoneOuter(totalLuminosity)
    },
    snowLine: calculateSnowLine(totalLuminosity)
  };
} 