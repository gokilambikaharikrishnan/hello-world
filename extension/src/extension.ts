import * as vscode from 'vscode';
import * as path from 'path';
import { DocGenPanel } from './webviewPanel';
import { getUsername } from './utils/getUsername';
import { getChangedFolders } from './utils/getChangedFolders';
import { scanFolders, ensureDocsDir } from './utils/scanFolders';
import { buildGreetingHTML } from './webview/greeting';
import { buildSelectorHTML } from './webview/selector';
import { renderDocShell } from './docRenderer';
import { LAYER_MAP } from './layerMap';

let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    output = vscode.window.createOutputChannel('BMS DocGen');
    output.show(true); // reveal Output panel and switch to BMS DocGen channel
    output.appendLine('BMS DocGen activated');

    // Manual command
    const openPanelCmd = vscode.commands.registerCommand('bms-doc-gen.openPanel', () => {
        launchGreeting(context).catch(err => output.appendLine(`Error: ${err}`));
    });

    // URI handler: vscode://bms-doc-gen/trigger
    const uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri): void {
            output.appendLine(`URI triggered: ${uri.toString()}`);
            if (uri.path === '/trigger') {
                output.appendLine('IAR post-build trigger — opening greeting');
                launchGreeting(context).catch(err => output.appendLine(`Error: ${err}`));
            }
        }
    });

    context.subscriptions.push(openPanelCmd, uriHandler, output);
}

// ---------------------------------------------------------------------------
// Step 1 — Greeting screen
// ---------------------------------------------------------------------------

async function launchGreeting(context: vscode.ExtensionContext): Promise<void> {
    const docGenPanel = DocGenPanel.createOrShow(context.extensionUri);
    const panel = docGenPanel.rawPanel;

    const username = await getUsername();
    const timestamp = new Date().toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });

    output.appendLine(`Greeting: Hey ${username} — ${timestamp}`);
    panel.webview.html = buildGreetingHTML(username, timestamp);

    // One-time message listener for this screen
    const sub = panel.webview.onDidReceiveMessage(async (msg: { command: string; value: string }) => {
        sub.dispose(); // remove this listener before navigating

        if (msg.command !== 'mode') { return; }

        switch (msg.value) {
            case 'full':
                output.appendLine('Mode: Full Stack');
                await showSelector(panel, []);
                break;

            case 'changes': {
                output.appendLine('Mode: My Changes');
                const changed = await getChangedFolders();
                output.appendLine(`Changed folders: ${changed.join(', ') || 'none'}`);
                if (changed.length === 0) {
                    vscode.window.showInformationMessage(
                        'BMS DocGen: No git changes detected — showing full module list'
                    );
                }
                await showSelector(panel, changed);
                break;
            }

            case 'close':
                output.appendLine('Mode: Not Now — closing panel');
                panel.dispose();
                break;
        }
    });
}

// ---------------------------------------------------------------------------
// Step 2 — Selector screen
// ---------------------------------------------------------------------------

async function showSelector(
    panel: vscode.WebviewPanel,
    preselected: string[]
): Promise<void> {
    const groups = scanFolders();
    output.appendLine(`Selector: ${groups.length} layer group(s), preselected: [${preselected.join(', ')}]`);

    panel.webview.html = buildSelectorHTML(groups, preselected);

    // One-time message listener for this screen
    const sub = panel.webview.onDidReceiveMessage(async (msg: { command: string; folders: string[] }) => {
        if (msg.command !== 'generate') { return; }
        sub.dispose();

        output.appendLine(`Generate requested: [${msg.folders.join(', ')}]`);
        await handleGenerate(panel, msg.folders);
    });
}

// ---------------------------------------------------------------------------
// Step 3 — Generate doc shells (Session 3 will add real LLM content)
// ---------------------------------------------------------------------------

async function handleGenerate(panel: vscode.WebviewPanel, folders: string[]): Promise<void> {
    const docsDir = ensureDocsDir();
    output.appendLine(`=== Generate requested for ${folders.length} module(s) ===`);

    for (const folder of folders) {
        const layer = LAYER_MAP[folder] ?? 'Unknown';
        const outFile = path.join(docsDir, `${folder}_design.html`);

        output.appendLine(`Rendering shell: ${folder} (${layer}) → ${outFile}`);

        try {
            renderDocShell(folder, layer, outFile);
            output.appendLine(`  ✓ Saved: docs/${folder}_design.html`);
            vscode.window.showInformationMessage(
                `BMS DocGen: docs/${folder}_design.html created`
            );
        } catch (err) {
            output.appendLine(`  ✗ Error: ${err}`);
            vscode.window.showErrorMessage(
                `BMS DocGen: Failed to create doc for ${folder}: ${err}`
            );
        }
    }

    output.appendLine(`=== Done — ${folders.length} shell(s) written to docs/ ===`);
    output.appendLine('Session 3 will wire this to Copilot for real content.');
}

export function deactivate(): void {
    // nothing to clean up
}
