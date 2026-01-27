<template>
  <DataTable
    :value="payments"
    :loading="loading"
    :rowClass="rowClass"
    @row-click="handleRowClick"
    striped-rows
  >
    <ColumnPrime field="portal.companyName" header="Портал" sortable />
    <ColumnPrime field="amount" header="Сумма" sortable>
      <template #body="{ data }">
        <div class="font-medium">
          {{ formatCurrency(data.amount) }}
        </div>
      </template>
    </ColumnPrime>
    <ColumnPrime field="status" header="Статус" sortable>
      <template #body="{ data }">
        <TagPrime
          :value="getStatusLabel(data.status)"
          :severity="getStatusSeverity(data.status)"
        />
      </template>
    </ColumnPrime>
    <ColumnPrime field="paymentMethod" header="Способ оплаты" sortable />
    <ColumnPrime field="createdAt" header="Дата платежа" sortable>
      <template #body="{ data }">
        {{ formatDate(data.createdAt) }}
      </template>
    </ColumnPrime>
    <ColumnPrime field="description" header="Описание" sortable />
    <ColumnPrime header="Действия">
      <template #body="{ data }">
        <div class="relative">
          <ButtonPrime
            icon="pi pi-ellipsis-h"
            text
            @click.stop="showMenu($event, data)"
            aria-haspopup="true"
            aria-controls="payment-menu"
          />
        </div>
      </template>
    </ColumnPrime>
  </DataTable>

  <Menu
    id="payment-menu"
    ref="menuRef"
    :model="menuItems"
    :popup="true"
  />
  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Menu from 'primevue/menu'
import type { PaymentDTO } from '@/types/dto'
import { paymentService } from '@/services/payment.service'
import { formatDate, formatCurrency } from '@/helpers/formatters'
import type { DataTableRowClickEvent } from 'primevue/datatable'

interface Props {
  payments: PaymentDTO[]
  loading: boolean
}

interface Emits {
  (e: 'deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const menuRef = ref<InstanceType<typeof Menu> | null>(null)
const selectedPayment = ref<PaymentDTO | null>(null)

const menuItems = computed(() => {
  if (!selectedPayment.value) return []

  const payment = selectedPayment.value
  const id = payment.id

  return [
    {
      label: 'Просмотреть',
      icon: 'pi pi-eye',
      command: () => viewPayment(id)
    },
    {
      label: 'Удалить',
      icon: 'pi pi-trash',
      command: () => confirmDelete(id),
      class: 'text-red-500'
    }
  ]
})

const handleRowClick = (event: DataTableRowClickEvent<PaymentDTO>) => {
  const id = event.data.id
  router.push(`/payments/${id}`)
}

const showMenu = (event: Event, payment: PaymentDTO) => {
  event.stopPropagation()
  event.preventDefault()
  selectedPayment.value = payment

  if (menuRef.value) {
    menuRef.value.toggle(event)
  }
}

const viewPayment = (id: string) => {
  router.push(`/payments/${id}`)
}

const deletePayment = async (id: string) => {
  try {
    const response = await paymentService.deletePayment(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Платеж удален',
        life: 3000
      })
      emit('deleted')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось удалить платеж',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить платеж',
      life: 3000
    })
  }
}

const confirmDelete = (id: string) => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить платеж?',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      await deletePayment(id)
      confirm.close()
    }
  })
}

const getStatusSeverity = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
    refunded: 'info',
    canceled: 'secondary'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    completed: 'Успешно',
    pending: 'Ожидает',
    failed: 'Ошибка',
    refunded: 'Возврат',
    canceled: 'Отменен'
  }
  return labelMap[status] || status
}

const rowClass = (data: PaymentDTO) => {
  const classes = ['cursor-pointer']
  if (data.status === 'failed') classes.push('opacity-70')
  return classes.join(' ')
}
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
