<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label }}</dt>

    <!-- Режим просмотра -->
    <dd v-if="!localIsEditing" class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded" @dblclick="startEditing">
      <pre class="text-sm overflow-auto max-h-32 whitespace-pre-wrap wrap-break-words">
{{ displayValue }}
      </pre>
    </dd>

    <!-- Режим редактирования -->
    <div v-else class="edit-mode space-y-4">
      <div v-if="fields.length === 0" class="text-gray-400 text-sm p-3 bg-gray-50 rounded">
        {{ emptyMessage }}
      </div>

      <div v-else>
        <div v-for="field in fields" :key="field.fullPath" class="limit-field">
          <div class="flex items-center gap-2 mb-1">
            <label class="text-sm font-medium">
              {{ field.label }}
              <span v-if="field.required" class="text-red-500">*</span>
            </label>
            <BadgePrime v-if="field.type" :value="field.type" severity="info" size="small" />
            <BadgePrime v-if="field.defaultValue" :value="`По умолчанию: ${field.defaultValue}`" severity="secondary"
              size="small" />
          </div>

          <!-- Вложенные объекты -->
          <div v-if="field.isObject" class="ml-4 pl-4 border-l-2 border-gray-200">
            <div v-for="childField in field.children || []" :key="childField.fullPath" class="mt-3">
              <div class="flex items-center gap-2 mb-1">
                <label class="text-sm font-medium">
                  {{ childField.label }}
                  <span v-if="childField.required" class="text-red-500">*</span>
                </label>
                <BadgePrime v-if="childField.type" :value="childField.type" severity="info" size="small" />
                <BadgePrime v-if="childField.defaultValue" :value="`По умолчанию: ${childField.defaultValue}`"
                  severity="secondary" size="small" />
              </div>

              <!-- Поле ввода для вложенного поля -->
              <component :is="getInputComponent(childField)" v-model="localData[childField.fullPath]"
                :placeholder="`Введите ${childField.label.toLowerCase()}`" class="w-full" :min="childField.min"
                :max="childField.max" :step="childField.step" :options="childField.options" optionLabel="label"
                optionValue="value" :invalid="isFieldInvalid(childField)" />

              <small v-if="childField.description" class="text-gray-500 text-xs">
                {{ childField.description }}
              </small>
              <small v-if="isFieldInvalid(childField)" class="text-red-500 text-xs">
                {{ getValidationMessage(childField) }}
              </small>
            </div>
          </div>

          <!-- Поле ввода для обычного поля или объекта (если нет детей) -->
          <template v-else>
            <component :is="getInputComponent(field)" v-model="localData[field.fullPath]"
              :placeholder="`Введите ${field.label.toLowerCase()}`" class="w-full" :min="field.min" :max="field.max"
              :step="field.step" :options="field.options" optionLabel="label" optionValue="value"
              :invalid="isFieldInvalid(field)" />

            <small v-if="field.description" class="text-gray-500 text-xs">
              {{ field.description }}
            </small>
            <small v-if="isFieldInvalid(field)" class="text-red-500 text-xs">
              {{ getValidationMessage(field) }}
            </small>
          </template>
        </div>
      </div>

      <!-- Предварительный просмотр (отображается всегда в режиме редактирования) -->
      <div v-if="showPreview && previewData" class="mt-4">
        <h4 class="font-medium mb-2">Предварительный просмотр:</h4>
        <pre class="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
    {{ previewData }}
  </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue'
import type { Metadata } from '@/types/dto'
import type { LimitField } from '@/types/editable'
import { PeriodType } from '@/types/api/responses'

interface Props {
  label: string
  settings: Metadata
  modelValue?: Metadata
  emptyMessage?: string
  showPreview?: boolean
  isEditing?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Лимиты',
  emptyMessage: 'Настройки не найдены',
  showPreview: true,
  isEditing: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Metadata]
  'update:value': [value: Metadata]
  'edit-start': []
  'validation-change': [isValid: boolean]
}>()

const handleValueUpdate = (value: Metadata) => {
  emit('update:modelValue', value)
  emit('update:value', value)
}

const { settings, modelValue, isEditing } = toRefs(props)

// Локальные данные для формы
const localData = ref<Record<string, any>>({})
// Режим редактирования
const localIsEditing = ref(props.isEditing)
// Исходное значение (для отмены)
const originalValue = ref<Metadata>({})

