<template>
  <div class="space-y-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Статистика подписок</h1>
      <p class="text-gray-600">Детальная статистика и аналитика подписок</p>
    </div>

    <CardPrime class="mb-6">
      <template #content>
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Начало</label>
              <DatePicker
                v-model="filters.startDate"
                dateFormat="dd.mm.yy"
                showIcon
                iconDisplay="input"
                placeholder="Выберите дату"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Конец</label>
              <DatePicker
                v-model="filters.endDate"
                dateFormat="dd.mm.yy"
                showIcon
                iconDisplay="input"
                placeholder="Выберите дату"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Приложение</label>
              <SelectPrime
                v-model="filters.appId"
                :options="[{label: 'Все', value: null}, ...apps]"
                optionLabel="label"
                optionValue="value"
                placeholder="Все приложения"
                class="w-full"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <ButtonPrime
              label="Применить"
              @click="loadStats"
              icon="pi pi-filter"
              :loading="loading"
            />
            <ButtonPrime
              label="Сбросить"
              @click="resetFilters"
              outlined
              severity="secondary"
            />
          </div>
        </div>
      </template>
    </CardPrime>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <CardPrime>
        <template #title>Всего подписок</template>
        <template #content>
          <div class="text-center py-4">
            <div class="text-4xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
            <div class="text-sm text-gray-500 mt-2">за все время</div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>Активные</template>
        <template #content>
          <div class="text-center py-4">
            <div class="text-4xl font-bold text-green-600">{{ stats.activeWithTrial || 0 }}</div>
            <div class="text-sm text-gray-500 mt-2">
              {{ stats.active || 0 }} активных + {{ stats.trial || 0 }} пробных
            </div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>Месячный доход</template>
        <template #content>
          <div class="text-center py-4">
            <div class="text-4xl font-bold text-blue-600">{{ formatCurrency(stats.monthlyRevenue || 0) }}</div>
            <div class="text-sm text-gray-500 mt-2">от активных подписок</div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>Истекают через неделю</template>
        <template #content>
          <div class="text-center py-4">
            <div class="text-4xl font-bold text-orange-600">{{ stats.expiring || 0 }}</div>
            <div class="text-sm text-gray-500 mt-2">требуют внимания</div>
          </div>
        </template>
      </CardPrime>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardPrime>
        <template #title>Распределение по статусам</template>
        <template #content>
          <div v-if="loading" class="h-64 flex items-center justify-center">
            <ProgressSpinner />
          </div>
          <div v-else >
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-700">Всего: {{ stats.total || 0 }}</div>
              <div class="text-sm text-gray-500">100%</div>
            </div>
            <div class="space-y-3">
              <div v-for="status in statusList" :key="status.value">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium">{{ status.label }}</span>
                  <span>{{ getStatusCount(status.value) }} ({{ getStatusPercentage(status.value) }}%)</span>
                </div>
                <ProgressBar 
                  :value="getStatusPercentage(status.value)"
                  :style="{'--p-progressbar-bg': status.color}"
                  class="h-2"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
              <div class="text-center">
                <div class="text-2xl font-bold">{{ stats.summary?.activePercentage || 0 }}%</div>
                <div class="text-sm text-gray-500">Активных</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">{{ stats.summary?.renewalRate || 0 }}%</div>
                <div class="text-sm text-gray-500">Конверсия</div>
              </div>
            </div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>Динамика за 6 месяцев</template>
        <template #content>
          <div v-if="loading" class="h-64 flex items-center justify-center">
            <ProgressSpinner />
          </div>
          <div v-else-if="!stats.monthlyStats?.length" class="h-64 flex flex-col items-center justify-center text-gray-500">
            <i class="pi pi-chart-line text-4xl mb-4"></i>
            <p>Нет данных</p>
          </div>
          <div v-else class="h-85 relative border-b border-l border-gray-200">
            <div 
              v-for="(month, index) in stats.monthlyStats"
              :key="month.month"
              class="absolute bottom-0 flex flex-col items-center"
              :style="{
                left: `${(index as number / (stats.monthlyStats.length - 1 || 1)) * 100}%`,
                transform: 'translateX(-50%)'
              }"
            >
              <div 
                class="w-8 bg-linear-to-t from-blue-500 to-blue-300 rounded-t"
                :style="{ height: `${Math.min((month.count / maxMonthlyCount) * 100, 100)}%` }"
                :title="`${month.count} подписок`"
              ></div>
              <div class="text-xs text-gray-500 mt-1 whitespace-nowrap -rotate-45 origin-top-left">
                {{ formatMonth(month.month) }}
              </div>
            </div>
          </div>
        </template>
      </CardPrime>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CardPrime>
        <template #title>По приложениям</template>
        <template #content>
          <div v-if="loading" class="h-48 flex items-center justify-center">
            <ProgressSpinner />
          </div>
          <div v-else-if="!stats.appStats?.length" class="h-48 flex flex-col items-center justify-center text-gray-500">
            <i class="pi pi-cube text-4xl mb-4"></i>
            <p>Нет данных</p>
          </div>
          <div v-else class="h-48 space-y-3 overflow-y-auto">
            <div 
              v-for="app in stats.appStats.slice(0, 5)"
              :key="app.appId"
              class="p-3 hover:bg-gray-50 rounded-lg"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium truncate">{{ app.appName || 'Без названия' }}</span>
                <span class="font-bold">{{ app.count }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  class="bg-green-500 h-2 rounded-full"
                  :style="{ width: `${(app.count / maxAppCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>По порталам</template>
        <template #content>
          <div v-if="loading" class="h-48 flex items-center justify-center">
            <ProgressSpinner />
          </div>
          <div v-else-if="!stats.portalStats?.length" class="h-48 flex flex-col items-center justify-center text-gray-500">
            <i class="pi pi-building text-4xl mb-4"></i>
            <p>Нет данных</p>
          </div>
          <div v-else class="h-48 space-y-3 overflow-y-auto">
            <div 
              v-for="portal in stats.portalStats.slice(0, 5)"
              :key="portal.portalId"
              class="p-3 hover:bg-gray-50 rounded-lg"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium truncate">{{ portal.portalName || 'Без названия' }}</span>
                <span class="font-bold">{{ portal.count }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full"
                  :style="{ width: `${(portal.count / maxPortalCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </template>
      </CardPrime>

      <CardPrime>
        <template #title>Ежедневная динамика (30 дней)</template>
        <template #content>
          <div v-if="loading" class="h-48 flex items-center justify-center">
            <ProgressSpinner />
          </div>
          <div v-else-if="!stats.dailyStats?.length" class="h-48 flex flex-col items-center justify-center text-gray-500">
            <i class="pi pi-calendar text-4xl mb-4"></i>
            <p>Нет данных</p>
          </div>
          <div v-else class="h-48 relative border-b border-l border-gray-200">
            <div 
              v-for="(day, index) in stats.dailyStats"
              :key="day.date"
              class="absolute bottom-0 flex flex-col items-center"
              :style="{
                left: `${(index as number / (stats.dailyStats.length - 1 || 1)) * 100}%`,
                transform: 'translateX(-50%)'
              }"
            >
              <div 
                class="w-3 bg-linear-to-t from-purple-500 to-purple-300 rounded-t"
                :style="{ height: `${Math.min((day.count / maxDailyCount) * 100, 100)}%` }"
                :title="`${day.count} подписок`"
              ></div>
            </div>
          </div>
        </template>
      </CardPrime>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { subscriptionService, applicationService } from '@/services'
import { formatCurrency } from '@/helpers/formatters'

const toast = useToast()
const loading = ref(false)
const apps = ref<any[]>([])
const stats = ref<any>({})

const filters = ref({
  startDate: null as Date | null,
  endDate: null as Date | null,
  appId: null as string | null
})

const statusList = [
  { value: 'active', label: 'Активные', color: '#10B981' },
  { value: 'trial', label: 'Пробные', color: '#F59E0B' },
  { value: 'suspended', label: 'Приостановлены', color: '#3B82F6' },
  { value: 'cancelled', label: 'Отменены', color: '#EF4444' },
  { value: 'expired', label: 'Истекли', color: '#6B7280' }
]

const loadStats = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.startDate) params.startDate = filters.value.startDate.toISOString()
    if (filters.value.endDate) params.endDate = filters.value.endDate.toISOString()
    if (filters.value.appId) params.appId = filters.value.appId

    const response = await subscriptionService.getStats(params)
    if (response.success) {
      stats.value = response.data
    } else {
      throw new Error(response.message)
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить статистику',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadApps = async () => {
  try {
    const response = await applicationService.getApplicationsList()
    if (response.success) {
      apps.value = response.data.map((app: any) => ({
        label: app.name,
        value: app.id
      }))
    }
  } catch (error) {
    console.error('Ошибка загрузки приложений:', error)
  }
}

