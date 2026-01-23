<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="subscription" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/subscriptions" class="hover:text-blue-600">Подписки</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <router-link :to="`/subscriptions/${subscriptionId}`" class="hover:text-blue-600">
        {{ subscription.name }}
      </router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Продление</span>
    </div>

    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">Продление подписки</h1>
        <p class="text-gray-600">{{ subscription.name }}</p>
      </div>
    </div>


    <CardPrime>
      <template #content>
        <h3 class="font-medium text-gray-700 mb-4">Информация о подписке</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="space-y-3">
            <div>
              <dt class="text-sm text-gray-500">Портал</dt>
              <router-link :to="`/portals/${subscription.portalId}`"
                class="font-medium text-primary-600 hover:text-primary-500">
                <dd>{{ subscription.companyName }}</dd>
              </router-link>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Приложение</dt>
              <router-link :to="`/applications/${subscription.appId}`"
                class="font-medium text-primary-600 hover:text-primary-500">
                <dd>{{ subscription.application?.name }}</dd>
              </router-link>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Тариф</dt>
              <dd>{{ subscription.tariff?.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Средства на балансе портала</dt>
              <dd>{{ formatCurrency(portalBalance) }}</dd>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <dt class="text-sm text-gray-500">Статус</dt>
              <dd>
                <TagPrime :value="subscription.status" :severity="getStatusSeverity(subscription.status)" />
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Текущий период</dt>
              <dd>
                {{ formatDate(subscription.validFrom) }} — {{ formatDate(subscription.validUntil) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Осталось дней</dt>
              <dd>
                <span :class="{ 'text-red-500': subscription.daysLeft < 7 }">
                  {{ subscription.daysLeft }} {{ pluralizeDays(subscription.daysLeft) }}
                </span>
              </dd>
            </div>
            <div v-if="subscription.trialEndDate">
              <dt class="text-sm text-gray-500">Триал до</dt>
              <dd>{{ formatDate(subscription.trialEndDate) }}</dd>
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="font-medium text-gray-700 mb-4">Параметры продления</h3>

          <div class="space-y-4">
            <div class="flex items-center gap-3 mb-4">
              <CheckboxPrime v-model="fromTariff" :binary="true" inputId="fromTariff" />
              <label for="fromTariff" class="font-medium"> Использовать период из тарифа </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Срок продления <span class="text-red-500">*</span>
                </label>
                <div class="flex gap-2">
                  <InputNumber v-model="days" placeholder="Введите количество дней" :min="1" :max="3650"
                    :maxFractionDigits="0" class="flex-1" :disabled="fromTariff" :invalid="!isDaysValid" />
                  <div class="flex items-center px-3 bg-gray-50 rounded border">
                    <span class="text-gray-700">дней</span>
                  </div>
                </div>
                <small v-if="!isDaysValid" class="text-red-500 text-xs">
                  Введите количество дней (1-3650)
                </small>
                <small v-else class="text-gray-500 text-xs">
                  {{ days }} {{ pluralizeDays(days) }}
                </small>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Новая дата окончания</label>
                <div class="p-3 bg-gray-50 rounded border">
                  <div class="font-medium">{{ newEndDate ? formatDate(newEndDate) : '—' }}</div>
                  <div v-if="newEndDate" class="text-sm text-gray-500 mt-1">
                    Период продления: {{ formatDate(subscription.validUntil) }} →
                    {{ formatDate(newEndDate) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="subscription.tariff" class="mt-4 p-4 bg-blue-50 rounded">
              <h4 class="font-medium text-blue-800 mb-2">Информация о тарифе</h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="text-blue-600">Период тарифа:</div>
                <div class="font-medium">{{ formatPeriodType(subscription.tariff.period) }}</div>

                <div class="text-blue-600">Дней в периоде:</div>
                <div class="font-medium">{{ tariffDaysInPeriod }}</div>

                <div class="text-blue-600">Цена тарифа:</div>
                <div class="font-medium">{{ formatCurrency(subscription.tariff.price) }}</div>

                <div v-if="calculatedPrice" class="text-blue-600">Стоимость продления:</div>
                <div v-if="calculatedPrice" class="font-medium text-lg">
                  {{ formatCurrency(calculatedPrice) }}
                </div>

              </div>
            </div>

            <div class="mt-6 p-4 bg-gray-50 rounded">
              <h4 class="font-medium text-gray-700 mb-2">Сводка продления</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Текущий период:</span>
                  <span>{{ formatDate(subscription.validFrom) }} —
                    {{ formatDate(subscription.validUntil) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Продление на:</span>
                  <span>{{ days }} {{ pluralizeDays(days) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Новый период:</span>
                  <span class="font-medium">
                    {{ formatDate(subscription.validFrom) }} —
                    {{ newEndDate ? formatDate(newEndDate) : '—' }}
                  </span>
                </div>
                <div v-if="subscription.tariff && subscription.tariff.price > 0"
                  class="flex justify-between pt-2 border-t">
                  <span class="text-gray-500">Стоимость:</span>
                  <span class="font-bold text-lg">{{ formatCurrency(calculatedPrice) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime label="Продлить" icon="pi pi-check" :disabled="!canExtend || extending"
        @click="extendSubscription" />
    </div>

    <CardPrime>
      <template #title>
        <div class="flex justify-between">
          <p>История платежей</p>
          <ButtonPrime label="Все платежи" icon="pi pi-external-link" @click="goToPayments" />
        </div>
      </template>
      <template #content>
        <div v-if="payments && payments.length > 0">
          <PaymentTable :payments="payments" :loading="paymentsLoading" />
          <PaginatorPrime v-if="paymentPagination?.total > paymentPagination.limit" :rows="paymentPagination.limit"
            :totalRecords="paymentPagination.total" @page="onPageChange" />
        </div>
        <div v-else class="text-center py-8">
          <i class="pi pi-credit-card text-3xl text-gray-300 mb-3"></i>
          <p class="text-gray-500">Платежей не найдено</p>
        </div>
      </template>
    </CardPrime>
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Подписка не найдена</h3>
    <router-link to="/subscriptions" class="text-blue-600 hover:underline">
      Вернуться к списку подписок
    </router-link>
  </div>
  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { subscriptionService, paymentService } from '@/services'
import type { PaymentSearchParams } from '@/services/payment.service'
import type { RenewSubscriptionRequest } from '@/services/subscription.service'
import type { SubscriptionDTO, PaymentDTO } from '@/types/dto'
import { PeriodType } from '@/types/api/responses'
import { formatDate, formatCurrency, pluralizeDays } from '@/helpers/formatters'
import PaymentTable from '@/components/PaymentTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const subscriptionId = route.params.id as string
const fromPayment = computed(() => route.query.fromPayment === 'true')

const loading = ref(false)
const extending = ref(false)
const paymentsLoading = ref(false)
const subscription = ref<SubscriptionDTO>()
const payments = ref<PaymentDTO[]>([])

const days = ref<number>(30)
const fromTariff = ref<boolean>(true)
const portalBalance = ref(0)

const paymentPagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})
const tariffDaysInPeriod = computed(() => {
  if (!subscription.value?.tariff?.period) return 30

  const periodMap = {
    [PeriodType.DAY]: 1,
    [PeriodType.WEEK]: 7,
    [PeriodType.MONTH]: 30,
    [PeriodType.YEAR]: 365,
  }

  return periodMap[subscription.value.tariff.period] || 30
})

const newEndDate = computed(() => {
  if (!subscription.value || !days.value) return null

  const currentEnd = new Date(subscription.value.validUntil)
  const newEnd = new Date(currentEnd)
  newEnd.setDate(newEnd.getDate() + days.value)

  return newEnd
})

const calculatedPrice = computed(() => {
  if (!subscription.value?.tariff?.price) return 0

  const tariff = subscription.value.tariff
  const periods = days.value / tariffDaysInPeriod.value

  if (periods <= 0) return tariff.price

  const totalPrice = tariff.price * periods
  return totalPrice
})

const isDaysValid = computed(() => {
  return days.value !== undefined && days.value >= 1 && days.value <= 3650
})

const canExtend = computed(() => {
  return isDaysValid.value && !extending.value
})

const isBalanceEnough = computed(() => {
  return portalBalance.value > calculatedPrice.value
})


const formatPeriodType = (period: PeriodType) => {
  const periodNames = {
    [PeriodType.DAY]: 'День',
    [PeriodType.WEEK]: 'Неделя',
    [PeriodType.MONTH]: 'Месяц',
    [PeriodType.YEAR]: 'Год',
  }
  return periodNames[period] || period
}

const getStatusSeverity = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    trial: 'info',
    expired: 'danger',
    suspended: 'warning',
    cancelled: 'secondary',
  }
  return statusMap[status] || 'info'
}

const loadSubscription = async () => {
  loading.value = true
  try {
    const response = await subscriptionService.getSubscription(subscriptionId)

    if (response.success) {
      subscription.value = response.data

      if (subscription.value.tariff) {
        days.value = tariffDaysInPeriod.value
      }
      if (subscription.value.portal) {
        portalBalance.value = subscription.value.portal.balance
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось загрузить подписку',
        life: 3000,
      })
      router.push('/subscriptions')
    }
  } catch (error) {
    console.error('Ошибка загрузки подписки:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить подписку',
      life: 3000,
    })
    router.push('/subscriptions')
  } finally {
    loading.value = false
  }
}

const loadPayments = async () => {
  if (!subscription.value) return

  paymentsLoading.value = true
  try {
    const params: PaymentSearchParams = {
      page: paymentPagination.page,
      limit: paymentPagination.limit,
      subscriptionId: subscriptionId,
    }

    const response = await paymentService.getPayments(params)

    if (response.success) {
      payments.value = response.data.items
      paymentPagination.total = response.data.total
      paymentPagination.totalPages = response.data.totalPages
      paymentPagination.hasNext = response.data.hasNext
      paymentPagination.hasPrev = response.data.hasPrev
    }
  } catch (error) {
    console.error('Ошибка загрузки платежей:', error)
  } finally {
    paymentsLoading.value = false
  }
}

const onPageChange = (event: any) => {
  paymentPagination.page = event.page + 1
  loadPayments()
}

const goToPayments = () => {
  router.push(`/payments?subscriptionId=${subscriptionId}`)
}

// Продление подписки
const extendSubscription = async () => {
  if (!subscription.value) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Ошибка в работе приложения',
      life: 3000,
    })
    return;
  }
  if (!isBalanceEnough.value) {
    toast.add({
      severity: 'warn',
      summary: 'Ошибка',
      detail: 'Недостаточно средств на балансе',
      life: 3000,
    })
    return;
  }
  if (!canExtend.value) {
    toast.add({
      severity: 'warning',
      summary: 'Ошибка',
      detail: 'Не указано количество дней',
      life: 3000,
    })
    return;
  }

  extending.value = true

  try {
    const requestData: RenewSubscriptionRequest = {
      days: days.value,
      amount: calculatedPrice.value
    }

    const response = await subscriptionService.renewSubscription(subscriptionId, requestData)

    if (response.success) {
      if (fromPayment.value) {
        router.back()
      } else {
        router.push(`/subscriptions/${subscriptionId}`)
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось продлить подписку',
        life: 3000,
      })
    }
  } catch (error: any) {
    console.error('Ошибка продления подписки:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось продлить подписку',
      life: 3000,
    })
  } finally {
    extending.value = false
  }
}

const cancel = () => {
  if (fromPayment.value) {
    router.back()
  } else {
    router.push(`/subscriptions/${subscriptionId}`)
  }
}

// Наблюдатели
watch(fromTariff, (newValue) => {
  if (newValue && subscription.value?.tariff) {
    days.value = tariffDaysInPeriod.value
  }
})

watch(
  () => subscription.value?.tariff,
  (newTariff) => {
    if (newTariff && fromTariff.value) {
      days.value = tariffDaysInPeriod.value
    }
  },
)

// Инициализация
onMounted(() => {
  loadSubscription()
  loadPayments()
})
</script>

<style scoped>
:deep(.p-inputnumber.p-invalid) {
  border-color: #f87171;
}
</style>
