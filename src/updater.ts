import * as vscode from 'vscode'
import * as path from 'path'
import Config from './config'
import { Endpoints, FuncEntry, MethodGroupEntry, ConstEntry, ArgEntry } from './data'
const Papa = require('./papaparse')
import { TextEncoder } from 'text-encoding'

type SheetRow = {
  [key: string]: string
}

export default class Updater {
  private LAST_UPDATE_KEY = 'lastUpdate'
  private updating = 0

  constructor(private context: vscode.ExtensionContext) { }

  update(forced: boolean = false) {
    if (forced || this.shoudlUpdate()) {
      this.updating = 2
      this.readConstants()
      this.readFunctions()
    }
  }

  finish() {
    this.saveLastUpdate()
    const msg = 'Autocomplete YGOPro API database has been succesfully updated!'
    const button = 'Reload'
    vscode.window.showInformationMessage(msg, button).then(s => {
      if (s == button)
        vscode.commands.executeCommand('workbench.action.reloadWindow')
    })
  }

  shoudlUpdate() {
    const lastUpdate = this.context.globalState.get<number>(this.LAST_UPDATE_KEY)
    if (!lastUpdate)
      return true
    return Date.now() - lastUpdate >= Config.getUpdateInterval()
  }

  saveLastUpdate() {
    this.context.globalState.update(this.LAST_UPDATE_KEY, Date.now())
  }
  
  read(url: string, step: (row: SheetRow) => any, complete: () => any) {
    Papa.parse(url, {
      download: true, header: true,
      step: (row: any) => {
        try { step(row.data) } catch (e) { }
      },
      complete: () => {
        complete()
        if (--this.updating == 0)
          this.finish()
      }
    })
  }

  readConstants() {
    const { constants } = Endpoints
    const list: ConstEntry[] = []
    this.read(constants, (row: SheetRow) => {
      const { name, desc, val } = row
      list.push({ id: name, value: val, desc: desc })
    }, () => {
      this.save('constants', list)
    })
  }

  readFunctions() {
    const { functions } = Endpoints
    const globals: FuncEntry[] = []
    const mgroups: { [cls: string]: MethodGroupEntry } = {
      Card: this.newMethodGroup('Card', 'c'),
      Effect: this.newMethodGroup('Effect', 'e'),
      Group: this.newMethodGroup('Group', 'g')
    }
    this.read(functions, (row: SheetRow) => {
      const [sig, name, desc] = this.convertTypes(row)
      const [cls, id, rawargs] = this.splitFunctionName(name)
      if (!id || cls == 'bit' || id == 'initial_effect')
        return
      const [argstr, args] = this.fmtArgs(rawargs)
      const ret = this.fmtRet(sig)
      const entry: FuncEntry = { id, argstr, args, desc, ret }
      if (cls) {
        let group = mgroups[cls]
        if (!group)
          group = mgroups[cls] = this.newMethodGroup(cls)
        group.methods.push(entry)
      } else
        globals.push(entry)
    }, () => {
      const methods: MethodGroupEntry[] = []
      for (const k in mgroups)
        methods.push(mgroups[k])
      this.save('methods', methods)
      this.save('globals', globals)
    })
  }

  convertTypes({ sig, name, desc }: SheetRow): string[] {
    const convert = (s: string) => s.replace(/\bbool\b/g, 'boolean')
      .replace(/\bint\b|\binteger\b/g, 'number')
      .replace(/\bvar\b/g, 'any')
    return [convert(sig), convert(name), desc]
  }

  newMethodGroup(cls: string, infer?: string): MethodGroupEntry {
    return { cls, infer, methods: [] }
  }

  splitFunctionName(name: string): string[] {
    const m = name.match(/^([^\.(]*?)\.?([^\.(]*)(?:\((.*)\))?$/)
    return m ? m.slice(1) : []
  }

  fmtArgs(rawargs: string): [string, ArgEntry[]] | undefined[] {
    if (rawargs === undefined)
      return []
    const [argstr, args] = this.splitArgs(rawargs)
    return this.markOptional(argstr, args)
  }

  splitArgs(rawargs: string): [string, ArgEntry[]] {
    let args: ArgEntry[] = [], argstr = ''
    const r = /\s*(\.\.\.|[\w\|]*)\s*(\.\.\.|[\w\|]+)\s*/
    rawargs.split(',').forEach(arg => {
      argstr += arg.replace(r, (_, t, id) => {
        const [__, argID, altType] = id.match(/^([^|]+)(\|.+)?$/)
        if (!t) {
          args.push({ id: id, type: '' })
          return id
        } else {
          t += altType || ''
          args.push({ id: argID, type: t })
          return `${argID}: ${t}`
        }
      }) + ', '
    })
    if (argstr.endsWith(', '))
      argstr = argstr.slice(0, -2)
    return [argstr, args]
  }

  splitTraverse = function* (s: string, splitter: string): Generator<[number, string], any, any> {
    const ss = s.split(splitter)
    for (let i = 0; i < ss.length; ++i)
      for (const c of ss[i])
        yield [i, c]
  }

  markOptional(argstr: string, args: ArgEntry[]): [string, ArgEntry[]] {
    let last = -1, opt
    for (const [i, c] of this.splitTraverse(argstr, ',')) {
      if (c == '[')
        opt = true
      if (i != last && args[i])
        args[i].opt = opt
      last = i
    }
    return [argstr, args]
  }

  fmtRet(sig: string): string[] | undefined {
    return sig != 'void' && sig.split(',').map(s => {
      const m = s.match(/^\s*[\[\]]?([^\[\]]*)[\[\]]?\s*$/)
      return m ? m[1] : ''
    }) || undefined
  }

  strToBuffer(s: string): Uint8Array {
    return new TextEncoder('utf8').encode(s)
  }

  save(file: string, data: any) {
    const fp = path.resolve(__dirname, 'data', file + '.json')
    const uri = vscode.Uri.file(fp)
    const jsondata = JSON.stringify(data, null, 2)
    vscode.workspace.fs.writeFile(uri, this.strToBuffer(jsondata))
  }
}
