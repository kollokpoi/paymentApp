<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/portals" class="hover:text-blue-600">Порталы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание портала</span>
    </div>

    <h1 class="text-2xl font-bold">Создание нового портала</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Данные портала</h3>

            <div>
              <label class="block text-sm font-medium mb-2">
                Домен Bitrix24 <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center">
                <InputText v-model="formData.b24_domain" placeholder="your-company" class="flex-1"
                  :invalid="!isDomainValid" @input="validateDomain" />
              </div>
              <small v-if="!isDomainValid" class="text-red-500 text-xs">
                Домен должен содержать только латинские буквы, цифры и дефисы
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Название компании <span class="text-red-500">*</span>
              </label>
              <InputText v-model="formData.company_name" placeholder="ООО Ромашка" class="w-full"
                :invalid="!formData.company_name" />
              <small v-if="!formData.company_name" class="text-red-500 text-xs">
                Название компании обязательно
              </small>
            </div>


            <div>
              <label class="block text-sm font-medium mb-2">Email администратора</label>
              <InputText v-model="formData.admin_email" placeholder="admin@company.com" type="email" class="w-full"
                :invalid="(formData.admin_email && !isEmailValid) === true" />
              <small v-if="formData.admin_email && !isEmailValid" class="text-red-500 text-xs">
                Введите корректный email
              </small>
              <small class="text-gray-500 text-xs">
                Для уведомлений и восстановления доступа
              </small>
            </div>

            <div class="flex items-center gap-3">
              <CheckboxPrime v-model="formData.is_active" :binary="true" inputId="isActive" />
              <label for="isActive" class="font-medium">Портал активен</label>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Дополнительно</h3>

            <div>
              <label class="block text-sm font-medium mb-2">Метаданные (JSON)</label>
              <TextareaPrime v-model="jsonMetadata" placeholder='{"plan": "pro", "users_count": 50, "industry": "IT"}'
                class="w-full font-mono text-sm" rows="8" autoResize @input="handleJsonInput" />
              <small class="text-gray-500 text-xs">
                Дополнительные метаданные портала в формате JSON
              </small>
              <div v-if="jsonError" class="text-red-500 text-sm mt-1">
                {{ jsonError }}
              </div>

              <div v-if="Object.keys(formData.metadata || {}).length > 0" class="mt-4">
                <h4 class="font-medium mb-2">Предварительный просмотр:</h4>
                <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
{{ JSON.stringify(formData.metadata, null, 2) }}
                </pre>
              </div>
            </div>

            <div class="pt-4 border-t">
              <h4 class="font-medium mb-2">Информация о портале</h4>
              <div class="bg-gray-50 p-3 rounded text-sm space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-500">Полный URL:</span>
                  <span class="font-mono">{{ formData.b24_domain ? `https://${formData.b24_domain}` : '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Статус:</span>
                  <TagPrime :value="formData.is_active ? 'Активен' : 'Неактивен'"
                    :severity="formData.is_active ? 'success' : 'secondary'" size="small" />
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Метаданные:</span>
                  <span>{{ Object.keys(formData.metadata || {}).length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime label="Создать" icon="pi pi-check" :disabled="!isFormValid || creating" @click="createPortal" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { portalService } from '@/services'
import type { CreatePortalRequest } from '@/services/portal.service'

const router = useRouter()
const toast = useToast()

const creating = ref(false)
const jsonError = ref<string | null>(null)
const jsonMetadata = ref('')

const formData = reactive<CreatePortalRequest>({
  b24_domain: '',
  company_name: '',
  is_active: true,
  metadata: {}
})


const isDomainValid = computed(() => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-.]*[a-zA-Z0-9]$/
  return formData.b24_domain &&
    domainRegex.test(formData.b24_domain) &&
    formData.b24_domain.length >= 3 &&
    !formData.b24_domain.includes('--')
})

const isEmailValid = computed(() => {
  if (!formData.admin_email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formData.admin_email)
})

const isFormValid = computed(() => {
  return !!isDomainValid.value &&
    !!formData.company_name &&
    (formData.admin_email ? isEmailValid.value : true)
})

const validateDomain = () => {
  formData.b24_domain = formData.b24_domain
    .toLowerCase()
}

const handleJsonInput = () => {
  jsonError.value = null

  if (!jsonMetadata.value.trim()) {
    formData.metadata = {}
    return
  }

  try {
    const parsed = JSON.parse(jsonMetadata.value)
    formData.metadata = parsed
  } catch {
    jsonError.value = 'Некорректный JSON формат'
  }
}

const createPortal = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Домен и название компании обязательны',
      life: 3000
    })
    return
  }

  creating.value = true

  try {
    const response = await portalService.createPortal({
      b24_domain: formData.b24_domain,
      company_name: formData.company_name,
      is_active: formData.is_active,
      metadata: formData.metadata,
      admin_email: formData.admin_email,
    })

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Портал создан',
        life: 3000
      })

      // Переход на страницу созданного портала
      router.push(`/portals/${response.data.id}`)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось создать портал',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания портала:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать портал',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.b24_domain || formData.company_name || jsonMetadata.value) {
    if (!confirm('Вы уверены? Введенные данные будут потеряны.')) {
      return
    }
  }

  router.push('/portals')
}
</script>

<style scoped>
:deep(.p-inputtext.p-invalid) {
  border-color: #f87171;
}
</style>
