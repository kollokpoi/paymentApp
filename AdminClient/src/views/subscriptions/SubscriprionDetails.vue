<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="subscription" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/subscriptions" class="hover:text-blue-600">Подписки</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ subscription.name }}</span>
    </div>
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ subscription.name }}</h1>
      </div>
    </div>
    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные подписки</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Портал</dt>
                <router-link :to="`/portals/${subscription.portalId}`"
                  class="font-medium text-primary-600 hover:text-primary-500">
                  <dd>{{ subscription.companyName }}</dd>
                </router-link>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Приложение</dt>
                <router-link :to="`/applications/${subscription.appId}`"
                  class="font-medium text-primary-600 hover:text-primary-500">
                  <dd>{{ subscription.application?.name }}</dd>
                </router-link>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Тариф</dt>
                <dd>{{ subscription.tariff?.name }}</dd>
              </div>
              <EditableSelect label="Статус" v-model:value="editData.status" required @edit-start="
                () => {
                  globalEditing = true
                }
              " :is-editing="globalEditing" :items="statusOptions" />
              <div>
                <dt class="text-sm text-gray-500">Дата начала</dt>
                <dd>{{ formatDate(subscription.validFrom) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Дата окончания</dt>
                <dd>{{ formatDate(subscription.validUntil) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Осталось дней</dt>
                <dd>{{ subscription.daysLeft }}</dd>
              </div>

              <EditableBoolean label="Автопродление" v-model:value="editData.autoRenew" :is-editing="globalEditing"
                true-label="Включено" false-label="отключено" @edit-start="
                  () => {
                    globalEditing = true
                  }
                " />
              <EditableText label="Пометки" v-model:value="editData.notes" :is-editing="globalEditing" @edit-start="
                () => {
                  globalEditing = true
                }
              " :type="FieldTypes.TextArea" />
            </dl>
          </div>
          <div>
            <div class="mb-4">
              <h3 class="font-medium text-gray-700 mb-4">Метаданные</h3>
              <div v-if="subscription.metadata && Object.keys(subscription.metadata).length > 0">
                <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                  JSON.stringify(subscription.metadata, null, 2)
                }}</pre>
              </div>
              <div v-else class="text-gray-500">Нет метаданных</div>
            </div>
            <div>
              <h3 class="font-medium text-gray-700 mb-4">Использованные возможности</h3>
              <div v-if="subscription.usedLimits && Object.keys(subscription.usedLimits).length > 0">
                <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                  JSON.stringify(subscription.usedLimits, null, 2)
                }}</pre>
              </div>
              <div v-else class="text-gray-500">Нет данных</div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>
    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Сохранить" icon="pi pi-check" @click="updateSubscription" :disabled="!canUpdate" />
      <ButtonPrime label="Отмена" severity="danger" outline @click="cancelEditing" />
    </div>
    <div v-else class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Продлить" icon="pi pi-pencil" @click="goToExtend" :disabled="globalEditing" />
      <ButtonPrime label="Редактировать" icon="pi pi-pencil" @click="globalEditing = !globalEditing"
        :disabled="globalEditing" />
      <ButtonPrime label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
    </div>
    <CardPrime>
      <template #title>
        <div class="flex justify-between">
          <p>Платежи</p>
          <ButtonPrime label="Все платежи" icon="pi pi-external-link" @click="goToPayments" />
        </div>
      </template>
      <template #content>
        <div v-if="payments">
          <PaymentTable :payments="payments" :loading="paymentsLoading" />
          <PaginatorPrime v-if="paymentPagination?.total > paymentPagination.limit" :rows="paymentPagination.limit"
            :totalRecords="paymentPagination.total" @page="onPageChange" />
        </div>
        <div v-else class="text-center py-12">
          <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium mb-2">Платежи не найдены</h3>
        </div>
      </template>
    </CardPrime>
  </div>
  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Подписка не найдена</h3>
    <router-link to="/subscriptions" class="text-blue-600 hover:underline">
      Вернуться к списку подписок
    </router-link>
  </div>
  <ConfirmDialog :draggable="true" />
