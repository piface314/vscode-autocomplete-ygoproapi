import * as callbacks from './data/callbacks.json'
import * as classes from './data/classes.json'
import * as constants from './data/constants.json'
import * as globals from './data/globals.json'
import * as methods from './data/methods.json'
import * as endpoints from './data/endpoints.json'

export type ConstEntry = {
  id: string
  desc: string
  value: string
}

export type ClsEntry = {
  id: string
  desc: string
  module?: boolean
}

export type ArgEntry = {
  id: string
  type: string
  opt?: boolean
}

export type FuncEntry = {
  id: string
  desc: string
  argstr?: string
  args?: ArgEntry[]
  ret?: string[]
}

export type MethodGroupEntry = {
  cls: string
  infer?: string
  methods: FuncEntry[]
}

export type ParamEntry = {
  id: string
  type: string
  desc: string
}

export type CallbackEntry = {
  id: string
  desc: string
  usedAs: string
  usedBy?: string[]
  args: ParamEntry[]
  ret?: string
}

export const Callbacks: CallbackEntry[] = callbacks
export const Classes: ClsEntry[] = classes
export const Constants: ConstEntry[] = constants
export const Globals: FuncEntry[] = globals
export const Methods: MethodGroupEntry[] = methods
export const Endpoints = endpoints