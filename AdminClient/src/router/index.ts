import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Типы для метаданных маршрутов
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    roles?: string[] // Дополнительно: ролевая модель
  }
}

// Ленивая загрузка компонентов
const LoginPage = () => import('@/views/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')
const NotFoundPage = () => import('@/views/NotFoundPage.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      title: 'Вход',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      title: 'Панель управления',
      requiresAuth: true,
      // roles: ['admin', 'manager'] // Пример ролевой защиты
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: {
      title: 'Профиль',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: { title: 'Страница не найдена' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

let isCheckingAuth = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.title) {
    document.title = `${to.meta.title} | My App`
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

  // Проверка авторизации для защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Сохраняем путь для редиректа после входа
    next({
      name: 'login',
      query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
    })
  }
  // Редирект с логина если уже авторизован
  else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  }
  // Дополнительная проверка ролей (опционально)
  else if (to.meta.roles && authStore.user) {
    const userRole = authStore.user.role || 'user'
    if (!to.meta.roles.includes(userRole)) {
      // Если нет прав - редирект на dashboard или 403
      next({ name: 'dashboard' })
    } else {
      next()
    }
  }
  else {
    next()
  }
})

export default router