// Поля для отображения
const fields = ref<LimitField[]>([])

const periodOptions = [
  { value: PeriodType.DAY, label: 'День' },
  { value: PeriodType.WEEK, label: 'Неделя' },
  { value: PeriodType.MONTH, label: 'Месяц' },
  { value: PeriodType.YEAR, label: 'Год' }
]

// Значение для отображения в режиме просмотра
const displayValue = computed(() => {
  if (!currentValue.value || Object.keys(currentValue.value).length === 0) {
    return '—'
  }
  return JSON.stringify(currentValue.value, null, 2)
})

// Текущее значение (из модели или из локальных данных)
const currentValue = computed(() => {
  return modelValue.value || buildLimitsObject()
})

// Парсинг структуры настроек с учетом текущих значений
const parseLimitsStructure = (settings: Metadata, currentValues: Metadata = {}, parentPath = ''): LimitField[] => {
  const fields: LimitField[] = []

  if (!settings || typeof settings !== 'object') return fields

  for (const [key, value] of Object.entries(settings)) {
    const fullPath = parentPath ? `${parentPath}.${key}` : key

    // Получаем текущее значение из переданных данных
    const currentValue = getValueByPath(currentValues, fullPath)

    let fieldType: LimitField['type'] = typeof value as any
    if (Array.isArray(value)) {
      fieldType = 'array'
    } else if (key === 'period') {
      fieldType = 'enum'
    } else if (value === null) {
      fieldType = 'string'
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      fieldType = 'object'
    }

    const field: LimitField = {
      key,
      fullPath,
      label: formatLabel(key),
      type: fieldType,
      required: false,
      defaultValue: fieldType !== 'object' && fieldType !== 'array' ? value : undefined,
      isObject: fieldType === 'object'
    }

    if (fieldType === 'object') {
      field.children = parseLimitsStructure(value, currentValues, fullPath)
    }
    if (fieldType === 'array') {
      field.description = `Массив из ${value.length} элементов`
    }
    if (fieldType === 'enum') {
      field.options = periodOptions
    }

    fields.push(field)

    // Устанавливаем текущее значение в локальные данные
    if (!field.isObject) {
      localData.value[fullPath] = currentValue
    }
  }

  return fields
}

// Вспомогательная функция для получения значения по пути
const getValueByPath = (obj: Metadata, path: string): any => {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (!part) continue
    if (current === null || typeof current !== 'object' || !(part in current)) {
      return undefined
    }
    current = current[part]
  }

  return current
}

// Форматирование label
const formatLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Получение компонента для типа поля
const getInputComponent = (field: LimitField) => {
  switch (field.type) {
    case 'number':
      return 'InputNumber'
    case 'boolean':
      return 'CheckboxPrime'
    case 'array':
      return 'TextareaPrime'
    case 'enum':
      return 'SelectPrime'
    default:
      return 'InputText'
  }
}

// Валидация поля
const isFieldInvalid = (field: LimitField): boolean => {
  const value = localData.value[field.fullPath]

  if (field.required && (value === undefined || value === null || value === '')) {
    return true
  }

  if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
    const numValue = Number(value)
    if (field.min !== undefined && numValue < field.min) return true
    if (field.max !== undefined && numValue > field.max) return true
  }

  return false
}

// Сообщение об ошибке валидации
const getValidationMessage = (field: LimitField): string => {
  const value = localData.value[field.fullPath]

  if (field.required && (value === undefined || value === null || value === '')) {
    return 'Поле обязательно для заполнения'
  }

  if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
    const numValue = Number(value)
    if (field.min !== undefined && numValue < field.min) {
      return `Значение должно быть не меньше ${field.min}`
    }
    if (field.max !== undefined && numValue > field.max) {
      return `Значение должно быть не больше ${field.max}`
    }
  }

  return 'Некорректное значение'
}

