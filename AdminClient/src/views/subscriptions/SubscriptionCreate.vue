<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/subscriptions" class="hover:text-blue-600">Подписки</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание подписки</span>
    </div>

    <h1 class="text-2xl font-bold">Создание новой подписки</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Данные подписки</h3>

            <div>
              <label class="block text-sm font-medium mb-2">
                Портал <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.portal_id" :options="portalOptions" optionLabel="label" optionValue="value"
                placeholder="Выберите портал" class="w-full" :filter="true" :loading="portalsLoading"
                :invalid="!formData.portal_id" />
              <small v-if="!formData.portal_id" class="text-red-500 text-xs">
                Выберите портал
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Приложение <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.app_id" :options="applicationOptions" optionLabel="label"
                optionValue="value" placeholder="Выберите приложение" class="w-full" :filter="true"
                :loading="applicationsLoading" :invalid="!formData.app_id" @change="onApplicationChange" />
              <small v-if="!formData.app_id" class="text-red-500 text-xs">
                Выберите приложение
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Тариф <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.tariff_id" :options="tariffOptions" optionLabel="label" optionValue="value"
                placeholder="Выберите тариф" class="w-full" :filter="true" :loading="tariffsLoading"
                :invalid="!formData.tariff_id" />
              <small v-if="!formData.tariff_id" class="text-red-500 text-xs">
                Выберите тариф
              </small>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Дата начала <span class="text-red-500">*</span>
                </label>
                <DatePicker v-model="formData.valid_from" :showIcon="true" dateFormat="dd.mm.yy" class="w-full"
                  :invalid="!formData.valid_from" />
                <small v-if="!formData.valid_from" class="text-red-500 text-xs">
                  Укажите дату начала
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">
                  Дата окончания <span class="text-red-500">*</span>
                </label>
                <DatePicker v-model="formData.valid_until" :showIcon="true" dateFormat="dd.mm.yy" :minDate="minEndDate"
                  class="w-full" :invalid="!formData.valid_until" />
                <small v-if="!formData.valid_until" class="text-red-500 text-xs">
                  Укажите дату окончания
                </small>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Статус <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value"
                placeholder="Выберите статус" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Примечания</label>
              <TextareaPrime v-model="formData.notes" placeholder="Дополнительные примечания" class="w-full" rows="3"
                autoResize />
            </div>

            <div class="flex items-center gap-3">
              <CheckboxPrime v-model="formData.auto_renew" :binary="true" inputId="autoRenew" />
              <label for="autoRenew" class="font-medium">Автопродление</label>
            </div>

            <div v-if="formData.status === 'trial'">
              <label class="block text-sm font-medium mb-2">Дата окончания триала</label>
              <DatePicker v-model="formData.trial_end_date" :showIcon="true" dateFormat="dd.mm.yy"
                :minDate="formData.valid_from" :maxDate="formData.valid_until" class="w-full" />
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Информация</h3>

            <div class="bg-gray-50 p-4 rounded space-y-3">
              <h4 class="font-medium">Выбранные данные:</h4>

              <div v-if="selectedPortalInfo" class="space-y-1">
                <div class="text-sm text-gray-500">Портал:</div>
                <div class="font-medium">{{ selectedPortalInfo.name }}</div>
                <div class="text-xs text-gray-500">{{ selectedPortalInfo.domain }}</div>
              </div>

              <div v-if="selectedApplicationInfo" class="space-y-1">
                <div class="text-sm text-gray-500">Приложение:</div>
                <div class="font-medium">{{ selectedApplicationInfo.name }}</div>
                <div class="text-xs text-gray-500">{{ selectedApplicationInfo.description }}</div>
              </div>

              <div v-if="selectedTariffInfo" class="space-y-1">
                <div class="text-sm text-gray-500">Тариф:</div>
                <div class="font-medium">{{ selectedTariffInfo.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatCurrency(selectedTariffInfo.price) }} / {{ selectedTariffInfo.period }}
                </div>
              </div>

              <div v-if="formData.valid_from && formData.valid_until" class="space-y-1">
                <div class="text-sm text-gray-500">Период:</div>
                <div class="font-medium">
                  {{ formatDate(formData.valid_from) }} – {{ formatDate(formData.valid_until) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ calculateDays }} дней
                </div>
              </div>

              <div v-if="selectedTariffInfo" class="pt-3 border-t">
                <div class="text-sm text-gray-500">Итоговая стоимость:</div>
                <div class="text-lg font-bold">
                  {{ formatCurrency(calculateTotalPrice) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ selectedTariffInfo.price }} × {{ calculateDays / getDaysInPeriod(selectedTariffInfo.period) || 1 }}
                  периодов
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Метаданные (JSON)</label>
              <TextareaPrime v-model="jsonMetadata" placeholder='{"source": "manual", "sales_person": "Иван Иванов"}'
                class="w-full font-mono text-sm" rows="6" autoResize @input="handleJsonInput" />
              <small class="text-gray-500 text-xs">
                Дополнительные метаданные подписки в формате JSON
              </small>
              <div v-if="jsonError" class="text-red-500 text-sm mt-1">
                {{ jsonError }}
              </div>

              <div v-if="Object.keys(formData.metadata || {}).length > 0" class="mt-2">
                <pre class="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
{{ JSON.stringify(formData.metadata, null, 2) }}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime label="Создать" icon="pi pi-check" :disabled="!isFormValid || creating"
        @click="createSubscription" />
    </div>
  </div>
  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { subscriptionService, portalService, applicationService, tariffService } from '@/services'
