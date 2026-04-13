import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Manages the BMS DocGen webview panel.
 * Only one panel is allowed at a time (singleton).
 */
export class DocGenPanel {
    private static instance: DocGenPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    private messageHandler?: (msg: Record<string, unknown>) => void;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.panel.webview.html = this.getHtml();

        this.panel.onDidDispose(() => {
            DocGenPanel.instance = undefined;
            this.dispose();
        }, null, this.disposables);

        this.panel.webview.onDidReceiveMessage(
            (msg: Record<string, unknown>) => {
                if (this.messageHandler) {
                    this.messageHandler(msg);
                }
            },
            null,
            this.disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): DocGenPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DocGenPanel.instance) {
            DocGenPanel.instance.panel.reveal(column);
            return DocGenPanel.instance;
        }

        const panel = vscode.window.createWebviewPanel(
            'bmsDocGen',
            'BMS DocGen',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        DocGenPanel.instance = new DocGenPanel(panel, extensionUri);
        return DocGenPanel.instance;
    }

    /** Expose the underlying vscode.WebviewPanel for direct html/event access. */
    public get rawPanel(): vscode.WebviewPanel {
        return this.panel;
    }

    public onMessage(handler: (msg: Record<string, unknown>) => void): void {
        this.messageHandler = handler;
    }

    public postMessage(msg: Record<string, unknown>): void {
        this.panel.webview.postMessage(msg);
    }

    private getHtml(): string {
        const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'webview.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }

    private dispose(): void {
        DocGenPanel.instance = undefined;
        this.panel.dispose();
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }
}
