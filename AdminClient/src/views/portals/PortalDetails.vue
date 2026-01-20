<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="portal" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/portals" class="hover:text-blue-600">Порталы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ portal.companyName || portal.b24Domain }}</span>
    </div>
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ portal.companyName }}</h1>
        <p class="text-gray-600">{{ portal.b24Domain }}</p>
      </div>
    </div>
    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные портала</h3>
            <dl class="space-y-3">
              <EditableBoolean label="Статус" v-model:value="editData.isActive" :type="FieldTypes.Boolean"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }" />
              <EditableText label="Название компании" placeholder="Компания" v-model:value="editData.companyName"
                :validators="companyValidators" :type="FieldTypes.Text" :is-editing="globalEditing" required
                @edit-start="() => { globalEditing = true }"
                @validation-change="onValidationChange('companyName', $event)" />
              <EditableText label="Домен Bitrix" placeholder="Домен" v-model:value="editData.b24Domain"
                :validators="domainValidators" :type="FieldTypes.Text" :is-editing="globalEditing" required
                @edit-start="() => { globalEditing = true }"
                @validation-change="onValidationChange('b24Domain', $event)" />
              <EditableText label="Почта администратора" placeholder="Почта" v-model:value="editData.adminEmail"
                :type="FieldTypes.Email" :is-editing="globalEditing"
                @edit-start="() => { globalEditing = true }" />
              <div>
                <dt class="text-sm text-gray-500">Дата создания</dt>
                <dd>{{ formatDate(portal.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Последняя синхронизация</dt>
                <dd>{{ portal.lastSyncAt ? formatDate(portal.lastSyncAt) : 'Никогда' }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mb-4">Метаданные</h3>
            <div v-if="portal.metadata && Object.keys(portal.metadata).length > 0">
              <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                JSON.stringify(portal.metadata, null, 2)
              }}</pre>
            </div>
            <div v-else class="text-gray-500">Нет метаданных</div>
          </div>
        </div>
      </template>
    </CardPrime>
    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Сохранить" icon="pi pi-check" @click="updatePortal" :disabled="!canUpdate" />
      <ButtonPrime label="Отмена" severity="danger" outline @click="cancelEditing" />
    </div>
    <div v-else class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Редактировать" icon="pi pi-pencil" @click="globalEditing = !globalEditing"
        :disabled="globalEditing" />
      <ButtonPrime label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
    </div>
    <!-- Подписки -->
    <CardPrime v-if="portal.subscriptions && portal.subscriptions.length > 0">
      <template #title>
        <div class="flex justify-between">
          <p>Активные подписки</p>
          <ButtonPrime label="Управление" icon="pi pi-pencil" @click="goToSubscriptions" />
        </div>
      </template>
      <template #content>
        <SubscriptionTable :subscriptions="portal.subscriptions" :loading="loading" />
      </template>
    </CardPrime>

    <!-- Действия -->
    <CardPrime>
      <template #title>Быстрые действия</template>
      <template #content>
        <div class="flex flex-wrap gap-3">
          <ButtonPrime label="Отправить уведомление" icon="pi pi-send" severity="secondary" />
          <ButtonPrime label="Создать подписку" icon="pi pi-plus" severity="success" @click="" />
        </div>
      </template>
    </CardPrime>
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Портал не найден</h3>
    <router-link to="/portals" class="text-blue-600 hover:underline">
      Вернуться к списку порталов
    </router-link>
  </div>

  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { PortalDTO, PortalEditData } from '@/types/dto'
import { portalService } from '@/services'
import { formatDate } from '@/helpers/formatters'
import EditableText from '@/components/editableFields/EditableText.vue'
import { FieldTypes, type ValidationResult } from '@/types/editable'
import EditableBoolean from '@/components/editableFields/EditableBoolean.vue'
import { portalDataToRequest, applyPortalEditData, createPortalEditData } from '@/types/dto'
import { domainValidators, companyValidators } from '@/helpers/validators'
import SubscriptionTable from '@/components/SubscriptionTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const portalId = route.params.id as string

const portal = ref<PortalDTO | null>(null)
const editData = reactive<PortalEditData>({
  isActive: false,
  companyName: '',
  adminEmail:'',
  b24Domain: '',
})

const loading = ref(true)
const globalEditing = ref(false)
const validationErrors = ref<Array<{ field: string, message: string }>>([])

const onValidationChange = (field: string, result: ValidationResult) => {
  validationErrors.value = validationErrors.value.filter(e => e.field !== field)

  if (!result.isValid && result.message) {
    validationErrors.value.push({
      field,
      message: result.message
    })
  }
  console.log(validationErrors)
}

const confirmDelete = () => {
  confirm.require({
    message: `Вы действительно хотите удалить портал "${portal.value?.companyName}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: "p-button-danger",
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        const response = await portalService.deletePortal(portalId)
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Портал удален',
            life: 3000,
          })
          router.push('/portals')
        } else {
          toast.add({
            severity: 'error',
            summary: 'Не удалось удалить портал',
            detail: response.message,
            life: 3000,
          })
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить портал',
          life: 3000,
        })
      }
    },
  })
}

const canUpdate = computed(() => validationErrors.value.length == 0);

const cancelEditing = () => {
  globalEditing.value = false;
  if (portal.value) {
    Object.assign(editData, createPortalEditData(portal.value))
  }
}

const updatePortal = async () => {
  if (!canUpdate.value || !portal.value)
    return;
  globalEditing.value = false;

  try {
    const response = await portalService.updatePortal(portalId, portalDataToRequest(editData))
    if (response.success) {
      applyPortalEditData(portal.value, editData);
      toast.add({
        severity: 'success',
        summary: 'Данные обновлены',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не получилось загрузить данные',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Ошибка обновления портала:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные портала',
      life: 3000,
    })
  }
}

const loadPortal = async () => {
  try {
    loading.value = true
    const response = await portalService.getPortal(portalId)
    if (response.success) {
      portal.value = response.data
      Object.assign(editData, createPortalEditData(response.data))

    }
    else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не получилось загрузить данные',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Ошибка загрузки портала:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить данные портала',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const goToSubscriptions = () => {
  router.push({
    path: `/portals/${portalId}/subscriptions`
  });
}

const goToCreateSubscription = () => {
  router.push({
    path: `/subscriptions/create`,
    query: { portalId: portalId }
  })
}

onMounted(() => {
  loadPortal()
})
</script>