const resetFilters = () => {
  filters.value = {
    startDate: null,
    endDate: null,
    appId: null
  }
  loadStats()
}

const getStatusCount = (status: string) => {
  switch (status) {
    case 'active': return stats.value.activeCount || 0
    case 'trial': return stats.value.trial || 0
    case 'suspended': return stats.value.suspended || 0
    case 'cancelled': return stats.value.cancelled || 0
    case 'expired': return stats.value.expired || 0
    default: return 0
  }
}

const getStatusPercentage = (status: string) => {
  const count = getStatusCount(status)
  return stats.value.total > 0 ? Math.round((count / stats.value.total) * 100) : 0
}

const formatMonth = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
}

const maxMonthlyCount = computed(() => {
  if (!stats.value.monthlyStats?.length) return 1
  return Math.max(...stats.value.monthlyStats.map((m: any) => m.count))
})

const maxDailyCount = computed(() => {
  if (!stats.value.dailyStats?.length) return 1
  return Math.max(...stats.value.dailyStats.map((d: any) => d.count))
})

const maxAppCount = computed(() => {
  if (!stats.value.appStats?.length) return 1
  return Math.max(...stats.value.appStats.map((a: any) => a.count))
})

const maxPortalCount = computed(() => {
  if (!stats.value.portalStats?.length) return 1
  return Math.max(...stats.value.portalStats.map((p: any) => p.count))
})

onMounted(() => {
  loadApps()
  loadStats()
})
</script>