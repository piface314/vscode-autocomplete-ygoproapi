import * as vscode from 'vscode'
import { Classes, ClsEntry } from '../data'


type Suggestion = {
  label: string
  desc: string
  kind: vscode.CompletionItemKind
}

const format = (entry: ClsEntry): Suggestion => ({
  label: entry.id,
  desc: entry.desc,
  kind: entry.module ?
    vscode.CompletionItemKind.Module :
    vscode.CompletionItemKind.Class
})

export const getDisposable = () => vscode.languages.registerCompletionItemProvider('lua', {
  provideCompletionItems(doc, pos, token, context) {
    if (context.triggerCharacter)
      return undefined
    return Classes.map(format).map(s => {
      const item = new vscode.CompletionItem(s.label, s.kind)
      item.documentation = s.desc
      return item
    })
  }
})