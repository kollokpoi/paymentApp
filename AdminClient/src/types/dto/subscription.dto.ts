import type { SubscriptionStatus } from '../api/responses'
import { ApplicationDTO } from './application.dto'
import { TariffDTO } from './tariff.dto'

export interface SubscriptionDTOData {
  id: string
  portal_id?: string
  portalId?: string
  app_id?: string
  appId?: string
  tariff_id?: string
  tariffId?: string
  status?: SubscriptionStatus
  valid_from?: string | Date
  validFrom?: string | Date
  valid_until?: string | Date
  validUntil?: string | Date
  auto_renew?: boolean
  autoRenew?: boolean
  trial_end_date?: string | Date
  trialEndDate?: string | Date
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  application?: any
  tariff?: any
}

export class SubscriptionDTO {
  id: string
  portalId: string
  appId: string
  tariffId: string | null
  status: SubscriptionStatus
  validFrom: string | Date
  validUntil: string | Date
  autoRenew: boolean
  trialEndDate: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  application: ApplicationDTO | null
  tariff: TariffDTO | null

  constructor(data: SubscriptionDTOData) {
    this.id = data.id
    this.portalId = data.portal_id || data.portalId || ''
    this.appId = data.app_id || data.appId || ''
    this.tariffId = data.tariff_id || data.tariffId || null
    this.status = data.status || 'trial'
    this.validFrom = data.valid_from || data.validFrom || new Date().toISOString()
    this.validUntil = data.valid_until || data.validUntil || new Date().toISOString()
    this.autoRenew = data.auto_renew !== undefined ? data.auto_renew : (data.autoRenew ?? true)
    this.trialEndDate = data.trial_end_date || data.trialEndDate || null
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()

    this.application = null
    if (data.application) {
      this.application = new ApplicationDTO(data.application)
    }

    this.tariff = null
    if (data.tariff) {
      this.tariff = new TariffDTO(data.tariff)
    }
  }

  toJSON() {
    return {
      id: this.id,
      portal_id: this.portalId,
      app_id: this.appId,
      tariff_id: this.tariffId,
      status: this.status,
      valid_from: this.validFrom,
      valid_until: this.validUntil,
      auto_renew: this.autoRenew,
      trial_end_date: this.trialEndDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      application: this.application ? this.application.toJSON() : null,
      tariff: this.tariff ? this.tariff.toJSON() : null
    }
  }

  // Вычисляемые свойства
  get isActive(): boolean {
    return ['trial', 'active'].includes(this.status) &&
           new Date(this.validUntil) > new Date()
  }

  get daysLeft(): number {
    const now = new Date()
    const until = new Date(this.validUntil)
    const diff = until.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }
}
