<template>
  <div v-if="loading" class="text-center py-12">
    <ProgressSpinner />
  </div>
  <div v-else-if="application" class="space-y-6">
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/applications" class="hover:text-blue-600">Приложения</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>{{ application.name }}</span>
    </div>
    <h1 class="text-2xl font-bold">{{ application.name }}</h1>
    <CardPrime>
      <template #title>Основная информация</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium text-gray-700 mb-4">Данные приложения</h3>
            <dl class="space-y-3">
              <EditableText v-model:value="editData.name" label="Название" required :type="FieldTypes.Text"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }"
                @validation-change="onValidationChange('name', $event)" />
              <EditableText v-model:value="editData.description" label="Описание" :type="FieldTypes.TextArea"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }" />
              <EditableText v-model:value="editData.version" label="Версия" required :type="FieldTypes.Text"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }"
                @validation-change="onValidationChange('version', $event)" />
              <EditableBoolean v-model:value="editData.isActive" label="Активно" true-label="Активно"
                false-label="Не активно" :is-editing="globalEditing" @edit-start="() => { globalEditing = true }" />
              <EditableText v-model:value="editData.iconUrl" placeholder="Ссылка на иконку" :type="FieldTypes.Text"
                :is-editing="globalEditing" @edit-start="() => { globalEditing = true }" label="Ссылка на иконку" />
              <EditableNumber v-model:value="editData.sortOrder" placeholder="Номер для сортировки"
                :type="FieldTypes.Text" :min="0" :max="800" :is-editing="globalEditing"
                @edit-start="() => { globalEditing = true }" label="Номер для сортировки" />
              <div>
                <dt class="text-sm text-gray-500">Дата создания</dt>
                <dd>{{ formatDate(application.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Дата последнего изменения</dt>
                <dd>{{ formatDate(application.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
          <div>
            <div>
              <h3 class="font-medium text-gray-700 mb-4">Базовые лимиты</h3>
              <EditableJson :is-editing="globalEditing" @edit-start="() => { globalEditing = true }"
                label="Базовые лимиты" v-model:value="editData.settings"
                @validation-change="onValidationChange('settings', $event)" />
            </div>
          </div>
        </div>
      </template>
    </CardPrime>
    <div v-if="globalEditing" class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Сохранить" icon="pi pi-check" @click="updateApplication" :disabled="!canUpdate" />
      <ButtonPrime label="Отмена" severity="danger" outline @click="cancelEditing" />
    </div>
    <div v-else class="flex gap-2 items-center justify-end">
      <ButtonPrime label="Редактировать" icon="pi pi-pencil" @click="globalEditing = !globalEditing"
        :disabled="globalEditing" />
      <ButtonPrime label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDelete" />

    </div>
    <CardPrime>
      <template #title>Быстрые действия</template>
      <template #content>
        <div class="flex flex-wrap gap-3">
          <ButtonPrime label="Перейти к тарифам" icon="pi pi-send" severity="secondary" @click="goToTariffs" />
          <ButtonPrime label="Создать тариф" icon="pi pi-plus" severity="secondary" @click="goToCreateTariff" />
          <ButtonPrime label="Создать подписку" icon="pi pi-plus" severity="secondary"
            @click="goToCreateSubscription" />
        </div>
      </template>
    </CardPrime>

    <CardPrime>
      <template #title>
        <div class="flex justify-between">
          <p>Подписки на это приложение</p>
          <ButtonPrime label="Просмотреть все" icon="pi pi-external-link" @click="goToSubscriptions" />
        </div>
      </template>
      <template #content>
        <div v-if="subscriptions && subscriptions.length > 0">
          <SubscriptionTable :subscriptions="subscriptions" :loading="subscriptionsLoading" show-company
            @deleted="loadSubscriptions" />
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
    <h3 class="text-lg font-medium mb-2">Приложение не найдено</h3>
    <router-link to="/portals" class="text-blue-600 hover:underline">
      Вернуться к списку приложений
    </router-link>
  </div>

  <ConfirmDialog :draggable="true" />
</template>
<script setup lang="ts">
import EditableBoolean from '@/components/editableFields/EditableBoolean.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableText from '@/components/editableFields/EditableText.vue';
import SubscriptionTable from '@/components/SubscriptionTable.vue';
import EditableJson from '@/components/editableFields/EditableJson.vue';
import { formatDate } from '@/helpers/formatters';
import { applicationService, subscriptionService } from '@/services';
import { applicationDataToRequest, applyApplicationEditData, createApplicationEditData, SubscriptionDTO, type ApplicationDTO, type ApplicationEditData } from '@/types/dto';
import { FieldTypes, type ValidationResult } from '@/types/editable';
import { useToast, useConfirm } from 'primevue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const loading = ref(false)
const subscriptionsLoading = ref(false)
const globalEditing = ref(false)
const application = ref<ApplicationDTO | null>(null)
const subscriptions = ref<SubscriptionDTO[]>([])

const applicationId = route.params.id as string

const editData = reactive<ApplicationEditData>({
  name: '',
  description: '',
  version: '',
  isActive: true,
  iconUrl: '',
  sortOrder: 0,
})

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
const canUpdate = computed(() => validationErrors.value.length == 0);

const cancelEditing = () => {
  globalEditing.value = false;
  if (application.value) {
    Object.assign(editData, createApplicationEditData(application.value))
  }
}

const updateApplication = async () => {

  if (!application.value || !canUpdate.value)
    return;
  globalEditing.value = false;

  try {
    const response = await applicationService.updateApplication(applicationId, applicationDataToRequest(editData))
    if (response.success) {
      applyApplicationEditData(application.value, editData);
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
    console.error('Ошибка обновления :', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить данные приложения',
      life: 3000,
    })
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
        const response = await applicationService.deleteApplication(applicationId)
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Приложение удалено',
            life: 3000,
          })
          router.push('/applications')
        } else {
          toast.add({
            severity: 'error',
            summary: 'Не удалось удалить приложение',
            detail: response.message,
            life: 3000,
          })
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить приложение',
          life: 3000,
        })
      }
    },
  })
}

const loadApplication = async () => {
  loading.value = true
  try {
    const response = await applicationService.getApplication(applicationId)

    if (response.success) {
      application.value = response.data
      Object.assign(editData, createApplicationEditData(response.data))
      loadSubscriptions();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить приложение',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить приложение',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const loadSubscriptions = async () => {
  if (!application.value) return

  subscriptionsLoading.value = true
  try {
    const response = await subscriptionService.getSubscriptions({
      appId: applicationId,
      limit: 5,
      page: 1
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
  router.push({
    path: `/subscriptions`,
    query: { appId: applicationId }
  })
}
const goToTariffs = () => {
  router.push({
    path: `/tariffs`,
    query: { appId: applicationId }
  })
}

const goToCreateTariff = () => {
  router.push({
    path: `/tariffs/create`,
    query: { appId: applicationId }
  })
}

const goToCreateSubscription = () => {
  router.push({
    path: `/subscriptions/create`,
    query: { appId: applicationId }
  })
}

onMounted(() => {
  loadApplication();
})


</script>
