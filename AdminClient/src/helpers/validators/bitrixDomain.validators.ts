import type { ValidationResult } from "@/types/editable"

export const domainValidators = [
  (value: string) : ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Домен обязателен' }
    }
    return { isValid: true }
  }
]
