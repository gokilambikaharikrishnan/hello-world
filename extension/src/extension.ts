import * as vscode from 'vscode';
import { DocGenPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
    const output = vscode.window.createOutputChannel('BMS DocGen');
    output.appendLine('BMS DocGen activated');

    // Manual command to open the panel
    const openPanelCmd = vscode.commands.registerCommand('bms-doc-gen.openPanel', () => {
        output.appendLine('Opening DocGen panel via command');
        DocGenPanel.createOrShow(context.extensionUri);
    });

    // URI handler: vscode://bms-doc-gen/trigger
    const uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri): void {
            output.appendLine(`URI handler triggered: ${uri.toString()}`);

            if (uri.path === '/trigger') {
                output.appendLine('IAR post-build trigger received — opening DocGen panel');
                const panel = DocGenPanel.createOrShow(context.extensionUri);

                // Set up message handling from webview
                panel.onMessage((msg) => {
                    output.appendLine(`Webview message: ${JSON.stringify(msg)}`);
                    // Full handling wired in later phases
                });

                // Notify webview that it loaded via URI trigger
                panel.postMessage({ type: 'status', text: 'Triggered via IAR post-build' });
            }
        }
    });

    context.subscriptions.push(openPanelCmd, uriHandler, output);
}

export function deactivate(): void {
    // nothing to clean up
}
