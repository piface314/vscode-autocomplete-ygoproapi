import * as vscode from 'vscode'


export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "autocomplete-ygoproapi" is now active!')
  let disposable = vscode.commands.registerCommand('autocomplete-ygoproapi.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from autocomplete-ygoproapi!')
  })
  context.subscriptions.push(disposable)
}

export function deactivate() { }
