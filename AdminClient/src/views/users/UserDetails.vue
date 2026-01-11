<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="user" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/admin-users" class="hover:text-blue-600">Пользователи</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ user.name }}</span>
    </div>

    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ user.name }}</h1>
        <div class="flex items-center gap-2 mt-2">
          <TagPrime :value="user.email" severity="info" />
          <TagPrime
            :value="user.isActive ? 'Активен' : 'Неактивен'"
            :severity="user.isActive ? 'success' : 'secondary'"
          />
          <TagPrime
            :value="getRoleLabel(user.role)"
            :severity="getRoleSeverity(user.role)"
          />
        </div>
      </div>
    </div>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные пользователя</h3>
            <dl class="space-y-3">
              <EditableText
                label="Имя"
                :type="FieldTypes.Text"
                v-model:value="editData.name"
                required
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <div>
                <dt class="text-sm text-gray-500">Email</dt>
                <dd class="text-gray-900 font-medium">{{ user.email }}</dd>
              </div>

              <EditableSelect
                label="Роль"
                v-model:value="editData.role"
                required
                :items="roleOptions"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableBoolean
                label="Активен"
                v-model:value="editData.isActive"
                true-label="Да"
                false-label="Нет"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <div>
                <dt class="text-sm text-gray-500">Последний вход</dt>
                <dd v-if="user.lastLogin" class="text-gray-900">
                  {{ formatDate(user.lastLogin) }}
                  <div class="text-xs text-gray-500">
                    {{ formatRelativeTime(user.lastLogin) }}
                  </div>
                </dd>
                <dd v-else class="text-gray-500">Никогда</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mb-4">Системная информация</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">ID пользователя</dt>
                <dd class="text-gray-900 font-mono text-sm">{{ user.id }}</dd>
              </div>

              <div>
                <dt class="text-sm text-gray-500">Создан</dt>
                <dd class="text-gray-900">{{ formatDate(user.createdAt) }}</dd>
              </div>

              <div>
                <dt class="text-sm text-gray-500">Обновлен</dt>
                <dd class="text-gray-900">{{ formatDate(user.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </template>
    </CardPrime>

    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime
        label="Сохранить"
        icon="pi pi-check"
        @click="updateUser"
        :disabled="!canUpdate"
      />
      <ButtonPrime
        label="Отмена"
        severity="danger"
        outline
        @click="cancelEditing"
      />
    </div>
    <div v-else class="flex gap-2 items-center justify-end">
      <ButtonPrime
        label="Редактировать"
        icon="pi pi-pencil"
        @click="startEditing"
      />
      <ButtonPrime
        label="Удалить"
        icon="pi pi-trash"
        severity="danger"
        @click="confirmDelete"
      />
    </div>
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Пользователь не найден</h3>
    <router-link to="/admin-users" class="text-blue-600 hover:underline">
      Вернуться к списку пользователей
    </router-link>
  </div>

  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast, useConfirm } from 'primevue'
import CardPrime from 'primevue/card'
import ButtonPrime from 'primevue/button'
import TagPrime from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

import { userService } from '@/services'

import { AdminRole } from '@/types/api/responses'
import { formatDate, formatRelativeTime } from '@/helpers/formatters'
import EditableText from '@/components/editableFields/EditableText.vue'
import EditableBoolean from '@/components/editableFields/EditableBoolean.vue'
import EditableSelect from '@/components/editableFields/EditableSelect.vue'
import { AdminUserDTO, type AdminUserEditData, createAdminUserEditData, adminUserDataToRequest, applyAdminUserEditData } from '@/types/dto'
import { FieldTypes } from '@/types/editable'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const userId = route.params.id as string

const loading = ref(false)
const user = ref<AdminUserDTO>()
const globalEditing = ref(false)
const validationErrors = ref<Array<{ field: string; message: string }>>([])

const canUpdate = computed(() => validationErrors.value.length === 0)

const editData = reactive<AdminUserEditData>({
  name: '',
  role: AdminRole.SUPPORT,
  isActive: true,
})

const roleOptions = [
  { value: AdminRole.SUPERADMIN, label: 'Суперадминистратор' },
  { value: AdminRole.ADMIN, label: 'Администратор' },
  { value: AdminRole.SUPPORT, label: 'Менеджер' }
]

const getRoleLabel = (role: AdminRole): string => {
  const roleLabels: Record<AdminRole, string> = {
    [AdminRole.SUPERADMIN]: 'Суперадминистратор',
    [AdminRole.ADMIN]: 'Администратор',
    [AdminRole.SUPPORT]: 'Менеджер'
  }
  return roleLabels[role] || role
}

const getRoleSeverity = (role: AdminRole): string => {
  const roleSeverities: Record<AdminRole, string> = {
    [AdminRole.SUPERADMIN]: 'danger',
    [AdminRole.ADMIN]: 'warning',
    [AdminRole.SUPPORT]: 'info'
  }
  return roleSeverities[role] || 'secondary'
}

const startEditing = () => {
  globalEditing.value = true
}

const cancelEditing = () => {
  globalEditing.value = false
  if (user.value) {
    Object.assign(editData, createAdminUserEditData(user.value))
  }
}

const updateUser = async () => {
  if (!canUpdate.value || !user.value) return

  try {
    const response = await userService.update(
      userId,
      adminUserDataToRequest(editData)
    )

    if (response.success) {
      applyAdminUserEditData(user.value, editData)
      globalEditing.value = false
      toast.add({
        severity: 'success',
        summary: 'Данные обновлены',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось обновить пользователя',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные пользователя',
      life: 3000,
    })
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `Вы действительно хотите удалить пользователя "${user.value?.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        const response = await userService.deleteUser(userId)
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Пользователь удален',
            life: 3000,
          })
          router.push('/admin-users')
        } else {
          toast.add({
            severity: 'error',
            summary: 'Не удалось удалить пользователя',
            detail: response.message,
            life: 3000,
          })
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить пользователя',
          life: 3000,
        })
      }
    },
  })
}

const loadUser = async () => {
  loading.value = true
  try {
    const response = await userService.getUser(userId)
    if (response.success) {
      user.value = response.data
      Object.assign(editData, createAdminUserEditData(response.data))
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить пользователя',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить пользователя',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUser()
})
</script>
