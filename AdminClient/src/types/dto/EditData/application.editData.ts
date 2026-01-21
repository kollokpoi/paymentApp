import type { UpdateApplicationRequest } from "@/services"
import type { Metadata, ApplicationDTO } from ".."

export interface ApplicationEditData{
    name: string
    description: string
    version: string
    isActive: boolean
    iconUrl: string
    settings?: Metadata
    sortOrder: number
}

export const applicationDataToRequest = (data: ApplicationEditData):UpdateApplicationRequest=>({
  name: data.name,
  description:data.description,
  version:data.version,
  is_active:data.isActive,
  icon_url:data.iconUrl,
  settings: data.settings,
  sort_order:data.sortOrder,
})

export const createApplicationEditData = (application: ApplicationDTO): ApplicationEditData => ({
  name: application.name,
  description:application.description,
  version:application.version,
  isActive:application.isActive,
  iconUrl:application.iconUrl || '',
  settings: application.settings,
  sortOrder:application.sortOrder,
})

export const applyApplicationEditData = (application: ApplicationDTO, editData: ApplicationEditData): void => {
  application.name= editData.name
  application.description=editData.description
  application.version=editData.version
  application.isActive=editData.isActive
  application.iconUrl=editData.iconUrl
  application.settings= editData.settings
  application.sortOrder =editData.sortOrder
}
