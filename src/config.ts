

export default class Config {
  static DAY = 86400

  static get(cfg: string): any {
    return null
  }

  static getFromEditor(cfg: string): any {
    return null
  }

  static getUpdateInterval(): number {
    const upCfg = Config.get('updateFrequency')
    const DAY = Config.DAY
    switch (upCfg) {
      case 'Daily': return DAY
      case 'Weekly': return DAY * 7
      case 'Monthly': return DAY * 30
      case 'Never': return Infinity
      default: return 0
    }
  }
}
