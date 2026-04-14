import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LAYER_META, LAYER_ORDER, LAYER_GROUP, LAYER_PATH } from '../layerMap';
import { FolderGroup } from '../types';

/** Returns the workspace root path */
export function getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : process.cwd();
}

/** Returns absolute path to docs/ dir, creating it if needed */
export function ensureDocsDir(): string {
    const docsPath = path.join(getWorkspaceRoot(), 'docs');
    if (!fs.existsSync(docsPath)) {
        fs.mkdirSync(docsPath, { recursive: true });
    }
    return docsPath;
}

/**
 * Scan the BSW/ASW nested folder structure and return layer-grouped module lists.
 * Expected layout:
 *   BSW/MCAL/<module>/
 *   BSW/CDD/<module>/
 *   BSW/ESAL/<module>/
 *   BSW/SRVLayer/<module>/
 *   ASW/<module>/
 */
export function scanFolders(): FolderGroup[] {
    const ws = getWorkspaceRoot();
    const result: FolderGroup[] = [];

    for (const layer of LAYER_ORDER) {
        const layerRelPath = LAYER_PATH[layer];
        if (!layerRelPath) { continue; }

        const layerDir = path.join(ws, layerRelPath);
        if (!fs.existsSync(layerDir)) { continue; }

        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(layerDir, { withFileTypes: true });
        } catch {
            continue;
        }

        const folders = entries
            .filter(e => e.isDirectory() && !e.name.startsWith('.'))
            .map(e => e.name)
            .sort();

        if (folders.length === 0) { continue; }

        const meta = LAYER_META[layer];
        result.push({
            layer,
            fullName: meta.fullName,
            description: meta.description,
            color: meta.color,
            icon: meta.icon,
            group: LAYER_GROUP[layer] ?? 'BSW',
            folders
        });
    }

    return result;
}

/**
 * Returns the absolute filesystem path for a named module given its layer.
 * e.g. getModuleFsPath('ADC', 'MCAL') → '<ws>/BSW/MCAL/ADC'
 */
export function getModuleFsPath(moduleName: string, layer: string): string {
    const ws = getWorkspaceRoot();
    const layerRelPath = LAYER_PATH[layer] ?? layer;
    return path.join(ws, layerRelPath, moduleName);
}
