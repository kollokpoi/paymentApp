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
      <select v-model="localValue" class="w-full border rounded px-2 py-1">
        <option :value="true">Активен</option>
        <option :value="false">Не активен</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  label: string
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit-start': []
}>()

const localValue = ref(props.modelValue)
const originalValue = ref(props.modelValue)
const localIsEditing = ref(false)

const displayValue = computed(() => {
  return props.modelValue ? 'Активен' : 'Не активен'
})

const startEditing = () => {
  originalValue.value = props.modelValue
  localValue.value = props.modelValue
  localIsEditing.value = true
  emit('edit-start')
}

const save = () => {
  emit('update:modelValue', localValue.value)
  localIsEditing.value = false
}

const cancel = () => {
  emit('update:modelValue', originalValue.value)
  localIsEditing.value = false
}

watch(() => props.isEditing, (newVal) => {
  if (newVal === false && localIsEditing.value) {
    cancel()
  }
})

defineExpose({
  save,
  cancel,
  getValue: () => localValue.value
})
</script>