export interface ApplicationShortDTOData {
  id: string
  code?: string
  name?: string
  is_active?: boolean
  isActive?: boolean
  icon_url?: string | null
  iconUrl?: string | null
  sort_order?: number
  sortOrder?: number
}

export class ApplicationShortDTO {
  id: string
  code: string
  name: string
  isActive: boolean
  iconUrl: string | null
  sortOrder: number

  constructor(data: ApplicationShortDTOData) {
    this.id = data.id
    this.code = data.code || ''
    this.name = data.name || ''
    this.isActive = data.isActive ?? data.is_active ?? true
    this.iconUrl = data.iconUrl || data.icon_url || null
    this.sortOrder = data.sortOrder || data.sort_order || 0
  }

  get selectOption() {
    return {
      value: this.id,
      label: this.name,
      code: this.code
    }
  }

  static fromRaw(data: ApplicationShortDTOData): ApplicationShortDTO {
    return new ApplicationShortDTO(data)
  }

  static fromArray(data: ApplicationShortDTOData[]): ApplicationShortDTO[] {
    return data.map(item => new ApplicationShortDTO(item))
  }
}
