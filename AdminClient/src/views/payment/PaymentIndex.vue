<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Платежи</h1>
    <p class="text-gray-600">Управление платежами подписок</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск платежа" class="w-full" />
      </div>
      <ButtonPrime label="Фильтры" icon="pi pi-filter" outlined @click="showFilters = true"
        :badge="hasActiveFilters ? '!' : null" :severity="hasActiveFilters ? 'warning' : 'secondary'"
        :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addPayment" />
    </div>
  </div>

  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else class="space-y-6">
    <div v-if="hasPayments">
      <PaymentTable :payments="payments" :loading="loading" @deleted="loadPayments" />
      <PaginatorPrime v-if="pagination?.total > pagination.limit" :rows="pagination.limit"
        :totalRecords="pagination.total" @page="onPageChange" />
    </div>
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-medium mb-2">
        {{ search ? 'Ничего не найдено' : 'Платежи не найдены' }}
      </h3>
      <p v-if="search" class="text-gray-500 mb-4">
        Попробуйте изменить поисковый запрос
      </p>
      <ButtonPrime v-if="search" label="Очистить поиск" @click="search = ''" outlined />
    </div>
  </div>

  <DialogPrime v-model:visible="showFilters" modal header="Фильтры платежей" :style="{ width: '80%' }">
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Портал</label>
        <SelectPrime v-model="selectedPortalId" class="w-full" :options="portalOptions" optionLabel="label"
          optionValue="value" placeholder="Все порталы" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Статус</label>
        <SelectPrime v-model="selectedStatus" class="w-full" :options="statusOptions" optionLabel="label"
          optionValue="value" placeholder="Все статусы" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Приложение</label>
        <SelectPrime v-model="selectedAppId" class="w-full" :options="appsOptions" optionLabel="label"
          optionValue="value" placeholder="Все приложения" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Способ оплаты</label>
        <SelectPrime v-model="selectedPaymentMethod" class="w-full" :options="paymentMethodOptions" optionLabel="label"
          optionValue="value" placeholder="Все способы" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Дата от</label>
          <DatePicker v-model="dateFrom" class="w-full" dateFormat="dd.mm.yy" showIcon iconDisplay="input"
            :maxDate="dateTo" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Дата до</label>
          <DatePicker v-model="dateTo" class="w-full" dateFormat="dd.mm.yy" showIcon iconDisplay="input"
            :minDate="dateFrom" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Сумма от</label>
          <InputNumber v-model="amountFrom" class="w-full" mode="currency" currency="RUB" locale="ru-RU" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Сумма до</label>
          <InputNumber v-model="amountTo" class="w-full" mode="currency" currency="RUB" locale="ru-RU" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <ButtonPrime label="Сбросить" icon="pi pi-filter-slash" @click="resetFilters" outlined severity="secondary" />
        <div class="flex gap-2">
          <ButtonPrime label="Отмена" @click="showFilters = false" outlined />
          <ButtonPrime label="Применить" @click="applyFilters" icon="pi pi-check" />
        </div>
      </div>
    </template>
  </DialogPrime>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { paymentService, portalService, applicationService } from '@/services'
import type { PortalShortDTO, PaymentDTO, ApplicationShortDTO } from '@/types/dto'
import { useDebouncedFn } from '@/composables/useDebounce'
import PaymentTable from '@/components/PaymentTable.vue'
import type { PaymentSearchParams } from '@/services/payment.service'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const subscriptionId = route.query.subscriptionId as string
const appId = route.query.appId as string
const portalId = route.query.portalId as string

const portals = ref<PortalShortDTO[]>([])
const applications = ref<ApplicationShortDTO[]>([])
const payments = ref<PaymentDTO[]>([])

const search = ref('')
const selectedPortalId = ref<string | undefined>(portalId)
const selectedStatus = ref<string>()
const selectedAppId = ref<string | undefined>(appId)
const selectedSubscriptionId = ref<string | undefined>(subscriptionId)
const selectedPaymentMethod = ref<string>()
const dateFrom = ref<Date>()
const dateTo = ref<Date>()
const amountFrom = ref<number>()
const amountTo = ref<number>()

const loading = ref(true)
const showFilters = ref(false)

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const portalOptions = computed(() => portals.value?.map(x => x.selectOption) || [])
const appsOptions = computed(() => applications.value?.map(x => x.selectOption) || [])
const statusOptions = [
  { value: 'completed', label: 'Успешные' },
  { value: 'pending', label: 'Ожидающие' },
  { value: 'failed', label: 'Ошибки' },
  { value: 'refunded', label: 'Возвраты' },
  { value: 'canceled', label: 'Отмененные' }
]

const paymentMethodOptions = [
  { value: 'bank_card', label: 'Банковская карта' },
  { value: 'sbp', label: 'СБП' },
  { value: 'yookassa', label: 'ЮKassa' },
  { value: 'cloudpayments', label: 'CloudPayments' },
  { value: 'tinkoff', label: 'Тинькофф' }
]

const hasPayments = computed(() => payments.value.length > 0)
const hasActiveFilters = computed(() => {
  return !!selectedPortalId.value ||
    !!selectedStatus.value ||
    !!selectedAppId.value ||
    !!selectedPaymentMethod.value ||
    !!dateFrom.value ||
    !!dateTo.value ||
    amountFrom.value !== undefined ||
    amountTo.value !== undefined
})

let abortController: AbortController | null = null

const { debouncedFn } = useDebouncedFn(() => {
  loadPayments()
}, 700)

const loadPortals = async () => {
  try {
    const response = await portalService.getPortalsList()

    if (response.success) {
      portals.value = response.data
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить порталы',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить порталы',
      life: 3000,
    })
  }
}

const loadApps = async () => {
  try {
    const response = await applicationService.getApplicationsList()

    if (response.success) {
      applications.value = response.data
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить приложения',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить приложения',
      life: 3000,
    })
  }
}

const loadPayments = async () => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    loading.value = true

    const params: PaymentSearchParams = {
      search: search.value,
      page: pagination.page,
      limit: pagination.limit
    }

    if (selectedSubscriptionId.value) params.subscriptionId = selectedSubscriptionId.value
    if (selectedPortalId.value) params.portalId = selectedPortalId.value
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedAppId.value) params.appId = selectedAppId.value
    if (dateFrom.value) params.dateFrom = dateFrom.value.toISOString().split('T')[0]
    if (dateTo.value) params.dateTo = dateTo.value.toISOString().split('T')[0]
    if (amountFrom.value) params.amountFrom = amountFrom.value;
    if (amountTo.value) params.amountTo = amountTo.value;

    const response = await paymentService.getPayments(
      params,
      { signal: abortController.signal }
    )

    if (response.success) {
      payments.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить платежи',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить платежи',
        life: 3000,
      })
    }
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  showFilters.value = false
  pagination.page = 1
  loadPayments()
}

const resetFilters = () => {
  selectedPortalId.value = undefined
  selectedStatus.value = undefined
  selectedAppId.value = undefined
  selectedPaymentMethod.value = undefined
  dateFrom.value = undefined
  dateTo.value = undefined
  amountFrom.value = undefined
  amountTo.value = undefined
  pagination.page = 1
  loadPayments()
  showFilters.value = false
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadPayments()
}

const addPayment = () => {
  router.push({
    path: `/payments/create`
  })
}

watch(search, () => {
  pagination.page = 1
  debouncedFn()
})

onMounted(() => {
  loadPortals()
  loadPayments()
  loadApps()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
