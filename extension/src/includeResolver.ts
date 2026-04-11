import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SourceFile, getWorkspaceRoot } from './fileReader';

/** Maximum total characters allowed across all context files */
const MAX_CONTEXT_CHARS = 80_000;

/** Regex matching #include "filename.h" — relative includes only */
const INCLUDE_RE = /^\s*#include\s+"([^"]+)"/gm;

/**
 * Build a map from filename (basename, lowercase) → full paths found in workspace.
 * We cache this for efficiency when resolving many includes.
 */
function buildFileIndex(repoRoot: string, output: vscode.OutputChannel): Map<string, string[]> {
    const index = new Map<string, string[]>();

    function walk(dir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.')) { continue; }
            if (entry.name === 'node_modules' || entry.name === 'out') { continue; }
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.h') || entry.name.endsWith('.c'))) {
                const key = entry.name.toLowerCase();
                const existing = index.get(key) ?? [];
                existing.push(fullPath);
                index.set(key, existing);
            }
        }
    }

    walk(repoRoot);
    output.appendLine(`[IncludeResolver] File index built: ${index.size} unique filenames`);
    return index;
}

/**
 * Extract all #include "..." targets from source text.
 */
function extractIncludes(content: string): string[] {
    const includes: string[] = [];
    let match: RegExpExecArray | null;
    INCLUDE_RE.lastIndex = 0;
    while ((match = INCLUDE_RE.exec(content)) !== null) {
        includes.push(match[1]);
    }
    return includes;
}

/**
 * Read a file and its paired counterpart (.h → .c or .c → .h) if it exists.
 */
function readFilePair(
    filePath: string,
    repoRoot: string,
    seen: Set<string>,
    output: vscode.OutputChannel
): SourceFile[] {
    const results: SourceFile[] = [];
    const ext = path.extname(filePath);
    const base = filePath.slice(0, -ext.length);
    const candidates = ext === '.h' ? [filePath, base + '.c'] : [filePath, base + '.h'];

    for (const candidate of candidates) {
        const normalized = path.resolve(candidate);
        if (seen.has(normalized)) { continue; }
        if (!fs.existsSync(normalized)) { continue; }

        let content: string;
        try {
            content = fs.readFileSync(normalized, 'utf8');
        } catch {
            continue;
        }

        seen.add(normalized);
        const relativePath = path.relative(repoRoot, normalized);
        results.push({ relativePath, fullPath: normalized, content, sizeChars: content.length });
        output.appendLine(`[IncludeResolver]   Resolved: ${relativePath} (${content.length.toLocaleString()} chars)`);
    }

    return results;
}

/**
 * Resolve all #includes (direct + transitive) for a set of module files.
 *
 * Priority for context cap:
 *   1. Module files themselves (always included — callers should not pass these here)
 *   2. Direct #includes from module files
 *   3. Transitive includes (only if space allows)
 *
 * Returns resolved files NOT already in the module files set.
 */
export function resolveIncludes(
    moduleFiles: SourceFile[],
    output: vscode.OutputChannel
): SourceFile[] {
    const repoRoot = getWorkspaceRoot();
    const fileIndex = buildFileIndex(repoRoot, output);

    // Track already-seen absolute paths to avoid duplicates
    const seen = new Set<string>(moduleFiles.map(f => path.resolve(f.fullPath)));

    // Budget: subtract module file sizes from cap
    let charBudget = MAX_CONTEXT_CHARS - moduleFiles.reduce((s, f) => s + f.sizeChars, 0);
    output.appendLine(`[IncludeResolver] Char budget after module files: ${charBudget.toLocaleString()}`);

    if (charBudget <= 0) {
        output.appendLine('[IncludeResolver] No budget remaining — skipping include resolution');
        return [];
    }

    // Collect direct includes from all module files
    const directIncludes: string[] = [];
    for (const mf of moduleFiles) {
        const includes = extractIncludes(mf.content);
        directIncludes.push(...includes);
    }

    const uniqueDirect = [...new Set(directIncludes)];
    output.appendLine(`[IncludeResolver] Direct includes to resolve: ${uniqueDirect.length}`);

    const resolved: SourceFile[] = [];
    const transitiveQueue: string[] = [];

    // --- Pass 1: direct includes ---
    for (const includeName of uniqueDirect) {
        const basename = path.basename(includeName).toLowerCase();
        const candidates = fileIndex.get(basename) ?? [];

        if (candidates.length === 0) {
            output.appendLine(`[IncludeResolver]   Not found: ${includeName}`);
            continue;
        }

        // Pick the most likely match (prefer one whose directory structure matches the include path)
        const best = candidates.length === 1
            ? candidates[0]
            : pickBestMatch(includeName, candidates);

        const pairs = readFilePair(best, repoRoot, seen, output);
        for (const sf of pairs) {
            if (sf.sizeChars <= charBudget) {
                resolved.push(sf);
                charBudget -= sf.sizeChars;
                // Queue transitive includes from this file
                transitiveQueue.push(sf.fullPath);
            } else {
                output.appendLine(`[IncludeResolver]   Skipped (over budget): ${sf.relativePath}`);
            }
        }
    }

    // --- Pass 2: transitive includes ---
    output.appendLine(`[IncludeResolver] Transitive queue: ${transitiveQueue.length} files`);

    for (const filePath of transitiveQueue) {
        if (charBudget <= 0) { break; }

        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch {
            continue;
        }

        const transIncludes = extractIncludes(content);
        for (const includeName of transIncludes) {
            if (charBudget <= 0) { break; }
            const basename = path.basename(includeName).toLowerCase();
            const candidates = fileIndex.get(basename) ?? [];
            if (candidates.length === 0) { continue; }

            const best = candidates.length === 1
                ? candidates[0]
                : pickBestMatch(includeName, candidates);

            const pairs = readFilePair(best, repoRoot, seen, output);
            for (const sf of pairs) {
                if (sf.sizeChars <= charBudget) {
                    resolved.push(sf);
                    charBudget -= sf.sizeChars;
                } else {
                    output.appendLine(`[IncludeResolver]   Skipped transitive (over budget): ${sf.relativePath}`);
                }
            }
        }
    }

    output.appendLine(`[IncludeResolver] Total resolved files: ${resolved.length}`);
    output.appendLine(`[IncludeResolver] Remaining char budget: ${charBudget.toLocaleString()}`);
    return resolved;
}

/**
 * When multiple files match a basename, pick the one whose path contains
 * path segments from the include string (e.g. "drivers/can.h" → prefer path with "drivers").
 */
function pickBestMatch(includeName: string, candidates: string[]): string {
    const parts = includeName.split('/').slice(0, -1); // directory hints
    if (parts.length === 0) {
        return candidates[0];
    }
    const scored = candidates.map(c => {
        const score = parts.filter(p => c.toLowerCase().includes(p.toLowerCase())).length;
        return { path: c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].path;
}
