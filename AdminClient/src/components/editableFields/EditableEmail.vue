<template>
  <EditableText ref="editableRef" v-bind="props" @update:value="$emit('update:value', $event)"
    @edit-start="$emit('edit-start')" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EditableText from './EditableText.vue'
import type { EditableTextProps, EditableComponentExpose, FieldTypes } from '@/types/editable'


interface EditableEmailProps extends EditableTextProps {
  type: FieldTypes.Email
}

const props = withDefaults(defineProps<EditableTextProps>(), {
  placeholder: '',
  maxLength: 255,
  required: false,
  validators: () => []
})

defineEmits<{
  'update:value': [value: string]
  'edit-start': []
}>()

const editableRef = ref<EditableComponentExpose>()

const cancel = () => editableRef.value?.cancel()
const getValue = () => editableRef.value?.getValue()
const validate = () => editableRef.value?.validate() || { isValid: true }

defineExpose({
  cancel,
  getValue,
  validate
})
</script>
