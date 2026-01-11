
import type { AdminRole } from '@/services'
import type { AdminUserDTO } from '../admin-user.dto'
import type { UpdateAdminUserRequest } from '@/services/user.service'

export interface AdminUserEditData {
  name: string
  role: AdminRole
  isActive: boolean
}

export const adminUserDataToRequest = (data: AdminUserEditData): UpdateAdminUserRequest => ({
  name: data.name,
  role: data.role,
  is_active: data.isActive,
})

export const createAdminUserEditData = (user: AdminUserDTO): AdminUserEditData => ({
  name: user.name,
  role: user.role,
  isActive: user.isActive,
})

export const applyAdminUserEditData = (user: AdminUserDTO, editData: AdminUserEditData): void => {
  user.name = editData.name
  user.role = editData.role
  user.isActive = editData.isActive
}
