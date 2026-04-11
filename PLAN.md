# BMS DocGen — Full Build Plan

## 1. What I Am Building

A VS Code extension paired with a Python trigger script that automatically generates
engineering documentation for a Battery Management System (BMS) embedded C codebase.

When a developer builds in IAR Embedded Workbench, the IDE runs a post-build Python
script (`trigger.py`) that sends a signal to VS Code. The VS Code extension wakes up,
shows a UI panel where the developer can select which BMS modules (folders) to document,
and then calls GitHub Copilot's language model (via `vscode.lm` API) to generate rich
HTML documentation — complete with Mermaid diagrams, syntax-highlighted code, and a
dark GitHub-style theme — saved to a `/docs` folder in the repo root.

---

## 2. Folder / File Structure

```
hello-world/
├── PLAN.md                        ← This file
├── README.md                      ← Root readme (Phase 11)
├── docs/                          ← Generated HTML docs (created at runtime)
│   └── {MODULE_NAME}_design.html
├── trigger/
│   ├── trigger.py                 ← IAR post-build Python trigger script
│   └── README.md                  ← IAR setup instructions
└── extension/
    ├── package.json               ← VS Code extension manifest
    ├── tsconfig.json              ← TypeScript config
    ├── .vscodeignore
    ├── src/
    │   ├── extension.ts           ← Entry point: activation, URI handler
    │   ├── webviewPanel.ts        ← Webview panel creation and messaging
    │   ├── folderScanner.ts       ← Scan workspace for module folders
    │   ├── fileReader.ts          ← Read .c and .h files from a folder
    │   ├── includeResolver.ts     ← Resolve #include chains across repo
    │   ├── promptBuilder.ts       ← Assemble LLM prompt from context
    │   ├── llmClient.ts           ← vscode.lm API call + streaming
    │   └── docRenderer.ts         ← LLM text → styled HTML document
    └── media/
        └── webview.html           ← Webview UI template (checklist + progress)
```

---

## 3. Build Order — Phase by Phase

### Phase 1 — Repo + Extension Scaffold
- Create `extension/` folder structure
- Write `package.json` with activation events, URI handler registration, contributes
- Write minimal `extension.ts` that activates and logs "BMS DocGen activated"
- Write `tsconfig.json`
- **Delivers:** A valid, installable VS Code extension skeleton

### Phase 2 — URI Handler + Webview Shell
- Register `vscode://bms-doc-gen/trigger` URI handler in `extension.ts`
- On URI trigger: create a Webview panel with placeholder content
- **Delivers:** Extension can be triggered by IAR and opens a panel

### Phase 3 — Folder Scanner + Checklist UI
- Implement `folderScanner.ts` to list all workspace root folders
- Pass folder list to Webview as a message
- Render checkboxes in Webview HTML
- **Delivers:** Developer can see and select modules to document

### Phase 4 — File Reader
- Implement `fileReader.ts` to read all `.c` and `.h` files from a folder
- Log file names and character counts to VS Code output channel
- **Delivers:** Extension can ingest raw source files from selected modules

### Phase 5 — Include Resolver
- Implement `includeResolver.ts`
- Parse `#include "..."` lines (skip `<system>` angle-bracket includes)
- Search workspace for matching headers, read them and their paired `.c` files
- Deduplicate, respect 80,000-character context cap with priority rules
- **Delivers:** Full cross-module context for the LLM

### Phase 6 — Prompt Builder
- Implement `promptBuilder.ts` with system context, per-module dynamic section,
  and output format instruction (exact text specified in task)
- Assemble and log final prompt length to output channel
- **Delivers:** A complete, structured LLM prompt ready for submission

### Phase 7 — vscode.lm Integration
- Implement `llmClient.ts`
- Call `vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' })`
- Stream response tokens to output channel
- Handle errors: model unavailable, Copilot not signed in, rate limits
- **Delivers:** Extension can query GitHub Copilot and receive streaming responses

### Phase 8 — Doc Renderer
- Implement `docRenderer.ts`
- Convert LLM markdown-style text into a full dark-themed HTML page
- Embed Mermaid.js and highlight.js from CDN
- Left sidebar with section anchors
- Save to `/docs/{MODULE_NAME}_design.html`
- **Delivers:** Beautiful, browsable HTML documentation files

### Phase 9 — Webview UI Polish
- Show generation progress (spinner / log lines) in Webview while LLM streams
- Display rendered doc inline in Webview iframe after generation
- Add "Open in Browser" button
- **Delivers:** Complete user-facing experience in the Webview panel

### Phase 10 — Python Trigger Script
- Write `trigger/trigger.py` (accepts repo root path arg, calls `code --open-url`)
- Write `trigger/README.md` with exact IAR post-build command instructions
- **Delivers:** Full IAR integration path

### Phase 11 — End-to-End README
- Write root `README.md` covering: architecture, install steps, IAR setup, first run,
  troubleshooting
- **Delivers:** Project is fully documented and handoff-ready

---

## 4. Assumptions About the Repo

1. The repo this extension runs against is a real embedded C codebase, but for
   development/testing we are working in the `hello-world` repo which contains no
   BMS source yet. The extension is designed generically so it works with any repo
   containing `.c`/`.h` files in subfolders.

2. VS Code is installed on the developer's machine and available as `code` in PATH
   (standard IAR Windows setup).

3. GitHub Copilot is licensed and the developer is signed in — this is a hard
   dependency for `vscode.lm` to return a model.

4. Node.js and npm are available for building the extension during development.

5. Python 3.x is available on the IAR build machine (trigger script uses only stdlib).

6. The extension will be installed as a local VSIX, not published to the marketplace.

7. The `vscode.lm` API (language model access) is available in VS Code 1.90+
   (Copilot Chat extension required alongside GitHub Copilot).

8. Layer type (Driver / IF / Application) is inferred from folder name conventions:
   - Folder name ends in `_Driver` or `_Drv` → Driver layer
   - Folder name ends in `_IF` or `_If` → Interface layer
   - Folder name ends in `_Appl` or `_App` → Application layer
   - Otherwise → Unknown / Other

---

## 5. Key Technical Decisions

- **No bundler complexity**: Use `esbuild` for bundling (fast, simple, no webpack config hell)
- **No framework for Webview**: Plain HTML/CSS/JS in the webview — no React, no overhead
- **Streaming**: Use `vscode.lm` stream API so the UI can show live progress
- **Context cap**: Hard cap at 80,000 chars to stay within model context window safely
- **CDN for Mermaid/highlight.js**: Simpler than bundling, docs are opened locally
- **Per-module HTML files**: One file per module, easy to navigate and version-control

---

*Plan written before any code. All phases will be committed individually.*
