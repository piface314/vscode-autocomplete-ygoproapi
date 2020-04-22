import * as vscode from 'vscode'
import { Callbacks, CallbackEntry } from '../data'
import Config from '../config'


type Suggestion = {
  label: string
  desc: string
  detail: string
  snippet: string
  filter?: string
}

const USE_CHAR = '$'

class CallbacksProvider {
  private PRIORITY = 4
  private tab: string
  private space: string = ' '
  private useSearch: boolean = false
  private prefix: string = ''

  constructor() {
    const insertSpaces = Config.getFromEditor('insertSpaces')
    const tabSize = Config.getFromEditor('tabSize')
    this.tab = insertSpaces ? ' '.repeat(tabSize) : '\t'
  }

  findPrefix(line: string): string | null {
    const fndef = line.match(/function\s+(.*)$/)
    if (!fndef)
      return null
    const m = fndef[1].match(/[^\.]*$/)
    const prefix =  m && m[0]
    this.prefix = prefix || ''
    return prefix
  }

  getSuggestions(): Suggestion[] {
    this.space = Config.get('useSpacing') ? ' ' : ''
    return this.match(this.prefix).map(e => this.format(e))
  }

  match(prefix: string): CallbackEntry[] {
    switch (prefix[0]) {
      case '(': return []
      case USE_CHAR: return this.matchUse(prefix)
      default: return this.matchID(prefix)
    }
  }

  matchUse(prefix: string): CallbackEntry[] {
    this.useSearch = true
    const pat = prefix.toLowerCase().slice(1)
    const used = (u: string) => u.toLowerCase().includes(pat)
    return Callbacks.filter(e => e.usedBy && e.usedBy.some(used))
  }

  matchID(prefix: string): CallbackEntry[] {
    const pat = prefix.toLowerCase()
    return Callbacks.filter(e => e.id.startsWith(pat))
  }

  format = (entry: CallbackEntry): Suggestion => {
    const [sig, desc] = this.fmtDescription(entry)
    return {
      label: entry.id,
      desc: desc,
      detail: `(${entry.usedAs}) ${sig}`,
      snippet: this.fmtSnippet(entry),
      filter: this.fmtFilter(entry)
    }
  }

  fmtDescription(entry: CallbackEntry): string[] {
    const { id, args, desc, usedBy, ret } = entry
    const arglist = args.map(a => a.id).reduce((a, b) => `${a},${b}`)
    const argdesc = args.map(a => `${a.id}: ${a.type} | ${a.desc};`)
      .reduce((a, b) => `${a}\n${b}`)
    const uses = usedBy ? '\n\nUsed by: ' + usedBy.reduce((a, b) => `${a}, ${b}`) : ''
    const returns = ret ? ': ' + ret : ''
    return [`${id}(${arglist})${returns}`, `${desc}

${argdesc}${uses}`]
  }

  fmtSnippet(entry: CallbackEntry) {
    const { id, args } = entry
    const argsSnip = args.map(a => a.id).reduce((a, b) => `${a},${this.space}${b}`)
    return `${id}(${argsSnip})
${this.tab}$0
end`
  }

  fmtFilter(entry: CallbackEntry) {
    if (!this.useSearch || !entry.usedBy)
      return undefined
    const pat = this.prefix.toLowerCase().slice(1)
    const used = (u: string) => u.toLowerCase().includes(pat)
    return USE_CHAR + (entry.usedBy.find(used) || '')
  }
}

const provider = new CallbacksProvider()

export const getDisposable = () => vscode.languages.registerCompletionItemProvider('lua', {
  provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
    const line = doc.lineAt(pos).text.substr(0, pos.character)
    const prefix = provider.findPrefix(line)
    if (prefix == null)
      return undefined
    const range = new vscode.Range(pos.translate(0, -prefix.length), pos)
    const sugs = provider.getSuggestions()
    return sugs.map(s => {
      const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Snippet)
      item.detail = s.detail
      item.documentation = s.desc
      item.insertText = new vscode.SnippetString(s.snippet)
      item.range = range
      item.filterText = s.filter
      return item
    })
  }
}, USE_CHAR, '.', ' ')