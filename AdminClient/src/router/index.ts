import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Импортируем layout компоненты
import Layout from '@/layouts/AppLayout.vue'

// Типы для метаданных маршрутов
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    subtitle?: string
    layout?: unknown
    roles?: string[]
  }
}

// Ленивая загрузка компонентов страниц
const LoginPage = () => import('@/views/LoginPage.vue')
const NotFoundPage = () => import('@/views/NotFoundPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const PortalsIndex = () => import('@/views/portals/PortalsIndex.vue')
const PortalsDetails = () => import('@/views/portals/PortalsDetails.vue')
const SubscriptionsPage = () => import('@/views/SubscriptionsPage.vue')
const PaymentsPage = () => import('@/views/PaymentsPage.vue')
const ApplicationsPage = () => import('@/views/ApplicationsPage.vue')
const TariffsPage = () => import('@/views/TariffsPage.vue')
const UsersPage = () => import('@/views/UsersPage.vue')
const SettingsPage = () => import('@/views/SettingsPage.vue')
const AnalyticsPage = () => import('@/views/AnalyticsPage.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      title: 'Вход',
      requiresAuth: false,
    }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      title: 'Дашборд',
      subtitle: 'Обзор системы',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/portals',
    name: 'portals',
    meta: {
      requiresAuth: true,
      layout: Layout 
    },
    children: [
      {
        path: '', 
        name: 'portals-list',
        component: PortalsIndex,
        meta: { 
          title: 'Порталы',
          subtitle: 'Управление порталами Bitrix24'
        }
      },
      {
        path: ':id',
        name: 'portal-detail',
        component: PortalsDetails,
        meta: { 
          title: 'Детали портала'
        }
      }
    ]
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: SubscriptionsPage,
    meta: {
      title: 'Подписки',
      subtitle: 'Активные подписки и их статус',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/payments',
    name: 'payments',
    component: PaymentsPage,
    meta: {
      title: 'Платежи',
      subtitle: 'История и управление платежами',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/applications',
    name: 'applications',
    component: ApplicationsPage,
    meta: {
      title: 'Приложения',
      subtitle: 'Доступные приложения',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/tariffs',
    name: 'tariffs',
    component: TariffsPage,
    meta: {
      title: 'Тарифы',
      subtitle: 'Настройка тарифных планов',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/users',
    name: 'users',
    component: UsersPage,
    meta: {
      title: 'Пользователи',
      subtitle: 'Управление пользователями системы',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: {
      title: 'Настройки',
      subtitle: 'Настройки системы',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsPage,
    meta: {
      title: 'Аналитика',
      subtitle: 'Статистика и отчеты',
      requiresAuth: true,
      layout: Layout
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      title: 'Страница не найдена',
      layout: Layout
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

let isCheckingAuth = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.title) {
    document.title = `${to.meta.title} | Админ-панель`
  }

  if (isCheckingAuth) {
    next()
    return
  }

  if (!authStore.isInitialized) {
    isCheckingAuth = true
    try {
      await authStore.initialize()
    } finally {
      isCheckingAuth = false
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
    })
  }
  else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  }
  else if (to.meta.roles && authStore.user) {
    const userRole = authStore.user.role || 'user'
    if (!to.meta.roles.includes(userRole)) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  }
  else {
    next()
  }
})

router.onError((error) => {
  console.error('Router navigation error:', error)

  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Module load failed, try refreshing the page')
  }
})

export default router
