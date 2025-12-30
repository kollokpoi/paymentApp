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
      <div class="flex gap-2">
        <ButtonPrime label="Редактировать" icon="pi pi-pencil" @click="onEditStart" />
        <ButtonPrime
          label="Удалить"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="confirmDelete"
        />
      </div>
    </div>
    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные портала</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Статус</dt>
                <dd class="font-medium">{{ portal.isActive?'Активен':'Не активен' }}</dd>
              </div>
              <EditableText
                ref="companyField"
                v-model="portal.companyName"
                label="Название компании"
                placeholder="Компания"
                :is-editing="isGlobalEditing"
                :validators="companyValidators"
                @edit-start="onEditStart"
                @validation-change="onValidationChange('companyName', $event)"
              />
              <EditableText
                ref="emailField"
                v-model="portal.adminEmail"
                label="Email администратора"
                type="email"
                placeholder="admin@example.com"
                :is-editing="isGlobalEditing"
                @edit-start="onEditStart"
              />
              <EditableText
                ref="domainField"
                v-model="portal.b24Domain"
                label="Домен Bitrix"
                type="email"
                placeholder="admin@example.com"
                :is-editing="isGlobalEditing"
                :validators="domainValidators"
                @edit-start="onEditStart"
                @validation-change="onValidationChange('b24Domain', $event)"
              />
              <div>
                <dt class="text-sm text-gray-500">ID Bitrix</dt>
                <dd class="font-medium">{{ portal.b24MemberId }}</dd>
              </div>              
              <div>
                <dt class="text-sm text-gray-500">Дата создания</dt>
                <dd>{{ formatDate(portal.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Последняя синхронизация</dt>
                <dd>{{ portal.lastSyncAt ? formatDate(portal.lastSyncAt) : 'Никогда' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Последнее изменение</dt>
                <dd>{{ portal.lastSyncAt ? formatDate(portal.updatedAt) : 'Никогда' }}</dd>
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
    <div v-if="isGlobalEditing" class="flex items-center justify-center gap-2">
        <ButtonPrime label="Сохранить" icon="pi pi-pencil" :disabled="!canSave" @click="saveAll"/>
        <ButtonPrime
          label="Отменить"
          severity="danger"
          outlined
          @click="cancelAll"
        />
    </div>
    <!-- Подписки -->
    <CardPrime v-if="portal.subscriptions && portal.subscriptions.length > 0">
      <template #title>Активные подписки</template>
      <template #content>
        <DataTable :value="portal.subscriptions">
          <ColumnPrime field="application.name" header="Приложение"></ColumnPrime>
          <ColumnPrime field="tariff.name" header="Тариф"></ColumnPrime>
          <ColumnPrime field="status" header="Статус">
            <template #body="{ data }">
              <TagPrime :value="data.status" />
            </template>
          </ColumnPrime>
          <ColumnPrime field="validUntil" header="Действует до">
            <template #body="{ data }">
              {{ formatDate(data.validUntil)}}
              <div class="text-xs text-gray-500" v-if="data.daysLeft">
                Осталось: {{ data.daysLeft }} дней
              </div>
            </template>
          </ColumnPrime>
        </DataTable>
      </template>
    </CardPrime>

    <!-- Действия -->
    <CardPrime>
      <template #title>Быстрые действия</template>
      <template #content>
        <div class="flex flex-wrap gap-3">
          <ButtonPrime label="Отправить уведомление" icon="pi pi-send" severity="secondary" />
          <ButtonPrime label="Создать подписку" icon="pi pi-plus" severity="success" />
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


  <ToastPrime />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ref, onMounted,computed} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { PortalDTO } from '@/types/dto'
import { portalService } from '@/services'
import { formatDate } from '@/helpers/formatters'
import ProgressSpinner from 'primevue/progressspinner'
import type { ValidationResult } from '@/types/editable/EditableBase'
import type EditableBoolean from '@/components/editableFields/EditableBoolean.vue'
import type EditableEmail from '@/components/editableFields/EditableEmail.vue'
import EditableText from '@/components/editableFields/EditableText.vue'


const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const portalId = route.params.id as string
const portal = ref<PortalDTO | null>(null)
const loading = ref(true)

const isGlobalEditing = ref(false)
const showControls = ref(false)
const validationErrors = ref<Array<{field: string, message: string}>>([])

const statusField = ref<typeof EditableBoolean | null>(null)
const companyField = ref<typeof EditableText | null>(null)
const emailField = ref<typeof EditableEmail | null>(null)
const domainField = ref<typeof EditableText | null>(null)
const memberIdField = ref<typeof EditableText | null>(null)

const companyValidators = [
  (value: string) => {
    if (!value || value.trim().length < 2) {
      return { isValid: false, message: 'Название компании должно быть не менее 2 символов' }
    }
    return { isValid: true }
  }
]

const domainValidators = [
  (value: string) => {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Домен обязателен' }
    }
    if (!value.includes('.bitrix24')) {
      return { isValid: false, message: 'Должен содержать .bitrix24' }
    }
    return { isValid: true }
  }
]

const canSave = computed(() => {
  return validationErrors.value.length === 0
})

const onEditStart = () => {
  if (!showControls.value) {
    showControls.value = true
    isGlobalEditing.value = true
  }
}

const onValidationChange = (field: string, result: ValidationResult) => {
  validationErrors.value = validationErrors.value.filter(e => e.field !== field)
  
  if (!result.isValid && result.message) {
    validationErrors.value.push({
      field,
      message: result.message
    })
  }
}

const saveAll = async () => {
  if (!canSave.value) {
    alert('Исправьте ошибки валидации')
    return
  }
  
  const fields = [companyField, emailField, domainField]
  const validations = await Promise.all(
    fields.map(field => field.value?.validate() || Promise.resolve({ isValid: true }))
  )
  
  const hasErrors = validations.some(v => !v.isValid)
  if (hasErrors) {
    alert('Есть ошибки валидации')
    return
  }
  
  fields.forEach(field => field.value?.save())
  
  const data = {
    isActive: statusField.value?.getValue(),
    companyName: companyField.value?.getValue(),
    adminEmail: emailField.value?.getValue(),
    b24Domain: domainField.value?.getValue(),
  }
  
  console.log('Сохранение:', data)
  
  showControls.value = false
  isGlobalEditing.value = false
  validationErrors.value = []
}

const cancelAll = () => {
  const fields = [statusField, companyField, emailField, domainField]
  fields.forEach(field => field.value?.cancel())
  
  showControls.value = false
  isGlobalEditing.value = false
  validationErrors.value = []
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
          life: 3000,
        })
        router.push('/portals')
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

const loadPortal = async () => {
  try {
    loading.value = true
    const response = await portalService.getPortal(portalId)
    if (response.success) portal.value = response.data
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

onMounted(() => {
  loadPortal()
})
</script>
