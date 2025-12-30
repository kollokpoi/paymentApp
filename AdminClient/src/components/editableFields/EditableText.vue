<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label }}</dt>
    <dd
      v-if="!localIsEditing"
      class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded"
      @dblclick="startEditing"
    >
      {{ displayValue }}
    </dd>
    <div v-else class="edit-mode">
      <input
        v-model="localValue"
        :type="inputType"
        class="w-full border rounded px-2 py-1"
        :class="{ 'border-red-500': !!errorMessage }"
        ref="inputRef"
        @keyup.enter="handleEnter"
        @blur="handleBlur"
      />
      <div v-if="errorMessage" class="text-red-500 text-sm mt-1">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { Validator, ValidationResult } from '@/types/editable/EditableBase'

interface Props {
  modelValue: string | null
  label: string
  inputType?: string
  isEditing?: boolean
  validators?: Validator[]
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  inputType: 'text',
  isEditing: false,
  validators: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string|null]
  'edit-start': []
  'validation-change': [result: ValidationResult]
}>()

const localValue = ref(props.modelValue)
const originalValue = ref(props.modelValue)
const localIsEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')

const displayValue = computed(() => {
  if (!props.modelValue || props.modelValue.trim() === '') return '—'
  return props.modelValue
})
const validate = (value: string | null = localValue.value): ValidationResult => {
  if (props.validators.length === 0) {
    return { isValid: true }
  }

  for (const validator of props.validators) {
    const result = validator(value)

    if (typeof result === 'boolean') {
      if (!result) {
        return { isValid: false, message: 'Неверное значение' }
      }
    } else {
      if (!result.isValid) {
        return result
      }
    }
  }

  return { isValid: true }
}

const startEditing = () => {
  originalValue.value = props.modelValue
  localValue.value = props.modelValue
  errorMessage.value = ''
  localIsEditing.value = true
  emit('edit-start')

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()
    }
  })
}

const handleEnter = () => {
  const validation = validate()
  if (validation.isValid) {
    save()
  } else {
    errorMessage.value = validation.message || 'Неверное значение'
  }
}

const handleBlur = () => {}

const save = () => {
  const validation = validate()
  if (!validation.isValid) {
    errorMessage.value = validation.message || 'Неверное значение'
    return
  }

  emit('update:modelValue', localValue.value)
  localIsEditing.value = false
  errorMessage.value = ''
}

const cancel = () => {
  emit('update:modelValue', originalValue.value)
  localIsEditing.value = false
  errorMessage.value = ''
}

watch(localValue, (newValue) => {
  const validation = validate(newValue)
  emit('validation-change', validation)
  errorMessage.value = validation.isValid ? '' : validation.message || ''
})

watch(
  () => props.isEditing,
  (newVal) => {
    localIsEditing.value = newVal
    if (newVal === false && localIsEditing.value) {
      cancel()
    }
  },
)

defineExpose({
  save,
  cancel,
  getValue: () => localValue.value,
  validate: () => validate(),
})
</script>
