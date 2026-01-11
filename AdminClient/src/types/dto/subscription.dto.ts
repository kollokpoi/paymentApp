/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from '.'
import type { SubscriptionStatus } from '../api/responses'
import { ApplicationDTO } from './application.dto'
import { PortalDTO } from './portal.dto'
import { TariffDTO } from './tariff.dto'

export interface SubscriptionDTOData {
  id: string
  portal_id?: string
  portalId?: string
  app_id?: string
  appId?: string
  tariff_id?: string | null
  tariffId?: string | null
  status: SubscriptionStatus
  valid_from?: Date
  validFrom?: Date
  valid_until?: Date
  validUntil?: Date
  auto_renew?: boolean
  autoRenew?: boolean
  trial_end_date?: Date | null
  trialEndDate?: Date | null
  notes?: string
  metadata?: Metadata
  application?: any
  tariff?: any
  portal?: any
}

export class SubscriptionDTO {
  id: string
  portalId: string
  appId: string
  tariffId: string | null
  status: SubscriptionStatus
  validFrom: Date
  validUntil: Date
  autoRenew: boolean
  trialEndDate: Date | null
  notes: string
  metadata: Metadata
  application: ApplicationDTO | null
  tariff: TariffDTO | null
  portal: PortalDTO | null

  constructor(data: SubscriptionDTOData) {
    this.id = data.id

    this.portalId = data.portalId || data.portal_id || ''
    this.appId = data.appId || data.app_id || ''
    this.tariffId = data.tariffId || data.tariff_id || null
    this.status = data.status || 'trial'
    this.validFrom = data.validFrom || data.valid_from || new Date()
    this.validUntil = data.validUntil || data.valid_until || new Date()
    this.autoRenew = data.autoRenew ?? data.auto_renew ?? true
    this.trialEndDate = data.trialEndDate || data.trial_end_date || null
    this.notes = data.notes || ''
    this.metadata = data.metadata || {}

    this.application = data.application ? new ApplicationDTO(data.application) : null
    this.tariff = data.tariff ? new TariffDTO(data.tariff) : null
    this.portal = data.portal ? new PortalDTO(data.portal) : null
  }

  get isActive(): boolean {
    return ['trial', 'active'].includes(this.status) && new Date(this.validUntil) > new Date()
  }

  get daysLeft(): number {
    const now = new Date()
    const until = new Date(this.validUntil)
    const diff = until.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  get companyName(): string {
    return this.portal ? this.portal.companyName || this.portal.b24Domain || '-' : '-'
  }

  get name(): string {
    return (
      (this.portal ? this.portal.companyName || this.portal.b24Domain || '-' : '-') +
      '/' +
      (this.application ? this.application.name || '' : '')
    )
  }
}
