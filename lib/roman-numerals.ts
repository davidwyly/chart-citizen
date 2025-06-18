const ROMAN_NUMERALS = [
  { value: 1000, numeral: 'M' },
  { value: 900, numeral: 'CM' },
  { value: 500, numeral: 'D' },
  { value: 400, numeral: 'CD' },
  { value: 100, numeral: 'C' },
  { value: 90, numeral: 'XC' },
  { value: 50, numeral: 'L' },
  { value: 40, numeral: 'XL' },
  { value: 10, numeral: 'X' },
  { value: 9, numeral: 'IX' },
  { value: 5, numeral: 'V' },
  { value: 4, numeral: 'IV' },
  { value: 1, numeral: 'I' }
]

/**
 * Converts a positive integer to its Roman numeral representation.
 * 
 * This function supports numbers from 1 to 3999, following standard Roman numeral conventions
 * including subtractive notation (e.g., IV for 4, IX for 9, CD for 400, CM for 900).
 * 
 * @param num - The positive integer to convert (must be between 1 and 3999 inclusive)
 * @returns The Roman numeral representation as a string
 * 
 * @throws {Error} When the input is not a positive integer between 1 and 3999
 * 
 * @example
 * ```typescript
 * toRomanNumeral(1) // Returns "I"
 * toRomanNumeral(4) // Returns "IV" 
 * toRomanNumeral(27) // Returns "XXVII"
 * toRomanNumeral(1994) // Returns "MCMXCIV"
 * toRomanNumeral(3999) // Returns "MMMCMXCIX"
 * ```
 */
export function toRomanNumeral(num: number): string {
  if (num <= 0 || num > 3999 || !Number.isInteger(num)) {
    throw new Error('Number must be between 1 and 3999')
  }

  let result = ''
  let remaining = num

  for (const { value, numeral } of ROMAN_NUMERALS) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }

  return result
} 