// Построение объекта из данных формы
const buildLimitsObject = (): Metadata => {
  const result: Metadata = {}

  // Создаем структуру объектов
  const createStructure = (fields: LimitField[], parentObj: Metadata = result) => {
    for (const field of fields) {
      if (field.isObject && field.children) {
        const parts = field.fullPath.split('.')
        let current = parentObj

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          if (!part) continue

          if (i === parts.length - 1) {
            if (!current[part] || typeof current[part] !== 'object') {
              current[part] = {}
            }
          } else {
            if (!current[part] || typeof current[part] !== 'object') {
              current[part] = {}
            }
            current = current[part]
          }
        }

        createStructure(field.children, result)
      }
    }
  }

  createStructure(fields.value)

  const setValue = (obj: Metadata, path: string, value: any) => {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue

      if (i === parts.length - 1) {
        const field = fields.value.find(f => f.fullPath === path) ||
          fields.value.flatMap(f => f.children || []).find(f => f.fullPath === path)

        if (value === '' || value === undefined || value === null) {
          if (field?.type === 'array')
            current[part] = []
          else
            current[part] = null
        } else if (field?.type === 'number') {
          current[part] = Number(value)
        } else if (field?.type === 'boolean') {
          current[part] = Boolean(value)
        } else if (field?.type === 'array') {
          if (Array.isArray(value)) {
            current[part] = value
          } else {
            const array = value.split(',') || []
            current[part] = array
          }
        } else {
          current[part] = value
        }
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }

  // Устанавливаем значения из формы
  for (const [path, value] of Object.entries(localData.value)) {
    setValue(result, path, value)
  }

  // Устанавливаем значения по умолчанию
  const setDefaults = (fieldsList: LimitField[]) => {
    for (const field of fieldsList) {
      if (field.children) {
        setDefaults(field.children)
      } else {
        if (!(field.fullPath in localData.value) && field.defaultValue !== undefined) {
          setValue(result, field.fullPath, field.defaultValue)
        }
      }
    }
  }

  setDefaults(fields.value)

  return result
}

// Предварительный просмотр
const previewData = computed(() => {
  if (localIsEditing.value) {
    return JSON.stringify(buildLimitsObject(), null, 2)
  }
  return displayValue.value
})

// Проверка валидности формы
const isFormValid = computed(() => {
  if (!localIsEditing.value) return true
  return !fields.value.some(field => isFieldInvalid(field))
})

// Инициализация полей
const initializeFields = () => {
  if (!settings.value || typeof settings.value !== 'object') {
    fields.value = []
    localData.value = {}
    return
  }

  // Сохраняем текущие значения для отмены
  originalValue.value = { ...(modelValue.value || {}) }

  // Парсим структуру с учетом текущих значений
  const parsedFields = parseLimitsStructure(settings.value, modelValue.value || {})
  fields.value = parsedFields

  // Инициализируем данные значениями по умолчанию
  parsedFields.forEach(field => {
    if (field.defaultValue !== undefined && !(field.fullPath in localData.value)) {
      localData.value[field.fullPath] = field.defaultValue
    }
  })
}

// Начало редактирования
const startEditing = () => {
  if (props.required && (!modelValue.value || Object.keys(modelValue.value).length === 0)) {
    // Если поле обязательно и пустое, инициализируем пустую структуру
    initializeFields()
  }
  originalValue.value = { ...(modelValue.value || {}) }
  localIsEditing.value = true
  emit('edit-start')
}

// Отмена редактирования
const cancel = () => {
  localIsEditing.value = false
  localData.value = {}
  initializeFields()
  handleValueUpdate(originalValue.value)
}


const save = () => {
  if (!isFormValid.value) return false

  const result = buildLimitsObject()
  localIsEditing.value = false
  handleValueUpdate(result)
  return true
}

// Отслеживание внешнего управления режимом редактирования
watch(isEditing, (newVal) => {
  if (!newVal && localIsEditing.value) {
    cancel()
  }
  localIsEditing.value = newVal
})

// Отслеживание изменений в данных формы
watch(localData, () => {
  if (localIsEditing.value) {
    const result = buildLimitsObject()
    handleValueUpdate(result)
    emit('validation-change', isFormValid.value)
  }
}, { deep: true })

// Инициализация при изменении настроек или начальных значений
watch([settings, modelValue], initializeFields, { immediate: true })

// Методы для работы с компонентом извне
const getValue = (): Metadata => {
  return buildLimitsObject()
}

const validate = (): boolean => {
  return isFormValid.value
}

const reset = () => {
  initializeFields()
}

defineExpose({
  cancel,
  save,
  getValue,
  validate,
  reset,
  startEditing
})
</script>

<style scoped>
.editable-field {
  margin-bottom: 1rem;
}

.limit-field {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.edit-mode {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>