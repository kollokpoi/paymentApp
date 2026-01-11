
import type { UpdatePaymentRequest } from "@/services"
import type { Metadata, PaymentDTO } from ".."
import type { PaymentStatus } from "@/types/api/responses"

export interface PaymentEditData {
  status: PaymentStatus
  external_id: string
  description: string
  metadata: Metadata
}

export const paymentDataToRequest = (data: PaymentEditData):UpdatePaymentRequest=>({
  status: data.status,
  external_id:data.external_id,
  description:data.description,
  metadata:data.metadata,
})

export const createPaymentEditData = (portal: PaymentDTO): PaymentEditData => ({
  status: portal.status,
  external_id: portal.externalId || '',
  description: portal.description || '',
  metadata: portal.metadata
})

export const applyPaymentEditData = (portal: PaymentDTO, editData: PaymentEditData): void => {
  portal.status = editData.status
  portal.externalId = editData.external_id || null
  portal.description = editData.description || null
  portal.metadata = editData.metadata
}
