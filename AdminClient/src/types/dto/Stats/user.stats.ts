import type { AdminRole } from "@/services"

export interface UserStatsDTOData {
  statistics: {
    total: number
    active: number
    inactive: number
    superadmins: number
    admins: number
    support: number
  }
  recentActivity: Array<{
    id: string
    email: string
    name: string
    role: AdminRole
    lastLogin: string | Date | null
    isActive: boolean
  }>
  summary: {
    totalUsers: number
    activeUsers: number
    byRole: {
      superadmin: number
      admin: number
      support: number
    }
  }
}

export class UserStatsDTO {
  statistics: {
    total: number
    active: number
    inactive: number
    superadmins: number
    admins: number
    support: number
  }
  recentActivity: Array<{
    id: string
    email: string
    name: string
    role: AdminRole
    lastLogin: Date | null
    isActive: boolean
  }>
  summary: {
    totalUsers: number
    activeUsers: number
    byRole: {
      superadmin: number
      admin: number
      support: number
    }
  }

  constructor(data: UserStatsDTOData) {
    this.statistics = {
      total: data.statistics?.total || 0,
      active: data.statistics?.active || 0,
      inactive: data.statistics?.inactive || 0,
      superadmins: data.statistics?.superadmins || 0,
      admins: data.statistics?.admins || 0,
      support: data.statistics?.support || 0
    }
    
    this.recentActivity = (data.recentActivity || []).map(user => ({
      ...user,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null
    }))
    
    this.summary = {
      totalUsers: data.summary?.totalUsers || 0,
      activeUsers: data.summary?.activeUsers || 0,
      byRole: {
        superadmin: data.summary?.byRole?.superadmin || 0,
        admin: data.summary?.byRole?.admin || 0,
        support: data.summary?.byRole?.support || 0
      }
    }
  }
}