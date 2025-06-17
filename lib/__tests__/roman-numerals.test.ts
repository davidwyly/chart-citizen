import { describe, it, expect } from 'vitest';
import { toRomanNumeral } from '../roman-numerals';

describe('Roman Numerals', () => {
  describe('valid conversions', () => {
    it('should convert single digits correctly', () => {
      expect(toRomanNumeral(1)).toBe('I');
      expect(toRomanNumeral(2)).toBe('II');
      expect(toRomanNumeral(3)).toBe('III');
      expect(toRomanNumeral(4)).toBe('IV');
      expect(toRomanNumeral(5)).toBe('V');
      expect(toRomanNumeral(6)).toBe('VI');
      expect(toRomanNumeral(7)).toBe('VII');
      expect(toRomanNumeral(8)).toBe('VIII');
      expect(toRomanNumeral(9)).toBe('IX');
    });

    it('should convert tens correctly', () => {
      expect(toRomanNumeral(10)).toBe('X');
      expect(toRomanNumeral(20)).toBe('XX');
      expect(toRomanNumeral(30)).toBe('XXX');
      expect(toRomanNumeral(40)).toBe('XL');
      expect(toRomanNumeral(50)).toBe('L');
      expect(toRomanNumeral(60)).toBe('LX');
      expect(toRomanNumeral(70)).toBe('LXX');
      expect(toRomanNumeral(80)).toBe('LXXX');
      expect(toRomanNumeral(90)).toBe('XC');
    });

    it('should convert hundreds correctly', () => {
      expect(toRomanNumeral(100)).toBe('C');
      expect(toRomanNumeral(200)).toBe('CC');
      expect(toRomanNumeral(300)).toBe('CCC');
      expect(toRomanNumeral(400)).toBe('CD');
      expect(toRomanNumeral(500)).toBe('D');
      expect(toRomanNumeral(600)).toBe('DC');
      expect(toRomanNumeral(700)).toBe('DCC');
      expect(toRomanNumeral(800)).toBe('DCCC');
      expect(toRomanNumeral(900)).toBe('CM');
    });

    it('should convert thousands correctly', () => {
      expect(toRomanNumeral(1000)).toBe('M');
      expect(toRomanNumeral(2000)).toBe('MM');
      expect(toRomanNumeral(3000)).toBe('MMM');
    });

    it('should convert complex numbers correctly', () => {
      expect(toRomanNumeral(11)).toBe('XI');
      expect(toRomanNumeral(27)).toBe('XXVII');
      expect(toRomanNumeral(48)).toBe('XLVIII');
      expect(toRomanNumeral(59)).toBe('LIX');
      expect(toRomanNumeral(93)).toBe('XCIII');
      expect(toRomanNumeral(141)).toBe('CXLI');
      expect(toRomanNumeral(163)).toBe('CLXIII');
      expect(toRomanNumeral(402)).toBe('CDII');
      expect(toRomanNumeral(575)).toBe('DLXXV');
      expect(toRomanNumeral(911)).toBe('CMXI');
      expect(toRomanNumeral(1024)).toBe('MXXIV');
    });

    it('should handle special astronomical numbers', () => {
      // Common celestial object designations
      expect(toRomanNumeral(42)).toBe('XLII');   // The answer to everything
      expect(toRomanNumeral(88)).toBe('LXXXVIII'); // Number of constellations
      expect(toRomanNumeral(365)).toBe('CCCLXV'); // Days in a year
      expect(toRomanNumeral(1969)).toBe('MCMLXIX'); // Moon landing year
      expect(toRomanNumeral(2001)).toBe('MMI');    // Space Odyssey year
    });

    it('should handle edge cases within valid range', () => {
      expect(toRomanNumeral(1)).toBe('I');      // Minimum valid
      expect(toRomanNumeral(3999)).toBe('MMMCMXCIX'); // Maximum valid
    });

    it('should handle numbers commonly used in astronomy', () => {
      // Planet numbers in our solar system
      expect(toRomanNumeral(8)).toBe('VIII');   // Number of planets
      expect(toRomanNumeral(12)).toBe('XII');   // Months in a year
      expect(toRomanNumeral(24)).toBe('XXIV');  // Hours in a day
      expect(toRomanNumeral(60)).toBe('LX');    // Minutes/seconds
      expect(toRomanNumeral(360)).toBe('CCCLX'); // Degrees in a circle
    });

    it('should handle numbers used in stellar classifications', () => {
      // Common spectral type numbers
      expect(toRomanNumeral(1)).toBe('I');      // Luminosity class I (supergiants)
      expect(toRomanNumeral(2)).toBe('II');     // Luminosity class II (bright giants)
      expect(toRomanNumeral(3)).toBe('III');    // Luminosity class III (giants)
      expect(toRomanNumeral(4)).toBe('IV');     // Luminosity class IV (subgiants)
      expect(toRomanNumeral(5)).toBe('V');      // Luminosity class V (main sequence)
    });
  });

  describe('error handling', () => {
    it('should throw error for zero', () => {
      expect(() => toRomanNumeral(0)).toThrow('Number must be between 1 and 3999');
    });

    it('should throw error for negative numbers', () => {
      expect(() => toRomanNumeral(-1)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(-10)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(-999)).toThrow('Number must be between 1 and 3999');
    });

    it('should throw error for numbers too large', () => {
      expect(() => toRomanNumeral(4000)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(5000)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(10000)).toThrow('Number must be between 1 and 3999');
    });

    it('should throw error for floating point numbers', () => {
      expect(() => toRomanNumeral(1.5)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(3.14)).toThrow('Number must be between 1 and 3999');
      expect(() => toRomanNumeral(999.9)).toThrow('Number must be between 1 and 3999');
    });
  });

  describe('performance and efficiency', () => {
    it('should handle large valid numbers efficiently', () => {
      const start = performance.now();
      const result = toRomanNumeral(3999);
      const end = performance.now();
      
      expect(result).toBe('MMMCMXCIX');
      expect(end - start).toBeLessThan(1); // Should complete in less than 1ms
    });

    it('should produce consistent results on repeated calls', () => {
      const testNumbers = [1, 27, 444, 1987, 3999];
      
      for (const num of testNumbers) {
        const first = toRomanNumeral(num);
        const second = toRomanNumeral(num);
        const third = toRomanNumeral(num);
        
        expect(first).toBe(second);
        expect(second).toBe(third);
      }
    });
  });

  describe('algorithm correctness', () => {
    it('should never contain invalid patterns', () => {
      // Test a range of numbers to ensure no invalid Roman numeral patterns
      const invalidPatterns = ['IIII', 'VV', 'XXXX', 'LL', 'CCCC', 'DD'];
      
      for (let i = 1; i <= 100; i++) {
        const roman = toRomanNumeral(i);
        
        for (const pattern of invalidPatterns) {
          expect(roman).not.toContain(pattern);
        }
      }
    });

    it('should use subtractive notation correctly', () => {
      // These numbers should use subtractive notation, not additive
      expect(toRomanNumeral(4)).toBe('IV');     // Not 'IIII'
      expect(toRomanNumeral(9)).toBe('IX');     // Not 'VIIII'
      expect(toRomanNumeral(40)).toBe('XL');    // Not 'XXXX'
      expect(toRomanNumeral(90)).toBe('XC');    // Not 'LXXXX'
      expect(toRomanNumeral(400)).toBe('CD');   // Not 'CCCC'
      expect(toRomanNumeral(900)).toBe('CM');   // Not 'DCCCC'
    });

    it('should always produce valid Roman numerals', () => {
      // Test that all outputs follow valid Roman numeral rules
      const validChars = new Set(['I', 'V', 'X', 'L', 'C', 'D', 'M']);
      
      for (let i = 1; i <= 50; i++) {
        const roman = toRomanNumeral(i);
        
        // Check all characters are valid
        for (const char of roman) {
          expect(validChars.has(char)).toBe(true);
        }
        
        // Check it's not empty
        expect(roman.length).toBeGreaterThan(0);
      }
    });
  });

  describe('astronomical use cases', () => {
    it('should handle Messier catalog numbers', () => {
      // Messier objects are numbered 1-110
      expect(toRomanNumeral(1)).toBe('I');     // M1 - Crab Nebula
      expect(toRomanNumeral(31)).toBe('XXXI'); // M31 - Andromeda Galaxy
      expect(toRomanNumeral(42)).toBe('XLII'); // M42 - Orion Nebula
      expect(toRomanNumeral(110)).toBe('CX');  // M110 - Dwarf galaxy
    });

    it('should handle NGC catalog numbers (subset)', () => {
      // New General Catalogue numbers (testing small subset)
      expect(toRomanNumeral(224)).toBe('CCXXIV');   // NGC 224 (M31)
      expect(toRomanNumeral(1952)).toBe('MCMLII');  // NGC 1952 (M1)
      expect(toRomanNumeral(3031)).toBe('MMMXXXI'); // NGC 3031 (M81)
    });

    it('should handle star catalog designations', () => {
      // Bayer designation numbers
      expect(toRomanNumeral(1)).toBe('I');      // α (alpha)
      expect(toRomanNumeral(2)).toBe('II');     // β (beta)  
      expect(toRomanNumeral(3)).toBe('III');    // γ (gamma)
      expect(toRomanNumeral(24)).toBe('XXIV');  // 24th Greek letter usage
    });
  });
});