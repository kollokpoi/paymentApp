import type { UpdateAndCreatePortalRequest } from "@/services/portal.service"
import type { PortalDTO} from "../portal.dto"

export interface PortalEditData {
  isActive: boolean
  companyName: string
  adminEmail: string
  b24Domain: string
  b24MemberId: string
}

export const portalDataToRequest = (data: PortalEditData):UpdateAndCreatePortalRequest=>({
  is_active: data.isActive,
  company_name:data.companyName,
  admin_email:data.adminEmail,
  b24_domain:data.b24Domain,
  b24_member_id:data.b24MemberId
})

export const createPortalEditData = (portal: PortalDTO): PortalEditData => ({
  isActive: portal.isActive,
  companyName: portal.companyName || '',
  adminEmail: portal.adminEmail || '',
  b24Domain: portal.b24Domain || '',
  b24MemberId: portal.b24MemberId || '',
})

export const applyPortalEditData = (portal: PortalDTO, editData: PortalEditData): void => {
  portal.isActive = editData.isActive
  portal.companyName = editData.companyName.trim() || null
  portal.adminEmail = editData.adminEmail.trim() || null
  portal.b24Domain = editData.b24Domain.trim() || null
  portal.b24MemberId = editData.b24MemberId.trim() || null
  portal.updatedAt = new Date()
}
