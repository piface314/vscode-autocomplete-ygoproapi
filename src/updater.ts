import * as fs from 'fs'
import * as path from 'path'
import * as Papa from 'papaparse'
import Config from './config'
import { Endpoints, FuncEntry, MethodGroupEntry, ConstEntry, ArgEntry } from './data'

type SheetRow = {
  [key: string]: string
}

export default class Updater {
  static LAST_UPDATE_KEY = 'autocomplete-ygoproapi.lastUpdate'
  static updating = 0

  static update(forced: boolean = false) {
    // if (forced || Updater.shoudlUpdate()) {
    //   Updater.updating = 2
    //   Updater.readConstants()
    //   Updater.readFunctions()
    // }
  }

  static finish() {
    Updater.saveLastUpdate()
    const msg = 'Autocomplete YGOPro API database has been succesfully updated!'
    // const notif = atom.notifications.addSuccess(msg, {
    //   dismissable: true,
    //   detail: 'Reload Atom to use fresh data ;)',
    //   buttons: [{
    //     onDidClick: () => atom.reload(),
    //     text: 'Reload'
    //   }]
    // })
  }

  static shoudlUpdate() {
    const lastUpdate = 1//atom.window.localStorage.getItem(Updater.LAST_UPDATE_KEY)
    if (!lastUpdate)
      return true
    return Date.now() - lastUpdate >= Config.getUpdateInterval()
  }

  static saveLastUpdate() {
    // atom.window.localStorage.setItem(Updater.LAST_UPDATE_KEY, Date.now())
  }

  static read(url: string, step: (row: SheetRow) => any, complete: () => any) {
    Papa.parse(url, {
      download: true, header: true,
      step: (row: any) => {
        try { step(row.data) } catch (e) { }
      },
      complete: () => {
        complete()
        if (--Updater.updating == 0)
          Updater.finish()
      }
    })
  }

  static readConstants() {
    const { constants } = Endpoints
    const list: ConstEntry[] = []
    Updater.read(constants, (row: SheetRow) => {
      const { name, desc, val } = row
      list.push({ id: name, value: val, desc: desc })
    }, () => {
      Updater.save('constants', list)
    })
  }

  static readFunctions() {
    const { functions } = Endpoints
    const globals: FuncEntry[] = []
    const mgroups: { [cls: string]: MethodGroupEntry } = {
      Card: Updater.newMethodGroup('Card', 'c'),
      Effect: Updater.newMethodGroup('Effect', 'e'),
      Group: Updater.newMethodGroup('Group', 'g')
    }
    Updater.read(functions, (row: SheetRow) => {
      const [sig, name, desc] = Updater.convertTypes(row)
      const [cls, id, rawargs] = Updater.splitFunctionName(name)
      if (!id || cls == 'bit' || id == 'initial_effect')
        return
      const [argstr, args] = Updater.fmtArgs(rawargs)
      const ret = Updater.fmtRet(sig)
      const entry: FuncEntry = { id, argstr, args, desc, ret }
      if (cls) {
        let group = mgroups[cls]
        if (!group)
          group = mgroups[cls] = Updater.newMethodGroup(cls)
        group.methods.push(entry)
      } else
        globals.push(entry)
    }, () => {
      const methods: MethodGroupEntry[] = []
      for (const k in mgroups)
        methods.push(mgroups[k])
      Updater.save('methods', methods)
      Updater.save('globals', globals)
    })
  }

  static convertTypes({ sig, name, desc }: SheetRow): string[] {
    const convert = (s: string) => s.replace(/\bbool\b/g, 'boolean')
      .replace(/\bint\b|\binteger\b/g, 'number')
      .replace(/\bvar\b/g, 'any')
    return [convert(sig), convert(name), desc]
  }

  static newMethodGroup(cls: string, infer?: string): MethodGroupEntry {
    return { cls, infer, methods: [] }
  }

  static splitFunctionName(name: string): string[] {
    const m = name.match(/^([^\.(]*?)\.?([^\.(]*)(?:\((.*)\))?$/)
    return m ? m.slice(1) : []
  }

  static fmtArgs(rawargs: string): [string, ArgEntry[]] | undefined[] {
    if (!rawargs)
      return [undefined, undefined]
    const args: ArgEntry[] = [], splitter = /([\w\|]+)\s+(\.\.\.|[\w\|]+)/g
    const argstr = rawargs.replace(splitter, (_, argType, argIDT) => {
      const [__, argID, altType] = argIDT.match(/^([^|]+)(\|.+)?$/)
      argType += altType || ''
      args.push({ id: argID, type: argType })
      return `${argID}: ${argType}`
    })
    let last: number = -1, opt: boolean | undefined
    for (const [i, c] of Updater.splitTraverse(argstr, ',')) {
      if (c == '[')
        opt = true
      if (i != last && args[i])
        args[i].opt = opt
      last = i
    }
    return [argstr, args]
  }

  static splitTraverse = function* (s: string, splitter: string): Generator<[number, string], any, any> {
    const ss = s.split(splitter)
    for (let i = 0; i < ss.length; ++i)
      for (const c of ss[i])
        yield [i, c]
  }

  static fmtRet(sig: string): string[] | undefined {
    return sig != 'void' && sig.split(',').map(s => {
      const m = s.match(/^\s*[\[\]]?([^\[\]]*)[\[\]]?\s*$/)
      return m ? m[1] : ''
    }) || undefined
  }

  static save(file: string, data: any) {
    const fp = path.resolve(__dirname, '..', 'data', file + '.json')
    fs.writeFile(fp, JSON.stringify(data, null, 2), (e) => null)
  }
}
