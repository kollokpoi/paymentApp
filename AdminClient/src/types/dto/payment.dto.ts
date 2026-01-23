/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from '.'
import { PaymentStatus } from '../api/responses'
import { SubscriptionDTO } from './subscription.dto'


export interface PaymentDTOData {
  id: string
  subscription_id?: string | null
  subscriptionId?: string | null
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
  subscription?: any
}

export class PaymentDTO {
  id: string
  subscriptionId: string | null
  externalId: string | null
  amount: number
  status: PaymentStatus
  paymentMethod: string | null
  description: string | null
  metadata: Metadata
  createdAt: string | Date
  updatedAt: string | Date
  subscription: SubscriptionDTO | null

  constructor(data: PaymentDTOData) {
    this.id = data.id
    this.subscriptionId = data.subscription_id || data.subscriptionId || null
    this.externalId = data.external_id || data.externalId || null
    this.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    this.status = data.status || PaymentStatus.PENDING
    this.paymentMethod = data.payment_method || data.paymentMethod || null
    this.description = data.description || null
    this.metadata = data.metadata || {}
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString()
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString()

    this.subscription = null
    if (data.subscription) {
      this.subscription = new SubscriptionDTO(data.subscription)
    }
  }
}
