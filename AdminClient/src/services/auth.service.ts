import type { LoginRequest, LoginResponse, RefreshTokenResponse } from '.'
import { BaseService } from './base.service'
import type { AdminUserDTO } from '@/types/dto'

class AuthService extends BaseService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/login', credentials)
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await this.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    return response.data
  }

  async getCurrentUser(): Promise<AdminUserDTO> {
    const response = await this.get<AdminUserDTO>('/auth/me')
    return response.data
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout')
  }
}

export const authService = new AuthService()
