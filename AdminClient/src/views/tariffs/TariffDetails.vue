<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="tariff" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/tariffs" class="hover:text-blue-600">Тарифы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ tariff.name }}</span>
    </div>

    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ tariff.name }}</h1>
        <div class="flex items-center gap-2 mt-2">
          <TagPrime :value="tariff.code" severity="info" />
          <TagPrime
            :value="tariff.isActive ? 'Активен' : 'Неактивен'"
            :severity="tariff.isActive ? 'success' : 'secondary'"
          />
          <TagPrime
            v-if="tariff.isDefault"
            value="По умолчанию"
            severity="warning"
            icon="pi pi-star"
          />
        </div>
      </div>
    </div>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные тарифа</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Приложение</dt>
                <router-link
                  v-if="tariff.application"
                  :to="`/applications/${tariff.appId}`"
                  class="font-medium text-primary-600 hover:text-primary-500"
                >
                  <dd>{{ tariff.application.name }}</dd>
                </router-link>
                <dd v-else class="text-gray-500">{{ tariff.appId }}</dd>
              </div>

              <EditableText
                label="Название"
                :type="FieldTypes.Text"
                v-model:value="editData.name"
                required
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableText
                label="Код"
                :type="FieldTypes.Text"
                v-model:value="editData.code"
                required
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableText
                label="Описание"
                v-model:value="editData.description"
                :type="FieldTypes.TextArea"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableNumber
                label="Цена"
                v-model:value="editData.price"
                required
                :min="0"
                :step="0.01"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableSelect
                label="Период"
                v-model:value="editData.period"
                required
                :items="periodOptions"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableNumber
                label="Пробных дней"
                v-model:value="editData.trialDays"
                :min="0"
                :step="1"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />

              <EditableNumber
                label="Порядок сортировки"
                v-model:value="editData.sortOrder"
                :min="0"
                :step="1"
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

              <EditableBoolean
                label="По умолчанию"
                v-model:value="editData.isDefault"
                true-label="Да"
                false-label="Нет"
                :is-editing="globalEditing"
                @edit-start="startEditing"
              />
            </dl>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mt-6 mb-4">Лимиты</h3>
            <div v-if="editData.limits && Object.keys(editData.limits).length > 0">
              <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                JSON.stringify(editData.limits, null, 2)
              }}</pre>
            </div>
            <div v-else class="text-gray-500">Лимиты не установлены</div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime
        label="Сохранить"
        icon="pi pi-check"
        @click="updateTariff"
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
        :disabled="tariff.isDefault"
      />
    </div>

    <CardPrime>
      <template #title>
        <div class="flex justify-between">
          <p>Подписки на этот тариф</p>
          <ButtonPrime
            label="Просмотреть все"
            icon="pi pi-external-link"
            @click="goToSubscriptions"
          />
        </div>
      </template>
      <template #content>
        <div v-if="subscriptions && subscriptions.length > 0">
          <SubscriptionTable :subscriptions="subscriptions" :loading="subscriptionsLoading" show-company/>
        </div>
        <div v-else class="text-center py-12">
          <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium mb-2">Подписки не найдены</h3>
        </div>
      </template>
    </CardPrime>
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Тариф не найден</h3>
    <router-link to="/tariffs" class="text-blue-600 hover:underline">
      Вернуться к списку тарифов
    </router-link>
  </div>

  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast, useConfirm } from 'primevue'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

import { tariffService, subscriptionService } from '@/services'
import {applyTariffEditData, createTariffEditData, SubscriptionDTO, tariffDataToRequest, TariffDTO, type TariffEditData} from '@/types/dto'
import { FieldTypes } from '@/types/editable'
import { PeriodType } from '@/types/api/responses'
import EditableText from '@/components/editableFields/EditableText.vue'
import EditableNumber from '@/components/editableFields/EditableNumber.vue'
import EditableBoolean from '@/components/editableFields/EditableBoolean.vue'
import EditableSelect from '@/components/editableFields/EditableSelect.vue'
import SubscriptionTable from '@/components/SubscriptionTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const tariffId = route.params.id as string

const loading = ref(false)
const subscriptionsLoading = ref(false)
const tariff = ref<TariffDTO>()
const subscriptions = ref<SubscriptionDTO[]>([])
const globalEditing = ref(false)
const validationErrors = ref<Array<{ field: string; message: string }>>([])

const canUpdate = computed(() => validationErrors.value.length === 0)

const editData = reactive<TariffEditData>({
  name: '',
  code: '',
  description: '',
  price: 0,
  period: PeriodType.MONTH,
  trialDays: 0,
  isActive: true,
  isDefault: false,
  limits: {},
  features: [],
  sortOrder: 0,
})

const periodOptions = [
  { value: PeriodType.DAY, label: 'День' },
  { value: PeriodType.WEEK, label: 'Неделя' },
  { value: PeriodType.MONTH, label: 'Месяц' },
  { value: PeriodType.YEAR, label: 'Год' }
]

const startEditing = () => {
  globalEditing.value = true
}

const cancelEditing = () => {
  globalEditing.value = false
  if (tariff.value) {
    Object.assign(editData, createTariffEditData(tariff.value))
  }
}

const updateTariff = async () => {
  if (!canUpdate.value || !tariff.value) return

  try {
    const response = await tariffService.updateTariff(
      tariffId,
      tariffDataToRequest(editData)
    )

    if (response.success) {
      applyTariffEditData(tariff.value, editData)
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
        detail: response.message || 'Не удалось обновить тариф',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Ошибка обновления тарифа:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные тарифа',
      life: 3000,
    })
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `Вы действительно хотите удалить тариф "${tariff.value?.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        const response = await tariffService.deleteTariff(tariffId)
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Тариф удален',
            life: 3000,
          })
          router.push('/tariffs')
        } else {
          toast.add({
            severity: 'error',
            summary: 'Не удалось удалить тариф',
            detail: response.message,
            life: 3000,
          })
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить тариф',
          life: 3000,
        })
      }
    },
  })
}

const loadTariff = async () => {
  loading.value = true
  try {
    const response = await tariffService.getTariff(tariffId)
    if (response.success) {
      tariff.value = response.data
      Object.assign(editData, createTariffEditData(response.data))
      loadSubscriptions()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить тариф',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить тариф',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const loadSubscriptions = async () => {
  if (!tariff.value) return

  subscriptionsLoading.value = true
  try {
    const response = await subscriptionService.getSubscriptions({
      tariffId: tariffId,
      limit: 5,
      page:1
    })
    if (response.success) {
      subscriptions.value = response.data.items
    }
  } catch (error) {
    console.error('Ошибка загрузки подписок:', error)
  } finally {
    subscriptionsLoading.value = false
  }
}

const goToSubscriptions = () => {
  router.push(`/subscriptions?tariffId=${tariffId}`)
}

onMounted(() => {
  loadTariff()
})
</script>
