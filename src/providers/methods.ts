import * as vscode from 'vscode'
import Config from '../config'
import Parser from '../parser'
import { MethodGroupEntry, FuncEntry, ArgEntry } from '../data'


type Suggestion = {
  label: string
  desc: string
  detail: string
  snippet: string
}

export default class MethodsProvider {
  private PRIORITY = 5
  private space: string = ' '
  private opt: boolean = false

  constructor() { }

  getPrefix(line: string): string[] {
    const match = line.match(/([a-zA-Z_]\w*)([\.:])((?:[a-zA-Z_]\w*)*)$/)
    return match ? match.slice(1) : []
  }

  getSuggestions(prefixParts: string[], code: string): Suggestion[] {
    this.space = Config.get('useSpacing') ? ' ' : ''
    this.opt = Config.get('suggestOptionalArguments')
    const [tableID, indexer, prefix] = prefixParts
    if (!tableID)
      return []
    const group = this.getMethodGroup(tableID, indexer, prefix, code)
    if (!group)
      return []
    const entries = this.match(group, prefix)
    return this.format(group, indexer, entries)
  }

  getMethodGroup(tableID: string, indexer: string, prefix: string, code: string) {
    return Parser.checkStaticCall(tableID, indexer)
      || this.inferFromCode(tableID, prefix, code)
      || Parser.inferTypeFromID(tableID)
  }

  inferFromCode(tableID: string, prefix: string, code: string) {
    return Parser.inferTypeFromCode(tableID, code)
  }

  match(group: MethodGroupEntry, prefix: string): FuncEntry[] {
    prefix = prefix.toLowerCase()
    return group.methods.filter(m => m.id.toLowerCase().startsWith(prefix))
  }

  format({ cls }: MethodGroupEntry, indexer: string, entries: FuncEntry[]): Suggestion[] {
    const sschk = indexer == ':' ? cls : null
    const sp = this.space
    const opt = this.opt
    const fmtArgs = (args?: ArgEntry[]): string => {
      if (!args)
        return ''
      if (args[0] && sschk === args[0].type)
        args = args.slice(1)
      if (!opt)
        args = args.filter(a => !a.opt)
      const snip = args.length ?
        args.map(({ id }, i) => `\${${i + 1}:${id}}`)
          .reduce((a, b) => `${a},${sp}${b}`) :
        ''
      return `(${snip})`
    }
    const fmt = (entry: FuncEntry): Suggestion => {
      const { id, argstr, args, desc, ret } = entry
      const argidsSnippet = fmtArgs(args)
      const sret = ret ? ret.reduce((a, b) => `${a},${b}`) : ''
      return {
        label: id,
        detail: `${cls}.${id}(${argstr || ''})${sret && (': ' + sret)}`,
        desc: desc,
        snippet: `${id}${argidsSnippet}`
      }
    }
    return entries.map(e => fmt(e))
  }
}

const provider = new MethodsProvider()
const origin = new vscode.Position(0, 0)
const rangeUntil = (pos: vscode.Position) => new vscode.Range(origin, pos)

export const getDisposable = () => vscode.languages.registerCompletionItemProvider('lua', {
  provideCompletionItems(doc, pos, token, context) {
    const code = doc.getText(rangeUntil(pos))
    const line = doc.lineAt(pos).text.substr(0, pos.character)
    const prefix = provider.getPrefix(line)
    const sugs = provider.getSuggestions(prefix, code)
    return sugs.map(s => {
      const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Method)
      item.detail = s.detail
      item.documentation = s.desc
      item.insertText = new vscode.SnippetString(s.snippet)
      return item
    })
  }
}, '.', ':')