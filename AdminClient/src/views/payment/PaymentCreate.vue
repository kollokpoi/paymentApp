<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/payments" class="hover:text-blue-600">Платежи</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание платежа</span>
    </div>

    <h1 class="text-2xl font-bold">Создание нового платежа</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Данные платежа</h3>

            <div>
              <label class="block text-sm font-medium mb-2">
                Подписка <span class="text-red-500">*</span>
              </label>
              <SelectPrime
                v-model="formData.subscription_id"
                :options="subscriptionOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Выберите подписку"
                class="w-full"
                :filter="true"
                :loading="subscriptionsLoading"
                :invalid="!formData.subscription_id"
              />
              <small v-if="!formData.subscription_id" class="text-red-500 text-xs">
                Подписка обязательна
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Сумма <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <InputNumber
                  v-model="formData.amount"
                  :min="0.01"
                  :max="999999"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  class="flex-1"
                  :invalid="!formData.amount || formData.amount <= 0"
                />
                <SelectPrime
                  v-model="formData.currency"
                  :options="currencyOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-32"
                />
              </div>
              <small v-if="!formData.amount || formData.amount <= 0" class="text-red-500 text-xs">
                Сумма должна быть больше 0
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Статус <span class="text-red-500">*</span>
              </label>
              <SelectPrime
                v-model="formData.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Выберите статус"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Описание</label>
              <InputText
                v-model="formData.description"
                placeholder="Описание платежа"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Метод оплаты</label>
              <InputText
                v-model="formData.payment_method"
                placeholder="Например: credit_card, bank_transfer"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Внешний ID</label>
              <InputText
                v-model="formData.external_id"
                placeholder="ID платежа во внешней системе"
                class="w-full"
              />
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Дополнительно</h3>

            <div>
              <label class="block text-sm font-medium mb-2">Метаданные (JSON)</label>
              <TextareaPrime
                v-model="jsonMetadata"
                placeholder='{"invoice_id": "123", "note": "Оплата за услуги"}'
                class="w-full font-mono text-sm"
                rows="8"
                autoResize
                @input="handleJsonInput"
              />
              <small class="text-gray-500 text-xs">
                Дополнительные метаданные платежа в формате JSON
              </small>
              <div v-if="jsonError" class="text-red-500 text-sm mt-1">
                {{ jsonError }}
              </div>

              <div v-if="Object.keys(formData.metadata || {}).length > 0" class="mt-4">
                <h4 class="font-medium mb-2">Предварительный просмотр:</h4>
                <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40"
                  >{{ JSON.stringify(formData.metadata, null, 2) }}
                </pre>
              </div>
            </div>

            <div class="pt-4 border-t">
              <h4 class="font-medium mb-2">Информация о выбранной подписке</h4>
              <div v-if="selectedSubscriptionInfo" class="bg-gray-50 p-3 rounded">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="text-gray-500">Приложение:</div>
                  <div class="font-medium">{{ selectedSubscriptionInfo.application?.name }}</div>

                  <div class="text-gray-500">Портал:</div>
                  <div class="font-medium">
                    {{
                      selectedSubscriptionInfo.portal?.companyName ||
                      selectedSubscriptionInfo.portalId
                    }}
                  </div>

                  <div class="text-gray-500">Тариф:</div>
                  <div class="font-medium">
                    {{ selectedSubscriptionInfo.tariff?.name || 'Без тарифа' }}
                  </div>

                  <div class="text-gray-500">Статус:</div>
                  <div>
                    <TagPrime
                      :value="selectedSubscriptionInfo.status"
                      :severity="getSubscriptionStatusSeverity(selectedSubscriptionInfo.status)"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-400 text-sm">
                Выберите подписку для просмотра информации
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime
        label="Создать"
        icon="pi pi-check"
        :disabled="!isFormValid || creating"
        @click="createPayment"
      />
    </div>
  </div>
  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { paymentService, subscriptionService } from '@/services'
