export interface PortalShortDTOData {
  id: string
  b24_domain?: string
  b24Domain?: string
  company_name?: string
  companyName?: string
  is_active?: boolean
  isActive?: boolean
}

export class PortalShortDTO {
  id: string
  name: string
  domain: string
  isActive: boolean

  constructor(data: PortalShortDTOData) {
    this.id = data.id
    this.domain = data.b24Domain || data.b24_domain || ''
    this.name = data.companyName || data.company_name || this.domain
    this.isActive = data.isActive ?? data.is_active ?? true
  }

  get selectOption() {
    return {
      value: this.id,
      label: `${this.name} (${this.domain})`
    }
  }

  static fromRaw(data: PortalShortDTOData): PortalShortDTO {
    return new PortalShortDTO(data)
  }

  static fromArray(data: PortalShortDTOData[]): PortalShortDTO[] {
    return data.map(item => new PortalShortDTO(item))
  }
}
