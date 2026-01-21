import type { UpdatePortalRequest } from "@/services/portal.service"
import type { PortalDTO} from "../portal.dto"

export interface PortalEditData {
  isActive: boolean
  companyName: string
  adminEmail: string | null
  b24Domain: string
}

export const portalDataToRequest = (data: PortalEditData):UpdatePortalRequest=>({
  is_active: data.isActive,
  company_name:data.companyName,
  admin_email:data.adminEmail,
  b24_domain:data.b24Domain
})

export const createPortalEditData = (portal: PortalDTO): PortalEditData => ({
  isActive: portal.isActive,
  companyName: portal.companyName || '',
  adminEmail: portal.adminEmail,
  b24Domain: portal.b24Domain || '',
})

export const applyPortalEditData = (portal: PortalDTO, editData: PortalEditData): void => {
  portal.isActive = editData.isActive
  portal.companyName = editData.companyName.trim() || null
  portal.adminEmail = editData.adminEmail?.trim() || null
  portal.b24Domain = editData.b24Domain.trim() || null
  portal.updatedAt = new Date()
}
