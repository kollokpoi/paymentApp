<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/tariffs" class="hover:text-blue-600">Тарифы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание тарифа</span>
    </div>

    <h1 class="text-2xl font-bold">Создание нового тарифа</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Данные тарифа</h3>

            <div>
              <label class="block text-sm font-medium mb-2">
                Приложение <span class="text-red-500">*</span>
              </label>
              <SelectPrime
                v-model="formData.app_id"
                :options="applicationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Выберите приложение"
                class="w-full"
                :filter="true"
                :loading="applicationsLoading"
                :invalid="!formData.app_id"
              />
              <small v-if="!formData.app_id" class="text-red-500 text-xs">
                Выберите приложение
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Название <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.name"
                placeholder="Например: Базовый, Профессиональный, Корпоративный"
                class="w-full"
                :invalid="!formData.name"
              />
              <small v-if="!formData.name" class="text-red-500 text-xs">
                Название обязательно
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Код тарифа <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.code"
                placeholder="Например: basic, pro, enterprise"
                class="w-full"
                :invalid="!formData.code"
              />
              <small v-if="!formData.code" class="text-red-500 text-xs">
                Код тарифа обязателен
              </small>
              <small class="text-gray-500 text-xs">
                Уникальный код для идентификации в системе
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Описание</label>
              <TextareaPrime
                v-model="formData.description"
                placeholder="Описание тарифа, преимущества"
                class="w-full"
                rows="3"
                autoResize
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Цена <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <InputNumber
                  v-model="formData.price"
                  :min="0"
                  :max="99999"
                  :minFractionDigits="1"
                  :maxFractionDigits="2"
                  class="flex-1"
                  :invalid="formData.price < 0"
                />
              </div>
              <small v-if="formData.price < 0" class="text-red-500 text-xs">
                Цена должна быть положительной
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Период <span class="text-red-500">*</span>
              </label>
              <SelectPrime
                v-model="formData.period"
                :options="periodOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Выберите период"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Пробных дней</label>
              <InputNumber
                v-model="formData.trial_days"
                :min="0"
                :max="365"
                :step="1"
                class="w-full"
              />
              <small class="text-gray-500 text-xs">
                Количество бесплатных дней пробного периода
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Порядок сортировки</label>
              <InputNumber
                v-model="formData.sort_order"
                :min="0"
                :max="999"
                :step="1"
                :showButtons="true"
                class="w-full"
              />
              <small class="text-gray-500 text-xs">
                Чем меньше число, тем выше в списке (0 - самый верхний)
              </small>
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <CheckboxPrime
                  v-model="formData.is_active"
                  :binary="true"
                  inputId="isActive"
                />
                <label for="isActive" class="font-medium">Тариф активен</label>
              </div>

              <div class="flex items-center gap-3">
                <CheckboxPrime
                  v-model="formData.is_default"
                  :binary="true"
                  inputId="isDefault"
                />
                <label for="isDefault" class="font-medium">Тариф по умолчанию</label>
              </div>
              <small class="text-gray-500 text-xs">
                При создании новой подписки будет выбран этот тариф по умолчанию
              </small>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="font-medium text-gray-700 mb-2">Лимиты (JSON)</h3>
              <TextareaPrime
                v-model="jsonLimits"
                placeholder='{"users": 10, "storage_gb": 5, "api_calls": 1000}'
                class="w-full font-mono text-sm"
                rows="6"
                autoResize
                @input="handleLimitsInput"
              />
              <small class="text-gray-500 text-xs">
                Ограничения тарифа в формате JSON
              </small>
              <div v-if="limitsError" class="text-red-500 text-sm mt-1">
                {{ limitsError }}
              </div>

              <div v-if="Object.keys(formData.limits || {}).length > 0" class="mt-2">
                <h4 class="font-medium mb-2">Предварительный просмотр лимитов:</h4>
                <pre class="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
{{ JSON.stringify(formData.limits, null, 2) }}
                </pre>
              </div>
            </div>

            <div>
              <h3 class="font-medium text-gray-700 mb-2">Возможности (JSON)</h3>
              <TextareaPrime
                v-model="jsonFeatures"
                placeholder='["Базовые отчеты", "Техподдержка по email", "5 пользователей"]'
                class="w-full font-mono text-sm"
                rows="6"
                autoResize
                @input="handleFeaturesInput"
              />
              <small class="text-gray-500 text-xs">
                Список возможностей тарифа в формате JSON массива
              </small>
              <div v-if="featuresError" class="text-red-500 text-sm mt-1">
                {{ featuresError }}
              </div>

              <div v-if="formData.features && formData.features.length > 0" class="mt-2">
                <h4 class="font-medium mb-2">Предварительный просмотр возможностей:</h4>
                <pre class="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
{{ JSON.stringify(formData.features, null, 2) }}
                </pre>
              </div>
            </div>

            <div class="pt-4 border-t">
              <h4 class="font-medium mb-2">Информация о выбранном приложении</h4>
              <div v-if="selectedApplicationInfo" class="bg-gray-50 p-3 rounded">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="text-gray-500">Название:</div>
                  <div class="font-medium">{{ selectedApplicationInfo.name }}</div>

                  <div class="text-gray-500">Версия:</div>
                  <div class="font-medium">{{ selectedApplicationInfo.version }}</div>

                  <div class="text-gray-500">Статус:</div>
                  <div>
                    <TagPrime
                      :value="selectedApplicationInfo.isActive ? 'Активно' : 'Неактивно'"
                      :severity="selectedApplicationInfo.isActive ? 'success' : 'secondary'"
                      size="small"
                    />
                  </div>

                  <div class="text-gray-500">Дата создания:</div>
                  <div class="font-medium">{{ formatDate(selectedApplicationInfo.createdAt) }}</div>
                </div>
              </div>
              <div v-else class="text-gray-400 text-sm">
                Выберите приложение для просмотра информации
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime
        label="Отмена"
        icon="pi pi-times"
        outlined
        @click="cancel"
      />
      <ButtonPrime
        label="Создать"
        icon="pi pi-check"
        :disabled="!isFormValid || creating"
        @click="createTariff"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { tariffService, applicationService } from '@/services'
