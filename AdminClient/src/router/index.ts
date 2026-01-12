import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'


import Layout from '@/layouts/AppLayout.vue'


declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    subtitle?: string
    layout?: unknown
    roles?: string[]
  }
}

const LoginPage = () => import('@/views/LoginPage.vue')
const NotFoundPage = () => import('@/views/NotFoundPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')

const PortalsIndex = () => import('@/views/portals/PortalIndex.vue')
const PortalsDetails = () => import('@/views/portals/PortalDetails.vue')
const PortalSubscriptions = () => import('@/views/portals/PortalSubsctiptions.vue')
const PortalCreate = () => import('@/views/portals/CreatePortal.vue')

const SubscriptionsIndex = () => import('@/views/subscriptions/SubscriprionIndex.vue')
const SubscriptionsDetails = () => import('@/views/subscriptions/SubscriprionDetails.vue')
const SubscriprionCreate = () => import('@/views/subscriptions/SubscriptionCreate.vue')
const SubscriprionExtend = () => import('@/views/subscriptions/SubscriptionExtends.vue')


const Paymentindex = () => import('@/views/payment/PaymentIndex.vue')
const PaymentDetails = () => import('@/views/payment/PaymentDetails.vue')
const PaymentCreate = () => import('@/views/payment/PaymentCreate.vue')

const ApplicationIndex = () => import('@/views/applications/ApplicationIndex.vue')
const ApplicationDetail = () => import('@/views/applications/ApplicationDetails.vue')
const ApplicationCreate = () => import('@/views/applications/ApplicationCreate.vue')

const TariffsIndex = () => import('@/views/tariffs/TariffIndex.vue')
const TariffsDetail = () => import('@/views/tariffs/TariffDetails.vue')
const TariffCreate = () => import('@/views/tariffs/CreateTariff.vue')

const UsersIndex = () => import('@/views/users/UserIndex.vue')
const UsersDetails = () => import('@/views/users/UserDetails.vue')

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
    },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      title: 'Дашборд',
      subtitle: 'Обзор системы',
      requiresAuth: true,
      layout: Layout,
    },
  },
  {
    path: '/portals',
    name: 'portals',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'portals-list',
        component: PortalsIndex,
        meta: {
          title: 'Порталы',
          subtitle: 'Управление порталами Bitrix24',
        },
      },
      {
        path: ':id',
        name: 'portal-detail',
        component: PortalsDetails,
        meta: {
          title: 'Детали портала',
        },
      },
      {
        path: ':id/subscriptions',
        name: 'portal-subscriptions',
        component: PortalSubscriptions,
        meta: {
          title: 'Подписки',
        },
      },
      {
        path: 'create',
        name: 'portal-create',
        component: PortalCreate,
        meta: {
          title: 'Создание портала',
        },
      },
    ],
  },
  {
    path: '/tariffs',
    name: 'tariffs',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'tariffs-list',
        component: TariffsIndex,
        meta: {
          title: 'Тарифы',
          subtitle: 'Управление тарифами Bitrix24',
        },
      },
      {
        path: ':id',
        name: 'tariffs-detail',
        component: TariffsDetail,
        meta: {
          title: 'Тариф',
          subtitle: 'Управление тарифами Bitrix24',
        },
      },
      {
        path: 'create',
        name: 'tariff-create',
        component: TariffCreate,
        meta: {
          title: 'Создание тарифа',
        },
      },
    ],
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'subscriptions-list',
        component: SubscriptionsIndex,
        meta: {
          title: 'Подписки',
          subtitle: 'Управление подписками Bitrix24',
        },
      },
      {
        path: ':id',
        name: 'subscription',
        component: SubscriptionsDetails,
        meta: {
          title: 'Подписка',
        },
      },
      {
        path: 'create',
        name: 'subscription-create',
        component: SubscriprionCreate,
        meta: {
          title: 'Создание подписки',
        },
      },
      {
        path: ':id/extend',
        name: 'subscription-extend',
        component: SubscriprionExtend,
        meta: {
          title: 'Продление',
        },
      },
    ],
  },
  {
    path: '/payments',
    name: 'payments',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'payment-index',
        component: Paymentindex,
        meta: {
          title: 'Платежи',
        },
      },
      {
        path: ':id',
        name: 'payment-detals',
        component: PaymentDetails,
        meta: {
          title: 'Редактирование',
        },
      },
      {
        path: 'create',
        name: 'payment-create',
        component: PaymentCreate,
        meta: {
          title: 'Создание платежа',
        },
      },
    ],
  },
  {
    path: '/applications',
    name: 'applications',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'appsIndex',
        component: ApplicationIndex,
        meta: {
          title: 'Приложения',
        },
      },
      {
        path: ':id',
        name: 'apps-detail',
        component: ApplicationDetail,
        meta: {
          title: 'Приложение',
        },
      },
      {
        path: 'create',
        name: 'apps-create',
        component: ApplicationCreate,
        meta: {
          title: 'Создание приложения',
        },
      },
    ],
  },
  {
    path: '/users',
    name: 'users',
    meta: {
      requiresAuth: true,
      layout: Layout,
    },
    children: [
      {
        path: '',
        name: 'users-list',
        component: UsersIndex,
        meta: {
          title: 'Пользователи',
        },
      },
      {
        path: ':id',
        name: 'user-details',
        component: UsersDetails,
        meta: {
          title: 'Пользователь',
        },
      },
    ],
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: {
      title: 'Настройки',
      subtitle: 'Настройки системы',
      requiresAuth: true,
      layout: Layout,
    },
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsPage,
    meta: {
      title: 'Аналитика',
      subtitle: 'Статистика и отчеты',
      requiresAuth: true,
      layout: Layout,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      title: 'Страница не найдена',
      layout: Layout,
    },
  },
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
  },
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
      query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined },
    })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else if (to.meta.roles && authStore.user) {
    const userRole = authStore.user.role || 'user'
    if (!to.meta.roles.includes(userRole)) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  } else {
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
