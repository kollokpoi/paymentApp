/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import { PaymentDTO, type Metadata, type PaymentDTOData } from '@/types/dto'
import type { ApiResponse, PaginatedResponse, PaymentStatus } from '@/types/api/responses'
import type { AxiosRequestConfig } from 'axios'

export interface CreatePaymentRequest {
  subscription_id: string
  external_id?: string
  amount: number
  currency?: string
  status?: PaymentStatus
  payment_method?: string
  description?: string
  metadata?: Metadata
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus
  external_id?: string | null
  description?: string | null
  metadata?: Metadata
}

export interface PaymentSearchParams {
  page?: number
  limit?: number
  portalId?: string
  subscriptionId?: string
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  appId?: string
  paymentMethod?: string
  amountFrom?: number
  amountTo?: number
}

export interface PaymentStats {
  totalRevenue: number
  totalPayments: number
  dailyStats: Array<{
    date: string
    count: number
    total: number
  }>
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  payments: number
}

class PaymentService extends BaseService {
  async getPayments(
    params?: PaymentSearchParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<PaginatedResponse<PaymentDTO>>> {
    const response = await this.get<PaginatedResponse<PaymentDTOData>>('/payments', {
      params,
      ...config,
    })
    if (response.success) {
      response.data.items = response.data.items.map((item) => new PaymentDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<PaymentDTO>>
  }

  async getPayment(id: string): Promise<ApiResponse<PaymentDTO>> {
    const response = await this.get<PaymentDTOData>(`/payments/${id}`)
    if (response.success) {
      response.data = new PaymentDTO(response.data)
    }
    return response as ApiResponse<PaymentDTO>
  }

  async createPayment(data: CreatePaymentRequest): Promise<ApiResponse<PaymentDTO>> {
    return this.post<PaymentDTO>('/payments', data)
  }

  async updatePayment(id: string, data: UpdatePaymentRequest): Promise<ApiResponse<PaymentDTO>> {
    return this.put<PaymentDTO>(`/payments/${id}`, data)
  }

  async deletePayment(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/payments/${id}`)
  }

  async getPaymentStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<PaymentStats>> {
    return this.get<PaymentStats>('/payments/stats', { params })
  }

  async getMonthlyRevenue(year?: number): Promise<ApiResponse<MonthlyRevenue[]>> {
    return this.get<MonthlyRevenue[]>('/payments/revenue/monthly', {
      params: { year: year || new Date().getFullYear() },
    })
  }

  async getPaymentByExternalId(externalId: string): Promise<ApiResponse<PaymentDTO>> {
    return this.get<PaymentDTO>('/payments/external/:externalId', {
      params: { externalId },
    })
  }

  async processRefund(paymentId: string, reason?: string): Promise<ApiResponse<PaymentDTO>> {
    return this.post<PaymentDTO>(`/payments/${paymentId}/refund`, { reason })
  }

  async getSubscriptionPayments(
    subscriptionId: string,
    page = 1,
    limit = 20,
  ): Promise<ApiResponse<PaginatedResponse<PaymentDTO>>> {
    return this.get<PaginatedResponse<PaymentDTO>>(`/subscriptions/${subscriptionId}/payments`, {
      params: { page, limit },
    })
  }

  async exportPayments(
    format: 'json' | 'csv' = 'json',
    params?: PaymentSearchParams,
  ): Promise<Blob | ApiResponse<PaymentDTO[]>> {
    return this.get<any>(`/payments/export?format=${format}`, {
      params,
      responseType: format === 'csv' ? 'blob' : 'json',
    })
  }

  async getRecentPayments(limit = 10): Promise<ApiResponse<PaymentDTO[]>> {
    return this.get<PaymentDTO[]>('/payments/recent', {
      params: { limit },
    })
  }

  async getFailedPayments(
    page = 1,
    limit = 20,
  ): Promise<ApiResponse<PaginatedResponse<PaymentDTO>>> {
    return this.get<PaginatedResponse<PaymentDTO>>('/payments/failed', {
      params: { page, limit, status: 'failed' },
    })
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/payments/count')
  }
}

export const paymentService = new PaymentService()
