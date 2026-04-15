# SESSION 3 PLAN — BMS DocGen: Wire the LLM Pipeline

## STEP 1 — PIPELINE AUDIT

### src/fileReader.ts
- **Exports**: `readModuleFiles(folderPath: string, output: vscode.OutputChannel): SourceFile[]`
- **Also exports**: `getWorkspaceRoot(): string`
- **What it does**: Reads every `.c` and `.h` file (non-recursive) from the given folder.
  Returns `SourceFile[]` sorted by relative path.
- **SourceFile shape**: `{ relativePath, fullPath, content, sizeChars }`

### src/includeResolver.ts
- **Exports**: `resolveIncludes(moduleFiles: SourceFile[], output: vscode.OutputChannel): SourceFile[]`
- **Context cap**: `MAX_CONTEXT_CHARS = 80_000`
- **What it does**: Builds a filename→path index of every `.h`/`.c` in the workspace,
  then walks the `#include "..."` chain in two passes (direct, then transitive).
  Returns files NOT already in `moduleFiles`, within the char budget.
- **Input**: the primary module files (already read by fileReader)
- **Output**: resolved include files to add to the prompt context

### src/promptBuilder.ts
- **Exports**: `buildPrompt(module: ModuleFolder, moduleFiles: SourceFile[], resolvedIncludes: SourceFile[], output: vscode.OutputChannel): PromptPayload`
- **ModuleFolder shape** (from folderScanner.ts): `{ name, fullPath, layer, fileCount }`
- **PromptPayload shape**: `{ systemPrompt: string, userPrompt: string, totalChars: number }`
- **What it does**: Combines SYSTEM_CONTEXT + file contents + OUTPUT_FORMAT into
  one payload ready to send to the LLM.

### src/llmClient.ts
- **Exports**: `generateDocumentation(payload: PromptPayload, onToken: TokenCallback, output: vscode.OutputChannel, cancellationToken?: vscode.CancellationToken): Promise<string>`
- **Also exports**: `type TokenCallback = (token: string) => void`
- **What it does**: Selects best available Copilot model (gpt-4o → any copilot fallback),
  sends one combined User message (systemPrompt + userPrompt), streams tokens via onToken,
  returns the full assembled string.
- **Error handling**: throws typed errors for model_not_found, not signed in, rate limit.

---

## WHAT ALREADY EXISTS AND WORKS — DO NOT TOUCH

| File | Status |
|------|--------|
| src/fileReader.ts | ✅ complete |
| src/includeResolver.ts | ✅ complete |
| src/llmClient.ts | ✅ complete |
| src/promptBuilder.ts | ✅ complete |
| src/layerMap.ts | ✅ complete |
| src/utils/scanFolders.ts | ✅ complete |
| src/folderScanner.ts | ✅ complete |
| src/webview/greeting.ts | ✅ complete |
| src/docRenderer.ts | ✅ shell-only, needs renderDoc() added |
| src/webview/selector.ts | ✅ UI complete, needs progress panel added |
| src/extension.ts | ✅ scaffold, handleGenerate() needs full wiring |

---

## WHAT THIS SESSION DOES

Connect the existing disconnected pieces into one working pipeline:

```
selector sends { command: 'generate', folders: [...] }
        ↓
extension.ts handleGenerate() — for each folder:
    readModuleFiles(folderPath, output)          → SourceFile[]
    resolveIncludes(moduleFiles, output)         → SourceFile[]
    buildPrompt(moduleFolder, files, includes, output) → PromptPayload
    generateDocumentation(payload, onToken, output)   → string
    renderDoc(name, layer, content, outFile, ts)      → HTML file
        ↓
sendProgress() messages → selector progress panel
        ↓
done: "Open doc" button opens HTML in browser
```

---

## ACTUAL FUNCTION SIGNATURES (verified from source)

The Step 3 prompt uses pseudocode names. Actual names to use:

| Prompt pseudocode | Actual function | File |
|-------------------|-----------------|------|
| `resolveIncludes(folderPath, workspace)` | `readModuleFiles(path, out)` THEN `resolveIncludes(files, out)` | fileReader + includeResolver |
| `buildPrompt({ moduleName, layerName, bundle })` | `buildPrompt(moduleFolder, files, resolved, out)` | promptBuilder |
| `callCopilot(chunks, onProgress)` | `generateDocumentation(payload, onToken, out)` | llmClient |
| `renderDoc(...)` | `renderDoc(name, layer, content, path, ts)` | docRenderer (to be added) |

---

## FILES MODIFIED THIS SESSION

| File | Change |
|------|--------|
| src/docRenderer.ts | ADD `renderDoc()` alongside existing `renderDocShell()` |
| src/extension.ts | REPLACE stub `handleGenerate()` with full pipeline |
| src/webview/selector.ts | ADD progress panel HTML + JS |

---

## WIRING ORDER

1. **docRenderer.ts** — add `renderDoc()`, `parseSections()`, `renderContent()`, `escapeHtml()`
2. **extension.ts** — wire full pipeline in `handleGenerate()`, add `sendProgress()` helper
3. **selector.ts** — add progress panel HTML/CSS/JS

---

## KNOWN API MISMATCHES FROM PROMPT INSTRUCTIONS

The instructions' pseudocode assumes a different API shape than what exists.
Correct mapping used in implementation:

```typescript
// Step 1: read primary files
const moduleFiles = readModuleFiles(folderPath, output);
if (moduleFiles.length === 0) { /* skip */ }

// Step 2: resolve includes
const resolvedIncludes = resolveIncludes(moduleFiles, output);

// Step 3: build prompt — ModuleFolder must match interface
const moduleFolder: ModuleFolder = {
    name: folderName,
    fullPath: folderPath,
    layer: layerName,
    fileCount: moduleFiles.length
};
const payload = buildPrompt(moduleFolder, moduleFiles, resolvedIncludes, output);

// Step 4: call LLM
let tokenBuffer = '';
const llmContent = await generateDocumentation(
    payload,
    (token) => {
        tokenBuffer += token;
        // throttle progress updates
        sendProgress(panel, folderName, 'analysing', 'Generating...');
    },
    output
);

// Step 5: render
await renderDoc(folderName, layerName, llmContent, outFile, timestamp);
```
