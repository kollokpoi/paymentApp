<template>
  <div>
    <!-- Карточки статистики -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardBlock :icon="UsersIcon" title="Пользователи" link="/users" :value="usersCount" />
      <DashboardBlock :icon="CubeIcon" title="Приложения" link="/applications" :value="applicationsCount" />
      <DashboardBlock :icon="BuildingOfficeIcon" title="Порталы" link="/portals" :value="portalsCount" />
      <DashboardBlock :icon="CreditCardIcon" title="Платежи" link="/payments" :value="paymentsCount" />
      <DashboardBlock :icon="DocumentTextIcon" title="Подписки" link="/subscriptions" :value="subscriptionsCount" />
      <DashboardBlock :icon="CurrencyDollarIcon" title="Тарифы" link="/tariffs" :value="tariffsCount" />
    </div>

    <div class="mt-8">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Последние платежи</h3>
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UsersIcon,
  CubeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'
import DashboardBlock from '@/components/dashboardBlock.vue';
import {
  applicationService,
  portalService,
  paymentService,
  subscriptionService,
  tariffService,
  userService
} from '@/services'

const usersCount = ref<number>(0)
const applicationsCount = ref<number>(0)
const portalsCount = ref<number>(0)
const paymentsCount = ref<number>(0)
const subscriptionsCount = ref<number>(0)
const tariffsCount = ref<number>(0)

const loadDashboardData = async () => {
  try {
    const [
      userResponse,
      appsResponse,
      portalsResponse,
      paymentsResponse,
      subscriptionsResponse,
      tariffsResponse
    ] = await Promise.all([
      userService.getActiveCount(),
      applicationService.getActiveCount(),
      portalService.getActiveCount(),
      paymentService.getActiveCount(),
      subscriptionService.getActiveCount(),
      tariffService.getActiveCount()
    ])
    if (userResponse.success) usersCount.value = userResponse.data
    if (appsResponse.success) applicationsCount.value = appsResponse.data
    if (portalsResponse.success) portalsCount.value = portalsResponse.data
    if (paymentsResponse.success) paymentsCount.value = paymentsResponse.data
    if (subscriptionsResponse.success) subscriptionsCount.value = subscriptionsResponse.data
    if (tariffsResponse.success) tariffsCount.value = tariffsResponse.data

  } catch (error) {
    console.error('Ошибка загрузки данных дашборда:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})

</script>
