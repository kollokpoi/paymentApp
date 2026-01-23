<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Пользователи админки</h1>
    <p class="text-gray-600">Управление администраторами системы</p>
  </div>

  <div class="mb-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <InputText v-model="search" placeholder="Поиск по email или имени" class="w-full" />
      </div>
      <ButtonPrime label="Фильтры" icon="pi pi-filter" outlined @click="showFilters = true"
        :badge="hasActiveFilters ? '!' : null" :severity="hasActiveFilters ? 'warning' : 'secondary'"
        :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
      <ButtonPrime label="Добавить" icon="pi pi-plus" @click="addUser" />
    </div>
  </div>

  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else class="space-y-6">
    <div v-if="hasUsers">
      <DataTable :value="users" :loading="loading" :rowClass="rowClass" @row-click="handleRowClick" striped-rows>
        <ColumnPrime field="email" header="Email" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <Avatar :label="data.name.charAt(0)" class="bg-primary text-white" size="normal" shape="circle" />
              <div>
                <div class="font-medium">{{ data.email }}</div>
                <div class="text-sm text-gray-500">{{ data.name }}</div>
              </div>
            </div>
          </template>
        </ColumnPrime>

        <ColumnPrime field="role" header="Роль" sortable>
          <template #body="{ data }">
            <TagPrime :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
          </template>
        </ColumnPrime>

        <ColumnPrime field="isActive" header="Статус" sortable>
          <template #body="{ data }">
            <TagPrime :value="data.isActive ? 'Активен' : 'Неактивен'"
              :severity="data.isActive ? 'success' : 'secondary'" />
          </template>
        </ColumnPrime>

        <ColumnPrime field="lastLogin" header="Последний вход" sortable>
          <template #body="{ data }">
            <div v-if="data.lastLogin">
              {{ formatDate(data.lastLogin) }}
              <div class="text-xs text-gray-500">
                {{ formatRelativeTime(data.lastLogin) }}
              </div>
            </div>
            <div v-else class="text-gray-400">Никогда</div>
          </template>
        </ColumnPrime>

        <ColumnPrime field="createdAt" header="Создан" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </ColumnPrime>

        <ColumnPrime header="Действия">
          <template #body="{ data }">
            <div class="relative">
              <ButtonPrime icon="pi pi-ellipsis-h" text @click.stop="showMenu($event, data)" aria-haspopup="true"
                aria-controls="user-menu" />
            </div>
          </template>
        </ColumnPrime>
      </DataTable>

      <Menu id="user-menu" ref="menuRef" :model="menuItems" :popup="true" />

      <PaginatorPrime v-if="pagination?.total > pagination.limit" :rows="pagination.limit"
        :totalRecords="pagination.total" @page="onPageChange" />
    </div>

    <div v-else class="text-center py-12">
      <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-medium mb-2">
        {{ search ? 'Ничего не найдено' : 'Пользователи не найдены' }}
      </h3>
      <p v-if="search" class="text-gray-500 mb-4">
        Попробуйте изменить поисковый запрос
      </p>
      <ButtonPrime v-if="search" label="Очистить поиск" @click="search = ''" outlined />
    </div>
  </div>

  <DialogPrime v-model:visible="showFilters" modal header="Фильтры пользователей" :style="{ width: '60%' }">
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Статус</label>
        <SelectPrime v-model="selectedStatus" class="w-full" :options="statusOptions" optionLabel="label"
          optionValue="value" placeholder="Все статусы" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Роль</label>
        <SelectPrime v-model="selectedRole" class="w-full" :options="roleOptions" optionLabel="label"
          optionValue="value" placeholder="Все роли" />
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

  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Menu from 'primevue/menu'
import Avatar from 'primevue/avatar'
import type { DataTableRowClickEvent } from 'primevue/datatable'

import type { AdminUserDTO } from '@/types/dto'
import { AdminRole } from '@/types/api/responses'
import { useDebouncedFn } from '@/composables/useDebounce'
import { formatDate, formatRelativeTime } from '@/helpers/formatters'
import { userService, type AdminUserSearchParams } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const store = useAuthStore()

const users = ref<AdminUserDTO[]>([])
const search = ref('')
const selectedStatus = ref<string>()
const selectedRole = ref<string>()

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
const selectedUser = ref<AdminUserDTO | null>(null)

