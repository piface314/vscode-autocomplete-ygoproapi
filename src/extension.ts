import * as vscode from 'vscode'
import * as callbacks from './providers/callbacks'
import * as classes from './providers/classes'
import * as constants from './providers/constants'
import * as globals from './providers/globals'
import * as methods from './providers/methods'
import Updater from './updater'

export function activate(context: vscode.ExtensionContext) {
  const updater = new Updater(context)
  const update = vscode.commands.registerCommand('autocomplete-ygoproapi.update', () => {
    updater.update(true)
  })
  updater.update()
  context.subscriptions.push(
    callbacks.getDisposable(),
    classes.getDisposable(),
    constants.getDisposable(),
    globals.getDisposable(),
    methods.getDisposable(),
    update
  )
}