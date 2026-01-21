import type { ValidationResult } from "@/types/editable"

export const emailValidators = [
    (value: string): ValidationResult => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value || emailRegex.test(value)) {
            return { isValid: false, message: 'Некорректный email' }
        }
        return { isValid: true }
    }
]
