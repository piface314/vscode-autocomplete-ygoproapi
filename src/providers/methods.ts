import Config from '../config'
import Parser from '../parser'
import { MethodGroupEntry, FuncEntry, ArgEntry } from '../data'


export default class MethodsProvider {
  private PRIORITY = 5
  private space: string = ' '
  private opt: boolean = false
  private ret: boolean = true 

  constructor() {
    
  }

  getSuggestions(/*options*/) {
    // this.space = Config.get('useSpacing') ? ' ' : ''
    // this.opt = Config.get('suggestOptionalArguments')
    // this.ret = Config.get('showReturnTypes')
    // const [ tableID, indexer, prefix ] = this.getPrefix(options)
    // if (!tableID)
    //   return []
    // const group = this.getMethodGroup(tableID, indexer, prefix, options)
    // if (!group)
    //   return []
    // const suggestions = this.match(group, prefix)
    // return this.format(group, indexer, suggestions)
	}

  getPrefix() {
    const line = ''//editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    const match = line.match(/([a-zA-Z_]\w*)([\.:])((?:[a-zA-Z_]\w*)*)$/)
    return match ? match.slice(1) : []
  }

  getMethodGroup(tableID: string, indexer: string, prefix: string) {
    return Parser.checkStaticCall(tableID, indexer)
      || this.inferFromCode(tableID, prefix)
      || Parser.inferTypeFromID(tableID)
  }

  inferFromCode(tableID: string, prefix: string) {
    // const end = [bufferPosition.row, bufferPosition.column - prefix.length]
    const code = ''//editor.getTextInRange([[0, 0], end])
    return Parser.inferTypeFromCode(tableID, code)
  }

  match(group: MethodGroupEntry, prefix: string): FuncEntry[] {
    prefix = prefix.toLowerCase()
    return group.methods.filter(m => m.id.toLowerCase().startsWith(prefix))
  }

  format({ cls }: MethodGroupEntry, indexer: string, suggestions: FuncEntry[]) {
    const sschk = indexer == ':' ? cls : null
    const sp = this.space
    const opt = this.opt
    const fmtArgs = (args?: ArgEntry[]) => {
      if (!args)
        return [ '', '' ]
      if (args[0] && sschk === args[0].type)
        args = args.slice(1)
      if (!opt)
        args = args.filter(a => !a.opt)
      if (args.length == 0)
        return [ '()', '()' ]
      const sargs = args.map(({ id }) => id)
      return [
        sargs.reduce((a, b) => `${a},${b}`),
        sargs.map((a, i) => `\${${i + 1}:${a}}`).reduce((a, b) => `${a},${sp}${b}`)
      ].map(s => `(${s})`)
    }
    const fmt = (entry: FuncEntry) => {
      const { id, argstr, args, desc, ret } = entry
      const [ argids, argidsSnippet ] = fmtArgs(args)
      const sret = ret ? ret.reduce((a, b) => `${a},${b}`) : ''
      return {
        displayText: `${id}${argids}`,
        description: `${cls}.${id}(${argstr || ''})${sret && (': ' + sret)}\n${desc}`,
        leftLabel: this.ret && sret ? sret : null,
        type: 'method',
        snippet: `${id}${argidsSnippet}`
      }
    }
    return suggestions.map(e => fmt(e))
  }
}
