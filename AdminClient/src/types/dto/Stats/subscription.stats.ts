export interface SubscriptionStatsDTOData {
  total: number
  active: number
  trial: number
  activeCount: number
  suspended: number
  cancelled: number
  expired: number
  expiring: number
  monthlyRevenue: number
  monthlyStats?: Array<{
    month: string
    count: number
  }>
  dailyStats?: Array<{
    date: string
    count: number
  }>
  appStats?: Array<{
    appId: string
    appName: string
    count: number
  }>
  portalStats?: Array<{
    portalId: string
    portalName: string
    count: number
  }>
  summary?: {
    activePercentage: number
    trialPercentage: number
    renewalRate: number
    churnRate?: number
  }
}

export class SubscriptionStatsDTO {
  total: number
  active: number
  trial: number
  activeCount: number
  suspended: number
  cancelled: number
  expired: number
  expiring: number
  monthlyRevenue: number
  monthlyStats: Array<{
    month: string
    count: number
  }>
  dailyStats: Array<{
    date: string
    count: number
  }>
  appStats: Array<{
    appId: string
    appName: string
    count: number
  }>
  portalStats: Array<{
    portalId: string
    portalName: string
    count: number
  }>
  summary: {
    activePercentage: number
    trialPercentage: number
    renewalRate: number
    churnRate: number
  }

  constructor(data: SubscriptionStatsDTOData) {
    this.total = data.total || 0
    this.active = data.active || 0
    this.trial = data.trial || 0
    this.activeCount = data.activeCount || 0
    this.suspended = data.suspended || 0
    this.cancelled = data.cancelled || 0
    this.expired = data.expired || 0
    this.expiring = data.expiring || 0
    this.monthlyRevenue = data.monthlyRevenue || 0
    
    this.monthlyStats = (data.monthlyStats || []).map(item => ({
      month: item.month || '',
      count: item.count || 0
    }))
    
    this.dailyStats = (data.dailyStats || []).map(item => ({
      date: item.date || '',
      count: item.count || 0
    }))
    
    this.appStats = (data.appStats || []).map(item => ({
      appId: item.appId || '',
      appName: item.appName || 'Без названия',
      count: item.count || 0
    }))
    
    this.portalStats = (data.portalStats || []).map(item => ({
      portalId: item.portalId || '',
      portalName: item.portalName || 'Без названия',
      count: item.count || 0
    }))
    
    this.summary = {
      activePercentage: data.summary?.activePercentage || 0,
      trialPercentage: data.summary?.trialPercentage || 0,
      renewalRate: data.summary?.renewalRate || 0,
      churnRate: data.summary?.churnRate || 0
    }
  }

  toApiResponse(): SubscriptionStatsDTOData {
    return {
      total: this.total,
      active: this.active,
      trial: this.trial,
      activeCount: this.activeCount,
      suspended: this.suspended,
      cancelled: this.cancelled,
      expired: this.expired,
      expiring: this.expiring,
      monthlyRevenue: this.monthlyRevenue,
      monthlyStats: this.monthlyStats,
      dailyStats: this.dailyStats,
      appStats: this.appStats,
      portalStats: this.portalStats,
      summary: this.summary
    }
  }

  static fromApiData(data: SubscriptionStatsDTOData): SubscriptionStatsDTO {
    return new SubscriptionStatsDTO(data)
  }
}