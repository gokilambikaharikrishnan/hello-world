import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ModuleFolder } from './folderScanner';

/**
 * Convert the LLM response text into a full dark-themed HTML document and save it.
 *
 * @param module       Module metadata (name + layer)
 * @param llmText      Raw text from the LLM
 * @param output       VS Code output channel
 * @returns            Absolute path to the saved HTML file
 */
export function renderAndSave(
    module: ModuleFolder,
    llmText: string,
    output: vscode.OutputChannel
): string {
    const repoRoot = getWorkspaceRoot();
    const docsDir = path.join(repoRoot, 'docs');

    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const htmlContent = buildHtml(module, llmText);
    const outPath = path.join(docsDir, `${module.name}_design.html`);
    fs.writeFileSync(outPath, htmlContent, 'utf8');

    output.appendLine(`[DocRenderer] Saved: ${outPath}`);
    return outPath;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : process.cwd();
}

/**
 * Extract section anchors from the LLM text for the sidebar nav.
 * Looks for lines that start with a number followed by a period (e.g. "1. MODULE OVERVIEW").
 */
function extractSections(text: string): Array<{ anchor: string; title: string }> {
    const sections: Array<{ anchor: string; title: string }> = [];
    const re = /^(\d+)\.\s+([A-Z][A-Z /()]+)/gm;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
        const num = match[1];
        const title = match[2].trim();
        const anchor = `section-${num}`;
        sections.push({ anchor, title: `${num}. ${title}` });
    }
    return sections;
}

/**
 * Convert the plain LLM text to HTML body content.
 * - Section headers (1. TITLE) become <h2> with anchors
 * - ```mermaid blocks become <div class="mermaid">
 * - ``` code blocks become <pre><code class="language-c">
 * - Other text is wrapped in <p>
 */
