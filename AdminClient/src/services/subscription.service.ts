import { BaseService } from './base.service'
import type { SubscriptionDTO } from '@/types/dto'
import type { ApiResponse, PaginatedResponse } from '@/types/api/responses'

export interface CreateSubscriptionRequest {
  portal_id: string
  app_id: string
  tariff_id: string
  status?: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'
  valid_from?: string
  valid_until?: string
  auto_renew?: boolean
  trial_end_date?: string
  notes?: string
}

export interface UpdateSubscriptionRequest {
  status?: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'
  valid_until?: string
  auto_renew?: boolean
  notes?: string
}

export interface SubscriptionSearchParams {
  page?: number
  limit?: number
  portalId?: string
  appId?: string
  status?: string
}

export interface RenewSubscriptionRequest {
  days?: number
}

export interface ChangeTariffRequest {
  tariff_id: string
  immediate?: boolean
}

class SubscriptionService extends BaseService {
  async getSubscriptions(params?: SubscriptionSearchParams): Promise<ApiResponse<PaginatedResponse<SubscriptionDTO>>> {
    return this.get<PaginatedResponse<SubscriptionDTO>>('/subscriptions', { params })
  }

  async getSubscription(id: string): Promise<ApiResponse<SubscriptionDTO>> {
    return this.get<SubscriptionDTO>(`/subscriptions/${id}`)
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>('/subscriptions', data)
  }

  async updateSubscription(id: string, data: UpdateSubscriptionRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.put<SubscriptionDTO>(`/subscriptions/${id}`, data)
  }

  async deleteSubscription(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/subscriptions/${id}`)
  }

  async renewSubscription(id: string, data: RenewSubscriptionRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>(`/subscriptions/${id}/renew`, data)
  }

  async changeTariff(id: string, data: ChangeTariffRequest): Promise<ApiResponse<SubscriptionDTO>> {
    return this.post<SubscriptionDTO>(`/subscriptions/${id}/change-tariff`, data)
  }

  async findByPortalAndApp(portalId: string, appId: string): Promise<ApiResponse<SubscriptionDTO>> {
    return this.get<SubscriptionDTO>(`/subscriptions/find`, {
      params: { portalId, appId }
    })
  }

  async getActiveSubscriptions(portalId?: string, appId?: string): Promise<ApiResponse<SubscriptionDTO[]>> {
    return this.get<SubscriptionDTO[]>('/subscriptions/active', {
      params: { portalId, appId }
    })
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/subscriptions/count')
  }
}

export const subscriptionService = new SubscriptionService()