</template>
<script setup lang="ts">
import { paymentService, subscriptionService, type PaymentSearchParams } from '@/services'
import {
  applySubscriptionEditData,
  createSubscriptionEditData,
  PaymentDTO,
  subscriptionDataToRequest,
  SubscriptionDTO,
  type SubscriptionEditData,
} from '@/types/dto'
import { FieldTypes } from '@/types/editable'
import { useToast, useConfirm } from 'primevue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EditableBoolean from '@/components/editableFields/EditableBoolean.vue'
import EditableText from '@/components/editableFields/EditableText.vue'
import EditableSelect from '@/components/editableFields/EditableSelect.vue'
import { SubscriptionStatus } from '@/types/api/responses'
import { formatDate } from '@/helpers/formatters'
import PaymentTable from '@/components/PaymentTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const subscriptionId = route.params.id as string

const loading = ref(false)
const paymentsLoading = ref(false)
const subscription = ref<SubscriptionDTO>()
const payments = ref<PaymentDTO[]>()
const globalEditing = ref(false)
const validationErrors = ref<Array<{ field: string; message: string }>>([])

const canUpdate = computed(() => validationErrors.value.length == 0)
const editData = reactive<SubscriptionEditData>({
  status: SubscriptionStatus.TRIAL,
  validUntil: new Date(),
  autoRenew: false,
  notes: '',
})

const paymentPagination = reactive({
  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const statusOptions = [
  { value: SubscriptionStatus.TRIAL, label: 'Триал' },
  { value: SubscriptionStatus.ACTIVE, label: 'Активна' },
  { value: SubscriptionStatus.EXPIRED, label: 'Истекла' },
  { value: SubscriptionStatus.SUSPENDED, label: 'Приостановлена' },
  { value: SubscriptionStatus.CANCELED, label: 'Отменена' },
]

const cancelEditing = () => {
  globalEditing.value = false
  if (subscription.value) {
    Object.assign(editData, createSubscriptionEditData(subscription.value))
  }
}

const updateSubscription = async () => {
  if (!canUpdate.value || !subscription.value) return
  globalEditing.value = false

  try {
    const response = await subscriptionService.updateSubscription(
      subscriptionId,
      subscriptionDataToRequest(editData),
    )
    if (response.success) {
      applySubscriptionEditData(subscription.value, editData)
      toast.add({
        severity: 'success',
        summary: 'Данные обновлены',
        life: 3000,
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
    console.error('Ошибка обновления подписки:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные подписки',
      life: 3000,
    })
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `Вы действительно хотите удалить подписку "${subscription.value?.companyName}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        const response = await subscriptionService.deleteSubscription(subscriptionId)
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
const goToExtend = () => {
  router.push(`/subscriptions/${subscriptionId}/extend`)
}
const loadSubscriprion = async () => {
  loading.value = true
  try {
    const response = await subscriptionService.getSubscription(subscriptionId)

    if (response.success) {
      subscription.value = response.data
      Object.assign(editData, createSubscriptionEditData(response.data))
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить приложения',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить приложения',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const onPageChange = (event: any) => {
  paymentPagination.page = event.page + 1
  loadPayments()
}

const goToPayments = () => {
  router.push(`/payments?subscriptionId=${subscriptionId}`)
}

const loadPayments = async () => {
  paymentsLoading.value = true
  try {
    const params: PaymentSearchParams = {
      page: paymentPagination.page,
      limit: paymentPagination.limit,
      subscriptionId: subscriptionId,
    }
    const response = await paymentService.getPayments(params)

    if (response.success) {
      payments.value = response.data.items
      paymentPagination.hasNext = response.data.hasNext
      paymentPagination.hasPrev = response.data.hasPrev
      paymentPagination.total = response.data.total
      paymentPagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить платежи',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить платежи',
      life: 3000,
    })
  } finally {
    paymentsLoading.value = false
  }
}

onMounted(() => {
  loadSubscriprion()
  loadPayments()
})
</script>
