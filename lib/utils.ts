import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names using clsx and tailwind-merge.
 * 
 * This utility function provides a clean way to conditionally combine CSS classes
 * while ensuring Tailwind CSS classes are properly merged (e.g., conflicting classes
 * are resolved with the last one taking precedence).
 * 
 * @param inputs - Class values that can be strings, objects, arrays, or conditionals
 * @returns A merged and deduplicated string of CSS class names
 * 
 * @example
 * ```typescript
 * cn('px-2 py-1', 'bg-blue-500') // Returns "px-2 py-1 bg-blue-500"
 * cn('px-2', 'px-4') // Returns "px-4" (tailwind-merge resolves conflicts)
 * cn('text-sm', { 'font-bold': true, 'text-red-500': false }) // Returns "text-sm font-bold"
 * cn(['bg-white', 'p-4'], undefined, 'shadow-md') // Returns "bg-white p-4 shadow-md"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 