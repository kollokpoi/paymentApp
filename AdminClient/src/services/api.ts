/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Импортируем DTO
import type {
  AdminUserDTO,
  ApplicationDTO,
  PaymentDTO,
  PortalDTO,
  SubscriptionDTO,
  TariffDTO
} from '@/types/dto'

// Импортируем общие типы
import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api/responses'

const API_BASE_URL = 'http://188.17.155.59:3001/api'

// Типы запросов
export interface LoginRequest {
  email: string
  password: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface LoginResponse {
  tokens:LoginTokens
  user: AdminUserDTO
}
export interface LoginTokens{
  accessToken: string
  refreshToken?: string
  expiresIn: number
}
export interface RefreshTokenResponse {
  access_token: string
  refresh_token?: string
}


class ApiService {
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const authStore = useAuthStore()

            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              authStore.token = response.access_token
              if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token)
              }
              return this.axiosInstance(originalRequest)
            }

            authStore.logout()
            router.push('/login')
          } catch {
            const authStore = useAuthStore()
            authStore.logout()
            router.push('/login')
          }
        }

        // Обработка других ошибок
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

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return response.data
  }

  async refreshToken(data: string): Promise<RefreshTokenResponse> {
    try {
      const response = await this.axiosInstance.post<RefreshTokenResponse>('/auth/refresh', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getPortals(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<PortalDTO>>> {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<PortalDTO>>>('/portals', {
      params: { page, limit }
    })
    return response.data
  }

  async getPortalById(id: string): Promise<ApiResponse<PortalDTO>> {
    const response = await this.axiosInstance.get<ApiResponse<PortalDTO>>(`/portals/${id}`)
    return response.data
  }

  async getSubscriptions(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<SubscriptionDTO>>> {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<SubscriptionDTO>>>('/subscriptions', {
      params: { page, limit }
    })
    return response.data
  }

  async getApplications(): Promise<ApiResponse<ApplicationDTO[]>> {
    const response = await this.axiosInstance.get<ApiResponse<ApplicationDTO[]>>('/applications')
    return response.data
  }

  async getPayments(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<PaymentDTO>>> {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<PaymentDTO>>>('/payments', {
      params: { page, limit }
    })
    return response.data
  }

  async getTariffs(appId?: string): Promise<ApiResponse<TariffDTO[]>> {
    const response = await this.axiosInstance.get<ApiResponse<TariffDTO[]>>('/tariffs', {
      params: appId ? { appId } : {}
    })
    return response.data
  }

  // Общие CRUD методы
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

export const apiService = new ApiService()
