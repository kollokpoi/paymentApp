/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import { ApplicationDTO, type ApplicationDTOData, type Metadata, type TariffDTO } from '@/types/dto'
import { ApplicationShortDTO, type ApplicationShortDTOData } from '@/types/dto/ApplicationShortDTO'
import type { ApiResponse } from '.'
import type { AxiosRequestConfig } from 'axios'
import type { PaginatedResponse } from '@/types/api/responses'

export interface CreateApplicationRequest {
  code: string
  name: string
  description?: string
  version?: string
  is_active?: boolean
  icon_url?: string
  settings?: Metadata
  sort_order?: number
  client_id: string
  client_secret: string
}

export interface ApplicationSearchParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  version?: string
}

export interface UpdateApplicationRequest {
  name?: string
  description?: string
  version?: string
  is_active?: boolean
  icon_url?: string
  settings?: Metadata
  sort_order?: number
}

export interface AppStats {
  total: number
  active: number
  inactive: number
}

class ApplicationService extends BaseService {
  async getApplications(
    params?: ApplicationSearchParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<PaginatedResponse<ApplicationDTO>>> {
    const response = await this.get<PaginatedResponse<ApplicationDTOData>>('/applications', {
      params,
      ...config,
    })
    if (response.success) {
      response.data.items = response.data.items.map((item) => new ApplicationDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<ApplicationDTO>>
  }

  async getApplicationsList(): Promise<ApiResponse<ApplicationShortDTO[]>> {
    const response = await this.get<ApplicationShortDTOData[]>('/applications/shortList', {})
    if (response.success) {
      response.data = ApplicationShortDTO.fromArray(response.data)
    }
    return response as ApiResponse<ApplicationShortDTO[]>
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

  async getAppStats(): Promise<ApiResponse<AppStats>> {
    return this.get<AppStats>('/applications/stats')
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/applications/count')
  }
}

export const applicationService = new ApplicationService()
