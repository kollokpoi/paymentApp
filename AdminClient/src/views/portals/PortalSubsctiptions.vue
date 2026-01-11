<template>
  <div v-if="loadingPortal" class="text-center py-12">
    <ProgressSpinner />
  </div>

  <div v-else-if="portal" class="space-y-6">
    <!-- Хлебные крошки -->
    <div class="flex items-center text-sm text-gray-500">
      <router-link to="/portals/" class="hover:text-blue-600">Порталы</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <router-link :to="`/portals/${portalId}`" class="hover:text-blue-600">{{ portalName }}</router-link>
      <i class="pi pi-chevron-right mx-2"></i>
      <span>Подписки</span>
    </div>

    <!-- Поиск и кнопка добавления -->
    <div class="mb-6">
      <div class="flex gap-3">
        <div class="flex-1">
          <InputText
            v-model="search"
            placeholder="Поиск по приложению"
            class="w-full"
          />
        </div>
        <ButtonPrime
          label="Добавить"
          icon="pi pi-plus"
          @click="addSubscription"
        />
      </div>
    </div>

    <!-- Компонент таблицы -->
    <div v-if="!searchLoading">
      <SubscriptionTable
        v-if="hasSubscriptions"
        :subscriptions="portalSubscriptions"
        :loading="loadingSubscriptions"
        @deleted="loadSubscriptions"
      />

      <div v-else class="text-center py-12">
        <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium mb-2">
          {{ search ? 'Ничего не найдено' : 'Подписки не найдены' }}
        </h3>
        <p v-if="search" class="text-gray-500 mb-4">
          Попробуйте изменить поисковый запрос
        </p>
        <ButtonPrime
          v-if="search"
          label="Очистить поиск"
          @click="search = ''"
          outlined
        />
      </div>
    </div>

    <div v-else class="text-center py-12">
      <ProgressSpinner />
    </div>

    <PaginatorPrime
      v-if="pagination?.total > pagination.limit"
      :rows="pagination.limit"
      :totalRecords="pagination.total"
      @page="onPageChange"
    />
  </div>

  <div v-else class="text-center py-12">
    <i class="pi pi-exclamation-circle text-4xl text-gray-300 mb-4"></i>
    <h3 class="text-lg font-medium mb-2">Портал не найден</h3>
    <router-link :to="`/portals/${portalId}`" class="text-blue-600 hover:underline">
      Вернуться к порталу
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { subscriptionService, portalService } from '@/services'
import type { PortalDTO, SubscriptionDTO } from '@/types/dto'
import { useDebouncedFn } from '@/composables/useDebounce'
import SubscriptionTable from '@/components/SubscriptionTable.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const portalId = route.params.id as string

const portal = ref<PortalDTO | null>(null)
const portalSubscriptions = ref<SubscriptionDTO[]>([])
const search = ref('')
const loadingPortal = ref(true)
const loadingSubscriptions = ref(true)
const searchLoading = ref(false)
let abortController: AbortController | null = null

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const hasSubscriptions = computed(() => portalSubscriptions.value.length > 0)
const portalName = computed(() =>
  portal.value?.companyName || portal.value?.b24Domain || 'Портал'
)

const { debouncedFn } = useDebouncedFn((searchTerm: string) => {
  loadSubscriptions(searchTerm)
}, 700)

const loadPortal = async () => {
  try {
    loadingPortal.value = true
    const response = await portalService.getPortal(portalId)

    if (response.success) {
      portal.value = response.data
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить портал',
        detail: response.message,
        life: 3000,
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Не удалось загрузить портал',
      life: 3000,
    })
  } finally {
    loadingPortal.value = false
  }
}

const loadSubscriptions = async (searchTerm?: string) => {
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()
  const isLoadingSearch = !!searchTerm

  try {
    if (isLoadingSearch) {
      searchLoading.value = true
    } else {
      loadingSubscriptions.value = true
    }

    const response = await subscriptionService.getSubscriptions({
      portalId,
      search: searchTerm,
      page: pagination.page,
      limit: pagination.limit
    }, { signal: abortController.signal })

    if (response.success) {
      portalSubscriptions.value = response.data.items
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить подписки',
        detail: response.message,
        life: 3000,
      })
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast.add({
        severity: 'error',
        summary: 'Не удалось загрузить подписки',
        life: 3000,
      })
    }
  } finally {
    if (isLoadingSearch) {
      searchLoading.value = false
    } else {
      loadingSubscriptions.value = false
    }
  }
}

const onPageChange = (event: any) => {
  pagination.page = event.page + 1
  loadSubscriptions(search.value)
}

const addSubscription = () => {
  router.push({
    path: `/subscription/create`,
    query: { portalId }
  })
}

watch(search, (newValue) => {
  debouncedFn(newValue)
})

onMounted(() => {
  loadPortal()
  loadSubscriptions()
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})
</script>
