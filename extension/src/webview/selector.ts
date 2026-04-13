import { FolderGroup } from '../types';

/**
 * Builds the module selector screen HTML.
 * Fully self-contained — set directly as panel.webview.html.
 */
export function buildSelectorHTML(groups: FolderGroup[], preselected: string[]): string {
    const groupsJson = JSON.stringify(groups);
    const preselectedJson = JSON.stringify(preselected);

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

    .topbar-brand {
      font-size: 0.8rem;
      color: #58a6ff;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .topbar-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #e6edf3;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #counter {
      font-size: 0.82rem;
      color: #8b949e;
    }

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

    #btn-generate.active {
      background: #238636;
      color: #ffffff;
      border-color: #238636;
      cursor: pointer;
    }

    #btn-generate.active:hover {
      background: #2ea043;
      border-color: #2ea043;
    }

    /* ── SEARCH BAR ── */
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

    /* ── GROUP LIST ── */
    #group-list {
      padding-top: 52px;
      padding-bottom: 56px;
    }

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

    .group-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .group-icon { font-size: 1.1rem; }

    .group-layer-name {
      color: #e6edf3;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .group-full-name {
      color: #8b949e;
      font-size: 0.78rem;
    }

    .group-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .folder-count-badge {
      background: #21262d;
      color: #8b949e;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 0.72rem;
    }

    .selection-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 200ms;
    }

    .btn-all {
      background: transparent;
      border: none;
      color: #58a6ff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      cursor: pointer;
      padding: 2px 6px;
    }
    .btn-all:hover { text-decoration: underline; }

    .chevron {
      color: #484f58;
      font-size: 0.7rem;
      transition: transform 200ms;
    }
    .chevron.collapsed { transform: rotate(-90deg); }

    /* ── FOLDER LIST ── */
    .folder-list {
      border-left: 3px solid var(--layer-color);
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

    .custom-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid #30363d;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 150ms, border-color 150ms;
      font-size: 11px;
      color: white;
    }

    .custom-checkbox.checked {
      background: var(--layer-color);
      border-color: var(--layer-color);
    }

    .folder-name {
      color: #e6edf3;
      font-size: 0.88rem;
      flex: 1;
    }

    .layer-badge {
      font-size: 0.68rem;
      padding: 1px 7px;
      border-radius: 8px;
      border: 1px solid var(--layer-color);
      color: var(--layer-color);
      opacity: 0.7;
    }

    .no-results {
      display: none;
      padding: 24px;
      text-align: center;
      color: #484f58;
      font-size: 0.88rem;
    }

    /* ── BOTTOM BAR ── */
    #bottombar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 40px;
      background: #161b22;
      border-top: 1px solid #30363d;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    #bottom-summary {
      font-size: 0.8rem;
      color: #8b949e;
    }

    #layer-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .layer-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 200ms;
      cursor: default;
    }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #0d1117; }
    ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  </style>
