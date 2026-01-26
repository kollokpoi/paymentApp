/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from '.'
import { PeriodType } from '../api/responses'
import { ApplicationDTO } from './application.dto'

export interface TariffDTOData {
  id: string
  app_id?: string
  appId?: string
  code?: string
  name?: string
  description?: string | null
  price?: number | string
  period?: PeriodType
  trial_days?: number
  trialDays?: number
  is_active?: boolean
  isActive?: boolean
  is_default?: boolean
  isDefault?: boolean
  limits?: Metadata
  features?: string[]
  sort_order?: number
  sortOrder?: number
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  application?: any
  show_in_list?: boolean
  showInList?: boolean
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
  limits: Metadata
  features: string[]
  sortOrder: number
  showInList: boolean
  createdAt: string | Date
  updatedAt: string | Date
  application: ApplicationDTO | null

  constructor(data: TariffDTOData) {
    this.id = data.id
    this.appId = data.appId || data.app_id || ''
    this.code = data.code || ''
    this.name = data.name || ''
    this.description = data.description || ''
    this.price = typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0)
    this.period = data.period || PeriodType.MONTH
    this.trialDays = data.trialDays || data.trial_days || 0
    this.isActive = data.isActive ?? data.is_active ?? true
    this.isDefault = data.isDefault ?? data.is_default ?? false
    this.showInList = data.showInList ?? data.show_in_list ?? true
    this.limits = data.limits || {}
    this.features = data.features || []
    this.sortOrder = data.sortOrder || data.sort_order || 0
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString()
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString()

    this.application = null
    if (data.application) {
      this.application = new ApplicationDTO(data.application)
    }
  }
}
