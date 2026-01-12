export interface AppStatsDTOData {
  total: number
  active: number
  inactive: number
}

export class AppStatsDTO {
  total: number
  active: number
  inactive: number

  constructor(data: AppStatsDTOData) {
    this.total = data.total || 0
    this.active = data.active || 0
    this.inactive = data.inactive || 0
  }
}