import { PaymentStatus } from '@/types/api/responses'
import type { CreatePaymentRequest } from '@/services/payment.service'
import type { SubscriptionDTO } from '@/types/dto'
import { useConfirm } from 'primevue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const creating = ref(false)
const jsonError = ref<string | null>(null)
const jsonMetadata = ref('')
const subscriptions = ref<SubscriptionDTO[]>([])
const subscriptionsLoading = ref(false)
const fromExtend = computed(() => route.query.fromExtend === 'true')

const formData = reactive<CreatePaymentRequest>({
  subscription_id: '',
  amount: 0,
  currency: 'RUB',
  status: PaymentStatus.PENDING,
  description: '',
  payment_method: '',
  external_id: '',
  metadata: {},
})

const statusOptions = [
  { value: PaymentStatus.PENDING, label: 'В процессе' },
  { value: PaymentStatus.COMPLETED, label: 'Выполнен' },
  { value: PaymentStatus.FAILED, label: 'Ошибка' },
  { value: PaymentStatus.REFUNDED, label: 'Возврат' },
]

const currencyOptions = [
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KZT', label: 'KZT' },
]

const subscriptionOptions = computed(() => {
  return subscriptions.value.map((sub) => ({
    value: sub.id,
    label: `${sub.portal?.companyName || sub.portalId} - ${sub.application?.name || 'Без приложения'} (${sub.tariff?.name || 'Без тарифа'})`,
  }))
})

const selectedSubscriptionInfo = computed(() => {
  return subscriptions.value.find((sub) => sub.id === formData.subscription_id)
})

const isFormValid = computed(() => {
  return !!formData.subscription_id && !!formData.amount && formData.amount > 0 && !!formData.status
})

const getSubscriptionStatusSeverity = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    trial: 'info',
    expired: 'danger',
    suspended: 'warning',
    cancelled: 'secondary',
  }
  return statusMap[status] || 'info'
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

const loadSubscriptions = async () => {
  subscriptionsLoading.value = true
  try {
    const response = await subscriptionService.getSubscriptions({
      limit: 100,
      page: 1,
      status: 'active',
    })

    if (response.success) {
      subscriptions.value = response.data.items
    }
  } catch (error) {
    console.error('Ошибка загрузки подписок:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список подписок',
      life: 3000,
    })
  } finally {
    subscriptionsLoading.value = false
  }
}

const createPayment = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Подписка, сумма и статус обязательны',
      life: 3000,
    })
    return
  }

  creating.value = true

  try {
    const response = await paymentService.createPayment(formData)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Платеж создан',
        life: 3000,
      })

      confirm.require({
        message: `Продлить подписку?`,
        header: 'Продление подписки',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-success',
        acceptLabel: 'Продлить',
        rejectLabel: 'Продолжить',
        accept() {
          router.push({
            path: `/subscriptions/${response.data.subscriptionId}/extend`,
            query: { fromPayment: 'true' },
          })
        },
        reject() {
          router.push(`/payments/${response.data.id}`)
        },
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось создать платеж',
        life: 3000,
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания платежа:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать платеж',
      life: 3000,
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.subscription_id || formData.amount || jsonMetadata.value) {
    confirm.require({
      message: `Вы уверены? Введенные данные будут потеряны.`,
      header: 'Отмена создания',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: 'Выход',
      rejectLabel: 'Продолжить',
      accept() {
        router.push('/payments')
      },
    })
  } else {
    router.push('/payments')
  }
}

onMounted(() => {
  loadSubscriptions()
  if (route.query.subscriptionId) {
    formData.subscription_id = route.query.subscriptionId as string
  }
  
  if (route.query.amount) {
    formData.amount = parseFloat(route.query.amount as string) || 0
  }
})
</script>

<style scoped>
/* Стили для невалидных полей */
:deep(.p-inputtext.p-invalid),
:deep(.p-dropdown.p-invalid) {
  border-color: #f87171;
}
</style>
