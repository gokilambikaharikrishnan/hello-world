import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface SourceFile {
    relativePath: string;
    fullPath: string;
    content: string;
    sizeChars: number;
}

/**
 * Read all .c and .h files in a given folder (non-recursive).
 * Returns an array of SourceFile objects sorted by name.
 */
export function readModuleFiles(
    folderPath: string,
    output: vscode.OutputChannel
): SourceFile[] {
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(folderPath, { withFileTypes: true });
    } catch (err) {
        output.appendLine(`[FileReader] Cannot read folder ${folderPath}: ${err}`);
        return [];
    }

    const sourceFiles: SourceFile[] = [];

    for (const entry of entries) {
        if (!entry.isFile()) { continue; }
        if (!entry.name.endsWith('.c') && !entry.name.endsWith('.h')) { continue; }

        const fullPath = path.join(folderPath, entry.name);
        let content: string;
        try {
            content = fs.readFileSync(fullPath, 'utf8');
        } catch (err) {
            output.appendLine(`[FileReader] Cannot read file ${fullPath}: ${err}`);
            continue;
        }

        const relativePath = path.relative(getWorkspaceRoot(), fullPath);
        sourceFiles.push({
            relativePath,
            fullPath,
            content,
            sizeChars: content.length
        });

        output.appendLine(`[FileReader]   ${entry.name} (${content.length.toLocaleString()} chars)`);
    }

    sourceFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return sourceFiles;
}

/**
 * Returns the workspace root path, or process.cwd() as a fallback.
 */
export function getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        return folders[0].uri.fsPath;
    }
    return process.cwd();
}
