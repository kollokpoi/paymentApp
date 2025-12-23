export interface ApplicationSettings {
  [key: string]: any
}

export interface ApplicationDTOData {
  id: string
  code: string
  name: string
  description?: string
  version?: string
  is_active?: boolean
  isActive?: boolean
  icon_url?: string
  iconUrl?: string
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
    this.code = data.code
    this.name = data.name
    this.description = data.description || ''
    this.version = data.version || '1.0.0'
    this.isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? true)
    this.iconUrl = data.icon_url || data.iconUrl || null
    this.settings = data.settings || {}
    this.sortOrder = data.sort_order || data.sortOrder || 0
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      version: this.version,
      is_active: this.isActive,
      icon_url: this.iconUrl,
      settings: this.settings,
      sort_order: this.sortOrder,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }
}
