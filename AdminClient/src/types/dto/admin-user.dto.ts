import { AdminRole } from '../api/responses'

export interface AdminUserDTOData {
  id: string
  email: string
  name: string
  role?: AdminRole
  is_active?: boolean
  isActive?: boolean
  last_login?: string | Date
  lastLogin?: string | Date
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
}

export class AdminUserDTO {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  lastLogin: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date

  constructor(data: AdminUserDTOData) {
    this.id = data.id
    this.email = data.email
    this.name = data.name
    this.role = data.role || AdminRole.ADMIN
    this.isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? true)
    this.lastLogin = data.last_login || data.lastLogin || null
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      is_active: this.isActive,
      last_login: this.lastLogin,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }
}