const statusOptions = [
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
]

const roleOptions = [
  { value: AdminRole.SUPERADMIN, label: 'Суперадминистратор' },
  { value: AdminRole.ADMIN, label: 'Администратор' },
  { value: AdminRole.SUPPORT, label: 'Менеджер' }
]

const menuItems = computed(() => {
  if (!selectedUser.value) return []

  const user = selectedUser.value
  const id = user.id
  const userId = store.user?.id

  return [
    {
      label: 'Редактировать',
      icon: 'pi pi-pencil',
      command: () => editUser(id)
    },
    {
      label: 'Удалить',
      icon: 'pi pi-trash',
      command: () => confirmDelete(id),
      class: 'text-red-500',
      disabled: user.role === AdminRole.ADMIN || id === userId
    }
  ]
})

const hasUsers = computed(() => users.value.length > 0)
const hasActiveFilters = computed(() => {
  return !!selectedStatus.value || !!selectedRole.value
})

let abortController: AbortController | null = null

const { debouncedFn } = useDebouncedFn(() => {
  loadUsers()
}, 700)

const loadUsers = async () => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    loading.value = true

    const params: AdminUserSearchParams = {
      search: search.value,
      page: pagination.page,
      limit: pagination.limit
    }

    if (selectedStatus.value !== undefined) {
      params.isActive = selectedStatus.value === 'true'
    }

    if (selectedRole.value) {
      params.role = selectedRole.value as AdminRole
    }

    const response = await userService.getUsers(
      params,
      { signal: abortController.signal }
    )

    if (response.success) {
      users.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить пользователей',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить пользователей',
        life: 3000,
      })
    }
  } finally {
    loading.value = false
  }
}

// Вспомогательные функции
const getRoleLabel = (role: AdminRole) => {
  const roleLabels: Record<AdminRole, string> = {
    [AdminRole.SUPERADMIN]: 'Суперадмин',
    [AdminRole.ADMIN]: 'Администратор',
    [AdminRole.SUPPORT]: 'модератор'
  }
  return roleLabels[role] || role
}

const getRoleSeverity = (role: AdminRole) => {
  const roleSeverities: Record<AdminRole, string> = {
    [AdminRole.SUPERADMIN]: 'danger',
    [AdminRole.ADMIN]: 'warning',
    [AdminRole.SUPPORT]: 'info'
  }
  return roleSeverities[role] || 'secondary'
}

const handleRowClick = (event: DataTableRowClickEvent<AdminUserDTO>) => {
  const id = event.data.id
  const userId = store.user?.id
  if (userId !== id) {
    router.push(`/users/${id}`)
  } else {
    router.push(`/users/me`)
  }

}

const showMenu = (event: Event, user: AdminUserDTO) => {
  event.stopPropagation()
  event.preventDefault()
  selectedUser.value = user

  if (menuRef.value) {
    menuRef.value.toggle(event)
  }
}

const editUser = (id: string) => {
  router.push(`/users/${id}`)
}

const deleteUser = async (id: string) => {
  try {
    const response = await userService.deleteUser(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Пользователь удален',
        life: 3000
      })
      loadUsers()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось удалить пользователя',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить пользователя',
      life: 3000
    })
  }
}

const confirmDelete = (id: string) => {
  const user = selectedUser.value
  const isAdmin = user?.role === AdminRole.SUPERADMIN || user?.role === AdminRole.ADMIN
  const userId = store.user?.id
  const isSelfdelete = id === userId

  if (isSelfdelete) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Нельзя удалить свой аккаунт',
      life: 3000
    })
    return
  }

  if (isAdmin) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Нельзя удалить администратора',
      life: 3000
    })
    return
  }

  confirm.require({
    message: 'Вы уверены, что хотите удалить пользователя? Это действие нельзя отменить.',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: () => deleteUser(id)
  })
}

const applyFilters = () => {
  showFilters.value = false
  pagination.page = 1
  loadUsers()
}

const resetFilters = () => {
  selectedStatus.value = undefined
  selectedRole.value = undefined
  pagination.page = 1
  loadUsers()
  showFilters.value = false
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadUsers()
}

const addUser = () => {
  router.push({
    path: `/users/create`
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
  loadUsers()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
