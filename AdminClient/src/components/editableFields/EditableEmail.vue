<template>
  <EditableText
    ref="editableRef"
    v-bind="props"
    @update:value="$emit('update:value', $event)"
    @edit-start="$emit('edit-start')"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EditableText from './EditableText.vue'
import type { EditableTextProps, EditableComponentExpose, FieldTypes } from '@/types/editable'


interface EditableEmailProps extends EditableTextProps {
  type: FieldTypes.Email
}

const props = defineProps<EditableEmailProps>()
defineEmits<{
  'update:value': [value: string]
  'edit-start': []
}>()

const editableRef = ref<EditableComponentExpose>()

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
</script>
