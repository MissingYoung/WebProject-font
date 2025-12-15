import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function isPureString(str: string): boolean {
  if (typeof str !== 'string' || str === '') {
    return false
  }
  for (const char of str) {
    if (char < '0' || char > '9') {
      return false
    }
  }
  return true
}
