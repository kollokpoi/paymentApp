<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/applications" class="hover:text-blue-600">Приложения</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание приложения</span>
    </div>

    <h1 class="text-2xl font-bold">Создание нового приложения</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные приложения</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Название <span class="text-red-500">*</span>
                </label>
                <InputText v-model="formData.name" placeholder="Введите название приложения" class="w-full"
                  :invalid="!formData.name" />
                <small v-if="!formData.name" class="text-red-500 text-xs">
                  Название обязательно
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Код приложения</label>
                <InputText v-model="formData.code" placeholder="Например: crm, tasks, calendar" class="w-full" />
                <small class="text-gray-500 text-xs">
                  Уникальный код для идентификации в системе
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Описание</label>
                <TextareaPrime v-model="formData.description" placeholder="Описание приложения" class="w-full" rows="3"
                  autoResize />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">
                  Версия <span class="text-red-500">*</span>
                </label>
                <InputText v-model="formData.version" placeholder="Например: 1.0.0" class="w-full"
                  :invalid="!formData.version" />
                <small v-if="!formData.version" class="text-red-500 text-xs">
                  Версия обязательна
                </small>
              </div>

              <div class="flex items-center gap-3">
                <CheckboxPrime v-model="formData.is_active" :binary="true" inputId="isActive" />
                <label for="isActive" class="font-medium">Приложение активно</label>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Ссылка на иконку</label>
                <InputText v-model="formData.icon_url" placeholder="https://example.com/icon.png" class="w-full" />
                <small class="text-gray-500 text-xs">
                  URL иконки приложения
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Порядок сортировки</label>
                <InputNumber v-model="formData.sort_order" :min="0" :max="999" :showButtons="true" class="w-full" />
                <small class="text-gray-500 text-xs">
                  Чем меньше число, тем выше в списке (0 - самый верхний)
                </small>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mb-4">Настройки (опционально)</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Настройки в формате JSON</label>
                <TextareaPrime v-model="jsonSettings" placeholder='{"apiKey": "your-key", "endpoint": "https://..."}'
                  class="w-full font-mono text-sm" rows="8" autoResize @input="handleJsonInput" />
                <small class="text-gray-500 text-xs">
                  Дополнительные настройки приложения в формате JSON
                </small>
              </div>

              <div v-if="jsonError" class="text-red-500 text-sm">
                {{ jsonError }}
              </div>

              <div v-if="Object.keys(formData.settings || {}).length > 0" class="mt-4">
                <h4 class="font-medium mb-2">Предварительный просмотр настроек:</h4>
                <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
{{ JSON.stringify(formData.settings, null, 2) }}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime label="Создать" icon="pi pi-check" :disabled="!isFormValid || creating" @click="createApplication" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { applicationService } from '@/services'
import type { CreateApplicationRequest } from '@/services/application.service'

const router = useRouter()
const toast = useToast()

const creating = ref(false)
const jsonError = ref<string | null>(null)
const jsonSettings = ref('')

const formData = reactive<CreateApplicationRequest>({
  name: '',
  code: '',
  description: '',
  version: '',
  is_active: true,
  icon_url: '',
  sort_order: 0,
  settings: {}
})

const isFormValid = computed(() => {
  return !!formData.name && !!formData.version
})

const handleJsonInput = () => {
  jsonError.value = null

  if (!jsonSettings.value.trim()) {
    formData.settings = {}
    return
  }

  try {
    const parsed = JSON.parse(jsonSettings.value)
    formData.settings = parsed
  } catch {
    jsonError.value = 'Некорректный JSON формат'
  }
}

const createApplication = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Название и версия обязательны для заполнения',
      life: 3000
    })
    return
  }

  creating.value = true

  try {
    const response = await applicationService.createApplication(formData)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Приложение создано',
        life: 3000
      })

      router.push(`/applications/${response.data.id}`)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось создать приложение',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания приложения:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать приложение',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.name || formData.description || jsonSettings.value) {
    if (!confirm('Вы уверены? Введенные данные будут потеряны.')) {
      return
    }
  }

  router.push('/applications')
}
</script>

<style scoped>
:deep(.p-inputtext:invalid) {
  border-color: #f87171;
}
</style>
