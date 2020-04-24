import * as vscode from 'vscode'
import { Globals, FuncEntry, ArgEntry } from '../data'
import Config from '../config'


type Suggestion = {
  label: string
  desc: string
  detail: string
  snippet: string
}

export default class GlobalsProvider {
  private space: string = ' '
  private opt: boolean = false

  constructor() { }

  getSuggestions(): Suggestion[] {
    this.space = Config.get('useSpacing') ? ' ' : ''
    this.opt = Config.get('suggestOptionalArguments')
    return Globals.map(e => this.format(e))
  }

  format = (entry: FuncEntry): Suggestion => {
    const { id, argstr, args, desc, ret } = entry
    const argidsSnippet = this.fmtArgs(args)
    const sret = ret ? ret.reduce((a, b) => `${a}, ${b}`) : ''
    return {
      label: id,
      desc: desc,
      snippet: `${id}${argidsSnippet}`,
      detail: `${id}(${argstr || ''})${sret && (': ' + sret)}`
    }
  }

  fmtArgs(args?: ArgEntry[]): string {
    if (!args)
      return ''
    const sp = this.space
    if (!this.opt)
      args = args.filter(a => !a.opt)
    const snip = args.length ?
      args.map(({ id }, i) => `\${${i + 1}:${id}}`)
        .reduce((a, b) => `${a},${sp}${b}`) :
      ''
    return `(${snip})`
  }
}

const provider = new GlobalsProvider()

export const getDisposable = () => vscode.languages.registerCompletionItemProvider('lua', {
  provideCompletionItems(doc, pos, token, context) {
    if (context.triggerCharacter)
      return undefined
    const sugs = provider.getSuggestions()
    return sugs.map(s => {
      const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Function)
      item.documentation = s.desc
      item.detail = s.detail
      item.insertText = new vscode.SnippetString(s.snippet)
      return item
    })
  }
})