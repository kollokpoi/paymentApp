export interface PaymentStatsDTOData {
  totalRevenue: number
  totalPayments: number
  dailyStats: Array<{
    date: string | Date
    count: number
    total: number
  }>
}

export class PaymentStatsDTO {
  totalRevenue: number
  totalPayments: number
  dailyStats: Array<{
    date: Date | string
    count: number
    total: number
  }>

  constructor(data: PaymentStatsDTOData) {
    this.totalRevenue = data.totalRevenue || 0
    this.totalPayments = data.totalPayments || 0
    this.dailyStats = (data.dailyStats || []).map(day => ({
      ...day,
      date: new Date(day.date)
    }))
  }
}