<template>
  <div class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/payments" class="hover:text-blue-600">Платежи</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Создание платежа</span>
    </div>

    <h1 class="text-2xl font-bold">Создание нового платежа</h1>

    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Данные платежа</h3>

            <div>
              <label class="block text-sm font-medium mb-2">
                Портал <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.portal_id" :options="portalOptions" optionLabel="label" optionValue="value"
                placeholder="Выберите портал" class="w-full" :filter="true" :loading="portalLoading"
                :invalid="!formData.portal_id" />
              <small v-if="!formData.portal_id" class="text-red-500 text-xs">
                Портал обязателен
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Сумма <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <InputNumber v-model="formData.amount" :min="0.01" :max="999999" :minFractionDigits="2"
                  :maxFractionDigits="2" class="flex-1" :invalid="!formData.amount || formData.amount <= 0" />
              </div>
              <small v-if="!formData.amount || formData.amount <= 0" class="text-red-500 text-xs">
                Сумма должна быть больше 0
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Статус <span class="text-red-500">*</span>
              </label>
              <SelectPrime v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value"
                placeholder="Выберите статус" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Описание</label>
              <InputText v-model="formData.description" placeholder="Описание платежа" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Метод оплаты</label>
              <InputText v-model="formData.payment_method" placeholder="Например: credit_card, bank_transfer"
                class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Внешний ID</label>
              <InputText v-model="formData.external_id" placeholder="ID платежа во внешней системе" class="w-full" />
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Дополнительно</h3>

            <div>
              <label class="block text-sm font-medium mb-2">Метаданные (JSON)</label>
              <TextareaPrime v-model="jsonMetadata" placeholder='{"invoice_id": "123", "note": "Оплата за услуги"}'
                class="w-full font-mono text-sm" rows="8" autoResize @input="handleJsonInput" />
              <small class="text-gray-500 text-xs">
                Дополнительные метаданные платежа в формате JSON
              </small>
              <div v-if="jsonError" class="text-red-500 text-sm mt-1">
                {{ jsonError }}
              </div>

              <div v-if="Object.keys(formData.metadata || {}).length > 0" class="mt-4">
                <h4 class="font-medium mb-2">Предварительный просмотр:</h4>
                <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(formData.metadata, null, 2) }}
                </pre>
              </div>
            </div>

            <div class="pt-4 border-t">
              <h4 class="font-medium mb-2">Информация о портале</h4>
              <div v-if="selectedPortalInfo" class="bg-gray-50 p-3 rounded">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="text-gray-500">Домен:</div>
                  <div class="font-medium">{{ selectedPortalInfo.domain }}</div>

                  <div class="text-gray-500">Компания:</div>
                  <div class="font-medium">
                    {{
                      selectedPortalInfo.name
                    }}
                  </div>

                  <div class="text-gray-500">баланс:</div>
                  <div class="font-medium">
                    {{ selectedPortalInfo.balance }}
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-400 text-sm">
                Выберите подписку для просмотра информации
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="flex gap-2 justify-end">
      <ButtonPrime label="Отмена" icon="pi pi-times" outlined @click="cancel" />
      <ButtonPrime label="Создать" icon="pi pi-check" :disabled="!isFormValid || creating" @click="createPayment" />
    </div>
  </div>
  <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { paymentService, portalService } from '@/services'
import { PaymentStatus } from '@/types/api/responses'
import type { CreatePaymentRequest } from '@/services/payment.service'
import type { PortalShortDTO } from '@/types/dto'
import { useConfirm } from 'primevue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const creating = ref(false)
const jsonError = ref<string | null>(null)
const jsonMetadata = ref('')
const portals = ref<PortalShortDTO[]>([])
const portalLoading = ref(false)
const fromExtend = computed(() => route.query.fromExtend === 'true')

const formData = reactive<CreatePaymentRequest>({
  portal_id: '',
  amount: 0,
  status: PaymentStatus.PENDING,
  description: '',
  payment_method: '',
  external_id: '',
  metadata: {},
})

const statusOptions = [
  { value: PaymentStatus.PENDING, label: 'В процессе' },
  { value: PaymentStatus.COMPLETED, label: 'Выполнен' },
  { value: PaymentStatus.FAILED, label: 'Ошибка' },
  { value: PaymentStatus.REFUNDED, label: 'Возврат' },
]

const portalOptions = computed(() => {
  return portals.value.map((portal) => (portal.selectOption))
})

const selectedPortalInfo = computed(() => {
  return portals.value.find((sub) => sub.id === formData.portal_id)
})

const isFormValid = computed(() => {
  return !!formData.portal_id && !!formData.amount && formData.amount > 0 && !!formData.status
})


const handleJsonInput = () => {
  jsonError.value = null

  if (!jsonMetadata.value.trim()) {
    formData.metadata = {}
    return
  }

  try {
    const parsed = JSON.parse(jsonMetadata.value)
    formData.metadata = parsed
  } catch {
    jsonError.value = 'Некорректный JSON формат'
  }
}

const loadSubscriptions = async () => {
  portalLoading.value = true
  try {
    const response = await portalService.getPortalsList()

    if (response.success) {
      portals.value = response.data
    }
  } catch (error) {
    console.error('Ошибка загрузки порталов:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить список порталов',
      life: 3000,
    })
  } finally {
    portalLoading.value = false
  }
}

const createPayment = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Заполните обязательные поля',
      detail: 'Портал, сумма и статус обязательны',
      life: 3000,
    })
    return
  }

  creating.value = true

  try {
    const response = await paymentService.createPayment(formData)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Платеж создан',
        life: 3000,
      })

      router.push(`/payments/${response.data.id}`)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: response.message || 'Не удалось создать платеж',
        life: 3000,
      })
    }
  } catch (error: any) {
    console.error('Ошибка создания платежа:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось создать платеж',
      life: 3000,
    })
  } finally {
    creating.value = false
  }
}

const cancel = () => {
  if (formData.portal_id || formData.amount || jsonMetadata.value) {
    confirm.require({
      message: `Вы уверены? Введенные данные будут потеряны.`,
      header: 'Отмена создания',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: 'Выход',
      rejectLabel: 'Продолжить',
      accept() {
        router.push('/payments')
      },
    })
  } else {
    router.push('/payments')
  }
}

onMounted(() => {
  loadSubscriptions()
  if (route.query.subscriptionId) {
    formData.portal_id = route.query.subscriptionId as string
  }

  if (route.query.amount) {
    formData.amount = parseFloat(route.query.amount as string) || 0
  }
})
</script>

<style scoped>
/* Стили для невалидных полей */
:deep(.p-inputtext.p-invalid),
:deep(.p-dropdown.p-invalid) {
  border-color: #f87171;
}
</style>
