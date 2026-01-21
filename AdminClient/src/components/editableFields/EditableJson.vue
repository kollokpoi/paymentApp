<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label }}</dt>
    <dd
      v-if="!localIsEditing"
      class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded whitespace-pre-wrap break-words"
      @dblclick="startEditing"
    >
      {{ displayValue }}
    </dd>
    <div v-else class="edit-mode">
      <TextareaPrime
        v-model="localValue"
        class="w-full border rounded px-2 py-1 font-mono text-sm"
        :placeholder="placeholder"
        :rows="rows"
        :spellcheck="false"
        :class="{ 'border-red-500': !isValidJson && hasValidationError, 'border-green-500': isValidJson && localValue.trim() !== '' }"
      />
      <div class="mt-2">
        <div v-if="errorMessage" class="text-red-500 text-sm">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { type EditableComponentExpose, type EditableJsonProps, type ValidationResult } from '@/types/editable'

const props = withDefaults(defineProps<EditableJsonProps>(), {
  placeholder: 'Введите JSON...',
  required: false,
  rows: 6,
  showFormatButton: false,
  validators: () => []
})

const emit = defineEmits([
  'update:value',
  'edit-start',
  'validation-change'
])

const localIsEditing = ref(false)
const localValue = ref(JSON.stringify(props.value))
const errorMessage = ref('')
const hasValidationError = ref(false)

const displayValue = computed(() => {
  if (!localValue.value|| localValue.value.trim() === '') {
    return '—'
  }
  
  try {
    const parsed = JSON.parse(localValue.value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return localValue.value
  }
})

const isValidJson = computed(() => {
  if (!localValue.value || localValue.value.trim() === '') {
    return true
  }
  
  try {
    JSON.parse(localValue.value)
    return true
  } catch {
    return false
  }
})

const startEditing = () => {
  localValue.value = JSON.stringify(props.value) || ''
  errorMessage.value = ''
  hasValidationError.value = false
  localIsEditing.value = true
  emit('edit-start')
}

const cancel = () => {
  localIsEditing.value = false
  localValue.value = JSON.stringify(props.value) || ''
  errorMessage.value = ''
  hasValidationError.value = false
}

const validate = (): ValidationResult => {
  errorMessage.value = ''
  hasValidationError.value = false
  
  if (props.required && (!localValue.value || localValue.value.trim() === '')) {
    const result = { isValid: false, message: 'Поле обязательно для заполнения' }
    errorMessage.value = result.message
    hasValidationError.value = true
    return result
  }

  if (!localValue.value || localValue.value.trim() === '') {
    return { isValid: true }
  }

  // Проверка JSON
  if (!isValidJson.value) {
    const result = { isValid: false, message: 'Некорректный JSON формат' }
    errorMessage.value = result.message
    hasValidationError.value = true
    return result
  }

  for (const validator of props.validators) {
    const result = validator(localValue.value)
    if (!result.isValid) {
      errorMessage.value = result.message || 'Ошибка валидации'
      hasValidationError.value = true
      return result
    }
  }

  return { isValid: true }
}

watch(() => props.isEditing, (newVal) => {
  if (!newVal && localIsEditing.value) {
    localValue.value = JSON.stringify(props.value) || ''
  }
  localIsEditing.value = newVal
})

watch(localValue, () => {
  const validation = validate()
  emit('validation-change', validation)
  
  if (validation.isValid) {
    const parsedValue = localValue.value? JSON.parse(localValue.value) : undefined
    emit('update:value', parsedValue)
  }
})

defineExpose<EditableComponentExpose>({
  cancel,
  getValue: () => localValue.value,
  validate
})
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
.break-words {
  word-break: break-word;
}
</style>