function textToHtml(text: string): string {
    const lines = text.split('\n');
    const output: string[] = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let inMermaid = false;
    let codeLines: string[] = [];

    function escapeHtml(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    for (const line of lines) {
        // --- Code / mermaid block start ---
        if (!inCodeBlock && !inMermaid) {
            const fenceMatch = line.match(/^```(\w*)/);
            if (fenceMatch) {
                const lang = fenceMatch[1].toLowerCase();
                if (lang === 'mermaid') {
                    inMermaid = true;
                    codeLines = [];
                } else {
                    inCodeBlock = true;
                    codeBlockLang = lang || 'c';
                    codeLines = [];
                }
                continue;
            }
        }

        // --- Inside mermaid block ---
        if (inMermaid) {
            if (line.startsWith('```')) {
                output.push(`<div class="mermaid">\n${escapeHtml(codeLines.join('\n'))}\n</div>`);
                inMermaid = false;
                codeLines = [];
            } else {
                codeLines.push(line);
            }
            continue;
        }

        // --- Inside code block ---
        if (inCodeBlock) {
            if (line.startsWith('```')) {
                const escaped = escapeHtml(codeLines.join('\n'));
                output.push(`<pre><code class="language-${codeBlockLang}">${escaped}</code></pre>`);
                inCodeBlock = false;
                codeLines = [];
            } else {
                codeLines.push(line);
            }
            continue;
        }

        // --- Section header: "N. TITLE" ---
        const sectionMatch = line.match(/^(\d+)\.\s+([A-Z][A-Z /()]+)/);
        if (sectionMatch) {
            const num = sectionMatch[1];
            const title = sectionMatch[2].trim();
            output.push(`<h2 id="section-${num}">${escapeHtml(`${num}. ${title}`)}</h2>`);
            continue;
        }

        // --- Sub-headers: lines starting with "   -" indented text as list items ---
        const subItemMatch = line.match(/^\s{3,}-\s+(.*)/);
        if (subItemMatch) {
            output.push(`<li>${escapeHtml(subItemMatch[1])}</li>`);
            continue;
        }

        // --- Empty line ---
        if (line.trim() === '') {
            output.push('<br/>');
            continue;
        }

        // --- Plain paragraph ---
        output.push(`<p>${escapeHtml(line)}</p>`);
    }

    return output.join('\n');
}

function buildHtml(module: ModuleFolder, llmText: string): string {
    const sections = extractSections(llmText);
    const generatedAt = new Date().toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });

    const sidebarItems = sections.map(s =>
        `<a href="#${s.anchor}" class="sidebar-link">${escapeHtmlAttr(s.title)}</a>`
    ).join('\n');

    const bodyContent = textToHtml(llmText);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${module.name} — BMS Design Document</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <!-- highlight.js -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/c.min.js"></script>

  <!-- Mermaid.js -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d1117;
      --bg-surface: #161b22;
      --bg-surface2: #1c2128;
      --border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --green: #3fb950;
      --yellow: #d29922;
      --sidebar-width: 260px;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      display: flex;
      min-height: 100vh;
    }

    /* ---- Sidebar ---- */
    #sidebar {
      width: var(--sidebar-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 24px 0;
      z-index: 10;
    }

    #sidebar .sidebar-header {
      padding: 0 20px 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 12px;
    }

    #sidebar .sidebar-header h3 {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    #sidebar .sidebar-header p {
      font-size: 13px;
      color: var(--text);
      font-weight: 600;
      margin-top: 4px;
    }

    .sidebar-link {
      display: block;
      padding: 7px 20px;
      font-size: 12px;
      color: var(--text-muted);
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: all 0.1s;
      font-family: 'Inter', sans-serif;
    }

    .sidebar-link:hover {
      color: var(--text);
      background: var(--bg-surface2);
      border-left-color: var(--accent);
    }

    /* ---- Main content ---- */
    #main {
      margin-left: var(--sidebar-width);
      flex: 1;
      max-width: 900px;
      padding: 40px 48px;
    }

    /* ---- Document header ---- */
    #doc-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 36px;
    }

    #doc-header .module-name {
      font-size: 28px;
      font-weight: 600;
      color: #f0f6fc;
      font-family: 'JetBrains Mono', monospace;
    }

    #doc-header .meta {
      margin-top: 10px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .meta-badge {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
      border: 1px solid;
    }

    .badge-driver { background: #1f3a5f; color: #58a6ff; border-color: #1f4a80; }
    .badge-interface { background: #3a2a1a; color: #d29922; border-color: #5a3a10; }
    .badge-application { background: #1a2f1a; color: #3fb950; border-color: #1a4a1a; }
    .badge-other { background: var(--bg-surface2); color: var(--text-muted); border-color: var(--border); }

    .meta-text {
      font-size: 12px;
      color: var(--text-muted);
      align-self: center;
    }

    /* ---- Body typography ---- */
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #f0f6fc;
      margin: 36px 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      scroll-margin-top: 20px;
    }

    p {
      margin-bottom: 8px;
      color: var(--text);
    }

    li {
      margin-left: 24px;
      margin-bottom: 4px;
      color: var(--text);
    }

    br { display: block; margin: 4px 0; content: ''; }

    /* ---- Code blocks ---- */
    pre {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin: 12px 0;
    }

    pre code {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.6;
    }

    code:not(pre code) {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 12px;
      background: var(--bg-surface2);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 5px;
      color: #ff7b72;
    }

    /* ---- Mermaid diagrams ---- */
    .mermaid {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      margin: 16px 0;
      overflow-x: auto;
      text-align: center;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
    }

    /* ---- Footer ---- */
    #doc-footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
    }

    /* ---- Scrollbar ---- */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #484f58; }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <nav id="sidebar">
    <div class="sidebar-header">
      <h3>BMS DocGen</h3>
      <p>${escapeHtmlAttr(module.name)}</p>
    </div>
    ${sidebarItems}
  </nav>

  <!-- Main content -->
  <main id="main">
    <div id="doc-header">
      <div class="module-name">${escapeHtmlAttr(module.name)}</div>
      <div class="meta">
        <span class="meta-badge ${layerBadgeClass(module.layer)}">${module.layer}</span>
        <span class="meta-text">Generated: ${generatedAt}</span>
        <span class="meta-text">Generated by BMS DocGen (GitHub Copilot)</span>
      </div>
    </div>

    <div id="doc-body">
${bodyContent}
    </div>

    <div id="doc-footer">
      Generated by BMS DocGen &mdash; ${generatedAt}
    </div>
  </main>

  <script>
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        background: '#161b22',
        primaryColor: '#1f4a80',
        primaryTextColor: '#e6edf3',
        lineColor: '#58a6ff',
        edgeLabelBackground: '#1c2128'
      }
    });

    // Initialize highlight.js
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    });

    // Highlight active sidebar link on scroll
    const sections = document.querySelectorAll('h2[id]');
    const links = document.querySelectorAll('.sidebar-link');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.style.borderLeftColor = '');
          const active = document.querySelector('.sidebar-link[href="#' + entry.target.id + '"]');
          if (active) { active.style.borderLeftColor = '#58a6ff'; active.style.color = '#e6edf3'; }
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });

    sections.forEach(s => observer.observe(s));
  </script>
</body>
</html>`;
}

function layerBadgeClass(layer: string): string {
    const map: Record<string, string> = {
        Driver: 'badge-driver',
        Interface: 'badge-interface',
        Application: 'badge-application',
        Other: 'badge-other'
    };
    return map[layer] ?? 'badge-other';
}

function escapeHtmlAttr(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
