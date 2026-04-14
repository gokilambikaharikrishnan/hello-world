import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LAYER_ORDER, LAYER_PATH } from './layerMap';

export interface ModuleFolder {
    name: string;
    fullPath: string;
    layer: string;   // 'MCAL' | 'CDD' | 'ESAL' | 'SRVLayer' | 'ASW'
    fileCount: number;
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
 * Scan the BSW/ASW nested folder structure and return all module folders
 * that contain at least one .c or .h file, in layer order.
 *
 * Expected layout:
 *   BSW/MCAL/<module>/
 *   BSW/CDD/<module>/
 *   BSW/ESAL/<module>/
 *   BSW/SRVLayer/<module>/
 *   ASW/<module>/
 */
export async function scanWorkspaceFolders(output: vscode.OutputChannel): Promise<ModuleFolder[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        output.appendLine('[FolderScanner] No workspace folder open');
        return [];
    }

    const repoRoot = workspaceFolders[0].uri.fsPath;
    output.appendLine(`[FolderScanner] Scanning workspace: ${repoRoot}`);

    const modules: ModuleFolder[] = [];

    for (const layer of LAYER_ORDER) {
        const layerRelPath = LAYER_PATH[layer];
        if (!layerRelPath) { continue; }

        const layerDir = path.join(repoRoot, layerRelPath);
        if (!fs.existsSync(layerDir)) { continue; }

        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(layerDir, { withFileTypes: true });
        } catch (err) {
            output.appendLine(`[FolderScanner] Cannot read ${layerRelPath}: ${err}`);
            continue;
        }

        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) { continue; }

            const fullPath = path.join(layerDir, entry.name);
            const fileCount = countSourceFiles(fullPath);
            if (fileCount === 0) { continue; }

            const module: ModuleFolder = { name: entry.name, fullPath, layer, fileCount };
            modules.push(module);
            output.appendLine(`[FolderScanner] Found: ${layer}/${entry.name} (${fileCount} files)`);
        }
    }

    output.appendLine(`[FolderScanner] Total modules found: ${modules.length}`);
    return modules;
}
