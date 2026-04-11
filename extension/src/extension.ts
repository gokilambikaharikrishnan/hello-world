import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
    const outputChannel = vscode.window.createOutputChannel('BMS DocGen');
    outputChannel.appendLine('BMS DocGen activated');

    // Register the command to open the panel manually
    const openPanelCmd = vscode.commands.registerCommand('bms-doc-gen.openPanel', () => {
        outputChannel.appendLine('bms-doc-gen.openPanel command invoked');
        vscode.window.showInformationMessage('BMS DocGen: Panel opening (Phase 2 pending)');
    });

    context.subscriptions.push(openPanelCmd, outputChannel);
}

export function deactivate(): void {
    // nothing to clean up
}
