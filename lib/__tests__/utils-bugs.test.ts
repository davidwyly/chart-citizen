import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('Utils Function Bug Tests', () => {
  describe('cn (className merger) edge cases', () => {
    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(undefined)).toBe('');
      expect(cn(null as unknown as string)).toBe('');
    });

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn(['class1'], ['class2'])).toBe('class1 class2');
      expect(cn([null, 'class1', undefined, 'class2'])).toBe('class1 class2');
    });

    it('should handle object inputs with falsy values', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': null,
        'class4': undefined,
        'class5': 0,
        'class6': ''
      })).toBe('class1');
    });

    it('should handle nested arrays and objects', () => {
      expect(cn(
        'base-class',
        ['conditional1', { 'conditional2': true }],
        { 'conditional3': false, 'conditional4': true }
      )).toBe('base-class conditional1 conditional2 conditional4');
    });

    it('should deduplicate classes properly', () => {
      // Test Tailwind CSS conflict resolution
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('bg-red-500', 'bg-blue-500', 'bg-green-500')).toBe('bg-green-500');
    });

    it('should handle very long class strings', () => {
      const longClassString = Array(1000).fill('class').map((c, i) => `${c}-${i}`).join(' ');
      expect(() => cn(longClassString)).not.toThrow();
      expect(cn(longClassString).length).toBeGreaterThan(0);
    });

    it('should handle special characters in class names', () => {
      // Some build tools or CSS-in-JS might generate unusual class names
      expect(cn('class_with_underscores')).toBe('class_with_underscores');
      expect(cn('class-with-dashes')).toBe('class-with-dashes');
      expect(cn('class123')).toBe('class123');
      
      // Edge case: what about classes with special characters?
      expect(() => cn('class:with:colons')).not.toThrow();
      expect(() => cn('class[with]brackets')).not.toThrow();
    });

    it('should handle numeric inputs', () => {
      // Numbers should be converted to strings
      expect(cn(123 as unknown as string)).toBe('123');
      expect(cn(0 as unknown as string)).toBe(''); // Falsy number should be filtered out
      expect(cn(-1 as unknown as string)).toBe('-1');
    });

    it('should handle boolean inputs', () => {
      expect(cn(true as unknown as string)).toBe(''); // Boolean true doesn't make sense as a class
      expect(cn(false as unknown as string)).toBe('');
    });

    it('should handle function inputs gracefully', () => {
      // This shouldn't happen in normal usage but let's make sure it doesn't crash
      const fn = () => 'dynamic-class';
      expect(() => cn(fn as unknown as string)).not.toThrow();
    });

    it('should maintain performance with many inputs', () => {
      const manyInputs = Array(100).fill(0).map((_, i) => ({
        [`class-${i}`]: i % 2 === 0
      }));
      
      const start = performance.now();
      const result = cn(...manyInputs);
      const end = performance.now();
      
      expect(result).toBeDefined();
      expect(end - start).toBeLessThan(10); // Should be fast
    });

    describe('Tailwind-specific merge behavior', () => {
      it('should handle responsive prefixes correctly', () => {
        expect(cn('text-sm', 'md:text-lg', 'text-base')).toBe('md:text-lg text-base');
        expect(cn('p-4', 'sm:p-2', 'md:p-6')).toBe('p-4 sm:p-2 md:p-6');
      });

      it('should handle state prefixes correctly', () => {
        expect(cn('bg-blue-500', 'hover:bg-blue-600', 'bg-red-500')).toBe('hover:bg-blue-600 bg-red-500');
        expect(cn('text-gray-900', 'focus:text-blue-500', 'active:text-red-500')).toBe('text-gray-900 focus:text-blue-500 active:text-red-500');
      });

      it('should handle arbitrary value conflicts', () => {
        // Tailwind allows arbitrary values like text-[14px]
        expect(cn('text-[14px]', 'text-[16px]')).toBe('text-[16px]');
        expect(cn('bg-[#123456]', 'bg-[#654321]')).toBe('bg-[#654321]');
      });

      it('should handle different utility categories', () => {
        // Different utility types shouldn't conflict
        expect(cn('text-red-500', 'bg-blue-500', 'p-4', 'm-2'))
          .toBe('text-red-500 bg-blue-500 p-4 m-2');
      });
    });

    describe('edge cases that might break styling', () => {
      it('should handle CSS injection attempts', () => {
        // Make sure malicious input doesn't break things
        const maliciousInput = 'class"; background: url("javascript:alert(1)"); "';
        expect(() => cn(maliciousInput)).not.toThrow();
        const result = cn(maliciousInput);
        // The cn function just processes class names, it doesn't sanitize CSS injection
        // This test just ensures it doesn't crash
        expect(result).toBeDefined();
      });

      it('should handle extremely long individual class names', () => {
        const longClassName = 'a'.repeat(10000);
        expect(() => cn(longClassName)).not.toThrow();
      });

      it('should handle circular object references', () => {
        const obj: Record<string, unknown> = { 'test-class': true };
        obj.self = obj; // Circular reference
        
        // clsx should handle this gracefully
        expect(() => cn(obj)).not.toThrow();
      });
    });
  });
});