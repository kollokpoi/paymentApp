import { BaseService } from './base.service'
import {
  SubscriptionDTO,
  SubscriptionStatsDTO,
  type Metadata,
  type SubscriptionDTOData,
  type SubscriptionStatsDTOData,
} from '@/types/dto'
import type { ApiResponse, PaginatedResponse, SubscriptionStatus } from '@/types/api/responses'
import type { AxiosRequestConfig } from 'axios'

export interface CreateSubscriptionRequest {
  portal_id: string
  app_id: string
  tariff_id: string
  status?: SubscriptionStatus
  valid_from?: Date
  valid_until?: Date
  auto_renew?: boolean
  trial_end_date?: Date
  notes?: string
  metadata?: Metadata
}

export interface UpdateSubscriptionRequest {
  status?: SubscriptionStatus
  valid_until?: Date | string
  auto_renew?: boolean
  notes?: string
}

export interface SubscriptionSearchParams {
  page: number
  limit: number
  portalId?: string
  appId?: string
  status?: string
  search?: string
  tariffId?: string
}

export interface RenewSubscriptionRequest {
  days?: number
  amount?: number
}

export interface ChangeTariffRequest {
  tariff_id: string
  immediate?: boolean
}

class SubscriptionService extends BaseService {
  async getSubscriptions(
    params?: SubscriptionSearchParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<PaginatedResponse<SubscriptionDTO>>> {
    const response = await this.get<PaginatedResponse<SubscriptionDTOData>>('/subscriptions', {
      params,
      ...config,
    })
    if (response.success) {
      response.data.items = response.data.items.map((item) => new SubscriptionDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<SubscriptionDTO>>
  }

  async getSubscription(id: string): Promise<ApiResponse<SubscriptionDTO>> {
    const response = await this.get<SubscriptionDTOData>(`/subscriptions/${id}`)
    if (response.success) {
      response.data = new SubscriptionDTO(response.data)
    }
    return response as ApiResponse<SubscriptionDTO>
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>('/subscriptions', data)
  }

  async updateSubscription(
    id: string,
    data: UpdateSubscriptionRequest,
  ): Promise<ApiResponse<SubscriptionDTO>> {
    return this.put<SubscriptionDTO>(`/subscriptions/${id}`, data)
  }

  async deleteSubscription(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/subscriptions/${id}`)
  }

  async renewSubscription(
    id: string,
    data: RenewSubscriptionRequest,
  ): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>(`/subscriptions/${id}/renew`, data)
  }

  async changeTariff(id: string, data: ChangeTariffRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>(`/subscriptions/${id}/change-tariff`, data)
  }

  async findByPortalAndApp(portalId: string, appId: string): Promise<ApiResponse<SubscriptionDTO>> {
    return this.get<SubscriptionDTO>(`/subscriptions/find`, {
      params: { portalId, appId },
    })
  }

  async getActiveSubscriptions(
    portalId?: string,
    appId?: string,
  ): Promise<ApiResponse<SubscriptionDTO[]>> {
    return this.get<SubscriptionDTO[]>('/subscriptions/active', {
      params: { portalId, appId },
    })
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/subscriptions/count')
  }
  async getStats(params?: {
    startDate?: string
    endDate?: string
    appId?: string
  }): Promise<ApiResponse<SubscriptionStatsDTO>> {
    const response = await this.get<SubscriptionStatsDTOData>('/subscriptions/stats', { params })
    if (response.success) {
      response.data = new SubscriptionStatsDTO(response.data)
    }
    return response as ApiResponse<SubscriptionStatsDTO>
  }
}

export const subscriptionService = new SubscriptionService()
