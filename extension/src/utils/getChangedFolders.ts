import * as cp from 'child_process';
import * as vscode from 'vscode';

/**
 * Returns module names (not paths) for folders that have git changes.
 * Handles the nested BSW/ASW structure:
 *   BSW/MCAL/ADC/file.c  → 'ADC'   (segment[2])
 *   ASW/ContactorControl/file.c → 'ContactorControl' (segment[1])
 */
export async function getChangedFolders(): Promise<string[]> {
    return new Promise((resolve) => {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!ws) { resolve([]); return; }
        cp.exec('git diff --name-only HEAD', { cwd: ws }, (err, stdout) => {
            if (err || !stdout.trim()) { resolve([]); return; }
            const seen = new Set<string>();
            const modules: string[] = [];
            for (const line of stdout.trim().split('\n')) {
                const parts = line.split('/');
                let module: string | undefined;
                if (parts[0] === 'BSW' && parts.length >= 3) {
                    module = parts[2];       // BSW/<layer>/<module>/file
                } else if (parts[0] === 'ASW' && parts.length >= 2) {
                    module = parts[1];       // ASW/<module>/file
                }
                if (module && !seen.has(module)) {
                    seen.add(module);
                    modules.push(module);
                }
            }
            resolve(modules);
        });
    });
}
