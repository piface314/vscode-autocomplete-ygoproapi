import * as vscode from 'vscode'
import * as callbacks from './providers/callbacks'
import Updater from './updater'

export function activate(context: vscode.ExtensionContext) {
  const update = vscode.commands.registerCommand('autocomplete-ygoproapi.update', () => {
    Updater.update()
  })
  context.subscriptions.push(
    update,
    callbacks.getDisposable()
  )
}