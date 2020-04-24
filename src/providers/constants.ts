import * as vscode from 'vscode'
import { Constants, ConstEntry } from '../data'
import Config from '../config'


type Suggestion = {
  label: string
  desc: string
  detail: string
}

export default class ConstProvider {
  constructor() { }

  getSuggestions(prefix: string): Suggestion[] {
    return this.match(prefix).map(e => this.format(e))
  }

  match(prefix: string): ConstEntry[] {
    const matchCase = Config.get('matchCaseForConstants')
    const getID = matchCase ? (e: ConstEntry) => e.id : (e: ConstEntry) => e.id.toLowerCase()
    if (!matchCase)
      prefix = prefix.toLowerCase()
    return Constants.filter((e) => {
      const id = getID(e)
      return id.includes(prefix)
    })
  }

  format = (entry: ConstEntry): Suggestion => ({
    label: entry.id,
    desc: entry.desc,
    detail: `= ${entry.value}`
  })
}

const provider = new ConstProvider()

export const getDisposable = () => vscode.languages.registerCompletionItemProvider('lua', {
  provideCompletionItems(doc, pos, token, context) {
    if (context.triggerCharacter)
      return undefined
    const prefix = doc.getText(doc.getWordRangeAtPosition(pos))
    const sugs = provider.getSuggestions(prefix)
    return sugs.map(s => {
      const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Value)
      item.documentation = s.desc
      item.detail = s.detail
      return item
    })
  }
})