import type { UpdateTariffRequest } from '@/services'
import type { TariffDTO, TariffLimits } from '..'
import type { PeriodType } from '@/types/api/responses'

export interface TariffEditData {
  name: string
  code: string
  description: string
  price: number
  period: PeriodType
  trialDays: number
  isActive: boolean
  isDefault: boolean
  limits: TariffLimits
  features: string[]
  sortOrder: number
}

export const tariffDataToRequest = (data: TariffEditData): UpdateTariffRequest => ({
  name: data.name,
  code: data.code,
  description: data.description,
  price: data.price,
  period: data.period,
  trial_days: data.trialDays,
  is_active: data.isActive,
  is_default: data.isDefault,
  limits: data.limits,
  features: data.features,
  sort_order: data.sortOrder,
})

export const createTariffEditData = (tariff: TariffDTO): TariffEditData => ({
  name: tariff.name,
  code: tariff.code,
  description: tariff.description,
  price: tariff.price,
  period: tariff.period,
  trialDays: tariff.trialDays,
  isActive: tariff.isActive,
  isDefault: tariff.isDefault,
  limits: { ...tariff.limits },
  features: [...tariff.features],
  sortOrder: tariff.sortOrder,
})

export const applyTariffEditData = (tariff: TariffDTO, editData: TariffEditData): void => {
  tariff.name = editData.name
  tariff.code = editData.code
  tariff.description = editData.description
  tariff.price = editData.price
  tariff.period = editData.period
  tariff.trialDays = editData.trialDays
  tariff.isActive = editData.isActive
  tariff.isDefault = editData.isDefault
  tariff.limits = editData.limits
  tariff.features = editData.features
  tariff.sortOrder = editData.sortOrder
}
