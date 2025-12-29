<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="portal" class="space-y-6">
    <!-- Хлебные крошки -->
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/portals" class="hover:text-blue-600">Порталы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ portal.companyName || portal.b24Domain }}</span>
    </div>

    <!-- Заголовок -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ portal.companyName }}</h1>
        <p class="text-gray-600">{{ portal.b24Domain }}</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Редактировать" 
          icon="pi pi-pencil" 
          @click="editPortal" 
        />
        <Button 
          label="Удалить" 
          icon="pi pi-trash" 
          severity="danger" 
          outlined
          @click="confirmDelete" 
        />
      </div>
    </div>

    <!-- Основная информация -->
    <Card>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные портала</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Статус</dt>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Email администратора</dt>
                <dd class="font-medium">{{ portal.adminEmail }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Дата создания</dt>
                <dd>{{ portal.createdAt }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Последняя синхронизация</dt>
                <dd>{{ portal.lastSyncAt || 'Никогда' }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mb-4">Метаданные</h3>
            <div v-if="portal.metadata && Object.keys(portal.metadata).length > 0">
              <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(portal.metadata, null, 2) }}</pre>
            </div>
            <div v-else class="text-gray-500">Нет метаданных</div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Подписки -->
    <Card v-if="portal.subscriptions && portal.subscriptions.length > 0">
      <template #title>Активные подписки</template>
      <template #content>
        <DataTable :value="portal.subscriptions">
          <Column field="application.name" header="Приложение"></Column>
          <Column field="tariff.name" header="Тариф"></Column>
          <Column field="status" header="Статус">
            <template #body="{ data }">
              <Tag :value="data.status" />
            </template>
          </Column>
          <Column field="validUntil" header="Действует до">
            <template #body="{ data }">
              {{ data.validUntil}}
              <div class="text-xs text-gray-500" v-if="data.daysLeft">
                Осталось: {{ data.daysLeft }} дней
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Действия -->
    <Card>
      <template #title>Быстрые действия</template>
      <template #content>
        <div class="flex flex-wrap gap-3">
          <Button 
            label="Отправить уведомление" 
            icon="pi pi-send" 
            severity="secondary" 
          />
          <Button 
            label="Создать подписку" 
            icon="pi pi-plus" 
            severity="success" 
          />
        </div>
      </template>
    </Card>
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Портал не найден</h3>
    <router-link to="/portals" class="text-blue-600 hover:underline">
      Вернуться к списку порталов
    </router-link>
  </div>

  <!-- Диалоги -->
  <Dialog v-model:visible="editDialog" header="Редактирование портала">
    <!-- Форма редактирования -->
  </Dialog>

  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { PortalDTO } from '@/types/dto'
import { portalService } from '@/services'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const portal = ref<PortalDTO | null>(null)
const loading = ref(true)
const editDialog = ref(false)

const portalId = route.params.id as string

const loadPortal = async () => {
  try {
    loading.value = true
    const response = await portalService.getPortal(portalId)
    if(response.success)
        portal.value = response.data;
    else{
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: response.message || "Не получилось загрузить данные",
            life: 3000
        })
    }
  } catch (error) {
    console.error('Ошибка загрузки портала:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить данные портала',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}


const editPortal = () => {
  editDialog.value = true
}

const confirmDelete = () => {
  confirm.require({
    message: `Вы действительно хотите удалить портал "${portal.value?.companyName}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        // await portalService.deletePortal(portalId)
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Портал удален',
          life: 3000
        })
        router.push('/portals')
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить портал',
          life: 3000
        })
      }
    }
  })
}

onMounted(() => {
  loadPortal()
})
</script>