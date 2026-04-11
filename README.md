# BMS DocGen

Automated engineering documentation generator for BMS embedded C firmware.

Triggered by IAR Embedded Workbench post-build → signals VS Code → GitHub Copilot
generates rich HTML design documents for each selected firmware module.

---

## System Architecture

```
IAR Build
    │
    └─► trigger/trigger.py  ──► code --open-url vscode://bms-doc-gen/trigger
                                        │
                                        ▼
                              VS Code Extension (extension/)
                                        │
                              ┌─────────┴──────────┐
                              │   DocGen Webview    │
                              │  ┌───────────────┐  │
                              │  │ Folder list   │  │
                              │  │ (checkboxes)  │  │
                              │  └───────────────┘  │
                              │  [Generate button]  │
                              └─────────┬──────────┘
                                        │
                              For each selected module:
                                        │
                              ┌─────────▼──────────┐
                              │  1. Read .c/.h      │  fileReader.ts
                              │  2. Resolve #incl   │  includeResolver.ts
                              │  3. Build prompt    │  promptBuilder.ts
                              │  4. Call Copilot    │  llmClient.ts
                              │  5. Render HTML     │  docRenderer.ts
                              └─────────┬──────────┘
                                        │
                                        ▼
                              docs/{MODULE}_design.html
```

---

## Repository Structure

```
bms-firmware/
├── README.md                    ← You are here
├── PLAN.md                      ← Original build plan
├── docs/                        ← Generated HTML docs (created on first run)
│   └── {MODULE_NAME}_design.html
├── trigger/
│   ├── trigger.py               ← IAR post-build Python script
│   └── README.md                ← IAR setup instructions
└── extension/
    ├── package.json             ← VS Code extension manifest
    ├── tsconfig.json
    ├── src/
    │   ├── extension.ts         ← Activation, URI handler, generation orchestration
    │   ├── webviewPanel.ts      ← Singleton Webview panel manager
    │   ├── folderScanner.ts     ← Scan workspace for BMS module folders
    │   ├── fileReader.ts        ← Read .c/.h files from a folder
    │   ├── includeResolver.ts   ← Resolve #include chains across the repo
    │   ├── promptBuilder.ts     ← Assemble LLM prompt with system context
    │   ├── llmClient.ts         ← vscode.lm API + streaming
    │   └── docRenderer.ts       ← LLM text → dark-themed HTML
    └── media/
        └── webview.html         ← Webview UI (checklist, progress, results)
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| VS Code | 1.90+ | Required for `vscode.lm` API |
| GitHub Copilot | Any | Subscription required |
| GitHub Copilot Chat | Latest | Provides the language model |
| Node.js + npm | 18+ | For building the extension |
| Python | 3.7+ | For the IAR trigger script |

---

## Installation

### 1. Build the Extension

```bash
cd extension
npm install
npm run build
```

This creates `extension/out/extension.js`.

### 2. Package as VSIX

```bash
cd extension
npm run package
# Creates: bms-doc-gen-0.1.0.vsix
```

### 3. Install in VS Code

```
VS Code → Extensions → ... (three dots) → Install from VSIX
```

Select the generated `.vsix` file.

Or install from the command line:

```bash
code --install-extension extension/bms-doc-gen-0.1.0.vsix
```

### 4. Verify Activation

Open VS Code on the BMS repo. Check **Output → BMS DocGen** — you should see:

```
BMS DocGen activated
```

---

## First Run (Manual)

Without IAR, you can trigger the panel manually:

1. Open VS Code on the BMS repo root
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run: **BMS DocGen: Open Documentation Generator**
4. The panel opens with all module folders listed
5. Check the modules you want to document
6. Click **Generate Documentation**

---

## IAR Post-Build Setup

See `trigger/README.md` for full instructions. Quick summary:

In IAR: **Project → Options → Build Actions → Post-build command line**

```
python "$PROJ_DIR$\..\..\trigger\trigger.py" "$PROJ_DIR$\.."
```

Adjust the `..\..\` path to point to the repo root from your IAR project directory.

---

## How Documentation is Generated

For each selected module folder:

1. **File Reader** — reads all `.c` and `.h` files in the folder
2. **Include Resolver** — parses `#include "..."` statements, finds the referenced
   headers (and their paired `.c` files) anywhere in the workspace, adds them to
   context (up to 80,000 characters total)
3. **Prompt Builder** — assembles a structured prompt with:
   - BMS system context (STM32, 14S LFP, IEC standards)
   - All file contents
   - 10-section output format instruction
4. **Copilot LLM** — streams the response via `vscode.lm.selectChatModels`
   (requires GitHub Copilot Chat)
5. **Doc Renderer** — converts LLM response to a dark-themed HTML file with:
   - Left sidebar navigation
   - Mermaid.js architecture diagrams
   - Syntax-highlighted code blocks
   - Module header with layer badge and timestamp

Output: `docs/{MODULE_NAME}_design.html`

---

## Generated Document Sections

Each generated document contains:

1. **Module Overview** — purpose and role in BMS
2. **Hardware / Peripheral Involved** — STM32 peripherals, registers
3. **Configuration** — all `#define`s, constants, baud rates
4. **Function Inventory** — every function with signature, params, return, side effects
5. **Data Flow** — inputs, outputs, queues, shared memory
6. **Cross-Module Dependencies** — as a Mermaid graph
7. **Sequence / Flow Diagram** — key operation sequences as Mermaid diagrams
8. **State Machine** — states and transitions if present (Mermaid stateDiagram)
9. **Design Decisions** — inferred rationale from code
10. **Known Issues / TODOs** — all TODO/FIXME/HACK comments verbatim

---

## Module Layer Detection

The extension automatically detects which BMS architecture layer a module belongs to
based on folder name conventions:

| Folder suffix | Layer |
|---|---|
| `_Driver`, `_Drv` | Driver (bare metal peripheral) |
| `_IF`, `_Interface` | Interface (abstraction layer) |
| `_Appl`, `_App`, `_Application` | Application (BMS logic) |
| anything else | Other |

---

## Context Window Management

The include resolver caps total context at **80,000 characters** with this priority:

1. Files in the selected module folder (always included)
2. Direct `#include "..."` references from those files
3. Transitive includes (only if budget remains)

System headers (`#include <stdio.h>`) are always skipped.

---

## Troubleshooting

**"No GitHub Copilot language models available"**
- Ensure GitHub Copilot Chat extension is installed
- Sign in: VS Code → Accounts → Sign in with GitHub Copilot

**Panel is empty / no folders shown**
- Open VS Code on the repo root folder (File → Open Folder)
- The extension scans the workspace root, not individual files

**Generated doc is incomplete**
- Check Output → BMS DocGen for error details
- Large modules may hit the 80,000-char context limit — the include resolver will
  log which files were skipped

**IAR post-build: 'code' not found**
- VS Code Command Palette → `Shell Command: Install 'code' command in PATH`

---

## Development

```bash
# Type-check without building
cd extension && npm run compile

# Watch mode for development
cd extension && npm run watch
```

Press `F5` in VS Code with the extension folder open to launch an Extension Development
Host for live testing.
