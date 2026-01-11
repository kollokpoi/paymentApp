<template>
  <DataTable
    :value="tariffs"
    :loading="loading"
    :rowClass="rowClass"
    @row-click="handleRowClick"
    striped-rows
  >
    <ColumnPrime field="application.name" header="Приложение" sortable />
    <ColumnPrime field="name" header="Название тарифа" sortable>
      <template #body="{ data }">
        <div>
          <div class="font-medium">{{ data.name }}</div>
          <div class="text-sm text-gray-500">{{ data.code }}</div>
        </div>
      </template>
    </ColumnPrime>

    <ColumnPrime field="price" header="Цена" sortable>
      <template #body="{ data }">
        <div class="font-bold text-green-600">
          {{ formatCurrency(data.price) }}
          <span class="text-sm text-gray-500">/{{ getPeriodLabel(data.period) }}</span>
        </div>
      </template>
    </ColumnPrime>

    <ColumnPrime field="period" header="Период" sortable>
      <template #body="{ data }">
        <TagPrime :value="getPeriodLabel(data.period)" severity="info" />
      </template>
    </ColumnPrime>

    <ColumnPrime field="trialDays" header="Пробный период" sortable>
      <template #body="{ data }">
        <div v-if="data.trialDays > 0">
          <TagPrime :value="`${data.trialDays} дней`" severity="success" />
        </div>
        <div v-else class="text-gray-400">—</div>
      </template>
    </ColumnPrime>

    <ColumnPrime field="isActive" header="Статус" sortable>
      <template #body="{ data }">
        <div class="flex items-center gap-2">
          <TagPrime
            :value="data.isActive ? 'Активен' : 'Неактивен'"
            :severity="data.isActive ? 'success' : 'secondary'"
          />
          <i
            v-if="data.isDefault"
            class="pi pi-star-fill text-yellow-500"
            title="Тариф по умолчанию"
          />
        </div>
      </template>
    </ColumnPrime>

    <ColumnPrime field="sortOrder" header="Порядок" sortable />

    <ColumnPrime header="Действия">
      <template #body="{ data }">
        <div class="relative">
          <ButtonPrime
            icon="pi pi-ellipsis-h"
            text
            @click.stop="showMenu($event, data)"
            aria-haspopup="true"
            aria-controls="tariff-menu"
          />
        </div>
      </template>
    </ColumnPrime>
  </DataTable>

  <Menu
    id="tariff-menu"
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
import type { TariffDTO } from '@/types/dto'
import { tariffService } from '@/services/tariff.service'
import { formatCurrency } from '@/helpers/formatters'
import type { DataTableRowClickEvent } from 'primevue/datatable'
import type { PeriodType } from '@/types/api/responses'

interface Props {
  tariffs: TariffDTO[]
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
const selectedTariff = ref<TariffDTO | null>(null)

const menuItems = computed(() => {
  if (!selectedTariff.value) return []

  const tariff = selectedTariff.value
  const id = tariff.id

  return [
    {
      label: 'Редактировать',
      icon: 'pi pi-pencil',
      command: () => editTariff(id)
    },
    {
      label: tariff.isActive ? 'Деактивировать' : 'Активировать',
      icon: tariff.isActive ? 'pi pi-ban' : 'pi pi-check-circle',
      command: () => toggleActiveStatus(id, tariff.isActive)
    },
    {
      label: tariff.isDefault ? 'Снять умолчание' : 'Сделать по умолчанию',
      icon: tariff.isDefault ? 'pi pi-star' : 'pi pi-star-fill',
      command: () => toggleDefaultStatus(id, tariff.isDefault)
    },
    {
      label: 'Удалить',
      icon: 'pi pi-trash',
      command: () => confirmDelete(id),
      class: 'text-red-500',
      disabled: tariff.isDefault // Нельзя удалить тариф по умолчанию
    }
  ]
})

const handleRowClick = (event: DataTableRowClickEvent<TariffDTO>) => {
  const id = event.data.id
  router.push(`/tariffs/${id}`)
}

const showMenu = (event: Event, tariff: TariffDTO) => {
  event.stopPropagation()
  event.preventDefault()
  selectedTariff.value = tariff

  if (menuRef.value) {
    menuRef.value.toggle(event)
  }
}

const editTariff = (id: string) => {
  router.push(`/tariffs/${id}`)
}

const toggleActiveStatus = async (id: string, isActive: boolean) => {
  try {
    const response = await tariffService.updateTariff(id, {
      is_active: !isActive
    })

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: `Тариф ${!isActive ? 'активирован' : 'деактивирован'}`,
        life: 3000
      })
      emit('deleted')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось изменить статус тарифа',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось изменить статус тарифа',
      life: 3000
    })
  }
}

const toggleDefaultStatus = async (id: string, isDefault: boolean) => {
  try {
    const response = await tariffService.setAsDefault(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: isDefault ? 'Тариф снят с умолчания' : 'Тариф установлен по умолчанию',
        life: 3000
      })
      emit('deleted')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось изменить статус умолчания',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось изменить статус умолчания',
      life: 3000
    })
  }
}

const deleteTariff = async (id: string) => {
  try {
    const response = await tariffService.deleteTariff(id)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Тариф удален',
        life: 3000
      })
      emit('deleted')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось удалить тариф',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить тариф',
      life: 3000
    })
  }
}

const confirmDelete = (id: string) => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить тариф?',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: () => deleteTariff(id)
  })
}

const getPeriodLabel = (period: PeriodType): string => {
  const periodLabels: Record<PeriodType, string> = {
    day: 'день',
    week: 'неделя',
    month: 'месяц',
    year: 'год'
  }
  return periodLabels[period] || period
}

const rowClass = (data: TariffDTO) => {
  const classes = ['cursor-pointer']
  if (!data.isActive) classes.push('opacity-70')
  if (data.isDefault) classes.push('bg-yellow-50')
  return classes.join(' ')
}
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
