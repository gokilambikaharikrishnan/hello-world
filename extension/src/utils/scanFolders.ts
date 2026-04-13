import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LAYER_MAP, LAYER_ORDER, LAYER_META } from '../layerMap';
import { FolderGroup } from '../types';

const IGNORE = new Set([
    '.git', 'node_modules', 'out', 'docs', 'trigger',
    'extension', 'images', 'media', '.vscode',
    'bms-doc-gen', '.github'
]);

export function scanFolders(): FolderGroup[] {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) { return []; }

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(ws, { withFileTypes: true });
    } catch {
        return [];
    }

    const folders = entries
        .filter(e => e.isDirectory() && !IGNORE.has(e.name) && !e.name.startsWith('.'))
        .map(e => e.name);

    // Group by layer
    const grouped: Record<string, string[]> = {};
    for (const folder of folders) {
        const layer = LAYER_MAP[folder] ?? 'Unknown';
        if (!grouped[layer]) { grouped[layer] = []; }
        grouped[layer].push(folder);
    }

    // Build result in defined layer order
    const result: FolderGroup[] = [];
    for (const layer of LAYER_ORDER) {
        if (!grouped[layer]) { continue; }
        const meta = LAYER_META[layer];
        result.push({
            layer,
            fullName: meta.fullName,
            description: meta.description,
            color: meta.color,
            icon: meta.icon,
            folders: grouped[layer].sort()
        });
    }

    // Append unknown at end if any
    if (grouped['Unknown']?.length) {
        result.push({
            layer: 'Unknown',
            fullName: 'Unrecognised Folders',
            description: 'Not mapped to any layer',
            color: '#6e7681',
            icon: '📁',
            folders: grouped['Unknown'].sort()
        });
    }

    return result;
}

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
