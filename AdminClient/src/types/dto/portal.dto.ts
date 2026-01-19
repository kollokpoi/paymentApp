/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from '.'
import { SubscriptionDTO } from './subscription.dto'

export interface PortalDTOData {
  id: string
  b24_domain?: string | null
  b24Domain?: string | null
  company_name?: string | null
  companyName?: string | null
  admin_email?: string | null
  adminEmail?: string | null
  is_active?: boolean
  isActive?: boolean
  last_sync_at?: string | Date | null
  lastSyncAt?: string | Date | null
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  metadata?: Metadata
  subscriptions?: any[]
}

export class PortalDTO {
  id: string
  b24Domain: string | null
  companyName: string | null
  adminEmail: string | null
  isActive: boolean
  lastSyncAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  metadata: Metadata
  subscriptions: SubscriptionDTO[]

  constructor(data: PortalDTOData) {
    this.id = data.id
    this.b24Domain = data.b24_domain || data.b24Domain || null
    this.companyName = data.company_name || data.companyName || null
    this.adminEmail = data.admin_email || data.adminEmail || null
    this.isActive = data.is_active !== undefined ? data.is_active : (data.isActive ?? true)
    this.lastSyncAt = data.last_sync_at || data.lastSyncAt || null
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()
    this.metadata = data.metadata || {}

    this.subscriptions = []
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      this.subscriptions = data.subscriptions.map(sub =>
        new SubscriptionDTO(sub)
      ).filter((sub): sub is SubscriptionDTO => sub !== null)
    }
  }
}
