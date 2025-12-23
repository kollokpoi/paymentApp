import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')
const NotFoundPage = () => import('@/views/NotFoundPage.vue')

let authStore: any = null

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { title: 'Вход', requiresAuth: false }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
    meta: { title: 'Панель управления', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: { title: 'Профиль', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: { title: 'Страница не найдена' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export function setAuthStore(store: any) {
  authStore = store
}

router.beforeEach(async (to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | My App`
  }

  if (authStore) {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    } else if (to.name === 'login' && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
      return
    }
  }
  
  next()
})

export default router