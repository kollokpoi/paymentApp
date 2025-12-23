import type { PeriodType } from '../api/responses'
import { ApplicationDTO, type ApplicationDTOData } from './application.dto'

export interface TariffLimits {
  [key: string]: any
}

export interface TariffDTOData {
  id: string
  app_id?: string
  appId?: string
  code: string
  name: string
  description?: string
  price: number | string
  period?: PeriodType
  trial_days?: number
  trialDays?: number
  is_active?: boolean
  isActive?: boolean
  is_default?: boolean
  isDefault?: boolean
  limits?: TariffLimits
  features?: string[]
  sort_order?: number
  sortOrder?: number
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  application?: ApplicationDTOData
}

export class TariffDTO {
  id: string
  appId: string
  code: string
  name: string
  description: string
  price: number
  period: PeriodType
  trialDays: number
  isActive: boolean
  isDefault: boolean
  limits: TariffLimits
  features: string[]
  sortOrder: number
  createdAt: string | Date
  updatedAt: string | Date
  application: ApplicationDTO | null

  constructor(data: TariffDTOData) {
    this.id = data.id
    this.appId = data.app_id || data.appId || ''
    this.code = data.code
    this.name = data.name
    this.description = data.description || ''
    this.price = typeof data.price === 'string' ? parseFloat(data.price) : data.price
    this.period = data.period || 'month'
    this.trialDays = data.trial_days || data.trialDays || 0
    this.isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? true)
    this.isDefault = data.is_default !== undefined ? data.is_default : (data.isDefault ?? false)
    this.limits = data.limits || {}
    this.features = data.features || []
    this.sortOrder = data.sort_order || data.sortOrder || 0
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()

    this.application = null
    if (data.application) {
      this.application = new ApplicationDTO(data.application)
    }
  }

  toJSON() {
    return {
      id: this.id,
      app_id: this.appId,
      code: this.code,
      name: this.name,
      description: this.description,
      price: this.price,
      period: this.period,
      trial_days: this.trialDays,
      is_active: this.isActive,
      is_default: this.isDefault,
      limits: this.limits,
      features: this.features,
      sort_order: this.sortOrder,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      application: this.application ? this.application.toJSON() : null
    }
  }
}