import type { CreateTariffRequest } from '@/services/tariff.service'
import { PeriodType } from '@/types/api/responses'
import type { ApplicationDTO } from '@/types/dto/application.dto'
import { formatDate } from '@/helpers/formatters'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const creating = ref(false)
const applications = ref<ApplicationDTO[]>([])
const applicationsLoading = ref(false)

const jsonLimits = ref('')
const jsonFeatures = ref('')
const limitsError = ref<string | null>(null)
const featuresError = ref<string | null>(null)

const formData = reactive<CreateTariffRequest>({
  app_id: route.query.appId as string,
  name: '',
  code: '',
  description: '',
  price: 0,
  period: PeriodType.MONTH,
  trial_days: 0,
  is_active: true,
  is_default: false,
  limits: {},
  features: [],
  sort_order: 0
})

const periodOptions = [
  { value: PeriodType.DAY, label: 'День' },
  { value: PeriodType.WEEK, label: 'Неделя' },
  { value: PeriodType.MONTH, label: 'Месяц' },
  { value: PeriodType.YEAR, label: 'Год' }
]

const currencyOptions = [
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KZT', label: 'KZT' }
]

const applicationOptions = computed(() => {
  return applications.value
    .filter(app => app.isActive)
    .map(app => ({
      value: app.id,
      label: `${app.name} (${app.version})`
    }))
})

const selectedApplicationInfo = computed(() => {
  return applications.value.find(a => a.id === formData.app_id)
})

const isFormValid = computed(() => {
  return !!formData.app_id &&
         !!formData.name &&
         !!formData.code &&
         formData.price !== undefined &&
         formData.price >= 0 &&
         !!formData.period
})

const handleLimitsInput = () => {
  limitsError.value = null

  if (!jsonLimits.value.trim()) {
    formData.limits = {}
    return
  }

  try {
    const parsed = JSON.parse(jsonLimits.value)
    formData.limits = parsed
  } catch{
    limitsError.value = 'Некорректный JSON формат для лимитов'
  }
}

const handleFeaturesInput = () => {
  featuresError.value = null

  if (!jsonFeatures.value.trim()) {
    formData.features = []
    return
  }

  try {
    const parsed = JSON.parse(jsonFeatures.value)
    if (Array.isArray(parsed)) {
      formData.features = parsed
    } else {
      featuresError.value = 'Возможности должны быть массивом'
    }
  } catch{
    featuresError.value = 'Некорректный JSON формат для возможностей'
  }
}

const loadApplications = async () => {
  applicationsLoading.value = true
  try {
    const response = await applicationService.getApplications({
      limit: 1000,
      isActive: true
    })
    if (response.success) {
      applications.value = response.data.items
    }
  } catch (error) {
    console.error('Ошибка загрузки приложений:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список приложений',
      life: 3000
    })
  } finally {
    applicationsLoading.value = false
  }
}

const createTariff = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Все обязательные поля должны быть заполнены',
      life: 3000
    })
    return
  }

  creating.value = true

  try {
    const response = await tariffService.createTariff(formData)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Тариф создан',
        life: 3000
      })

      // Переход на страницу созданного тарифа
      router.push(`/tariffs/${response.data.id}`)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось создать тариф',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания тарифа:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать тариф',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.app_id || formData.name || formData.code || jsonLimits.value || jsonFeatures.value) {
    if (!confirm('Вы уверены? Введенные данные будут потеряны.')) {
      return
    }
  }

  router.push('/tariffs')
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
:deep(.p-inputtext.p-invalid),
:deep(.p-dropdown.p-invalid),
:deep(.p-inputnumber.p-invalid) {
  border-color: #f87171;
}
</style>
