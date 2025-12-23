import type { AdminUserDTOData } from './admin-user.dto'
import type { ApplicationDTOData, ApplicationSettings } from './application.dto'
import type { PaymentDTOData, PaymentMetadata } from './payment.dto'
import type { PortalDTOData, PortalMetadata } from './portal.dto'
import type { SubscriptionDTOData } from './subscription.dto'
import type { TariffDTOData, TariffLimits } from './tariff.dto'

// Экспорт всех DTO классов
export * from './admin-user.dto'
export * from './application.dto'
export * from './payment.dto'
export * from './portal.dto'
export * from './subscription.dto'
export * from './tariff.dto'

// Экспорт интерфейсов для использования в API
export type {
  AdminUserDTOData,
  ApplicationDTOData,
  PaymentDTOData,
  PortalDTOData,
  SubscriptionDTOData,
  TariffDTOData,
  ApplicationSettings,
  PaymentMetadata,
  PortalMetadata,
  TariffLimits
}
