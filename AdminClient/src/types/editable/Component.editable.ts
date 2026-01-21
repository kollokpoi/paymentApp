import type { FieldTypes, ValidationResult, Validator } from "."
import type { Metadata } from "../dto"

export interface EditableComponentExpose {

  cancel: () => void
  getValue: () => string | boolean | number | Date | null | Metadata | undefined
  validate: () => ValidationResult
}

export interface EditableComponentProps {
  label: string
  value: string | Date | number | boolean | null | Metadata | undefined
  isEditing: boolean
  validators?: Validator[]
  required?: boolean
  placeholder?: string
}

export interface EditableTextProps extends EditableComponentProps {
  type: FieldTypes.Text | FieldTypes.Email | FieldTypes.TextArea | FieldTypes.Number
  maxLength?: number
  value: string | number
}

export interface EditableEmailProps extends EditableComponentProps {
  type: FieldTypes.Email
  value: string | null
}

export interface EditableNumberProps extends EditableComponentProps {
  value: number
  min?: number
  max?: number
  step?: number
}

export interface EditableJsonProps extends EditableComponentProps {
  value: Metadata | undefined
  rows?: number
  autoResize?: boolean
}

export interface EditableBooleanProps extends EditableComponentProps {
  trueLabel?: string
  falseLabel?: string
}

export interface EditableDateProps extends EditableComponentProps {
  showTime?: boolean
  dateFormat?: string
  value: Date | string
  minDate?: Date
  maxDate?: Date
}

export interface EditableSelect extends EditableComponentProps {
  items: Array<{ label: string, value: string }>
}

export interface LimitField {
  key: string
  fullPath: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  description?: string
  required?: boolean
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ label: string, value: any }>
  isObject: boolean
  children?: LimitField[]
  parent?: string
}