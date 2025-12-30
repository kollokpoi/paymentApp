import { SubscriptionDTO } from './subscription.dto'

export interface PortalMetadata {
  [key: string]: any
}

export interface PortalDTOData {
  id: string
  b24_member_id?: string
  b24MemberId?: string
  b24_domain?: string
  b24Domain?: string
  company_name?: string
  companyName?: string
  admin_email?: string
  adminEmail?: string
  is_active?: boolean
  isActive?: boolean
  last_sync_at?: string | Date
  lastSyncAt?: string | Date
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  metadata?: PortalMetadata
  subscriptions?: any[]
}

export class PortalDTO {
  id: string
  b24MemberId: string | null
  b24Domain: string | null
  companyName: string | null
  adminEmail: string | null
  isActive: boolean
  lastSyncAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  metadata: PortalMetadata
  subscriptions: SubscriptionDTO[]

  constructor(data: PortalDTOData) {
    this.id = data.id
    this.b24MemberId = data.b24_member_id || data.b24MemberId || null
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
