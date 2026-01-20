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
      <TextareaPrime
        v-model="jsonString"
        class="w-full font-mono text-sm border rounded px-2 py-1"
        :placeholder="placeholder"
        :rows="rows"
        :autoResize="autoResize"
        @input="handleJsonInput"
      />
      <small class="text-gray-500 text-xs">
        {{ placeholder || 'Введите данные в формате JSON' }}
      </small>
      <div v-if="errorMessage" class="text-red-500 text-sm mt-1">
        {{ errorMessage }}
      </div>
      
      <div v-if="Object.keys(parsedValue).length > 0" class="mt-2">
        <h4 class="font-medium mb-2">Предварительный просмотр:</h4>
        <pre class="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
{{ JSON.stringify(parsedValue, null, 2) }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FieldTypes, type EditableComponentExpose, type EditableJsonProps, type ValidationResult } from '@/types/editable'
import type { Metadata } from '@/types/dto';

const props = withDefaults(defineProps<EditableJsonProps>(), {
  placeholder: '{}',
  rows: 6,
  autoResize: true,
  required: false,
  isEditing: false,
  validators: () => []
})

const emit = defineEmits([
  'update:value',
  'edit-start',
  'validation-change'
])

const localIsEditing = ref(props.isEditing)
const jsonString = ref('')
const parsedValue = ref<Metadata>({})
const errorMessage = ref('')

watch(() => props.value, (newValue) => {
  if (typeof newValue === 'string') {
    jsonString.value = newValue
    try {
      parsedValue.value = newValue ? JSON.parse(newValue) : {}
    } catch {
      parsedValue.value = {}
    }
  } else {
    jsonString.value = JSON.stringify(newValue, null, 2)
    parsedValue.value = newValue || {}
  }
}, { immediate: true })

const displayValue = computed(() => {
  if (!props.value || Object.keys(props.value).length === 0) {
    return '—'
  }
  
  if (typeof props.value === 'string') {
    try {
      const parsed = JSON.parse(props.value)
      return Object.keys(parsed).length > 0 ? 'JSON объект' : '—'
    } catch {
      return 'Некорректный JSON'
    }
  }
  
  return Object.keys(props.value).length > 0 ? 'JSON объект' : '—'
})

const startEditing = () => {
  jsonString.value = typeof props.value === 'string' 
    ? props.value 
    : JSON.stringify(props.value || {}, null, 2)
  parsedValue.value = typeof props.value === 'string'
    ? (props.value ? JSON.parse(props.value) : {})
    : props.value || {}
  errorMessage.value = ''
  localIsEditing.value = true
  emit('edit-start')
}

const cancel = () => {
  localIsEditing.value = false
  jsonString.value = typeof props.value === 'string'
    ? props.value
    : JSON.stringify(props.value || {}, null, 2)
  parsedValue.value = typeof props.value === 'string'
    ? (props.value ? JSON.parse(props.value) : {})
    : props.value || {}
  errorMessage.value = ''
}

const handleJsonInput = () => {
  errorMessage.value = ''
  
  if (!jsonString.value.trim()) {
    parsedValue.value = {}
    emit('update:value', {})
    emit('validation-change', { isValid: true })
    return
  }

  try {
    const parsed = JSON.parse(jsonString.value)
    parsedValue.value = parsed
    emit('update:value', parsed)
    
    // Валидация
    const validation = validate()
    emit('validation-change', validation)
  } catch (err) {
    errorMessage.value = 'Некорректный JSON формат'
    parsedValue.value = {}
    emit('update:value', {})
    emit('validation-change', { 
      isValid: false, 
      message: 'Некорректный JSON формат' 
    })
  }
}

const validate = (): ValidationResult => {
  errorMessage.value = ''
  
  if (props.required && (!jsonString.value || jsonString.value.trim() === '')) {
    const result = { isValid: false, message: 'Поле обязательно для заполнения' }
    errorMessage.value = result.message
    return result
  }

  try {
    const parsed = jsonString.value ? JSON.parse(jsonString.value) : {}
    
    for (const validator of props.validators) {
      const result = validator(parsed)
      if (!result.isValid) {
        errorMessage.value = result.message || 'Ошибка валидации JSON'
        return result
      }
    }
    
    return { isValid: true }
  } catch (err) {
    return {
      isValid: false,
      message: 'Некорректный JSON формат'
    }
  }
}

watch(() => props.isEditing, (newVal) => {
  if (!newVal && localIsEditing.value) {
    cancel()
  }
  localIsEditing.value = newVal
})

defineExpose<EditableComponentExpose>({
  cancel,
  getValue: () => parsedValue.value,
  validate
})
</script>