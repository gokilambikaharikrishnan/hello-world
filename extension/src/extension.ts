import * as vscode from 'vscode';
import { DocGenPanel } from './webviewPanel';
import { scanWorkspaceFolders } from './folderScanner';

export function activate(context: vscode.ExtensionContext): void {
    const output = vscode.window.createOutputChannel('BMS DocGen');
    output.appendLine('BMS DocGen activated');

    async function openDocGenPanel(): Promise<void> {
        output.appendLine('Opening DocGen panel');
        const panel = DocGenPanel.createOrShow(context.extensionUri);

        // Wire message handler from webview
        panel.onMessage((msg) => {
            output.appendLine(`Webview message: ${JSON.stringify(msg)}`);
            // Generation handler wired in later phases
        });

        // Scan and send folders to webview
        const modules = await scanWorkspaceFolders(output);
        panel.postMessage({
            type: 'foldersLoaded',
            folders: modules.map(m => m.name)
        });
    }

    // Manual command to open the panel
    const openPanelCmd = vscode.commands.registerCommand('bms-doc-gen.openPanel', () => {
        openDocGenPanel().catch(err => output.appendLine(`Error opening panel: ${err}`));
    });

    // URI handler: vscode://bms-doc-gen/trigger
    const uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri): void {
            output.appendLine(`URI handler triggered: ${uri.toString()}`);

            if (uri.path === '/trigger') {
                output.appendLine('IAR post-build trigger received — opening DocGen panel');
                openDocGenPanel().catch(err => output.appendLine(`Error opening panel: ${err}`));
            }
        }
    });

    context.subscriptions.push(openPanelCmd, uriHandler, output);
}

export function deactivate(): void {
    // nothing to clean up
}
