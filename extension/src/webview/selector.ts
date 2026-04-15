import { FolderGroup } from '../types';

function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Server-side render helpers — generate HTML in TypeScript, not in the webview
// ---------------------------------------------------------------------------

function buildGroupsHtml(groups: FolderGroup[], preselected: Set<string>): string {
    let html = '';
    let bswAdded = false;
    let aswAdded = false;

    for (const g of groups) {
        if (g.group === 'BSW' && !bswAdded) {
            bswAdded = true;
            html += `
    <div class="arch-divider arch-divider-bsw">
      <span class="arch-divider-label">BSW</span>
      <div class="arch-divider-line"></div>
      <span class="arch-divider-desc">Basic Software</span>
    </div>`;
        }
        if (g.group === 'ASW' && !aswAdded) {
            aswAdded = true;
            html += `
    <div class="arch-divider arch-divider-asw">
      <span class="arch-divider-label">ASW</span>
      <div class="arch-divider-line"></div>
      <span class="arch-divider-desc">Application Software</span>
    </div>`;
        }

        const folderCount = g.folders.length;
        const foldersHtml = g.folders.map(folder => {
            const checked = preselected.has(folder);
            return `
      <label class="folder-row" id="row-${esc(folder)}">
        <input type="checkbox" name="folder" value="${esc(folder)}"${checked ? ' checked' : ''} onchange="onFolderChange()">
        <span class="folder-name">${esc(folder)}</span>
        <span class="layer-badge">${esc(g.layer)}</span>
      </label>`;
        }).join('');

        html += `
    <div class="group-wrapper" id="group-${esc(g.layer)}" style="--layer-color:${esc(g.color)}">
      <div class="group-header" id="hdr-${esc(g.layer)}" onclick="toggleCollapse('${g.layer}')">
        <div class="group-header-left">
          <span class="group-icon">${g.icon}</span>
          <span class="group-layer-name">${esc(g.layer)}</span>
          <span class="group-full-name">${esc(g.fullName)}</span>
        </div>
        <div class="group-header-right">
          <span class="folder-count-badge">${folderCount} folder${folderCount === 1 ? '' : 's'}</span>
          <div class="selection-dot" id="sel-dot-${esc(g.layer)}" style="background:${esc(g.color)}"></div>
          <button class="btn-all" onclick="event.stopPropagation();selectAll('${g.layer}')">All</button>
          <span class="chevron" id="chevron-${esc(g.layer)}">&#9660;</span>
        </div>
      </div>
      <div class="folder-list" id="folders-${esc(g.layer)}">${foldersHtml}
      </div>
    </div>`;
    }

    return html;
}

