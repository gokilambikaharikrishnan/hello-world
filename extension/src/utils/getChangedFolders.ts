import * as cp from 'child_process';
import * as vscode from 'vscode';

export async function getChangedFolders(): Promise<string[]> {
    return new Promise((resolve) => {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!ws) { resolve([]); return; }
        cp.exec('git diff --name-only HEAD', { cwd: ws }, (err, stdout) => {
            if (err || !stdout.trim()) { resolve([]); return; }
            const folders = stdout.trim().split('\n')
                .map(f => f.split('/')[0])
                .filter((f, i, arr) => arr.indexOf(f) === i);
            resolve(folders);
        });
    });
}
