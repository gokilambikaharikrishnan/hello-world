# BMS DocGen — Session 2 Upgrade Plan

## 1. What Already Exists (from Session 1)

### Commits on bms-doc-gen-v1
- phase 1: extension scaffold (package.json, tsconfig.json, .vscodeignore)
- phase 2: URI handler + webview shell (webviewPanel.ts reads media/webview.html)
- phase 3: folder scanner (folderScanner.ts — layer detection by suffix convention)
- phase 4: file reader (fileReader.ts)
- phase 5: include resolver (includeResolver.ts — workspace file index, 80k char cap)
- phase 6: prompt builder (promptBuilder.ts — 3-section BMS prompt)
- phase 7: vscode.lm integration (llmClient.ts — gpt-4o, streaming, error handling)
- phase 8: doc renderer (docRenderer.ts — LLM text → dark HTML, Mermaid CDN)
- phase 9: full pipeline wired in extension.ts
- phase 10: trigger.py + trigger/README.md
- phase 11: root README.md, INSTALL.md

### Current src/ files
```
extension/src/
  extension.ts       ← activation, URI handler, full LLM pipeline
  webviewPanel.ts    ← singleton panel, loads media/webview.html
  folderScanner.ts   ← scans workspace, detects layer by name suffix
  fileReader.ts      ← reads .c/.h files from folder
  includeResolver.ts ← resolves #include chains, 80k cap
  promptBuilder.ts   ← builds 3-section BMS prompt
  llmClient.ts       ← vscode.lm + streaming
  docRenderer.ts     ← LLM text → full HTML doc
```

### Current flow
URI trigger → openDocGenPanel() → scan folders → send foldersLoaded msg
→ webview checklist → user selects → 'generate' msg
→ readFiles → resolveIncludes → buildPrompt → callLLM → renderAndSave

---

## 2. What This Session Adds

### Architecture data
- `extension/src/layerMap.ts` — real 5-layer BMS architecture (MCAL/CDD/ESAL/SRVLayer/ASW)
  with colors, icons, descriptions per layer

### Upgrade A — Greeting screen
- `extension/src/utils/getUsername.ts` — git config user.name
- `extension/src/utils/getChangedFolders.ts` — git diff --name-only HEAD
- `extension/src/webview/greeting.ts` — buildGreetingHTML() → full HTML string

### Upgrade B — Module selector screen
- `extension/src/types.ts` — FolderGroup interface
- `extension/src/utils/scanFolders.ts` — groups folders by LAYER_MAP, returns FolderGroup[]
- `extension/src/webview/selector.ts` — buildSelectorHTML() → full HTML string

### Upgrade C — Doc shell layout
- `extension/src/docRenderer.ts` — REWRITTEN: renderDocShell() for layout testing
  (real content in Session 3)

---

## 3. Files Modified vs Created Fresh

### Created fresh (new files)
| File | What |
|---|---|
| `extension/src/layerMap.ts` | Layer architecture data |
| `extension/src/types.ts` | FolderGroup interface |
| `extension/src/utils/getUsername.ts` | git username util |
| `extension/src/utils/getChangedFolders.ts` | git changed folders util |
| `extension/src/utils/scanFolders.ts` | layer-aware folder scanner |
| `extension/src/webview/greeting.ts` | greeting HTML builder |
| `extension/src/webview/selector.ts` | selector HTML builder |

### Modified
| File | Change |
|---|---|
| `extension/src/extension.ts` | Major rewrite: new flow greeting→selector→docshell |
| `extension/src/webviewPanel.ts` | Minor: expose rawPanel getter |
| `extension/src/docRenderer.ts` | Replace renderAndSave with renderDocShell |

### Kept as-is (used in Session 3)
- `extension/src/fileReader.ts` — unchanged
- `extension/src/includeResolver.ts` — unchanged
- `extension/src/promptBuilder.ts` — unchanged
- `extension/src/llmClient.ts` — unchanged
- `extension/src/folderScanner.ts` — kept (still valid, supplements new scanner)
- `extension/media/webview.html` — kept but no longer active (HTML generated in TS now)

---

## 4. New Flow After This Session

```
URI trigger or command
  → getUsername() + timestamp
  → panel.webview.html = buildGreetingHTML(username, timestamp)
  → user clicks Full Stack / My Changes / Not Now

  Full Stack: showSelector(panel, [])
  My Changes: getChangedFolders() → showSelector(panel, folders)
  Not Now:    panel.dispose()

  showSelector:
    → scanFolders() → FolderGroup[]
    → panel.webview.html = buildSelectorHTML(groups, preselected)
    → user selects modules → clicks Generate

  Generate:
    → for each folder: renderDocShell(folder, layer, outPath)
    → vscode.window.showInformationMessage per doc saved
    (Session 3 replaces renderDocShell with real LLM pipeline)
```

---

## 5. Risks and Notes

1. **extension.ts is a full rewrite** — Session 1 LLM pipeline (fileReader, includeResolver,
   promptBuilder, llmClient) is preserved as-is in their files, just not called yet.
   Session 3 rewires them into the new flow.

2. **docRenderer.ts is replaced** — Session 1's renderAndSave (LLM text → HTML) is replaced
   by renderDocShell (layout shell only). Session 3 brings back LLM content rendering,
   building on the new HTML shell structure.

3. **webviewPanel.ts needs rawPanel getter** — The new extension.ts uses
   `panel.webview.html = ...` directly, so DocGenPanel must expose the underlying
   vscode.WebviewPanel. Minimal change.

4. **No external JS libraries in webview** — All webview HTML uses only Google Fonts CDN
   and inline CSS/JS. No Mermaid or highlight.js in webview (those are in doc output only).

5. **media/webview.html becomes inactive** — It's kept in the repo but no longer loaded.
   Webview HTML is now generated as TypeScript strings. Session 3 can clean it up.

---

*Session 2 delivers polished UI only. No LLM calls. No file reads. Pure UI scaffolding.*
