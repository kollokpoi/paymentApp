/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import { PortalDTO, PortalShortDTO, type Metadata, type PortalDTOData, type PortalShortDTOData } from '@/types/dto'
import type { ApiResponse, PaginatedResponse } from '@/types/api/responses'
import type { AxiosRequestConfig } from 'axios'


export interface UpdatePortalRequest {
  company_name?: string
  admin_email?: string
  is_active?: boolean
  b24_member_id: string
  b24_domain: string
}

export interface CreatePortalRequest {
  b24_domain: string
  company_name: string
  b24_member_id?: string
  admin_email?: string
  is_active?: boolean
  metadata?: Metadata
}

export interface PortalSearchParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  memberId?: string
  domain?: string
}

export interface PortalListParams {
  search?: string
  limit?: number
  onlyActive?: boolean
}

class PortalService extends BaseService {
  async getPortals(params?: PortalSearchParams,config?: AxiosRequestConfig): Promise<ApiResponse<PaginatedResponse<PortalDTO>>> {
    const response = await this.get<PaginatedResponse<PortalDTOData>>('/portals', { params, ...config})
    if (response.success) {
      response.data.items = response.data.items.map(item => new PortalDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<PortalDTO>>
  }

  async getPortal(id: string): Promise<ApiResponse<PortalDTO>> {
    const response = await this.get<PortalDTOData>(`/portals/${id}`)
    if (response.success) {
      response.data = new PortalDTO(response.data)
    }
    return response as ApiResponse<PortalDTO>
  }

  async getPortalsList(params?: PortalListParams): Promise<ApiResponse<PortalShortDTO[]>> {
    const response = await this.get<PortalShortDTOData[]>('/portals/shortList', { params })
    if (response.success) {
      response.data = PortalShortDTO.fromArray(response.data)
    }
    return response as ApiResponse<PortalShortDTO[]>
  }

  async createPortal(data: CreatePortalRequest): Promise<ApiResponse<PortalDTO>> {
    const response = await this.post<PortalDTO>('/portals', data)
    if (response.success) {
      response.data = new PortalDTO(response.data)
    }
    return response as ApiResponse<PortalDTO>
  }

  async updatePortal(id: string, data: UpdatePortalRequest): Promise<ApiResponse<PortalDTO>> {
    return this.put<PortalDTO>(`/portals/${id}`, data)
  }

  async deletePortal(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/portals/${id}`)
  }

  async searchPortal(params: { memberId?: string; domain?: string }): Promise<ApiResponse<PortalDTO>> {
    return this.get<PortalDTO>('/portals/search', { params })
  }

  async getPortalStats(id: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/portals/${id}/stats`)
  }

  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>('/portals/count')
  }
}

export const portalService = new PortalService()
