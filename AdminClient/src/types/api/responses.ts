
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

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
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
export enum AdminRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPPORT = 'support'
}
