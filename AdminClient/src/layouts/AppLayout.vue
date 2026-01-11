<template>
  <div class="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
    <aside class="hidden lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
      <div class="flex items-center justify-between p-6">
        <router-link to="/">
          <span class="text-xl font-bold text-gray-900">AdminPanel</span>
        </router-link>
      </div>

      <nav class="mt-8 flex-1 space-y-1 px-4">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          :class="[
            'group flex items-center rounded-lg px-3 py-2 text-sm font-medium',
            isActive(item.to)
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'mr-3 h-5 w-5 shrink-0',
              isActive(item.to) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
            ]"
            aria-hidden="true"
          />
          {{ item.name }}
        </router-link>
      </nav>

      <div class="mt-auto border-t border-gray-200 p-4">
        <div class="flex items-center">
          <div class="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span class="text-white font-bold text-sm">
              {{ authStore.user?.name?.charAt(0) || 'U' }}
            </span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-700">{{ authStore.user?.name || 'User' }}</p>
            <p class="text-xs text-gray-500">{{ authStore.user?.role || 'Admin' }}</p>
          </div>
          <button
            @click="logout"
            class="ml-auto text-gray-400 hover:text-gray-500"
            title="Выйти"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>

    <div class="lg:hidden">
      <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="text-gray-500 hover:text-gray-600"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
        <router-link to="/" class="flex items-center space-x-2">
          <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <span class="text-white font-bold text-sm">A</span>
          </div>
          <span class="text-lg font-bold text-gray-900">Admin</span>
        </router-link>
        <div class="h-8 w-8"></div>
      </div>

      <!-- Мобильное меню -->
      <div v-if="mobileMenuOpen" class="bg-white shadow-lg">
        <div class="space-y-1 px-2 pb-3 pt-2">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            :class="[
              'block rounded-lg px-3 py-2 text-base font-medium',
              isActive(item.to)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            ]"
            @click="mobileMenuOpen = false"
          >
            <div class="flex items-center">
              <component
                :is="item.icon"
                :class="[
                  'mr-3 h-5 w-5',
                  isActive(item.to) ? 'text-primary-600' : 'text-gray-400'
                ]"
              />
              {{ item.name }}
            </div>
          </router-link>
        </div>
        <div class="border-t border-gray-200 px-4 py-3">
          <div class="flex items-center">
            <div class="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span class="text-white font-bold text-sm">
                {{ authStore.user?.name?.charAt(0) || 'U' }}
              </span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">{{ authStore.user?.name || 'User' }}</p>
              <p class="text-xs text-gray-500">{{ authStore.user?.role || 'Admin' }}</p>
            </div>
            <button
              @click="logout"
              class="ml-auto text-gray-400 hover:text-gray-500"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <main class="w-full p-4">
      <slot></slot>
    </main>
  </div>
  <ToastPrime />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

// Навигация
const navigation = [
  { name: 'Дашборд', to: '/', icon: HomeIcon },
  { name: 'Порталы', to: '/portals', icon: BuildingOfficeIcon },
  { name: 'Подписки', to: '/subscriptions', icon: DocumentTextIcon },
  { name: 'Платежи', to: '/payments', icon: CreditCardIcon},
  { name: 'Приложения', to: '/applications', icon: CubeIcon },
  { name: 'Тарифы', to: '/tariffs', icon: CurrencyDollarIcon },
  { name: 'Пользователи', to: '/users', icon: UsersIcon },
  { name: 'Настройки', to: '/settings', icon: Cog6ToothIcon },
  { name: 'Статистика', to: '/analytics', icon: ChartBarIcon },
]

const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

const logout = async () => {
  authStore.logout()
  mobileMenuOpen.value = false
  await router.push('/login')
}

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>
