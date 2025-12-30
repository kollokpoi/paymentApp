// types/editable.ts
export interface ValidationResult {
  isValid: boolean
  message?: string
}

export type Validator = (value: any) => ValidationResult | boolean

export interface EditableComponent {
  save: () => void
  cancel: () => void
  getValue: () => any
  validate: () => ValidationResult
}