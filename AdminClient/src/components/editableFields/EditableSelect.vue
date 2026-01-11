<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label }}</dt>
    <dd
      v-if="!localIsEditing"
      class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center"
      @dblclick="startEditing"
    >
      <span>{{ displayText }}</span>
      <i class="pi pi-chevron-down ml-2 text-xs text-gray-400"></i>
    </dd>
    <div v-else class="edit-mode">
      <SelectPrime
        v-model="localValue"
        :options="items"
        optionLabel="label"
        optionValue="value"
        :placeholder="placeholder || 'Выберите...'"
        :class="{ 'p-invalid': hasError }"
        class="w-full"
        @change="onChange"
        @blur="onBlur"
      />
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  EditableSelect,
  ValidationResult
} from '@/types/editable'

const props = defineProps<EditableSelect>()

const emit = defineEmits<{
  'update:value': [value: string | null]
  'edit-start': []
}>()

const localIsEditing = ref(false)
const localValue = ref<string | null>(props.value as string | null)
const originalValue = ref<string | null>(props.value as string | null)
const isTouched = ref(false)

const displayText = computed(() => {
  const item = props.items.find(item => item.value === props.value)
  return item?.label || props.placeholder || '—'
})

const hasError = computed(() => {
  if (!isTouched.value) return false
  return !!errorMessage.value
})

const errorMessage = computed(() => {
  if (!isTouched.value) return ''

  if (props.required && !localValue.value) {
    return 'Это поле обязательно'
  }

  if (props.validators && props.validators.length > 0) {
    for (const validator of props.validators) {
      const result = validator(localValue.value)
      if (!result.isValid) {
        return result.message
      }
    }
  }

  return ''
})

const startEditing = () => {
  originalValue.value = props.value as string | null
  localValue.value = props.value as string | null
  isTouched.value = false
  localIsEditing.value = true
  emit('edit-start')
}

const onChange = () => {
  isTouched.value = true
  emit('update:value', localValue.value)
}

const onBlur = () => {
  isTouched.value = true
}

const cancel = () => {
  localValue.value = originalValue.value
  localIsEditing.value = false
  isTouched.value = false
}

const getValue = (): string | null => {
  return localValue.value
}

const validate = (): ValidationResult => {
  isTouched.value = true

  if (props.required && !localValue.value) {
    return {
      isValid: false,
      message: 'Это поле обязательно'
    }
  }

  if (props.validators && props.validators.length > 0) {
    for (const validator of props.validators) {
      const result = validator(localValue.value)
      if (!result.isValid) {
        return result
      }
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

watch(() => props.isEditing, (newVal) => {
  if (!newVal && localIsEditing.value) {
    cancel()
  }
  localIsEditing.value = newVal
})

watch(() => props.value, (newVal) => {
  if (!localIsEditing.value) {
    localValue.value = newVal as string | null
  }
})

defineExpose({
  cancel,
  getValue,
  validate
})
</script>

<style scoped>

:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-dropdown .p-dropdown-label) {
  padding: 0.5rem;
}

:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item) {
  padding: 0.5rem 1rem;
}
</style>
