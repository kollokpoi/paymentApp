/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse, PaginatedResponse } from '.'
import { BaseService } from './base.service'
import { TariffDTO, type TariffDTOData } from '@/types/dto'
import type { PeriodType } from '@/types/api/responses'

export interface CreateTariffRequest {
  app_id: string
  code: string
  name: string
  description?: string
  price: number
  period?: PeriodType
  trial_days?: number
  is_active?: boolean
  is_default?: boolean
  limits?: Record<string, any>
  features?: string[]
  sort_order?: number
}

export interface UpdateTariffRequest {
  name?: string
  description?: string
  price?: number
  period?: PeriodType
  trial_days?: number
  is_active?: boolean
  is_default?: boolean
  limits?: Record<string, any>
  features?: string[]
  sort_order?: number
  code?: string
}

export interface TariffSearchParams {
  page?: number
  limit?: number
  search?: string
  appId?: string
  isActive?: boolean
  period?: string
  priceFrom?: number
  priceTo?: number
  hasTrial?: boolean
  isDefault?: boolean
}

class TariffService extends BaseService {
  async getTariffs(
    params?: TariffSearchParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<PaginatedResponse<TariffDTO>>> {
    const response = await this.get<PaginatedResponse<TariffDTOData>>('/tariffs', {
      params,
      ...config,
    })
    if (response.success) {
      response.data.items = response.data.items.map((item) => new TariffDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<TariffDTO>>
  }

  async getActiveTariffs(appId?: string): Promise<ApiResponse<TariffDTO[]>> {
    return this.get<TariffDTO[]>('/tariffs', {
      params: { appId, isActive: true },
    })
  }

  async getTariff(id: string): Promise<ApiResponse<TariffDTO>> {
    return this.get<TariffDTO>(`/tariffs/${id}`)
  }

  async setAsDefault(id: string): Promise<ApiResponse<TariffDTO>> {
    return this.get<TariffDTO>(`/tariffs/${id}`)
  }

  async createTariff(data: CreateTariffRequest): Promise<ApiResponse<TariffDTO>> {
    return this.post<TariffDTO>('/tariffs', data)
  }

  async updateTariff(id: string, data: UpdateTariffRequest): Promise<ApiResponse<TariffDTO>> {
    return this.put<TariffDTO>(`/tariffs/${id}`, data)
  }

  async deleteTariff(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/tariffs/${id}`)
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/tariffs/count')
  }
}

export const tariffService = new TariffService()
