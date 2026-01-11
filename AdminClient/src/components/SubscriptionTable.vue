<template>
  <DataTable
    :value="subscriptions"
    :loading="loading"
    :rowClass="rowClass"
    @row-click="handleRowClick"
    striped-rows
  >
    <ColumnPrime field="application.name" header="Приложение" sortable />
    <ColumnPrime v-if="showCompany" field="companyName" header="Компания" sortable />
    <ColumnPrime field="tariff.name" header="Тариф" sortable />
    <ColumnPrime field="status" header="Статус" sortable>
      <template #body="{ data }">
        <TagPrime
          :value="data.status"
          :severity="getStatusSeverity(data.status)"
        />
      </template>
    </ColumnPrime>
    <ColumnPrime field="validUntil" header="Действует до" sortable>
      <template #body="{ data }">
        <div>{{ formatDate(data.validUntil) }}</div>
        <div class="text-xs text-gray-500">
          Осталось: {{ data.daysLeft }} {{ pluralizeDays(data.daysLeft) }}
        </div>
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
            aria-controls="subscription-menu"
          />

        </div>
      </template>
    </ColumnPrime>
  </DataTable>

  <Menu
    id="subscription-menu"
    ref="menuRef"
    :model="menuItems"
    :popup="true"
  />
  <ConfirmDialog
    :draggable="true" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Menu from 'primevue/menu' // Добавляем импорт Menu
import type { SubscriptionDTO } from '@/types/dto'
import { subscriptionService } from '@/services/subscription.service'
import { formatDate, pluralizeDays } from '@/helpers/formatters'
import type { DataTableRowClickEvent } from 'primevue/datatable'

interface Props {
  subscriptions: SubscriptionDTO[]
  loading: boolean
  showCompany?:boolean
}

interface Emits {
  (e: 'deleted'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const menuRef = ref<InstanceType<typeof Menu> | null>(null)
const selectedSubscription = ref<SubscriptionDTO | null>(null)

const menuItems = computed(() => {
  if (!selectedSubscription.value) return []

  const subscription = selectedSubscription.value
  const id = subscription.id

  return [
    {
      label: 'Редактировать',
      icon: 'pi pi-pencil',
      command: () => editSubscription(id)
    },
    {
      label: 'Продлить',
      icon: 'pi pi-calendar-plus',
      command: () => extendSubscription(id),
      disabled: !subscription.isActive
    },
    {
      label: 'Удалить',
      icon: 'pi pi-trash',
      command: () => confirmDelete(id),
      class: 'text-red-500'
    }
  ]
})

const handleRowClick = (event: DataTableRowClickEvent<SubscriptionDTO>) => {
  const id = event.data.id
  router.push(`/subscriptions/${id}`)
}

const showMenu = (event: Event, subscription: SubscriptionDTO) => {
  event.stopPropagation()
  event.preventDefault()
  selectedSubscription.value = subscription

  if (menuRef.value) {
    menuRef.value.toggle(event)
  }
}

const editSubscription = (id: string) => {
  router.push(`/subscriptions/${id}`)
}

const extendSubscription = (id: string) => {
  router.push(`/subscription/${id}/extend`)
}

const deleteSubscription = async (id: string) => {
  try{
    const response = await subscriptionService.deleteSubscription(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Подписка удалена',
        life: 3000
      })
      emit('deleted')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось удалить подписку',
        life: 3000
      })
    }
  }catch{
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось удалить подписку',
        life: 3000
      })
  }
}

const confirmDelete = (id: string) => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить подписку?',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass:"p-button-danger",
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: () => deleteSubscription(id)
  })
}

const getStatusSeverity = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    expired: 'danger',
    pending: 'warning',
    cancelled: 'secondary',
    trial: 'info',
    suspended: 'warning'
  }
  return statusMap[status] || 'info'
}

const rowClass = (data: SubscriptionDTO) => {
  const classes = ['cursor-pointer']
  if (!data.isActive) classes.push('opacity-50')
  return classes.join(' ')
}
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
