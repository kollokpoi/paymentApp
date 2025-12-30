/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Импортируем DTO
import type {
  AdminUserDTO,
} from '@/types/dto'
import type { ApiResponse } from '@/types/api/responses'
import type { ApiError } from '.'

// Импортируем общие типы
const API_BASE_URL = 'https://adminapi.paymentapp.kollokpoi.ddns.net/api'
// Базовые интерфейсы для всех API ответов

// Типы для статусов
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'canceled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PeriodType = 'day' | 'week' | 'month' | 'year'
export type UserRole = 'admin' | 'moderator' | 'user'

export class ApiService {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authStore = useAuthStore()
        const token = authStore.token

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        const authStore = useAuthStore()

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await authStore.refreshAccessToken()
            
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.axiosInstance(originalRequest)
            }
          }  catch (refreshError) {
            authStore.logout()
            router.push('/login')
            return Promise.reject(refreshError)
          }
        }

        if (error.response) {
          const apiError: ApiError = {
            message: error.response.data?.message || 'Произошла ошибка',
            status: error.response.status,
            code: error.response.data?.code,
          }
          return Promise.reject(apiError)
        }

        if (error.request) {
          return Promise.reject({
            message: 'Сервер не отвечает. Проверьте подключение к интернету',
          })
        }

        return Promise.reject({
          message: 'Произошла ошибка при выполнении запроса',
        })
      }
    )
  }

  // Общие CRUD методы для использования в специализированных сервисах
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
      }
    }
    return {
      message: error.message || 'Неизвестная ошибка',
    }
  }
}

// Экспортируем синглтон экземпляр
export const apiService = new ApiService()
