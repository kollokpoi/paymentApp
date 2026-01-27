<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>
  <div v-else-if="payment" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/payments" class="hover:text-blue-600">Платежи</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ payment.description }}</span>
    </div>
    <h1 class="text-2xl font-bold">{{ payment.description }}</h1>
    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные платежа</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Дата создания</dt>
                <dd>{{ formatDate(payment.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Дата последнего изменения</dt>
                <dd>{{ formatDate(payment.updatedAt) }}</dd>
              </div>

              <EditableText v-model:value="editData.description" placeholder="Описание" :type="FieldTypes.Text"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }" label="Описание" />
              <div>
                <dt class="text-sm text-gray-500">Сумма платежа</dt>
                <dd>{{ formatCurrency(payment.amount) }}</dd>
              </div>
              <EditableText v-model:value="editData.external_id" placeholder="Внешний Id платежа"
                label="Внешний Id платежа" :type="FieldTypes.Text" :is-editing="globalEditing"
                @edit-start="() => { globalEditing = true }" />
              <div>
                <dt class="text-sm text-gray-500">Портал</dt>
                <router-link :to="`/portals/${payment.portalId}`" class="font-medium text-primary-600 hover:text-primary-500">
                  <dd>{{ payment.portal?.companyName }}</dd>
                </router-link>

              </div>
              <EditableSelect label="Статус платежа" :is-editing="globalEditing" placeholder="Статус платежа"
                v-model:value="editData.status" :items="statusOptions" @edit-start="() => { globalEditing = true }" />
              <div>
                <dt class="text-sm text-gray-500">Метод оплаты</dt>
                <dd>{{ payment.paymentMethod }}</dd>
              </div>
            </dl>
          </div>
          <div>
            <div>
              <h3 class="font-medium text-gray-700 mb-4">Метаданные</h3>
              <div v-if="payment.metadata && Object.keys(payment.metadata).length > 0">
                <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                  JSON.stringify(payment.metadata, null, 2)
                }}</pre>
              </div>
              <div v-else class="text-gray-500">Нет метаданных</div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>
    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Сохранить" icon="pi pi-check" @click="updatePayment" />
      <ButtonPrime label="Отмена" severity="danger" outline @click="cancelEditing" />
    </div>
    <div v-else class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Редактировать" icon="pi pi-pencil" @click="globalEditing = !globalEditing"
        :disabled="globalEditing" />
      <ButtonPrime label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
    </div>
  </div>
  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Платеж не найден</h3>
    <router-link to="/payments" class="text-blue-600 hover:underline">
      Вернуться к списку платежей
    </router-link>
  </div>

  <ConfirmDialog :draggable="true" />
</template>
<script setup lang="ts">
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import EditableText from '@/components/editableFields/EditableText.vue';
import { formatDate, formatCurrency } from '@/helpers/formatters';
import { paymentService } from '@/services';
import { PaymentStatus } from '@/types/api/responses';
import { applyPaymentEditData, createPaymentEditData, paymentDataToRequest, PaymentDTO, type PaymentEditData } from '@/types/dto';
import { FieldTypes } from '@/types/editable';
import { useToast, useConfirm } from 'primevue';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const paymentId = route.params.id as string

const loading = ref(false)
const globalEditing = ref(false)
const payment = ref<PaymentDTO | null>(null)

const editData = reactive<PaymentEditData>({
  status: PaymentStatus.PENDING,
  external_id: '',
  description: '',
  metadata: {}
})

const statusOptions = [
  { value: PaymentStatus.COMPLETED, label: 'Выполнен' },
  { value: PaymentStatus.FAILED, label: 'Ошибка' },
  { value: PaymentStatus.PENDING, label: 'В процессе' },
  { value: PaymentStatus.REFUNDED, label: 'Возврат' },
]

const updatePayment = async () => {
  if (!payment.value)
    return;
  globalEditing.value = false;

  try {
    const response = await paymentService.updatePayment(paymentId, paymentDataToRequest(editData))
    if (response.success) {
      applyPaymentEditData(payment.value, editData);
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
    console.error('Ошибка обновления платежа:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные платежа',
      life: 3000,
    })
  }
}

const cancelEditing = () => {
  globalEditing.value = false;
  if (payment.value) {
    Object.assign(editData, createPaymentEditData(payment.value))
  }
}

const confirmDelete = async () => {
  confirm.require({
    message: `Вы действительно хотите удалить платеж?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: "p-button-danger",
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        const response = await paymentService.deletePayment(paymentId)
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Платеж удален',
            life: 3000,
          })
          router.push('/payments')
        } else {
          toast.add({
            severity: 'error',
            summary: 'Не удалось удалить платеж',
            detail: response.message,
            life: 3000,
          })
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить платеж',
          life: 3000,
        })
      }
    },
  })
}

const loadPayment = async () => {
  loading.value = true
  try {
    const response = await paymentService.getPayment(paymentId)

    if (response.success) {
      payment.value = response.data
      Object.assign(editData, createPaymentEditData(response.data))
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить платеж',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить платеж',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPayment();
})

</script>
