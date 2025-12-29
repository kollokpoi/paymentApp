/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import type { TariffDTO } from '@/types/dto'
import type { ApiResponse } from './api.service'

export interface CreateTariffRequest {
  app_id: string
  code: string
  name: string
  description?: string
  price: number
  period?: 'day' | 'week' | 'month' | 'year'
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
  period?: 'day' | 'week' | 'month' | 'year'
  trial_days?: number
  is_active?: boolean
  is_default?: boolean
  limits?: Record<string, any>
  features?: string[]
  sort_order?: number
}

class TariffService extends BaseService {
  async getTariffs(appId?: string): Promise<ApiResponse<TariffDTO[]>> {
    return this.get<TariffDTO[]>('/tariffs', { params: appId ? { appId } : {} })
  }

  async getActiveTariffs(appId?: string): Promise<ApiResponse<TariffDTO[]>> {
    return this.get<TariffDTO[]>('/tariffs', {
      params: { appId, isActive: true }
    })
  }

  async getTariff(id: string): Promise<ApiResponse<TariffDTO>> {
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

  async getActiveCount():Promise<ApiResponse<number>>{
    return this.get<number>('/tariffs/count');
  }
}

export const tariffService = new TariffService()
