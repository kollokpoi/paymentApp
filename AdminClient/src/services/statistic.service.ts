import { BaseService } from './base.service'
import type { ApiResponse } from '@/types/api/responses'
import { AppStatsDTO, PaymentStatsDTO, PortalStatsDTO, SubscriptionStatsDTO, UserStatsDTO, type AppStatsDTOData, type UserStatsDTOData, type PaymentStatsDTOData, type PortalStatsDTOData, type SubscriptionStatsDTOData } from '@/types/dto'
import type { AxiosRequestConfig } from 'axios'


export interface StatsParams {
  startDate?: string
  endDate?: string
}

class StatisticService extends BaseService {
  async getAppStats(): Promise<ApiResponse<AppStatsDTO>> {
    const response = await this.get<AppStatsDTOData>('/applications/stats')
    if (response.success) {
      response.data = new AppStatsDTO(response.data)
    }
    return response as ApiResponse<AppStatsDTO>
  }

  async getUserStats(): Promise<ApiResponse<UserStatsDTO>> {
    const response = await this.get<UserStatsDTOData>('/users/stats')
    if (response.success) {
      response.data = new UserStatsDTO(response.data)
    }
    return response as ApiResponse<UserStatsDTO>
  }

  async getPaymentStats(params?: StatsParams): Promise<ApiResponse<PaymentStatsDTO>> {
    const response = await this.get<PaymentStatsDTOData>('/payments/stats', { params })
    if (response.success) {
      response.data = new PaymentStatsDTO(response.data)
    }
    return response as ApiResponse<PaymentStatsDTO>
  }

  async getPortalStats(portalId: string): Promise<ApiResponse<PortalStatsDTO>> {
    const response = await this.get<PortalStatsDTOData>(`/portals/${portalId}/stats`)
    if (response.success) {
      response.data = new PortalStatsDTO(response.data)
    }
    return response as ApiResponse<PortalStatsDTO>
  }

  async getSubscriptionStats(): Promise<ApiResponse<SubscriptionStatsDTO>> {
    const response = await this.get<SubscriptionStatsDTOData>('/subscriptions/stats')
    if (response.success) {
      response.data = new SubscriptionStatsDTO(response.data)
    }
    return response as ApiResponse<SubscriptionStatsDTO>
  }

  async getDashboardStats(params?: StatsParams): Promise<ApiResponse<{
    apps: AppStatsDTO
    users: UserStatsDTO
    payments: PaymentStatsDTO
    subscriptions: SubscriptionStatsDTO
  }>> {
    const [appsRes, usersRes, paymentsRes, subsRes] = await Promise.all([
      this.getAppStats(),
      this.getUserStats(),
      this.getPaymentStats(params),
      this.getSubscriptionStats()
    ])

    return {
      success: appsRes.success && usersRes.success && paymentsRes.success && subsRes.success,
      data: {
        apps: appsRes.success? appsRes.data : appsRes.message,
        users: usersRes.success? usersRes.data : usersRes.message,
        payments: paymentsRes.success? paymentsRes.data:paymentsRes.message,
        subscriptions:subsRes.success? subsRes.data:subsRes.message
      },
      message: 'Dashboard stats loaded'
    } as ApiResponse<{
      apps: AppStatsDTO
      users: UserStatsDTO
      payments: PaymentStatsDTO
      subscriptions: SubscriptionStatsDTO
    }>
  }
}

export const statisticService = new StatisticService()