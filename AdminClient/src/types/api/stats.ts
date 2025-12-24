export interface statsData{
  total : number
  active: number
  inactive: number
}


export class stats{
  total : number
  active: number
  inactive: number
  constructor(data:statsData){
    this.total = data.total
    this.active = data.active
    this.inactive = data.inactive
  }
}
