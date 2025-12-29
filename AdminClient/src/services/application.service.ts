/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import type { ApplicationDTO, TariffDTO } from '@/types/dto'
import type { ApiResponse } from './api.service'

export interface CreateApplicationRequest {
  code: string
  name: string
  description?: string
  version?: string
  is_active?: boolean
  icon_url?: string
  settings?: Record<string, any>
  sort_order?: number
}

export interface UpdateApplicationRequest {
  name?: string
  description?: string
  version?: string
  is_active?: boolean
  icon_url?: string
  settings?: Record<string, any>
  sort_order?: number
}

export interface AppStats {
  total: number
  active: number
  inactive: number
}

class ApplicationService extends BaseService {
  async getApplications(): Promise<ApiResponse<ApplicationDTO[]>> {
    return this.get<ApplicationDTO[]>('/applications')
  }

  async getActiveApplications(): Promise<ApiResponse<ApplicationDTO[]>> {
    return this.get<ApplicationDTO[]>('/applications?isActive=true')
  }

  async getApplication(id: string): Promise<ApiResponse<ApplicationDTO>> {
    return this.get<ApplicationDTO>(`/applications/${id}`)
  }

  async createApplication(data: CreateApplicationRequest): Promise<ApiResponse<ApplicationDTO>> {
    return this.post<ApplicationDTO>('/applications', data)
  }

  async updateApplication(
    id: string,
    data: UpdateApplicationRequest,
  ): Promise<ApiResponse<ApplicationDTO>> {
    return this.put<ApplicationDTO>(`/applications/${id}`, data)
  }

  async deleteApplication(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/applications/${id}`)
  }

  async getApplicationTariffs(appId: string): Promise<ApiResponse<TariffDTO[]>> {
    return this.get<TariffDTO[]>(`/applications/${appId}/tariffs`)
  }

  async getAppStats(): Promise<ApiResponse<AppStats>> {
    return this.get<AppStats>('/applications/stats')
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/applications/count')
  }
}

export const applicationService = new ApplicationService()
