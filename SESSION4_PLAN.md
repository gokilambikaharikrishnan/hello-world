# SESSION 4 PLAN — BMS DocGen: Fix Parser, Renderer, Mermaid, Copy, Prompt

## ORIENTATION FINDINGS

### src/docRenderer.ts — what is broken and why

**parseSections()** (line 141):
- Only matches bare `^(\d{1,2})\.\s+(.+)$`
- Copilot returns `## 1. MODULE OVERVIEW` — the `##` prefix kills the match
- Also misses `**1. MODULE OVERVIEW**`, `# 1.`, `### 1.`
- Result: everything falls into the fallback "Generated Documentation" block
- Sidebar shows 1 section instead of 10

**renderContent()** (line 167):
- Regex-replace approach, processes whole string at once
- `### subheadings` not handled → renders as literal `### text`
- `---` dividers not stripped → render as literal dashes
- Table regex `/((?:\|.+\|\n?)+)/g` unreliable with multiline
- `**bold**` works only when the regex doesn't conflict with other replacements
- No `⚠️ WARNING` block handling
- No `h3`/`h4` subheading handling

**Mermaid** (line 416):
- Uses `startOnLoad: true` — synchronous, no per-diagram error handling
- Any invalid mermaid syntax = red bomb, no fallback

**copyCode()** (line 422):
- Exists and is correct — no change needed

### src/promptBuilder.ts — what is broken and why

- `SYSTEM_CONTEXT` is generic firmware boilerplate
- `OUTPUT_FORMAT` instructs format but doesn't enforce it strictly
- No instruction to start with `1. MODULE OVERVIEW` (no preamble)
- No BMS domain context (what LFP cells are, why 14S, what contactor is)
- No audience definition (new hire who needs first-principles explanations)
- No layer-specific focus (MCAL vs ASW need completely different content)
- Result: Copilot writes generic software docs with `##` headers that break parser

### src/llmClient.ts — status

- Complete and correct. No changes needed.
- Sends `systemPrompt + userPrompt` as a single User message.
- Falls back from gpt-4o to any copilot model.

---

## 5 FIXES IN ORDER

### Fix 1 — Section parser (docRenderer.ts)
**File:** `src/docRenderer.ts`
**Function:** `parseSections()`
**Change:** Strip `#` prefixes and `**` bold markers before matching
the `^\d{1,2}\.\s+` pattern. Also skip `---` divider lines inside sections.

### Fix 2 — Content renderer (docRenderer.ts)
**File:** `src/docRenderer.ts`
**Function:** `renderContent()` + new helpers `applyInline()` + `renderTable()`
**Change:** Line-by-line renderer with proper state machine:
- `### ` → `<h4>`, `## ` → `<h3>`
- `---` → skip
- `⚠️` lines → yellow warning block
- Bullet lists → flush to `<ul>` on non-bullet line
- Tables → line accumulator → `renderTable()`
- Mermaid/code blocks → state flags
Add missing CSS: h3.sub-title, h4.subsection-title, .warning-block, .spacer

### Fix 3 — Mermaid error handling (docRenderer.ts)
**File:** `src/docRenderer.ts`
**Inline script in buildRealDocHtml()**
**Change:** Replace `startOnLoad:true` with async per-diagram render loop.
On error: show yellow fallback block with source. Add .mermaid-fallback CSS.

### Fix 4 — Copy button (docRenderer.ts)
**File:** `src/docRenderer.ts`
**Change:** Verify `copyCode()` function is complete (it is — no code change needed).
Verify CDN links for hljs and mermaid are correct (they are).
This fix is a verification step only.

### Fix 5 — Prompt rewrite (promptBuilder.ts)
**File:** `src/promptBuilder.ts`
**Change:** Full rewrite of prompt content. Keep TypeScript structure.
Four parts assembled in `buildPrompt()`:
- Part A: Format rules (start with `1.`, no `##`, no preamble)
- Part B: Identity (senior BMS engineer) + audience (new hire)
- Part C: BMS domain context + layer focus + source files
- Part D: 10 section instructions (mandatory, detailed)
New helper: `getLayerFocus(layerName)` — 5 different instructions per layer

---

## FILES TOUCHED

| Fix | File | Functions changed |
|-----|------|-------------------|
| 1 | src/docRenderer.ts | parseSections() |
| 2 | src/docRenderer.ts | renderContent(), new applyInline(), new renderTable(), CSS in buildRealDocHtml() |
| 3 | src/docRenderer.ts | inline script block in buildRealDocHtml() |
| 4 | src/docRenderer.ts | verify only, no code change |
| 5 | src/promptBuilder.ts | buildPrompt(), new getLayerFocus(), new PART_A/B/C/D constants |

---

## COMMIT SEQUENCE

- session4: add SESSION4_PLAN.md
- fix 1: section parser handles all markdown header formats
- fix 2a: applyInline and renderTable helpers
- fix 2b: renderContent full line-by-line rewrite
- fix 2c: add missing CSS classes (sub-title, warning, spacer, table, list)
- fix 3a: mermaid async per-diagram render with error handling
- fix 3b: mermaid fallback CSS
- fix 5a: prompt part A format rules
- fix 5b: prompt part B identity and audience
- fix 5c: prompt part C bms context + getLayerFocus helper
- fix 5d: prompt part D 10 section instructions
- fix 5e: buildPrompt assembles all 4 parts
