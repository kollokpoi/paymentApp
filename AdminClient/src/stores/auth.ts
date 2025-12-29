import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'

export interface User {
  id: string
  email: string
  name: string
  role?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {

  // Состояние
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Геттеры
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Действия
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      user.value = response.user
      token.value = response.tokens.accessToken
      refreshToken.value = response.tokens.refreshToken||null

      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('user', JSON.stringify( user.value))
      if(refreshToken.value)
        localStorage.setItem('refresh_token', refreshToken.value)

      return { success: true, user:  user.value }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка авторизации'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('refresh_token')
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
      return true
    } catch {
      logout()
      return false
    }
  }

  const initialize = async () => {
    if (isInitialized.value) return

    try {
      await checkAuth()
    } finally {
      isInitialized.value = true
    }
  }
  return {
    // State
    user,
    token,
    isLoading,
    error,
    isInitialized,

    // Getters
    isAuthenticated,

    // Actions
    login,
    logout,
    checkAuth,
    initialize
  }
})
