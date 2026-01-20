<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Подписки</h1>
    <p class="text-gray-600">Управление подписками Bitrix24</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск подписки" class="w-full" />
      </div>
      <ButtonPrime
        label="Фильтры"
        icon="pi pi-filter"
        outlined
        @click="showFilters = true"
        :badge="hasActiveFilters ? '!' : null"
        :severity="hasActiveFilters ? 'warning' : 'secondary'"
        :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''"
      />
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addSubscription" />
    </div>
  </div>

  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else class="space-y-6">
    <div v-if="hasSubscriptions">
      <SubscriptionTable
        :subscriptions="subscriptions"
        :loading="loading"
        @deleted="loadSubscriptions"
        :showCompany="true"
      />
      <PaginatorPrime
        v-if="pagination?.total > pagination.limit"
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        @page="onPageChange"
      />
    </div>
    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-medium mb-2">
        {{ search ? 'Ничего не найдено' : 'Подписки не найдены' }}
      </h3>
      <p v-if="search" class="text-gray-500 mb-4">
        Попробуйте изменить поисковый запрос
      </p>
      <ButtonPrime v-if="search" label="Очистить поиск" @click="search = ''" outlined />
    </div>
  </div>

  <DialogPrime
    v-model:visible="showFilters"
    modal
    header="Фильтры подписок"
    :style="{ width: '80%' }"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Портал</label>
        <DropdownPrime
          v-model="selectedPortalId"
          class="w-full"
          :options="portalOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все порталы"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Статус</label>
        <DropdownPrime
          v-model="selectedStatus"
          class="w-full"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все статусы"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Приложение</label>
        <DropdownPrime
          v-model="selectedAppId"
          class="w-full"
          :options="appsOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все приложения"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <ButtonPrime
          label="Сбросить"
          icon="pi pi-filter-slash"
          @click="resetFilters"
          outlined
          severity="secondary"
        />
        <div class="flex gap-2">
          <ButtonPrime
            label="Отмена"
            @click="showFilters = false"
            outlined
          />
          <ButtonPrime
            label="Применить"
            @click="applyFilters"
            icon="pi pi-check"
          />
        </div>
      </div>
    </template>
  </DialogPrime>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { subscriptionService, portalService, applicationService } from '@/services'
import type { PortalShortDTO, SubscriptionDTO } from '@/types/dto'
import { useDebouncedFn } from '@/composables/useDebounce'
import SubscriptionTable from '@/components/SubscriptionTable.vue'
import type { SubscriptionSearchParams } from '@/services/subscription.service'
import type { ApplicationShortDTO } from '@/types/dto/ApplicationShortDTO'
import { SubscriptionStatus } from '@/types/api/responses'

const router = useRouter()
const toast = useToast()

const portals = ref<PortalShortDTO[]>([])
const applications = ref<ApplicationShortDTO[]>([])
const subscriptions = ref<SubscriptionDTO[]>([])

const search = ref('')
const selectedPortalId = ref<string>()
const selectedStatus = ref<string>()
const selectedAppId = ref<string>()
const dateFrom = ref<Date>()
const dateTo = ref<Date>()

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

const portalOptions = computed(() => [
  { value: undefined, label: 'Все порталы' },
  ...(portals.value?.map(x => x.selectOption) || [])
])
const appsOptions = computed(() => [
  { value: undefined, label: 'Все приложения' },
  ...(applications.value?.map(x => x.selectOption) || [])
])
const statusOptions = [
  { value: undefined, label: 'Все статусы' },
  { value: SubscriptionStatus.ACTIVE, label: 'Активные' },
  { value: SubscriptionStatus.TRIAL, label: 'Триал' },
  { value: SubscriptionStatus.EXPIRED, label: 'Истекшие' },
  { value: SubscriptionStatus.SUSPENDED, label: 'Приостановленные' },
  { value: SubscriptionStatus.CANCELED, label: 'Отмененные' }
]

const hasSubscriptions = computed(() => subscriptions.value.length > 0)
const hasActiveFilters = computed(() => {
  return !!selectedPortalId.value || !!selectedStatus.value || !!dateFrom.value || !!dateTo.value || !!selectedAppId.value
})

let abortController: AbortController | null = null

const { debouncedFn } = useDebouncedFn(() => {
  loadSubscriptions()
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

const loadSubscriptions = async () => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    loading.value = true

    const params: SubscriptionSearchParams = {
      search: search.value,
      page: pagination.page,
      limit: pagination.limit
    }

    if (selectedPortalId.value) {
      params.portalId = selectedPortalId.value
    }

    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    if(selectedAppId.value){
      params.appId = selectedAppId.value
    }

    const response = await subscriptionService.getSubscriptions(
      params,
      { signal: abortController.signal }
    )

    if (response.success) {
      subscriptions.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить подписки',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить подписки',
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
  loadSubscriptions()
}

const resetFilters = () => {
  selectedPortalId.value = undefined
  selectedStatus.value = undefined
  dateFrom.value = undefined
  dateTo.value = undefined
  selectedAppId.value = undefined
  pagination.page = 1
  loadSubscriptions()
  showFilters.value = false
}


const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadSubscriptions()
}

const addSubscription = () => {
  router.push({
    path: `/subscriptions/create`
  })
}

watch(search, () => {
  pagination.page = 1
  debouncedFn()
})

onMounted(() => {
  loadPortals()
  loadSubscriptions()
  loadApps()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
