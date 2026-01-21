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
      <InputNumber
        v-model="localValue"
        class="w-full rounded py-1"
        :min="min"
        :max="max"
        :step="step"
        :placeholder="placeholder"
        />
      <div v-if="errorMessage" class="text-red-500 text-sm mt-1">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {type EditableComponentExpose, type EditableNumberProps, type ValidationResult } from '@/types/editable'

const props = withDefaults(defineProps<EditableNumberProps>(), {
  step:1,
  required: false,
  validators: () => []
})

const emit = defineEmits([
  'update:value',
  'edit-start',
  'validation-change'
])

const localIsEditing = ref(false)
const localValue = ref(props.value)
const errorMessage = ref('')

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '—'
  }
  return props.value.toString()
})

const startEditing = () => {
  localValue.value = props.value
  errorMessage.value = ''
  localIsEditing.value = true
  emit('edit-start')
}

const cancel = () => {
  localIsEditing.value = false
  localValue.value = props.value
  errorMessage.value = ''
}

const validate = (): ValidationResult => {
  errorMessage.value=''
  if (props.required && !localValue.value) {
    const result = { isValid: false, message: 'Поле обязательно для заполнения' }
    errorMessage.value = result.message
    return result
  }

  for (const validator of props.validators) {
    const result = validator(localValue.value)
    if(!result.isValid){
      errorMessage.value = result.message || 'ошибка валидации'
      return result
    }
  }

  if (props.max && localValue.value > props.max) {
    return {
      isValid: false,
      message: `Максимальное значение: ${props.max}`
    }
  }

  return { isValid: true }
}

watch(()=>props.isEditing, (newVal) => {
  if(!newVal && localIsEditing.value){
    localValue.value = props.value
  }
  localIsEditing.value = newVal
})

watch(localValue, () => {
  const validation = validate()
  emit('validation-change', validation)
  emit('update:value',localValue.value)
})

defineExpose<EditableComponentExpose>({
  cancel,
  getValue: () => localValue.value,
  validate
})
</script>
