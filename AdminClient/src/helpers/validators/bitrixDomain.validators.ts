import type { ValidationResult } from "@/types/editable"

export const domainValidators = [
  (value: string) : ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Домен обязателен' }
    }
    if (!value.includes('.bitrix24')) {
      return { isValid: false, message: 'Должен содержать .bitrix24' }
    }
    if(!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.bitrix24\.(ru|com|kz|ua|by)$/.test(value)){
      return { isValid: false, message: 'Неподходящий домен' }
    }
    return { isValid: true }
  }
]
