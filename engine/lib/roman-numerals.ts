export function toRomanNumeral(num: number): string {
  if (num <= 0 || num > 3999) {
    return num.toString() // Fallback for numbers outside Roman numeral range
  }

  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const numerals = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]

  let result = ""
  let remaining = num

  for (let i = 0; i < values.length; i++) {
    while (remaining >= values[i]) {
      result += numerals[i]
      remaining -= values[i]
    }
  }

  return result
}
