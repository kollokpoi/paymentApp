export interface PortalStatsDTOData {
  portalId: string
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  totalMonthlyRevenue: number
  subscriptions?: Array<{
    id: string
    appName: string
    tariffName: string
    status: string
    validUntil: string | Date
  }>
}

export class PortalStatsDTO {
  portalId: string
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  totalMonthlyRevenue: number
  subscriptions: Array<{
    id: string
    appName: string
    tariffName: string
    status: string
    validUntil: Date
  }>

  constructor(data: PortalStatsDTOData) {
    this.portalId = data.portalId
    this.totalSubscriptions = data.totalSubscriptions || 0
    this.activeSubscriptions = data.activeSubscriptions || 0
    this.trialSubscriptions = data.trialSubscriptions || 0
    this.totalMonthlyRevenue = data.totalMonthlyRevenue || 0
    this.subscriptions = (data.subscriptions || []).map(sub => ({
      ...sub,
      validUntil: new Date(sub.validUntil)
    }))
  }
}