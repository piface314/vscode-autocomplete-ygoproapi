const luaparse = require('dapetcu21-luaparse')
import { Callbacks, Globals, Methods } from './data'

let OPTIONS: any
const EMPTY_GROUP = { methods: [] }

export default class Parser {
  static lastCode: string | null = null
  static scopes: { [id: string]: string | null }[]

  static checkStaticCall(baseID: string, indexer: string) {
    return indexer == '.' && Methods.find(g => g.cls == baseID)
  }

  static inferTypeFromCode(id: string, code: string) {
    if (code == Parser.lastCode)
      return Parser.getCurrentTypeMethods(id)
    Parser.scopes = [{}]
    try {
      luaparse.parse(code, OPTIONS)
    } catch(e) { } finally {
      Parser.lastCode = code
      return Parser.getCurrentTypeMethods(id)
    }
  }

  static inferTypeFromID(id: string) {
    const m = id.match(/(.)\d*$/)
    const lastChar = m && m[1]
    return Methods.find(g => g.infer == lastChar)
  }

  static getLastScope() {
    return Parser.scopes[Parser.scopes.length - 1]
  }

  static getGlobalScope() {
    return Parser.scopes[0]
  }

  static getCurrentType(id: string): string | null {
    const scopes = Parser.scopes
    for (let i = scopes.length - 1; i >= 0; i--) {
      const type = scopes[i][id]
      if (type !== null)
        return type
    }
    return null
  }

  static onCreateNode(node: any) {
    if (node.type != 'LocalStatement' && node.type != 'AssignmentStatement')
      return
    let { variables, init } = node
    init = init.map((node: any) => Parser.handleInit(node))
      .reduce((a: string[], b: string[]) => a.concat(b), [])
    const localScope = Parser.getLastScope()
    const globalScope = Parser.getGlobalScope()
    variables.forEach((v: any, i: number) => {
      const { name, isLocal } = v
      if (isLocal)
        localScope[name] = init[i] || 'nil'
      else
        globalScope[name] = init[i] || 'nil'
    })
  }

  static handleInit(node: any) {
    switch (node.type) {
      case 'Identifier': return Parser.handleIDAssignment(node)
      case 'CallExpression': return Parser.handleCallAssignment(node)
      // case 'NumericLiteral': return 'number'
      // case 'StringLiteral': return 'string'
      // case 'TableConstructorExpression': return 'table'
      default: return null
    }
  }

  static handleIDAssignment(node: any) {
    return Parser.getCurrentType(node.name)
  }

  static handleCallAssignment(node: any) {
    const { base } = node
    switch (base.type) {
      case 'Identifier': return Parser.handleCallBaseID(base)
      case 'MemberExpression': return Parser.handleCallBaseMember(base)
      default: return null
    }
  }

  static handleCallBaseID(node: any) {
    const { name } = node
    const globalFn = Globals.find(g => g.id == name)
    return globalFn ? globalFn.ret : null
  }

  static handleCallBaseMember(node: any) {
    const { base, indexer, identifier } = node
    const baseID = base && base.name
    const memberID = identifier && identifier.name
    if (!baseID || !memberID)
      return null
    const methodGroup = Parser.checkStaticCall(baseID, indexer)
      || Parser.getCurrentTypeMethods(baseID)
      || Parser.inferTypeFromID(baseID)
    if (!methodGroup)
      return null
    const method = methodGroup.methods.find(g => g.id == memberID)
    return method && method.ret
  }

  static getCurrentTypeMethods(id: string) {
    const type = Parser.getCurrentType(id)
    if (type == 'nil')
      return EMPTY_GROUP
    return type && Methods.find(g => g.cls == type)
  }

  static onCreateScope() {
    Parser.scopes.push({})
  }

  static onDestroyScope() {
    Parser.scopes.pop()
  }

  static onScopeIdentifierName(id: string, data: any) {
    const scope = Parser.getLastScope()
    scope[id] = data ? Parser.handleParamName(data) : null
  }

  static handleParamName({ parameterOf, parameterIndex }: any) {
    const { type, name, identifier } = parameterOf
    let fnID = type == 'Identifier' ? name : identifier && identifier.name
    if (!fnID)
      return null
    fnID = fnID.match(/(.*?)\d*$/)[1]
    const cb = Callbacks.find(cb => fnID.endsWith(cb.id))
    if (!cb || parameterIndex >= cb.args.length)
      return null
    return cb.args[parameterIndex].type
  }
}

OPTIONS = {
  wait: false,
  comments: false,
  scope: true,
  locations: false,
  ranges: false,
  onCreateNode: Parser.onCreateNode,
  onCreateScope: Parser.onCreateScope,
  onDestroyScope: Parser.onDestroyScope,
  onScopeIdentifierName: Parser.onScopeIdentifierName,
  luaVersion: '5.3'
}
