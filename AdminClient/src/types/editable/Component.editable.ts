import type { FieldTypes, ValidationResult, Validator } from "."
import type { Metadata } from "../dto"

export interface EditableComponentExpose {
  
  cancel: () => void
  getValue: () => string|boolean|number|Date| null |  Metadata
  validate: () => ValidationResult
}

export interface EditableComponentProps{
  label: string
  value: string | Date | number | boolean | null |  Metadata
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

export interface EditableNumberProps extends EditableComponentProps {
  value: number
  min?: number
  max?: number
  step?: number
}

export interface EditableJsonProps extends EditableComponentProps {
  value: Record<string, any> | string
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
  value:Date|string
  minDate?: Date
  maxDate?: Date
}

export interface EditableSelect extends EditableComponentProps {
  items: Array<{label:string, value:string}>
}
