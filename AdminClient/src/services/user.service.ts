import type { AxiosRequestConfig } from 'axios'
import type { AdminRole, ApiResponse, PaginatedResponse } from '.'
import { BaseService } from './base.service'
import { AdminUserDTO, type AdminUserDTOData } from '@/types/dto'

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: AdminRole
}

export interface UpdateAdminUserRequest {
  email: string
  name: string
  role: AdminRole
  is_active?: boolean
  password?:string
}

export interface AdminRoleStatistics {
  superadmin: number
  admin: number
  support: number
}

export interface AdminUserStatistics {
  total: number
  active: number
  inactive: number
  superadmins: number
  admins: number
  support: number
}

export interface AdminUserSearchParams {
  page?: number
  limit?: number
  search?: string
  role?: AdminRole
  isActive?: boolean
}

export interface AdminUserSummary {
  totalUsers: number
  activeUsers: number
  byRole: AdminRoleStatistics
}

export interface UserStatsResponse {
  statistics: AdminUserStatistics
  recentActivity: AdminUserDTO[]
  summary: AdminUserSummary
}

class UserService extends BaseService {
  async getUsers(
    params?: AdminUserSearchParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<PaginatedResponse<AdminUserDTO>>> {
    const response = await this.get<PaginatedResponse<AdminUserDTOData>>('/users', {
      params,
      ...config,
    })
    if (response.success) {
      response.data.items = response.data.items.map((item) => new AdminUserDTO(item))
    }
    return response as ApiResponse<PaginatedResponse<AdminUserDTO>>
  }
  async getUser(id: string): Promise<ApiResponse<AdminUserDTO>> {
    return this.get<AdminUserDTO>(`/users/${id}`)
  }
  async create(data: CreateUserRequest): Promise<ApiResponse<AdminUserDTO>> {
    return this.post<AdminUserDTO>('/users/', data)
  }
  async update(id: string, data: UpdateAdminUserRequest): Promise<ApiResponse<AdminUserDTO>> {
    return this.put<AdminUserDTO>(`/users/${id}`, data)
  }
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/users/${id}`)
  }
  async getStats(): Promise<ApiResponse<UserStatsResponse>> {
    return this.get<UserStatsResponse>(`/users/stats`)
  }
  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>(`/users/count`)
  }
}

export const userService = new UserService()
