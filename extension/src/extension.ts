import * as vscode from 'vscode';
import * as path from 'path';
import { DocGenPanel } from './webviewPanel';
import { scanWorkspaceFolders, ModuleFolder } from './folderScanner';
import { readModuleFiles } from './fileReader';
import { resolveIncludes } from './includeResolver';
import { buildPrompt } from './promptBuilder';
import { generateDocumentation } from './llmClient';
import { renderAndSave } from './docRenderer';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('BMS DocGen');
    outputChannel.appendLine('BMS DocGen activated');

    async function openDocGenPanel(): Promise<void> {
        outputChannel.appendLine('Opening DocGen panel');
        const panel = DocGenPanel.createOrShow(context.extensionUri);

        panel.onMessage((msg) => {
            const command = msg['command'] as string;
            if (command === 'generate') {
                const folders = msg['folders'] as string[];
                handleGenerate(panel, folders).catch(err => {
                    outputChannel.appendLine(`Generate error: ${err}`);
                    panel.postMessage({ type: 'error', text: String(err) });
                });
            } else if (command === 'openDoc') {
                const docPath = msg['path'] as string;
                vscode.env.openExternal(vscode.Uri.file(docPath)).then(undefined, err => {
                    outputChannel.appendLine(`Failed to open doc: ${err}`);
                });
            }
        });

        // Scan and send folders to webview
        const modules = await scanWorkspaceFolders(outputChannel);
        panel.postMessage({
            type: 'foldersLoaded',
            folders: modules.map(m => m.name)
        });
    }

    // Manual command to open the panel
    const openPanelCmd = vscode.commands.registerCommand('bms-doc-gen.openPanel', () => {
        openDocGenPanel().catch(err => outputChannel.appendLine(`Error opening panel: ${err}`));
    });

    // URI handler: vscode://bms-doc-gen/trigger
    const uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri): void {
            outputChannel.appendLine(`URI handler triggered: ${uri.toString()}`);
            if (uri.path === '/trigger') {
                outputChannel.appendLine('IAR post-build trigger received — opening DocGen panel');
                openDocGenPanel().catch(err => outputChannel.appendLine(`Error opening panel: ${err}`));
            }
        }
    });

    context.subscriptions.push(openPanelCmd, uriHandler, outputChannel);
}

/**
 * Handle a 'generate' message from the webview.
 * For each selected folder: read files → resolve includes → build prompt → call LLM → render HTML.
 */
async function handleGenerate(panel: DocGenPanel, folderNames: string[]): Promise<void> {
    outputChannel.appendLine(`[Generate] Starting for ${folderNames.length} module(s): ${folderNames.join(', ')}`);

    // Rebuild the module list so we have full metadata
    const allModules = await scanWorkspaceFolders(outputChannel);
    const moduleMap = new Map<string, ModuleFolder>(allModules.map(m => [m.name, m]));

    let completedCount = 0;

    for (const folderName of folderNames) {
        const module = moduleMap.get(folderName);
        if (!module) {
            panel.postMessage({
                type: 'moduleError',
                folder: folderName,
                error: `Module not found in workspace: ${folderName}`
            });
            continue;
        }

        panel.postMessage({ type: 'log', text: `[${folderName}] Reading source files...`, level: 'info' });

        try {
            // Phase 4: Read module files
            outputChannel.appendLine(`[Generate] Reading files for: ${folderName}`);
            const moduleFiles = readModuleFiles(module.fullPath, outputChannel);

            if (moduleFiles.length === 0) {
                throw new Error(`No .c or .h files found in ${folderName}`);
            }

            panel.postMessage({
                type: 'log',
                text: `[${folderName}] Read ${moduleFiles.length} file(s) — resolving includes...`,
                level: 'info'
            });

            // Phase 5: Resolve includes
            const resolvedIncludes = resolveIncludes(moduleFiles, outputChannel);
            panel.postMessage({
                type: 'log',
                text: `[${folderName}] Resolved ${resolvedIncludes.length} cross-module file(s)`,
                level: 'info'
            });

            // Phase 6: Build prompt
            const prompt = buildPrompt(module, moduleFiles, resolvedIncludes, outputChannel);
            panel.postMessage({
                type: 'log',
                text: `[${folderName}] Prompt ready (${prompt.totalChars.toLocaleString()} chars) — calling Copilot...`,
                level: 'info'
            });

            // Phase 7: Generate via LLM
            let tokenCount = 0;
            const llmText = await generateDocumentation(
                prompt,
                (token) => {
                    tokenCount++;
                    // Throttle webview log updates (every 50 tokens)
                    if (tokenCount % 50 === 0) {
                        panel.postMessage({
                            type: 'log',
                            text: `[${folderName}] Streaming... (${tokenCount * 4}+ chars received)`,
                            level: 'info'
                        });
                    }
                },
                outputChannel
            );

            // Phase 8: Render and save
            const docPath = renderAndSave(module, llmText, outputChannel);
            const relPath = path.relative(getWorkspaceRoot(), docPath);

            panel.postMessage({
                type: 'log',
                text: `[${folderName}] Saved: ${relPath}`,
                level: 'ok'
            });
            panel.postMessage({
                type: 'moduleDone',
                folder: folderName,
                docPath
            });

            completedCount++;

        } catch (err) {
            const errMsg = String(err);
            outputChannel.appendLine(`[Generate] Error for ${folderName}: ${errMsg}`);
            panel.postMessage({
                type: 'moduleError',
                folder: folderName,
                error: errMsg
            });
        }
    }

    panel.postMessage({ type: 'allDone', count: completedCount });
    outputChannel.appendLine(`[Generate] All done. ${completedCount}/${folderNames.length} succeeded.`);
}

function getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : process.cwd();
}

export function deactivate(): void {
    // nothing to clean up
}
