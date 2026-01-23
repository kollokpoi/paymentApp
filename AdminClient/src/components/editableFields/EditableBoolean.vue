<template>
  <div class="editable-field">
    <dt class="text-sm text-gray-500">{{ label }}<span v-if="props.required && isEditing" style="color: red;">*</span></dt>
    <dd v-if="!localIsEditing" class="font-medium cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center"
      @dblclick="startEditing">
      <CheckboxPrime v-model="displayValueModel" :binary="true" disabled class="mr-2" />
      <span>{{ displayText }}</span>
    </dd>
    <div v-else class="edit-mode flex items-center gap-4">
      <div class="flex items-center gap-2">
        <CheckboxPrime v-model="localValue" :binary="true" inputId="editable-checkbox" />
        <label for="editable-checkbox" class="cursor-pointer ml-2">
          {{ localValue ? trueLabel : falseLabel }}
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { type EditableBooleanProps } from '@/types/editable'

const props = withDefaults(defineProps<EditableBooleanProps>(), {
  trueLabel: 'Активен',
  falseLabel: 'Не активен',
  required: false,
  validators: () => []
})

const emit = defineEmits<{
  'update:value': [value: boolean]
  'edit-start': []
}>()

const localIsEditing = ref(props.isEditing)
const localValue = ref(props.value as unknown as boolean)
const originalValue = ref(props.value as unknown as boolean)

const displayValueModel = computed(() => props.value as unknown as boolean)

const displayText = computed(() => {
  if (props.value === true) return props.trueLabel
  if (props.value === false) return props.falseLabel
  return '—'
})

const startEditing = () => {
  originalValue.value = props.value as unknown as boolean
  localValue.value = props.value as unknown as boolean
  localIsEditing.value = true
  emit('edit-start')

}

watch(() => props.isEditing, (newVal) => {
  if (!newVal && localIsEditing.value) {
    localValue.value = props.value as boolean
  }
  localIsEditing.value = newVal
})

watch(localValue, () => {
  emit('update:value', localValue.value)
})

</script>

<style scoped>
:deep(.p-checkbox) {
  width: 20px;
  height: 20px;
}

:deep(.p-checkbox .p-checkbox-box) {
  width: 20px;
  height: 20px;
}

:deep(.p-checkbox.p-variant-filled .p-checkbox-box) {
  background: white;
  border: 1px solid #d1d5db;
}
</style>
