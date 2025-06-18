import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility function', () => {
  it('should combine simple class names', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
  })

  it('should merge conflicting Tailwind classes (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('should handle conditional classes with objects', () => {
    expect(cn('text-sm', { 'font-bold': true, 'text-red-500': false })).toBe('text-sm font-bold')
  })

  it('should handle arrays and undefined values', () => {
    expect(cn(['bg-white', 'p-4'], undefined, 'shadow-md')).toBe('bg-white p-4 shadow-md')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(undefined, null, false)).toBe('')
  })

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      {
        'active': true,
        'disabled': false,
      },
      ['flex', 'items-center'],
      'text-lg',
      'text-sm' // This should override text-lg
    )
    expect(result).toBe('base-class active flex items-center text-sm')
  })
}) 