function buildLayerDotsHtml(groups: FolderGroup[]): string {
    return groups.map(g =>
        `<div class="layer-dot" id="dot-${esc(g.layer)}" style="background:${esc(g.color)}" title="${esc(g.layer)}"></div>`
    ).join('');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildSelectorHTML(groups: FolderGroup[], preselected: string[]): string {
    const groupsJson = JSON.stringify(groups);
    const preselectedJson = JSON.stringify(preselected);
    const preselectedSet = new Set(preselected);

    const groupsHtml   = buildGroupsHtml(groups, preselectedSet);
    const layerDotsHtml = buildLayerDotsHtml(groups);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BMS DocGen — Select Modules</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      background: #0d1117;
      color: #e6edf3;
    }

    /* ── TOP BAR ── */
    #topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 50;
    }

    .topbar-brand { font-size: 0.8rem; color: #58a6ff; letter-spacing: 0.2em; text-transform: uppercase; }
    .topbar-title { font-size: 0.95rem; font-weight: 600; color: #e6edf3; }

    .topbar-right { display: flex; align-items: center; gap: 12px; }

    #counter { font-size: 0.82rem; color: #8b949e; }

    #btn-generate {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      padding: 6px 16px;
      border-radius: 6px;
      cursor: not-allowed;
      transition: all 200ms;
      background: #21262d;
      color: #484f58;
      border: 1px solid #30363d;
    }
    #btn-generate.active { background: #238636; color: #fff; border-color: #238636; cursor: pointer; }
    #btn-generate.active:hover { background: #2ea043; border-color: #2ea043; }

    /* ── SEARCH ── */
    #searchbar {
      position: sticky;
      top: 52px;
      background: #0d1117;
      padding: 12px 24px;
      border-bottom: 1px solid #21262d;
      z-index: 40;
    }

    #search-input {
      width: 100%;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #e6edf3;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      padding: 8px 14px;
      outline: none;
      transition: border-color 150ms;
    }
    #search-input::placeholder { color: #484f58; }
    #search-input:focus { border-color: #58a6ff; }

    /* ── MAIN CONTENT ── */
    #main {
      margin-top: 52px;   /* clear fixed topbar */
      padding-bottom: 56px;
    }

    /* ── GROUP ITEMS ── */
    .group-header {
      background: #0d1117;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      border-bottom: 1px solid #21262d;
      user-select: none;
    }
    .group-header:hover .chevron { color: #8b949e; }

    .group-header-left { display: flex; align-items: center; gap: 10px; }
    .group-icon { font-size: 1.1rem; }
    .group-layer-name { color: #e6edf3; font-weight: 600; font-size: 0.95rem; }
    .group-full-name { color: #8b949e; font-size: 0.78rem; }

    .group-header-right { display: flex; align-items: center; gap: 12px; }

    .folder-count-badge {
      background: #21262d; color: #8b949e;
      border-radius: 10px; padding: 2px 8px; font-size: 0.72rem;
    }

    .selection-dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0; transition: opacity 200ms; }

    .btn-all {
      background: transparent; border: none; color: #58a6ff;
      font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
      cursor: pointer; padding: 2px 6px;
    }
    .btn-all:hover { text-decoration: underline; }

    .chevron { color: #484f58; font-size: 0.7rem; transition: transform 200ms; }
    .chevron.collapsed { transform: rotate(-90deg); }

    .folder-list {
      border-left: 3px solid var(--layer-color, #58a6ff);
      margin-left: 32px;
      background: #161b22;
    }

    .folder-row {
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #21262d;
      cursor: pointer;
      transition: background 150ms;
    }
    .folder-row:last-child { border-bottom: none; }
    .folder-row:hover { background: #1f2937; }

    .folder-row input[type="checkbox"] {
      width: 16px; height: 16px; flex-shrink: 0;
      accent-color: var(--layer-color, #58a6ff);
      cursor: pointer;
    }

    .folder-name { color: #e6edf3; font-size: 0.88rem; flex: 1; }

    .layer-badge {
      font-size: 0.68rem; padding: 1px 7px; border-radius: 8px;
      border: 1px solid var(--layer-color, #58a6ff);
      color: var(--layer-color, #58a6ff); opacity: 0.7;
    }

    .no-results { display: none; padding: 24px; text-align: center; color: #484f58; font-size: 0.88rem; }

    /* ── BSW / ASW DIVIDERS ── */
    .arch-divider {
      padding: 8px 24px;
      display: flex; align-items: center; gap: 10px;
      background: #0d1117;
    }
    .arch-divider-label {
      font-size: 0.68rem; font-weight: 600; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 2px 10px; border-radius: 4px; white-space: nowrap;
    }
    .arch-divider-bsw .arch-divider-label { color: #8b949e; border: 1px solid #30363d; background: #161b22; }
    .arch-divider-asw .arch-divider-label { color: #1f6feb; border: 1px solid #1f6feb; background: rgba(31,111,235,0.08); }
    .arch-divider-line { flex: 1; height: 1px; background: #21262d; }
    .arch-divider-desc { font-size: 0.7rem; color: #484f58; }

    /* ── BOTTOM BAR ── */
    #bottombar {
      position: fixed;
      bottom: 0; left: 0; right: 0; height: 40px;
      background: #161b22; border-top: 1px solid #30363d;
      padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between;
    }
    #bottom-summary { font-size: 0.8rem; color: #8b949e; }
    #layer-dots { display: flex; align-items: center; gap: 6px; }
    .layer-dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0; transition: opacity 200ms; cursor: default; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #0d1117; }
    ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }

    /* ── PROGRESS PANEL ── */
    #progress-panel {
      display: none;
      margin: 24px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
    }
    .progress-header {
      background: #21262d;
      padding: 12px 20px;
      color: #8b949e;
      font-size: 0.82rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .progress-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; border-bottom: 1px solid #21262d; font-size: 0.88rem;
    }
    .progress-row:last-child { border-bottom: none; }
    .progress-icon { font-size: 1rem; width: 20px; flex-shrink: 0; }
    .progress-folder { color: #e6edf3; font-weight: 500; min-width: 160px; }
    .progress-msg { color: #8b949e; flex: 1; }
    .progress-link {
      color: #58a6ff; cursor: pointer; font-size: 0.8rem;
      text-decoration: underline; background: none; border: none;
      font-family: inherit; white-space: nowrap;
    }
    .progress-link:hover { color: #79c0ff; }
    #all-done-msg {
      display: none; padding: 16px 20px;
      align-items: center; gap: 12px;
      color: #3fb950; font-size: 0.9rem;
    }
    #open-docs-btn {
      margin-left: auto; background: transparent;
      border: 1px solid #30363d; color: #8b949e;
      border-radius: 6px; padding: 4px 12px; cursor: pointer;
      font-family: inherit; font-size: 0.8rem;
    }
    #open-docs-btn:hover { color: #e6edf3; border-color: #8b949e; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .pulsing { animation: pulse 1.2s ease infinite; }
  </style>
</head>
<body>

  <div id="topbar">
    <div class="topbar-brand">&#9889; BMS DocGen</div>
    <div class="topbar-title">Select Modules</div>
    <div class="topbar-right">
      <span id="counter">0 selected</span>
      <button id="btn-generate">Generate Docs &#8594;</button>
    </div>
  </div>

  <div id="main">
    <div id="searchbar">
      <input id="search-input" type="text" placeholder="Search modules..." autocomplete="off" />
    </div>

    <div id="group-list">${groupsHtml}
      <div class="no-results" id="no-results">No modules match your search.</div>
    </div>
  </div>

  <div id="progress-panel">
    <div class="progress-header">Generating Documentation</div>
    <div id="progress-list"></div>
    <div id="all-done-msg">
      <span>&#9989;</span>
      <span id="done-text"></span>
      <button id="open-docs-btn">Open docs folder</button>
    </div>
  </div>

  <div id="bottombar">
    <span id="bottom-summary">0 folders selected across 0 layers</span>
    <div id="layer-dots">${layerDotsHtml}</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const GROUPS = ${groupsJson};
    const collapsed = new Set();

    // ── Read currently checked boxes ───────────────────────────
    function checkedFolders() {
      return Array.from(document.querySelectorAll('input[name="folder"]:checked')).map(cb => cb.value);
    }

    // ── Called by each checkbox onchange ──────────────────────
    function onFolderChange() { updateCounter(); }

    // ── Select-all for one layer ──────────────────────────────
    function selectAll(layer) {
      const fl = document.getElementById('folders-' + layer);
      if (!fl) { return; }
      fl.querySelectorAll('input[name="folder"]').forEach(cb => { cb.checked = true; });
      updateCounter();
    }

    // ── Collapse ───────────────────────────────────────────────
    function toggleCollapse(layer) {
      const fl = document.getElementById('folders-' + layer);
      const ch = document.getElementById('chevron-' + layer);
      if (!fl || !ch) { return; }
      if (collapsed.has(layer)) {
        collapsed.delete(layer); fl.style.display = ''; ch.classList.remove('collapsed');
      } else {
        collapsed.add(layer); fl.style.display = 'none'; ch.classList.add('collapsed');
      }
    }

    // ── Counter ────────────────────────────────────────────────
    function updateCounter() {
      const n = checkedFolders().length;
      document.getElementById('counter').textContent = n + ' selected';
      document.getElementById('btn-generate').classList.toggle('active', n > 0);
      document.getElementById('bottom-summary').textContent =
        n + ' folder' + (n === 1 ? '' : 's') + ' selected';
    }

    // ── Search ─────────────────────────────────────────────────
    document.getElementById('search-input').addEventListener('input', function() {
      const q = this.value.trim().toLowerCase();
      let anyVisible = false;
      GROUPS.forEach(g => {
        const wrapper = document.getElementById('group-' + g.layer);
        if (!wrapper) { return; }
        let groupMatch = false;
        g.folders.forEach(f => {
          const row = document.getElementById('row-' + f);
          if (!row) { return; }
          const match = !q || f.toLowerCase().includes(q) ||
            g.layer.toLowerCase().includes(q) || g.fullName.toLowerCase().includes(q);
          row.style.display = match ? '' : 'none';
          if (match) { groupMatch = true; }
        });
        wrapper.style.display = groupMatch ? '' : 'none';
        if (groupMatch) { anyVisible = true; }
      });
      document.getElementById('no-results').style.display = anyVisible ? 'none' : 'block';
    });

    // ── Generate ───────────────────────────────────────────────
    document.getElementById('btn-generate').addEventListener('click', function() {
      const folders = checkedFolders();
      if (folders.length === 0) { return; }
      vscode.postMessage({ command: 'generate', folders });
    });

    // ── Init counter for any pre-selections ───────────────────
    updateCounter();

    // ── Progress panel ─────────────────────────────────────────
    window.addEventListener('message', event => {
      const msg = event.data;

      if (msg.command === 'progress') {
        showProgressPanel();
        updateProgressRow(msg.folder, msg.status, msg.message, msg.outputPath);
      }

      if (msg.command === 'allDone') {
        const doneEl = document.getElementById('all-done-msg');
        const textEl = document.getElementById('done-text');
        if (doneEl && textEl) {
          textEl.textContent = 'Documentation generated for ' + msg.count + ' module' + (msg.count === 1 ? '' : 's');
          doneEl.style.display = 'flex';
        }
      }
    });

    function showProgressPanel() {
      const panel = document.getElementById('progress-panel');
      if (panel) { panel.style.display = 'block'; }
    }

    function updateProgressRow(folder, status, message, outputPath) {
      let row = document.getElementById('pr-' + folder);
      if (!row) {
        row = document.createElement('div');
        row.id = 'pr-' + folder;
        row.className = 'progress-row';
        const list = document.getElementById('progress-list');
        if (list) { list.appendChild(row); }
      }

      const icons = { reading: '\uD83D\uDD0D', analysing: '\u23F3', rendering: '\uD83C\uDFA8', done: '\u2705', error: '\u274C' };
      const isPulsing = status === 'analysing' || status === 'reading';
      let linkHtml = '';
      if (status === 'done' && outputPath) {
        linkHtml = '<button class="progress-link" onclick="openDoc(\\'' + outputPath.replace(/\\/g, '\\\\') + '\\')">Open doc</button>';
      }

      row.innerHTML =
        '<span class="progress-icon ' + (isPulsing ? 'pulsing' : '') + '">' + (icons[status] || '\u23F3') + '</span>' +
        '<span class="progress-folder">' + folder + '</span>' +
        '<span class="progress-msg">' + message + '</span>' +
        linkHtml;
    }

    function openDoc(filePath) {
      vscode.postMessage({ command: 'openDoc', path: filePath });
    }

    document.getElementById('open-docs-btn').addEventListener('click', () => {
      vscode.postMessage({ command: 'openDocsFolder' });
    });
  </script>
</body>
</html>`;
}
