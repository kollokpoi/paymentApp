<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Порталы</h1>
    <p class="text-gray-600">Управление порталами Bitrix24</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск по названию или домену..." class="w-full" />
      </div>
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addPortal"></ButtonPrime>
    </div>
  </div>

  <div v-if="!loading">
    <div v-if="portals && portals.length > 0">
      <DataTable :value="portals" responsiveLayout="scroll" class="p-datatable-sm" stripedRows
        :rowClass="rowClassFunction" @row-click="onRowClick">

        <ColumnPrime field="companyName" header="Компания"></ColumnPrime>
        <ColumnPrime field="b24Domain" header="Домен"></ColumnPrime>
        <ColumnPrime field="adminEmail" header="Админстратор">
          <template #body="{ data }">
            {{ data.adminEmail }}
          </template>
        </ColumnPrime>
        <ColumnPrime field="subscriptions" header="Подписки">
          <template #body="{ data }">
            {{ data.subscriptions.length }}
          </template>
        </ColumnPrime>
      </DataTable>

      <PaginatorPrime v-if="pagination?.total > pagination.limit" :rows="pagination.limit"
        :totalRecords="pagination.total" @page="onPageChange" />
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
  <div v-else class="text-center py-12">
    <ProgressSpinner />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import { portalService } from '@/services'
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast'
import type { PortalDTO } from '@/types/dto'
import type { DataTableRowClickEvent } from 'primevue'
import { useDebouncedFn } from '@/composables/useDebounce';

const loading = ref(true)
const search = ref('')
const portals = ref<PortalDTO[]>([])
const router = useRouter();
const toast = useToast()

let abortController: AbortController | null = null

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const { debouncedFn } = useDebouncedFn((searchTerm: string) => {
  loadPortals(searchTerm)
}, 700)

const onRowClick = (event: DataTableRowClickEvent<PortalDTO>) => {
  const id = event.data.id
  router.push({
    path: `/portals/${id}`
  });
};

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadPortals(search.value)
}

const rowClassFunction = (): string => {
  const classes = ['cursor-pointer'];
  return classes.join(' ')
}

const loadPortals = async (searchTerm?: string) => {
  try {
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()

    loading.value = true
    const response = await portalService.getPortals({
      search: searchTerm,
      page: pagination.page,
      limit: pagination.limit
    }, { signal: abortController.signal })

    if (response.success) {
      portals.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    }
    else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить порталы',
        detail: response.message,
        life: 3000,
      })
    }

    console.log('Portals loaded:', portals.value)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить порталы',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const addPortal = () => {
  router.push({
    path: `/portals/create`
  })
}

watch(search, (newValue) => {
  debouncedFn(newValue)
})

onMounted(async () => {
  await loadPortals();
})
</script>
