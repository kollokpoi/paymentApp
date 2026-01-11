import type { ValidationResult } from "@/types/editable"

export const companyValidators = [
  (value: string) : ValidationResult => {
    if (!value || value.trim().length < 2) {
      return { isValid: false, message: 'Название компании должно быть не менее 2 символов' }
    }
    return { isValid: true }
  }
]
