<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label}}<span v-if="props.required && isEditing" style="color: red;">*</span></dt>
    <dd
      v-if="!localIsEditing"
      class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center"
      @dblclick="startEditing"
    >
      <i class="pi pi-calendar mr-2 text-gray-400"></i>
      <span>{{ displayText }}</span>
    </dd>
    <div v-else class="edit-mode">
      <DatePicker
        v-model="localValue"
        :show-icon="true"
        :date-format="dateFormat"
        :show-time="showTime"
        :hour-format="showTime ? '24' : undefined"
        :class="{ 'p-invalid': hasError }"
        :placeholder="placeholder || 'Выберите дату'"
        :min-date="minDate"
        :max-date="maxDate"
        input-class="w-full"
        @date-select="onChange"
        @blur="onBlur"
      />
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import type {
  EditableDateProps,
  ValidationResult
} from '@/types/editable'

const props = withDefaults(defineProps<EditableDateProps>(), {
  showTime: false,
  dateFormat: 'dd.mm.yy',
  placeholder: 'Выберите дату',
  required: false,
  validators: () => []
})

const emit = defineEmits<{
  'update:value': [value: Date | null]
  'edit-start': []
}>()

const localIsEditing = ref(props.isEditing)
const localValue = ref<Date | null>(props.value ? new Date(props.value) : null)
const originalValue = ref<Date | null>(props.value ? new Date(props.value) : null)
const isTouched = ref(false)

const parseDate = (date: Date | string | null): Date | null => {
  if (!date) return null
  if (date instanceof Date) return date
  try {
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

const displayText = computed(() => {
  if (!props.value) return props.placeholder || '—'

  const date = parseDate(props.value)
  if (!date) return '—'

  if (props.showTime) {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return date.toLocaleDateString('ru-RU')
})

const hasError = computed(() => {
  if (!isTouched.value) return false
  return !!errorMessage.value
})

const errorMessage = computed(() => {
  if (!isTouched.value) return ''

  if (props.required && !localValue.value) {
    return 'Дата обязательна'
  }

  if (localValue.value && props.validators && props.validators.length > 0) {
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
  originalValue.value = parseDate(props.value)
  localValue.value = parseDate(props.value)
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

const getValue = (): Date | null => {
  return localValue.value
}

const validate = (): ValidationResult => {
  isTouched.value = true

  if (props.required && !localValue.value) {
    return {
      isValid: false,
      message: 'Дата обязательна'
    }
  }

  if (localValue.value && props.validators && props.validators.length > 0) {
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
    localValue.value = parseDate(newVal)
  }
})

watch(localValue, (newVal) => {
  if (localIsEditing.value) {
    emit('update:value', newVal)
  }
})

defineExpose({
  cancel,
  getValue,
  validate
})
</script>

<style scoped>

:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-calendar .p-inputtext) {
  width: 100%;
}
</style>
