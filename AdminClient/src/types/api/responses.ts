// Базовые интерфейсы для всех API ответов
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  message: string
  code?: string
  errors?: ValidationError[]
  statusCode?: number
  timestamp?: string
}

// Типы для статусов
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'canceled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PeriodType = 'day' | 'week' | 'month' | 'year'
export type UserRole = 'admin' | 'moderator' | 'user'
