import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ModuleFolder {
    name: string;
    fullPath: string;
    layer: 'Driver' | 'Interface' | 'Application' | 'Other';
    fileCount: number;
}

/**
 * Determines the BMS architecture layer from a folder name.
 */
function detectLayer(folderName: string): ModuleFolder['layer'] {
    const lower = folderName.toLowerCase();
    if (lower.endsWith('_driver') || lower.endsWith('_drv')) {
        return 'Driver';
    }
    if (lower.endsWith('_if') || lower.endsWith('_interface')) {
        return 'Interface';
    }
    if (lower.endsWith('_appl') || lower.endsWith('_app') || lower.endsWith('_application')) {
        return 'Application';
    }
    return 'Other';
}

/**
 * Count .c and .h files in a directory (non-recursive).
 */
function countSourceFiles(dirPath: string): number {
    try {
        return fs.readdirSync(dirPath).filter(f => f.endsWith('.c') || f.endsWith('.h')).length;
    } catch {
        return 0;
    }
}

/**
 * Scan the workspace root and return all folders that contain at least one .c or .h file.
 * Skip hidden folders and node_modules.
 */
export async function scanWorkspaceFolders(output: vscode.OutputChannel): Promise<ModuleFolder[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        output.appendLine('[FolderScanner] No workspace folder open');
        return [];
    }

    const repoRoot = workspaceFolders[0].uri.fsPath;
    output.appendLine(`[FolderScanner] Scanning workspace root: ${repoRoot}`);

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(repoRoot, { withFileTypes: true });
    } catch (err) {
        output.appendLine(`[FolderScanner] Failed to read directory: ${err}`);
        return [];
    }

    const SKIP = new Set(['node_modules', '.git', 'out', 'docs', '.vscode', 'media']);

    const modules: ModuleFolder[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) { continue; }
        if (entry.name.startsWith('.')) { continue; }
        if (SKIP.has(entry.name)) { continue; }

        const fullPath = path.join(repoRoot, entry.name);
        const fileCount = countSourceFiles(fullPath);

        if (fileCount === 0) { continue; }

        const module: ModuleFolder = {
            name: entry.name,
            fullPath,
            layer: detectLayer(entry.name),
            fileCount
        };

        modules.push(module);
        output.appendLine(`[FolderScanner] Found module: ${entry.name} (${module.layer}, ${fileCount} files)`);
    }

    // Sort: Driver first, then Interface, then Application, then Other
    const layerOrder: Record<ModuleFolder['layer'], number> = {
        Driver: 0,
        Interface: 1,
        Application: 2,
        Other: 3
    };

    modules.sort((a, b) => {
        const layerDiff = layerOrder[a.layer] - layerOrder[b.layer];
        if (layerDiff !== 0) { return layerDiff; }
        return a.name.localeCompare(b.name);
    });

    output.appendLine(`[FolderScanner] Total modules found: ${modules.length}`);
    return modules;
}
