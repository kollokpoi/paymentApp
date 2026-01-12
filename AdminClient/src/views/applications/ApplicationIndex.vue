<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Приложения</h1>
    <p class="text-gray-600">Управление приложениями Bitrix24</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск приложения" class="w-full" />
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
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addApplication" />
    </div>
  </div>

  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else class="space-y-6">
    <div v-if="hasApplications">
      <DataTable
        :value="applications"
        :loading="loading"
        :rowClass="rowClass"
        @row-click="handleRowClick"
        striped-rows
      >
        <ColumnPrime field="name" header="Название" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                v-if="data.iconUrl"
                :src="data.iconUrl"
                :alt="data.name"
                class="w-8 h-8 rounded"
              />
              <div>
                <div class="font-medium">{{ data.name }}</div>
                <div class="text-sm text-gray-500">{{ data.code }}</div>
              </div>
            </div>
          </template>
        </ColumnPrime>

        <ColumnPrime field="description" header="Описание" sortable>
          <template #body="{ data }">
            <div class="max-w-md truncate">{{ data.description }}</div>
          </template>
        </ColumnPrime>

        <ColumnPrime field="version" header="Версия" sortable />

        <ColumnPrime field="isActive" header="Статус" sortable>
          <template #body="{ data }">
            <TagPrime
              :value="data.isActive ? 'Активно' : 'Неактивно'"
              :severity="data.isActive ? 'success' : 'secondary'"
            />
          </template>
        </ColumnPrime>

        <ColumnPrime field="createdAt" header="Создано" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </ColumnPrime>

        <ColumnPrime header="Действия">
          <template #body="{ data }">
            <div class="relative">
              <ButtonPrime
                icon="pi pi-ellipsis-h"
                text
                @click.stop="showMenu($event, data)"
                aria-haspopup="true"
                aria-controls="application-menu"
              />
            </div>
          </template>
        </ColumnPrime>
      </DataTable>

      <Menu
        id="application-menu"
        ref="menuRef"
        :model="menuItems"
        :popup="true"
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
        {{ search ? 'Ничего не найдено' : 'Приложения не найдены' }}
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
    header="Фильтры приложений"
    :style="{ width: '60%' }"
  >
    <div class="flex flex-col gap-4">
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
        <label class="block text-sm font-medium mb-2">Версия</label>
        <InputText
          v-model="versionFilter"
          placeholder="Версия приложения"
          class="w-full"
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

  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Menu from 'primevue/menu'
import type { DataTableRowClickEvent } from 'primevue/datatable'

import { applicationService } from '@/services'
import type { ApplicationDTO } from '@/types/dto'
import { useDebouncedFn } from '@/composables/useDebounce'
import { formatDate } from '@/helpers/formatters'
import type { ApplicationSearchParams } from '@/services/application.service'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const applications = ref<ApplicationDTO[]>([])
const search = ref('')
const selectedStatus = ref<string>()
const versionFilter = ref('')

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

const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const selectedApplication = ref<ApplicationDTO | null>(null)
const statusOptions = [
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
]


const menuItems = computed(() => {
  if (!selectedApplication.value) return []

  const app = selectedApplication.value
  const id = app.id

  return [
    {
      label: 'Редактировать',
      icon: 'pi pi-pencil',
      command: () => editApplication(id)
    },
    {
      label: app.isActive ? 'Деактивировать' : 'Активировать',
      icon: app.isActive ? 'pi pi-ban' : 'pi pi-check-circle',
      command: () => toggleActiveStatus(id, app.isActive)
    },
    {
      label: 'Тарифы',
      icon: 'pi pi-dollar',
      command: () => viewTariffs(id)
    },
    {
      label: 'Удалить',
      icon: 'pi pi-trash',
      command: () => confirmDelete(id),
      class: 'text-red-500'
    }
  ]
})

const hasApplications = computed(() => applications.value.length > 0)
const hasActiveFilters = computed(() => {
  return !!selectedStatus.value || !!versionFilter.value
})

let abortController: AbortController | null = null

const { debouncedFn } = useDebouncedFn(() => {
  loadApplications()
}, 700)

const loadApplications = async () => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    loading.value = true

    const params: ApplicationSearchParams = {
      search: search.value,
      page: pagination.page,
      limit: pagination.limit
    }

    if (selectedStatus.value !== undefined) {
      params.isActive = selectedStatus.value==='true'
    }

    if (versionFilter.value) {
      params.version = versionFilter.value
    }

    const response = await applicationService.getApplications(
      params,
      { signal: abortController.signal }
    )

    if (response.success) {
      applications.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить приложения',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить приложения',
        life: 3000,
      })
    }
  } finally {
    loading.value = false
  }
}

// Обработчики кликов
const handleRowClick = (event: DataTableRowClickEvent<ApplicationDTO>) => {
  const id = event.data.id
  router.push(`/applications/${id}`)
}

const showMenu = (event: Event, application: ApplicationDTO) => {
  event.stopPropagation()
  event.preventDefault()
  selectedApplication.value = application

  if (menuRef.value) {
    menuRef.value.toggle(event)
  }
}

const editApplication = (id: string) => {
  router.push(`/applications/${id}`)
}

const toggleActiveStatus = async (id: string, isActive: boolean) => {
  try {
    const response = await applicationService.updateApplication(id, {
      is_active: !isActive
    })

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: `Приложение ${!isActive ? 'активировано' : 'деактивировано'}`,
        life: 3000
      })
      loadApplications()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось изменить статус',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось изменить статус',
      life: 3000
    })
  }
}

const viewTariffs = (id: string) => {
  router.push(`/tariffs?appId=${id}`)
}

const deleteApplication = async (id: string) => {
  try {
    const response = await applicationService.deleteApplication(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Приложение удалено',
        life: 3000
      })
      loadApplications()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось удалить приложение',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить приложение',
      life: 3000
    })
  }
}

const confirmDelete = (id: string) => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить приложение? Это действие нельзя отменить.',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: () => deleteApplication(id)
  })
}

const applyFilters = () => {
  showFilters.value = false
  pagination.page = 1
  loadApplications()
}

const resetFilters = () => {
  selectedStatus.value = undefined
  versionFilter.value = ''
  pagination.page = 1
  loadApplications()
  showFilters.value = false
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadApplications()
}

const addApplication = () => {
  router.push({
    path: `/applications/create`
  })
}

const rowClass = () => {
  return 'cursor-pointer'
}

// Наблюдатели
watch(search, () => {
  pagination.page = 1
  debouncedFn()
})

// Жизненный цикл
onMounted(() => {
  loadApplications()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
