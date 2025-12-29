/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseService } from './base.service'
import type { PortalDTO } from '@/types/dto'
import type { PaginatedResponse } from '@/types/api/responses'
import type { ApiResponse } from './api.service'

export interface CreatePortalRequest {
  b24_member_id: string
  b24_domain: string
  company_name?: string
  admin_email?: string
  is_active?: boolean
  metadata?: Record<string, any>
}

export interface UpdatePortalRequest {
  company_name?: string
  admin_email?: string
  is_active?: boolean
  metadata?: Record<string, any>
}

export interface PortalSearchParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  memberId?: string
  domain?: string
}

class PortalService extends BaseService {
  async getPortals(params?: PortalSearchParams): Promise<ApiResponse<PaginatedResponse<PortalDTO>>> {
    return this.get<PaginatedResponse<PortalDTO>>('/portals', { params })
  }

  async getPortal(id: string): Promise<ApiResponse<PortalDTO>> {
    return this.get<PortalDTO>(`/portals/${id}`)
  }

  async createPortal(data: CreatePortalRequest): Promise<ApiResponse<PortalDTO>> {
    return this.post<PortalDTO>('/portals', data)
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