import type { CreateSubscriptionRequest } from '@/services/subscription.service'
import { PeriodType, SubscriptionStatus } from '@/types/api/responses'
import type { ApplicationDTO } from '@/types/dto/application.dto'
import type { TariffDTO } from '@/types/dto/tariff.dto'
import { formatDate, formatCurrency } from '@/helpers/formatters'
import type { PortalShortDTO } from '@/types/dto'
import { useConfirm } from 'primevue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const creating = ref(false)
const jsonError = ref<string | null>(null)
const jsonMetadata = ref('')

const portals = ref<PortalShortDTO[]>([])
const applications = ref<ApplicationDTO[]>([])
const tariffs = ref<TariffDTO[]>([])
const portalsLoading = ref(false)
const applicationsLoading = ref(false)
const tariffsLoading = ref(false)

const formData = reactive<CreateSubscriptionRequest>({
  portal_id: '',
  app_id: '',
  tariff_id: '',
  status: SubscriptionStatus.ACTIVE,
  valid_from: new Date(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  auto_renew: true,
  trial_end_date: undefined,
  notes: '',
  metadata: {}
})

const statusOptions = [
  { value: SubscriptionStatus.TRIAL, label: 'Триал' },
  { value: SubscriptionStatus.ACTIVE, label: 'Активная' },
  { value: SubscriptionStatus.SUSPENDED, label: 'Приостановлена' },
  { value: SubscriptionStatus.CANCELED, label: 'Отменена' },
  { value: SubscriptionStatus.EXPIRED, label: 'Истекла' }
]

const portalOptions = computed(() => {
  return portals.value.map(portal => ({
    value: portal.id,
    label: `${portal.name} (${portal.domain})`
  }))
})

const applicationOptions = computed(() => {
  return applications.value
    .filter(app => app.isActive)
    .map(app => ({
      value: app.id,
      label: `${app.name} (${app.version})`
    }))
})

const tariffOptions = computed(() => {
  if (!formData.app_id) return []

  return tariffs.value
    .filter(tariff => tariff.appId === formData.app_id && tariff.isActive)
    .map(tariff => ({
      value: tariff.id,
      label: `${tariff.name} - ${formatCurrency(tariff.price)} / ${tariff.period}`
    }))
})

const selectedPortalInfo = computed(() => {
  return portals.value.find(p => p.id === formData.portal_id)
})

const selectedApplicationInfo = computed(() => {
  return applications.value.find(a => a.id === formData.app_id)
})

const selectedTariffInfo = computed(() => {
  return tariffs.value.find(t => t.id === formData.tariff_id)
})

const minEndDate = computed(() => {
  return formData.valid_from ? new Date(formData.valid_from) : new Date()
})

const calculateDays = computed(() => {
  if (!formData.valid_from || !formData.valid_until) return 0

  const start = new Date(formData.valid_from)
  const end = new Date(formData.valid_until)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const calculateTotalPrice = computed(() => {
  if (!selectedTariffInfo.value || !calculateDays.value) return 0

  const tariff = selectedTariffInfo.value
  const daysInPeriod = getDaysInPeriod(tariff.period) || 30
  const periods = calculateDays.value / daysInPeriod

  return tariff.price * periods
})

const isFormValid = computed(() => {
  return !!formData.portal_id &&
    !!formData.app_id &&
    !!formData.tariff_id &&
    !!formData.valid_from &&
    !!formData.valid_until &&
    !!formData.status &&
    calculateDays.value > 0
})

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

const getDaysInPeriod = (period: PeriodType): number => {
  const periodMap: Record<PeriodType, number> = {
    'day': 1,
    'week': 7,
    'month': 30,
    'year': 365
  }
  return periodMap[period] || 30
}

const onApplicationChange = () => {
  loadTariffs()
}

const loadPortals = async () => {
  portalsLoading.value = true
  try {
    const response = await portalService.getPortalsList({ limit: 1000 })
    if (response.success) {
      portals.value = response.data
    }
  } catch (error) {
    console.error('Ошибка загрузки порталов:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список порталов',
      life: 3000
    })
  } finally {
    portalsLoading.value = false
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

const loadTariffs = async () => {
  if (!formData.app_id) {
    tariffs.value = []
    return
  }

  tariffsLoading.value = true
  try {
    const response = await tariffService.getTariffs({
      appId: formData.app_id,
      limit: 100
    })
    if (response.success) {
      tariffs.value = response.data.items
    }
  } catch (error) {
    console.error('Ошибка загрузки тарифов:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список тарифов',
      life: 3000
    })
  } finally {
    tariffsLoading.value = false
  }
}

const createSubscription = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Все поля обязательны для заполнения',
      life: 3000
    })
    return
  }

  if (calculateDays.value <= 0) {
    toast.add({
      severity: 'warn',
      summary: 'Ошибка дат',
      detail: 'Дата окончания должна быть позже даты начала',
      life: 3000
    })
    return
  }

  creating.value = true

  try {
    const response = await subscriptionService.createSubscription(formData)

    if (response.success) {
      confirm.require({
        message: `Создать платеж за продление на сумму ${calculateTotalPrice.value}?`,
        header: 'Создание платежа',
        icon: 'pi pi-credit-card',
        acceptClass: 'p-button-success',
        acceptLabel: 'Создать платеж',
        rejectLabel: 'К подписке',

        accept() {
          router.push({
            path: '/payments/create',
            query: {
              fromExtend: 'true',
              subscriptionId: response.data.id,
              amount: calculateTotalPrice.value,
            },
          })
        },
        reject() {
          router.push(`/subscriptions/${response.data.id}`)
        },
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось продлить подписку',
        life: 3000,
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания подписки:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать подписку',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.portal_id || formData.app_id || formData.tariff_id || jsonMetadata.value) {
    if (!confirm('Вы уверены? Введенные данные будут потеряны.')) {
      return
    }
  }

  router.push('/subscriptions')
}

onMounted(() => {
  loadPortals()
  loadApplications()
  if (route.query.portalId) {
    formData.portal_id = route.query.portalId as string
  }
  if (route.query.appId)
    formData.app_id = route.query.appId as string
  if (route.query.tariffId)
    formData.tariff_id = route.query.tariffId as string

})

const periodMap = {
  [PeriodType.DAY]: 1,
  [PeriodType.WEEK]: 7,
  [PeriodType.MONTH]: 30,
  [PeriodType.YEAR]: 365,
}

watch(() => formData.app_id, () => {
  if (formData.app_id) {
    loadTariffs()
    formData.tariff_id = ''
  }
})

watch(() => formData.tariff_id, (newValue) => {
  const tariff = tariffs.value.find(x => x.id == newValue);
  if (tariff) {
    const newEnd = formData.valid_from ? new Date(formData.valid_from) : new Date()
    newEnd.setDate(newEnd.getDate() + periodMap[tariff.period] || 30)
    formData.valid_until = newEnd
  }
})
</script>

<style scoped>
:deep(.p-inputtext.p-invalid),
:deep(.p-dropdown.p-invalid),
:deep(.p-calendar.p-invalid) {
  border-color: #f87171;
}
</style>