<template>
  <EditableText
    ref="editableRef"
    v-model="emailValue"
    :label="label"
    input-type="email"
    :is-editing="isEditing"
    :validators="emailValidators"
    :placeholder="placeholder"
    @update:modelValue="onValueChange"
    @edit-start="$emit('edit-start')"
    @validation-change="$emit('validation-change', $event)"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EditableText from './EditableText.vue'
import type { Validator, ValidationResult } from '@/types/editable/EditableBase'

interface Props {
  modelValue: string
  label?: string
  isEditing?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Email',
  placeholder: 'email@example.com'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'edit-start': []
  'validation-change': [result: ValidationResult]
}>()

const emailValue = ref(props.modelValue)
const editableRef = ref<typeof EditableText | null>(null)

const emailValidators = computed<Validator[]>(() => [
  (value: string) => {
    if (!value || value.trim() === '') {
      return { isValid: true } // Пустое значение разрешено
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { isValid: false, message: 'Введите корректный email адрес' }
    }
    
    return { isValid: true }
  },
  (value: string) => {
    if (value && value.length > 254) {
      return { isValid: false, message: 'Email слишком длинный' }
    }
    return { isValid: true }
  }
])

const onValueChange = (value: string) => {
  emailValue.value = value
  emit('update:modelValue', value)
}

const save = () => editableRef.value?.save()
const cancel = () => editableRef.value?.cancel()
const getValue = () => editableRef.value?.getValue()
const validate = () => editableRef.value?.validate() || { isValid: true }

defineExpose({
  save,
  cancel,
  getValue,
  validate
})

watch(() => props.modelValue, (newVal) => {
  emailValue.value = newVal
})
</script>