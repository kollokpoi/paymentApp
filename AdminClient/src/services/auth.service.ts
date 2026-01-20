import type { ApiResponse, LoginRequest, LoginResponse, RefreshTokenResponse } from '.'
import { BaseService } from './base.service'
import type { AdminUserDTO } from '@/types/dto'

class AuthService extends BaseService {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login', credentials)
    return response
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await this.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    return response
  }

  async getCurrentUser(): Promise<ApiResponse<AdminUserDTO>> {
    const response = await this.get<AdminUserDTO>('/auth/me')
    return response
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout')
  }
}

export const authService = new AuthService()
