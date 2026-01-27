/* eslint-disable @typescript-eslint/no-explicit-any */
import { PortalDTO, type Metadata } from '.'
import { PaymentStatus } from '../api/responses'
import { SubscriptionDTO } from './subscription.dto'


export interface PaymentDTOData {
  id: string
  portal_id?: string | null
  portalId?: string | null
  external_id?: string| null
  externalId?: string| null
  amount: number | string
  status?: PaymentStatus
  payment_method?: string | null
  paymentMethod?: string | null
  description?: string | null
  metadata?: Metadata
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  portal?: any
}

export class PaymentDTO {
  id: string
  portalId: string | null
  externalId: string | null
  amount: number
  status: PaymentStatus
  paymentMethod: string | null
  description: string | null
  metadata: Metadata
  createdAt: string | Date
  updatedAt: string | Date
  portal: PortalDTO | null

  constructor(data: PaymentDTOData) {
    this.id = data.id
    this.portalId = data.portal_id || data.portalId || null
    this.externalId = data.external_id || data.externalId || null
    this.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    this.status = data.status || PaymentStatus.PENDING
    this.paymentMethod = data.payment_method || data.paymentMethod || null
    this.description = data.description || null
    this.metadata = data.metadata || {}
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()

    this.portal = null
    if (data.portal) {
      this.portal = new PortalDTO(data.portal)
    }
  }
}
