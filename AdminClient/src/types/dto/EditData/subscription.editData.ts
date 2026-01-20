
import type { UpdateSubscriptionRequest } from "@/services"
import type { SubscriptionDTO } from ".."
import type { SubscriptionStatus } from "@/types/api/responses"

export interface SubscriptionEditData {
  status: SubscriptionStatus
  validUntil: Date
  autoRenew: boolean
  notes: string
}

export const subscriptionDataToRequest = (data: SubscriptionEditData):UpdateSubscriptionRequest=>({
  status: data.status,
  valid_until:data.validUntil,
  auto_renew:data.autoRenew,
  notes:data.notes,
})

export const createSubscriptionEditData = (portal: SubscriptionDTO): SubscriptionEditData => ({
  status: portal.status,
  validUntil: portal.validUntil ,
  autoRenew: portal.autoRenew,
  notes: portal.notes || '',
})

export const applySubscriptionEditData = (portal: SubscriptionDTO, editData: SubscriptionEditData): void => {
  portal.status = editData.status
  portal.validUntil = editData.validUntil
  portal.autoRenew = editData.autoRenew
  portal.notes = editData.notes
}
