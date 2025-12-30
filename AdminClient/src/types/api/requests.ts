import type { AdminUserDTO } from "../dto"

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface LoginResponse {
  tokens: LoginTokens
  user: AdminUserDTO
}

export interface LoginTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}