</head>
<body>

  <!-- Top bar -->
  <div id="topbar">
    <div class="topbar-brand">⚡ BMS DocGen</div>
    <div class="topbar-title">Select Modules</div>
    <div class="topbar-right">
      <span id="counter">0 selected</span>
      <button id="btn-generate">Generate Docs →</button>
    </div>
  </div>

  <!-- Search -->
  <div id="searchbar">
    <input id="search-input" type="text" placeholder="Search modules..." autocomplete="off" />
  </div>

  <!-- Group list -->
  <div id="group-list"></div>

  <div class="no-results" id="no-results">No modules match your search.</div>

  <!-- Bottom bar -->
  <div id="bottombar">
    <span id="bottom-summary">0 folders selected across 0 layers</span>
    <div id="layer-dots"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const GROUPS = ${groupsJson};
    const PRESELECTED = ${preselectedJson};

    const selected = new Set(PRESELECTED);
    const collapsed = new Set();

    // ── Build DOM ──────────────────────────────────────────────

    function buildUI() {
      const list = document.getElementById('group-list');
      list.innerHTML = '';

      const layerDots = document.getElementById('layer-dots');
      layerDots.innerHTML = '';

      GROUPS.forEach(group => {
        // Layer dot in bottom bar
        const dot = document.createElement('div');
        dot.className = 'layer-dot';
        dot.id = 'dot-' + group.layer;
        dot.style.background = group.color;
        dot.title = group.layer;
        layerDots.appendChild(dot);

        // Group wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'group-wrapper';
        wrapper.id = 'group-' + group.layer;
        wrapper.style.setProperty('--layer-color', group.color);

        // Group header
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML =
          '<div class="group-header-left">' +
            '<span class="group-icon">' + group.icon + '</span>' +
            '<span class="group-layer-name">' + esc(group.layer) + '</span>' +
            '<span class="group-full-name">' + esc(group.fullName) + '</span>' +
          '</div>' +
          '<div class="group-header-right">' +
            '<span class="folder-count-badge">' + group.folders.length + ' folder' + (group.folders.length === 1 ? '' : 's') + '</span>' +
            '<div class="selection-dot" id="sel-dot-' + group.layer + '" style="background:' + group.color + '"></div>' +
            '<button class="btn-all" onclick="event.stopPropagation(); selectAll(\'' + group.layer + '\')">All</button>' +
            '<span class="chevron" id="chevron-' + group.layer + '">▼</span>' +
          '</div>';

        header.addEventListener('click', () => toggleCollapse(group.layer));
        wrapper.appendChild(header);

        // Folder list
        const folderList = document.createElement('div');
        folderList.className = 'folder-list';
        folderList.id = 'folders-' + group.layer;

        group.folders.forEach(folder => {
          const row = document.createElement('div');
          row.className = 'folder-row';
          row.id = 'row-' + folder;
          row.dataset.folder = folder;
          row.dataset.layer = group.layer;

          const isChecked = selected.has(folder);
          row.innerHTML =
            '<div class="custom-checkbox' + (isChecked ? ' checked' : '') + '" id="cb-' + folder + '">' +
              (isChecked ? '✓' : '') +
            '</div>' +
            '<span class="folder-name">' + esc(folder) + '</span>' +
            '<span class="layer-badge">' + esc(group.layer) + '</span>';

          row.addEventListener('click', () => toggleFolder(folder, group.color, group.layer));
          folderList.appendChild(row);
        });

        wrapper.appendChild(folderList);
        list.appendChild(wrapper);
      });

      updateCounter();
    }

    // ── State management ───────────────────────────────────────

    function toggleFolder(folderName, color, layer) {
      if (selected.has(folderName)) {
        selected.delete(folderName);
      } else {
        selected.add(folderName);
      }
      const cb = document.getElementById('cb-' + folderName);
      if (cb) {
        cb.className = 'custom-checkbox' + (selected.has(folderName) ? ' checked' : '');
        cb.textContent = selected.has(folderName) ? '✓' : '';
      }
      updateCounter();
      updateGroupDot(layer);
    }

    function selectAll(layer) {
      const group = GROUPS.find(g => g.layer === layer);
      if (!group) { return; }
      group.folders.forEach(folder => {
        selected.add(folder);
        const cb = document.getElementById('cb-' + folder);
        if (cb) { cb.className = 'custom-checkbox checked'; cb.textContent = '✓'; }
      });
      updateCounter();
      updateGroupDot(layer);
    }

    function toggleCollapse(layer) {
      const folderList = document.getElementById('folders-' + layer);
      const chevron = document.getElementById('chevron-' + layer);
      if (!folderList || !chevron) { return; }
      if (collapsed.has(layer)) {
        collapsed.delete(layer);
        folderList.style.display = '';
        chevron.classList.remove('collapsed');
      } else {
        collapsed.add(layer);
        folderList.style.display = 'none';
        chevron.classList.add('collapsed');
      }
    }

    function updateGroupDot(layer) {
      const group = GROUPS.find(g => g.layer === layer);
      if (!group) { return; }
      const anySelected = group.folders.some(f => selected.has(f));
      const dot = document.getElementById('sel-dot-' + layer);
      if (dot) { dot.style.opacity = anySelected ? '1' : '0'; }
    }

    function updateCounter() {
      const count = selected.size;
      document.getElementById('counter').textContent = count + ' selected';

      const btn = document.getElementById('btn-generate');
      if (count > 0) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      // Bottom bar: count layers with at least one selection
      const layersWithSelection = GROUPS.filter(g =>
        g.folders.some(f => selected.has(f))
      );
      document.getElementById('bottom-summary').textContent =
        count + ' folder' + (count === 1 ? '' : 's') +
        ' selected across ' + layersWithSelection.length + ' layer' +
        (layersWithSelection.length === 1 ? '' : 's');

      // Bottom dots
      GROUPS.forEach(g => {
        const dot = document.getElementById('dot-' + g.layer);
        if (dot) {
          const has = g.folders.some(f => selected.has(f));
          dot.style.opacity = has ? '1' : '0';
        }
      });
    }

    // ── Search ─────────────────────────────────────────────────

    document.getElementById('search-input').addEventListener('input', function() {
      filterFolders(this.value.trim().toLowerCase());
    });

    function filterFolders(query) {
      let anyVisible = false;

      GROUPS.forEach(group => {
        const wrapper = document.getElementById('group-' + group.layer);
        if (!wrapper) { return; }
        let groupHasMatch = false;

        group.folders.forEach(folder => {
          const row = document.getElementById('row-' + folder);
          if (!row) { return; }
          const match = !query ||
            folder.toLowerCase().includes(query) ||
            group.layer.toLowerCase().includes(query) ||
            group.fullName.toLowerCase().includes(query);
          row.style.display = match ? '' : 'none';
          if (match) { groupHasMatch = true; }
        });

        wrapper.style.display = groupHasMatch ? '' : 'none';
        if (groupHasMatch) { anyVisible = true; }
      });

      document.getElementById('no-results').style.display = anyVisible ? 'none' : 'block';
    }

    // ── Generate ───────────────────────────────────────────────

    document.getElementById('btn-generate').addEventListener('click', function() {
      if (selected.size === 0) { return; }
      vscode.postMessage({ command: 'generate', folders: [...selected] });
    });

    // ── Escape helper ──────────────────────────────────────────

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // ── Init ───────────────────────────────────────────────────
    buildUI();
  </script>
</body>
</html>`;
}
