import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('autocomplete-ygoproapi.update', () => {
    vscode.window.showInformationMessage('Updating')
  })
  context.subscriptions.push(disposable)

  let provider1 = vscode.languages.registerCompletionItemProvider('lua', {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
      const simpleCompletion = new vscode.CompletionItem('Hello World!')
      const snippetCompletion = new vscode.CompletionItem('Good part of the day')
      snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?')
      snippetCompletion.documentation = new vscode.MarkdownString("Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.")
      const commitCharacterCompletion = new vscode.CompletionItem('console')
      commitCharacterCompletion.commitCharacters = ['.']
      commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`')
      const commandCompletion = new vscode.CompletionItem('new')
      commandCompletion.kind = vscode.CompletionItemKind.Keyword
      commandCompletion.insertText = 'new '
      commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' }
      return [
        simpleCompletion,
        snippetCompletion,
        commitCharacterCompletion,
        commandCompletion
      ]
    }
  })

  const provider2 = vscode.languages.registerCompletionItemProvider('lua', {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      let linePrefix = document.lineAt(position).text.substr(0, position.character)
      if (!linePrefix.endsWith('console.')) {
        return undefined
      }
      return [
        new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
        new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
        new vscode.CompletionItem('error', vscode.CompletionItemKind.Method),
      ]
    }
  }, '.')

  context.subscriptions.push(provider1, provider2)
}