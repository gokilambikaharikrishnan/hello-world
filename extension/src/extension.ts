import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DocGenPanel } from './webviewPanel';
import { getUsername } from './utils/getUsername';
import { getChangedFolders } from './utils/getChangedFolders';
import { scanFolders, ensureDocsDir, getModuleFsPath } from './utils/scanFolders';
import { buildGreetingHTML } from './webview/greeting';
import { buildSelectorHTML } from './webview/selector';
import { renderDoc } from './docRenderer';
import { LAYER_MAP } from './layerMap';
import { readModuleFiles } from './fileReader';
import { resolveIncludes } from './includeResolver';
import { buildPrompt } from './promptBuilder';
import { generateDocumentation } from './llmClient';
import { ModuleFolder } from './folderScanner';

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

    // Message listener for selector screen (persists for openDoc/openDocsFolder too)
    const sub = panel.webview.onDidReceiveMessage(async (msg: { command: string; folders?: string[]; path?: string }) => {
        if (msg.command === 'generate') {
            sub.dispose();
            output.appendLine(`Generate requested: [${(msg.folders ?? []).join(', ')}]`);
            await handleGenerate(panel, msg.folders ?? []);
            return;
        }

        if (msg.command === 'openDoc' && msg.path) {
            vscode.env.openExternal(vscode.Uri.file(msg.path));
            return;
        }

        if (msg.command === 'openDocsFolder') {
            const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (ws) { vscode.env.openExternal(vscode.Uri.file(path.join(ws, 'docs'))); }
            return;
        }
    });
}

// ---------------------------------------------------------------------------
// Step 3 — Full LLM pipeline
// ---------------------------------------------------------------------------

function sendProgress(
    panel: vscode.WebviewPanel,
    folder: string,
    status: 'reading' | 'analysing' | 'rendering' | 'done' | 'error',
    message: string,
    outputPath?: string
): void {
    panel.webview.postMessage({ command: 'progress', folder, status, message, outputPath });
}

async function handleGenerate(panel: vscode.WebviewPanel, folders: string[]): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        vscode.window.showErrorMessage('BMS DocGen: No workspace folder open');
        return;
    }

    const docsPath = path.join(workspacePath, 'docs');
    if (!fs.existsSync(docsPath)) { fs.mkdirSync(docsPath, { recursive: true }); }

    const timestamp = new Date().toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });

    output.appendLine(`\n=== Generate requested for ${folders.length} module(s) ===`);

    for (const folderName of folders) {
        const layerName = LAYER_MAP[folderName] ?? 'Unknown';
        const folderPath = getModuleFsPath(folderName, layerName);
        const outFile = path.join(docsPath, `${folderName}_design.html`);

        output.appendLine(`\n[${folderName}] layer=${layerName} path=${folderPath}`);

        if (!fs.existsSync(folderPath)) {
            sendProgress(panel, folderName, 'error', `Folder not found: ${folderPath}`);
            output.appendLine(`[${folderName}] ERROR: folder not found`);
            continue;
        }

        // ── Stage 1: read files ──────────────────────────────────
        sendProgress(panel, folderName, 'reading', 'Reading source files...');
        output.appendLine(`[${folderName}] Reading files...`);

        const moduleFiles = readModuleFiles(folderPath, output);
        if (moduleFiles.length === 0) {
            sendProgress(panel, folderName, 'error', 'No .c/.h files found in folder');
            output.appendLine(`[${folderName}] ERROR: no source files`);
            continue;
        }

        // ── Stage 2: resolve includes ────────────────────────────
        sendProgress(panel, folderName, 'reading', `Resolving #include chain (${moduleFiles.length} files)...`);
        output.appendLine(`[${folderName}] Resolving includes...`);

        const resolvedIncludes = resolveIncludes(moduleFiles, output);

        // ── Stage 3: build prompt ────────────────────────────────
        sendProgress(panel, folderName, 'analysing', 'Building prompt...');
        output.appendLine(`[${folderName}] Building prompt...`);

        const moduleFolder: ModuleFolder = {
            name: folderName,
            fullPath: folderPath,
            layer: layerName,
            fileCount: moduleFiles.length
        };

        let payload;
        try {
            payload = buildPrompt(moduleFolder, moduleFiles, resolvedIncludes, output);
        } catch (err: any) {
            sendProgress(panel, folderName, 'error', `Prompt build failed: ${err.message}`);
            output.appendLine(`[${folderName}] Prompt ERROR: ${err.message}`);
            continue;
        }

        // ── Stage 4: call Copilot ────────────────────────────────
        sendProgress(panel, folderName, 'analysing', 'Calling GitHub Copilot...');
        output.appendLine(`[${folderName}] Calling Copilot (${payload.totalChars.toLocaleString()} chars)...`);

        let llmContent: string;
        try {
            llmContent = await generateDocumentation(
                payload,
                (_token: string) => {
                    // throttle: only post progress every ~500 tokens
                },
                output
            );
        } catch (err: any) {
            sendProgress(panel, folderName, 'error', err.message ?? 'Copilot call failed');
            output.appendLine(`[${folderName}] Copilot ERROR: ${err.message}`);
            continue;
        }

        output.appendLine(`[${folderName}] Response: ${llmContent.length.toLocaleString()} chars`);

        // ── Stage 5: render HTML ─────────────────────────────────
        sendProgress(panel, folderName, 'rendering', 'Rendering documentation...');
        output.appendLine(`[${folderName}] Rendering to ${outFile}`);

        try {
            renderDoc(folderName, layerName, llmContent, outFile, timestamp);
            output.appendLine(`[${folderName}] ✓ Saved: docs/${folderName}_design.html`);
        } catch (err: any) {
            sendProgress(panel, folderName, 'error', `Render failed: ${err.message}`);
            output.appendLine(`[${folderName}] Render ERROR: ${err.message}`);
            continue;
        }

        // ── Stage 6: done ────────────────────────────────────────
        sendProgress(panel, folderName, 'done', 'Documentation complete', outFile);
    }

    panel.webview.postMessage({ command: 'allDone', count: folders.length });
    output.appendLine(`\n=== All done: ${folders.length} module(s) ===`);
}

export function deactivate(): void {
    // nothing to clean up
}
