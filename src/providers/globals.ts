import { Globals, FuncEntry, ArgEntry } from '../data'
import Config from '../config'


export default class GlobalsProvider {
  private PRIORITY = 2
  private MIN_LEN = 3
  private space: string = ' '
  private opt: boolean = false
  private ret: boolean = true

  constructor() {
    
  }

  getSuggestions(/*options*/) {
    // const { prefix } = options
    // this.space = Config.get('useSpacing') ? ' ' : ''
    // this.opt = Config.get('suggestOptionalArguments')
    // this.ret = Config.get('showReturnTypes')
    // if (prefix.length >= this.MIN_LEN)
    //   return this.match(prefix).map(e => this.format(e))
	}

  match(prefix: string): FuncEntry[] {
    prefix = prefix.toLowerCase()
    const starts: FuncEntry[] = [], includes: FuncEntry[] = []
    Globals.forEach((e) => {
      const id = e.id.toLowerCase()
      if (id.startsWith(prefix))
        starts.push(e)
      else if (id.includes(prefix))
        includes.push(e)
    })
    return starts.concat(includes)
  }

  format = (entry: FuncEntry) => {
    // const { id, argstr, args, desc, ret } = entry
    // const [ argids, argidsSnippet ] = this.fmtArgs(args)
    // const sret = ret ? ret.reduce((a, b) => `${a}, ${b}`) : ''
    // return {
    //   displayText: `${id}${argids}`,
    //   description: `${id}(${argstr || ''})${sret && (': ' + sret)}\n${desc}`,
    //   leftLabel: this.ret && sret ? sret : null,
    //   type: 'function',
    //   snippet: `${id}${argidsSnippet}`
    // }
  }

  fmtArgs(args: ArgEntry[] | undefined) {
    // if (!args)
    //   return [ '', '' ]
    // const sp = this.space
    // if (!this.opt)
    //   args = args.filter(a => !a.opt)
    // if (args.length == 0)
    //   return [ '', '' ]
    // const sargs = args.map(({ id }) => id)
    // return [
    //   sargs.reduce((a, b) => `${a}, ${b}`),
    //   sargs.map((a, i) => `\${${i + 1}:${a}}`).reduce((a, b) => `${a},${sp}${b}`)
    // ].map(s => `(${s})`)
  }
}
