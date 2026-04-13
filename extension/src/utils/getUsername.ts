import * as cp from 'child_process';
import * as vscode from 'vscode';

export async function getUsername(): Promise<string> {
    return new Promise((resolve) => {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!ws) { resolve('Engineer'); return; }
        cp.exec('git config user.name', { cwd: ws }, (err, stdout) => {
            if (err || !stdout.trim()) {
                resolve('Engineer');
            } else {
                resolve(stdout.trim().split(' ')[0]);
            }
        });
    });
}
