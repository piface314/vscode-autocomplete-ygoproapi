import { Callbacks, CallbackEntry } from '../data'
import Config from '../config'


export default class CallbacksProvider {
  private PRIORITY = 4
  private MIN_LEN = 2
  private tab: string
  private space: string = ' '

  constructor() {
    const tabType = Config.getFromEditor('tabType')
    const tabLen = Config.getFromEditor('tabLength')
    this.tab = tabType == 'soft' ? ' '.repeat(tabLen) : '\t'
  }

  getSuggestions(/*options*/): any[] {
    // const { editor, bufferPosition } = options
    // const prefix = this.getPrefix(editor, bufferPosition)
    // this.space = Config.get('useSpacing') ? ' ' : ''
    // return prefix ? this.match(prefix).map(e => this.format(prefix, e)) : []
    return []
	}

  getPrefix(/*editor, bufferPosition*/): string | null {
    const line = ''//editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    const fndef = line.match(/function\s+(.+)$/)
    if (!fndef)
      return null
    const prefix = fndef[1].match(/[^\.]+$/)
    return prefix && prefix[0]
  }

  match(prefix: string): CallbackEntry[] {
    switch (prefix[0]) {
      case '(': return []
      case '$': return this.matchUse(prefix)
      default: return this.matchID(prefix)
    }
  }

  matchUse(prefix: string): CallbackEntry[] {
    const pat = prefix.toLowerCase().slice(1)
    const used = (u: string) => u.toLowerCase().includes(pat)
    return Callbacks.filter(e => e.usedBy && e.usedBy.some(used))
  }

  matchID(prefix: string): CallbackEntry[] {
    const pat = prefix.toLowerCase()
    if (prefix.length >= this.MIN_LEN)
      return Callbacks.filter(e => e.id.startsWith(pat))
    else
      return []
  }

  format = (prefix: string, entry: CallbackEntry) => ({
    // replacementPrefix: prefix,
    // displayText: entry.id,
    // description: this.fmtDescription(entry),
    // rightLabel: entry.usedAs,
    // type: 'snippet',
    // snippet: this.fmtSnippet(entry)
  })

  fmtDescription(entry: CallbackEntry) {
    const { id, args, desc, usedBy, ret } = entry
    const arglist = args.map(a => a.id).reduce((a, b) => `${a}, ${b}`)
    const argdesc = args.map(a => `${a.id}: ${a.type} | ${a.desc};`)
      .reduce((a, b) => `${a}\n${b}`)
    const uses = usedBy ? '\n\nUsed by: ' + usedBy.reduce((a, b) => `${a}, ${b}`) : ''
    const returns = ret ? ': ' + ret : ''
    return `${id}(${arglist})${returns}
${desc}

${argdesc}${uses}`
  }

  fmtSnippet(entry: CallbackEntry) {
    const { id, args } = entry
    const argsSnip = args.map(a => a.id).reduce((a, b) => `${a},${this.space}${b}`)
    return `${id}(${argsSnip})
${this.tab}$1
end
`
  }
}
