import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/auth'

interface LoginCredentials {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Симуляция API запроса
  const fakeApiLogin = (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '1',
            email: credentials.email,
            name: 'Пользователь'
          },
          token: 'fake-jwt-token'
        })
      }, 1000)
    })
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fakeApiLogin(credentials)
      
      user.value = response.user
      token.value = response.token
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return { success: true }
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initialize = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        logout()
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    initialize
  }
})