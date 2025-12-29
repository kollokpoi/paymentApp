import type { AdminRole } from '@/types/api/responses'
import type { ApiResponse, PaginatedResponse } from './api.service'
import { BaseService } from './base.service'
import type { AdminUserDTO } from '@/types/dto'

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: AdminRole
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
  async getUsers(): Promise<ApiResponse<PaginatedResponse<AdminUserDTO>>> {
    return this.get<PaginatedResponse<AdminUserDTO>>('/users')
  }
  async getUser(id: string): Promise<ApiResponse<AdminUserDTO>> {
    return this.get<AdminUserDTO>(`/users/${id}`)
  }
  async create(data: CreateUserRequest): Promise<ApiResponse<AdminUserDTO>> {
    return this.post<AdminUserDTO>('/users/', data)
  }
  async update(id: string, data: CreateUserRequest): Promise<ApiResponse<AdminUserDTO>> {
    return this.put<AdminUserDTO>(`/users/${id}`, data)
  }
  async getStats(): Promise<ApiResponse<UserStatsResponse>> {
    return this.get<UserStatsResponse>(`/users/stats`)
  }
  async getActiveCount(): Promise<ApiResponse<number>> {
    return this.get<number>(`/users/count`)
  }
}

export const userService = new UserService()
