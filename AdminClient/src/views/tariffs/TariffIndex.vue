<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Тарифы</h1>
    <p class="text-gray-600">Управление тарифами приложений</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск тарифа" class="w-full" />
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
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addTariff" />
    </div>
  </div>

  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else class="space-y-6">
    <div v-if="hasTariffs">
      <TariffTable
        :tariffs="tariffs"
        :loading="loading"
        @deleted="loadTariffs"
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
        {{ search ? 'Ничего не найдено' : 'Тарифы не найдены' }}
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
    header="Фильтры тарифов"
    :style="{ width: '70%' }"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Приложение</label>
        <SelectPrime
          v-model="selectedAppId"
          class="w-full"
          :options="appsOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все приложения"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Статус</label>
        <SelectPrime
          v-model="selectedStatus"
          class="w-full"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все статусы"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Период</label>
        <SelectPrime
          v-model="selectedPeriod"
          class="w-full"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Все периоды"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Цена от</label>
          <InputNumber
            v-model="priceFrom"
            class="w-full"
            mode="currency"
            currency="RUB"
            locale="ru-RU"
            :min="0"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Цена до</label>
          <InputNumber
            v-model="priceTo"
            class="w-full"
            mode="currency"
            currency="RUB"
            locale="ru-RU"
            :min="0"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Пробный период</label>
        <SelectPrime
          v-model="hasTrial"
          class="w-full"
          :options="trialOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Любой пробный период"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Тариф по умолчанию</label>
        <SelectPrime
          v-model="isDefault"
          class="w-full"
          :options="defaultOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Любой"
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
import { tariffService, applicationService } from '@/services'
import type { ApplicationShortDTO, TariffDTO } from '@/types/dto'
import { useDebouncedFn } from '@/composables/useDebounce'
import TariffTable from '@/components/TariffTable.vue'
import type { TariffSearchParams } from '@/services/tariff.service'

const router = useRouter()
const toast = useToast()

const applications = ref<ApplicationShortDTO[]>([])
const tariffs = ref<TariffDTO[]>([])

const search = ref('')
const selectedAppId = ref<string>()
const selectedStatus = ref<string>()
const selectedPeriod = ref<string>()
const priceFrom = ref<number>()
const priceTo = ref<number>()
const hasTrial = ref<string>()
const isDefault = ref<string>()

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

const appsOptions = computed(() => applications.value?.map(x => x.selectOption) || [])

const statusOptions = [
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
]

const periodOptions = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' }
]

const trialOptions = [
  { value: 'true', label: 'С пробным периодом' },
  { value: 'false', label: 'Без пробного периода' }
]

const defaultOptions = [
  { value: 'true', label: 'По умолчанию' },
  { value: 'false', label: 'Не по умолчанию' }
]

const hasTariffs = computed(() => tariffs.value.length > 0)
const hasActiveFilters = computed(() => {
  return !!selectedAppId.value ||
         !!selectedStatus.value ||
         !!selectedPeriod.value ||
         !!priceFrom.value ||
         !!priceTo.value ||
         !!hasTrial.value ||
         !!isDefault.value
})

let abortController: AbortController | null = null

const { debouncedFn } = useDebouncedFn(() => {
  loadTariffs()
}, 700)

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

const loadTariffs = async () => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    loading.value = true

    const params: TariffSearchParams = {
      search: search.value,
      page: pagination.page,
      limit: pagination.limit
    }

    if (selectedAppId.value) params.appId = selectedAppId.value
    if (selectedStatus.value !== undefined) params.isActive = selectedStatus.value==='true'
    if (selectedPeriod.value) params.period = selectedPeriod.value
    if (priceFrom.value !== undefined) params.priceFrom = priceFrom.value
    if (priceTo.value !== undefined) params.priceTo = priceTo.value
    if (hasTrial.value !== undefined) {
      params.hasTrial = hasTrial.value === 'true'
    }
    if (isDefault.value !== undefined) {
      params.isDefault = isDefault.value === 'true'
    }

    const response = await tariffService.getTariffs(
      params,
      { signal: abortController.signal }
    )

    if (response.success) {
      tariffs.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить тарифы',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить тарифы',
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
  loadTariffs()
}

const resetFilters = () => {
  selectedAppId.value = undefined
  selectedStatus.value = undefined
  selectedPeriod.value = undefined
  priceFrom.value = undefined
  priceTo.value = undefined
  hasTrial.value = undefined
  isDefault.value = undefined
  pagination.page = 1
  loadTariffs()
  showFilters.value = false
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadTariffs()
}

const addTariff = () => {
  router.push({
    path: `/tariffs/create`
  })
}

watch(search, () => {
  pagination.page = 1
  debouncedFn()
})

onMounted(() => {
  loadApps()
  loadTariffs()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
