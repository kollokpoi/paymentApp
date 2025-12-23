import type { PaymentStatus } from '../api/responses'
import { SubscriptionDTO } from './subscription.dto'

export interface PaymentMetadata {
  [key: string]: any
}

export interface PaymentDTOData {
  id: string
  subscription_id?: string
  subscriptionId?: string
  external_id?: string
  externalId?: string
  amount: number | string
  currency?: string
  status?: PaymentStatus
  payment_method?: string
  paymentMethod?: string
  description?: string
  metadata?: PaymentMetadata
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
  currency: string
  status: PaymentStatus
  paymentMethod: string | null
  description: string | null
  metadata: PaymentMetadata
  createdAt: string | Date
  updatedAt: string | Date
  subscription: SubscriptionDTO | null

  constructor(data: PaymentDTOData) {
    this.id = data.id
    this.subscriptionId = data.subscription_id || data.subscriptionId || null
    this.externalId = data.external_id || data.externalId || null
    this.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    this.currency = data.currency || 'RUB'
    this.status = data.status || 'pending'
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

  toJSON() {
    return {
      id: this.id,
      subscription_id: this.subscriptionId,
      external_id: this.externalId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      payment_method: this.paymentMethod,
      description: this.description,
      metadata: this.metadata,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      subscription: this.subscription ? this.subscription.toJSON() : null
    }
  }
}
