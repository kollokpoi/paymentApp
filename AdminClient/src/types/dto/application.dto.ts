/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApplicationSettings {
  [key: string]: any
}

export interface ApplicationDTOData {
  id: string
  code?: string
  name?: string
  description?: string | null
  version?: string
  is_active?: boolean
  isActive?: boolean
  icon_url?: string | null
  iconUrl?: string | null
  settings?: ApplicationSettings
  sort_order?: number
  sortOrder?: number
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
}

export class ApplicationDTO {
  id: string
  code: string
  name: string
  description: string
  version: string
  isActive: boolean
  iconUrl: string | null
  settings: ApplicationSettings
  sortOrder: number
  createdAt: string | Date
  updatedAt: string | Date

  constructor(data: ApplicationDTOData) {
    this.id = data.id
    this.code = data.code || ''
    this.name = data.name || ''
    this.description = data.description || ''
    this.version = data.version || '1.0.0'
    this.isActive = data.isActive ?? data.is_active ?? true
    this.iconUrl = data.iconUrl || data.icon_url || null
    this.settings = data.settings || {}
    this.sortOrder = data.sortOrder || data.sort_order || 0
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString()
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString()
  }
}
