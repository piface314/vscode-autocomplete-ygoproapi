import * as vscode from 'vscode'


export default class Config {
  static DAY = 86400

  static get(cfg: string): any {
    const cfgkey = `autocomplete-ygoproapi.${cfg}`
    return vscode.workspace.getConfiguration().get(cfgkey)
  }

  static getFromEditor(cfg: string): any {
    const cfgkey = `editor.${cfg}`
    return vscode.workspace.getConfiguration().get(cfgkey)
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
