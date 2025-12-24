<template>
  <div>
    <!-- Карточки статистики -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardBlock :icon="UsersIcon" title="Пользователи" link="/users" :value="10" />
      <DashboardBlock :icon="CubeIcon" title="Приложения" link="/applications" :value="10" />
      <DashboardBlock :icon="BuildingOfficeIcon" title="Порталы" link="/portals" :value="10" />
      <DashboardBlock :icon="CreditCardIcon" title="Платежи" link="/payments" :value="10" />
      <DashboardBlock :icon="DocumentTextIcon" title="Подписки" link="/subscriptions" :value="10" />
      <DashboardBlock :icon="CurrencyDollarIcon" title="Тарифы" link="/tariffs" :value="10" />
    </div>

    <div class="mt-8">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Последние платежи</h3>
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" class="divide-y divide-gray-200">
          <li v-for="payment in recentPayments" :key="payment.id">
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div :class="[
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      payment.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    ]">
                      <CreditCardIcon :class="[
                        'h-5 w-5',
                        payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      ]" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ payment.portal }}</div>
                    <div class="text-sm text-gray-500">{{ payment.description }}</div>
                  </div>
                </div>
                <div class="flex items-center">
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">{{ payment.amount }} ₽</div>
                    <div :class="[
                      'inline-flex text-xs font-medium rounded-full px-2 py-1',
                      payment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    ]">
                      {{ payment.status === 'completed' ? 'Оплачено' : 'В ожидании' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  UsersIcon,
  CubeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'
import DashboardBlock from '@/components/dashboardBlock.vue';

// Mock data
const recentPayments = ref([
  { id: 1, portal: 'Компания А', amount: '5,000', status: 'completed', description: 'Тариф "Профессиональный"' },
  { id: 2, portal: 'Компания Б', amount: '3,500', status: 'pending', description: 'Тариф "Базовый"' },
  { id: 3, portal: 'Компания В', amount: '7,200', status: 'completed', description: 'Тариф "Корпоративный"' },
])
</script>
