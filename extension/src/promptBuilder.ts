import { SourceFile } from './fileReader';
import { ModuleFolder } from './folderScanner';
import * as vscode from 'vscode';

// ---------------------------------------------------------------------------
// Prompt parts — assembled in buildPrompt()
// ---------------------------------------------------------------------------

const PART_A = `CRITICAL FORMAT RULES — FOLLOW EXACTLY OR THE OUTPUT WILL BREAK:

- Start your response IMMEDIATELY with "1. MODULE OVERVIEW"
- Do NOT write any preamble, intro sentence, or title before section 1
- Do NOT write "Here is the documentation" or similar opener
- Section headers MUST use EXACTLY this format:
    1. MODULE OVERVIEW
    2. HARDWARE / PERIPHERAL INVOLVED
  (number + dot + space + UPPERCASE TITLE — nothing else on that line)
- Do NOT put ## or ### or ** before section numbers
- Do NOT use --- between sections
- Inside section body: ### for subheadings is OK
- **bold** for emphasis is OK inside body text
- Bullet points with - are OK
- Tables with | col | col | format are OK
- Code in \`\`\`c fenced blocks is OK
- Mermaid diagrams in \`\`\`mermaid fenced blocks are OK
- After every mermaid block write 2 plain English sentences describing it
`;

const PART_B = `YOU ARE:
A senior embedded firmware engineer with 15 years of BMS experience.
You are writing documentation for a junior engineer who just joined the team.
Your documentation must be:
- Technically precise: real values, real register names, real behaviour
- Built from first principles: explain the domain before the code
- Honest: prefix inferred information with "Inferred from code:"
- Never vague: no "handles errors appropriately" — say exactly what happens
- Never hallucinating: only document what is visible in the source files

READER PROFILE:
The person reading this just joined the BMS firmware team. They:
- Know C programming and basic embedded concepts
- Have NEVER worked on a BMS before
- Do not know: what a contactor is, what SOC means in practice,
  why CAN is used, what the AFE does, why NVM matters for battery life
- Will use this document as their primary reference for modifying the module
- Must understand the module well enough to change it safely
`;

// ---------------------------------------------------------------------------
// Layer-specific focus instructions
// ---------------------------------------------------------------------------

function getLayerFocus(layerName: string): string {
    switch (layerName) {
        case 'MCAL':
            return `LAYER FOCUS — MCAL:
You are documenting a bare metal STM32 peripheral driver.
Cover: which STM32 peripheral and why MCUs need it; which bus (APB1/APB2),
clock frequency, why it matters; exact register configuration; interrupt setup
(IRQ name, priority, why that priority); DMA if present; init → operation → ISR flow.
Start section 1 by explaining what this peripheral IS from first principles.`;

        case 'CDD':
            return `LAYER FOCUS — CDD:
You are documenting a driver for an external IC.
Cover: what the chip does physically in the BMS; communication protocol and why;
the exact initialisation sequence; how data is requested and parsed; error handling.
Start section 1 by explaining what the external IC does at system level and what
would happen to battery safety if this driver stopped working.`;

        case 'ESAL':
            return `LAYER FOCUS — ESAL:
You are documenting an abstraction interface module.
Cover: what complexity it hides; the API contract for every function;
why this boundary exists here; what upper layers would change if hardware swapped;
how hardware errors propagate upward.
Start section 1 explaining what abstraction means in embedded firmware and why it matters.`;

        case 'SRVLayer':
            return `LAYER FOCUS — SRVLayer:
You are documenting a service module used by application software.
Cover: what service it provides to ASW; how ASW modules use it; timing model
(cyclic / event-driven); resource management and concurrency safety; data that
survives resets; startup ordering dependencies.
Start section 1 by explaining what would break in the BMS if this service failed.`;

        case 'ASW':
            return `LAYER FOCUS — ASW:
You are documenting a BMS application software module.
Cover: what BMS feature or protection it implements; physical inputs and what they
mean; decisions made and what triggers them; battery safety implication; state machine
if present with every state and transition.
Start section 1 by explaining the physical scenario this module protects against.
For ContactorControl: explain what a contactor is and what happens if it closes at
the wrong time. The code must make sense after the domain context.`;

        default:
            return `LAYER FOCUS: Document this module completely. Always explain BMS context before code.`;
    }
}

function buildPartC(
    module: ModuleFolder,
    moduleFiles: SourceFile[],
    resolvedIncludes: SourceFile[]
): string {
    const layerFullNames: Record<string, string> = {
        'MCAL': 'Microcontroller Abstraction Layer',
        'CDD': 'Complex Device Drivers',
        'ESAL': 'ECU Software Abstraction Layer',
        'SRVLayer': 'Service Layer',
        'ASW': 'Application Software'
    };
    const layerFullName = layerFullNames[module.layer] ?? module.layer;

    const primaryBlock = moduleFiles.map(f => `=== ${f.relativePath} ===\n${f.content}`).join('\n\n');
    const includesBlock = resolvedIncludes.length > 0
        ? resolvedIncludes.map(f => `=== ${f.relativePath} ===\n${f.content}`).join('\n\n')
        : '';

    return `BMS DOMAIN CONTEXT:
Battery Management System for LFP (Lithium Iron Phosphate) cells.
- 14S pack: 35V min, 51.1V max
- 314Ah capacity, 75A max current
- AFE IC measures cell voltages and temperatures
- SOC = State of Charge (0-100% fullness)
- Contactor = high-current relay connecting/disconnecting the pack
- NVM is critical: SOC must survive power cycles
- CAN bus used for noise immunity in high-current environment

SOFTWARE ARCHITECTURE:
Hardware → MCAL → CDD → ESAL → SRVLayer → ASW

MODULE: ${module.name}
LAYER: ${module.layer} — ${layerFullName}

${getLayerFocus(module.layer)}

SOURCE FILES:
${'='.repeat(60)}
${primaryBlock}
${includesBlock.length > 0 ? `\nCROSS-REFERENCED INCLUDES:\n${'='.repeat(60)}\n${includesBlock}` : ''}
`;
}

// ---------------------------------------------------------------------------
// Part D — 10 section instructions (constant)
// ---------------------------------------------------------------------------

const PART_D = `NOW GENERATE THE DOCUMENTATION.
Every section is mandatory. Do not skip any section. Do not merge sections.
Start immediately with "1. MODULE OVERVIEW" — no preamble.

1. MODULE OVERVIEW
   Write 5 paragraphs:
   P1 — What would go wrong with the battery pack if this module did not exist?
   P2 — What this module is in plain English (no jargon).
   P3 — Where it sits in the stack, what it depends on, what depends on it.
   P4 — A concrete operational example naming actual functions.
   P5 — The single most important design decision in this module.

2. HARDWARE / PERIPHERAL INVOLVED
   ### What hardware does this module interact with?
   Peripheral name, instance, base address if in code, relevant register names.
   ### Register details (for MCAL/CDD modules):
   For each register: what it does in plain English, actual values and why.
   ### If no direct hardware:
   State which lower-layer module provides the hardware interface.

3. CONFIGURATION
   List EVERY #define, constant, enum, and config parameter in the source files.
   | Parameter | Value | Unit | Purpose |
   |-----------|-------|------|---------|
   After the table: explain the 3 most critical parameters in detail.

4. FUNCTION INVENTORY
   Document EVERY function. Group by:
   ### Initialisation Functions
   ### Runtime / Cyclic Functions
   ### Event-Driven Functions
   ### ISR Handlers
   ### Helper / Private Functions
   For each function:
   **FunctionName(params)**
   - Purpose: one plain English sentence
   - When called: what triggers this
   - Parameters: each param, valid range, units
   - Returns: all return values and meaning
   - Side effects: globals written, hardware touched

5. DATA FLOW
   ### Inputs: what data comes in, from where, format
   ### Outputs: what data goes out, to where, format
   ### Internal state: static/global variables, what they store, when updated
   ### Data flow diagram:
   \`\`\`mermaid
   flowchart LR
     A[Source] -->|data| B[ThisModule]
     B -->|data| C[Consumer]
   \`\`\`
   MERMAID RULES: flowchart LR only; node IDs CamelCase no spaces; labels under 20 chars no special chars

6. CROSS-MODULE DEPENDENCIES
   ### Modules this module calls (what functions, why)
   ### Modules that call this module (what functions, what scenario)
   ### Dependency graph:
   \`\`\`mermaid
   graph TD
     THIS[ModuleName]
     DEP[Dependency]
     CLIENT[Client]
     THIS -->|calls| DEP
     CLIENT -->|calls| THIS
   \`\`\`
   MERMAID RULES: graph TD; all node IDs CamelCase no spaces; square brackets only

7. SEQUENCE DIAGRAM
   Write 2 sentences explaining what scenario is shown and why you chose it.
   \`\`\`mermaid
   sequenceDiagram
     participant A as ShortName
     participant B as ShortName
     A->>B: call()
     B-->>A: return
   \`\`\`
   MERMAID RULES: participant aliases one word; ->> for calls -->> for returns; labels under 30 chars
   After diagram: numbered step-by-step walkthrough of every arrow.

8. STATE MACHINE
   If state machine exists: document every state, then:
   \`\`\`mermaid
   stateDiagram-v2
     [*] --> StateName
     StateName --> Other : trigger
   \`\`\`
   MERMAID RULES: state names CamelCase no spaces no parentheses; [*] for init/final only
   If no state machine: write "This module does not implement a state machine." then explain execution model.

9. DESIGN DECISIONS
   Document at least 4 decisions using this format:
   ### Decision: ShortTitle
   **What:** what was decided
   **Why:** why this over alternatives
   **Trade-off:** what this gives up
   **Alternative:** what else could have been done

10. KNOWN ISSUES AND TODOS
    ### Source comments:
    Every TODO, FIXME, HACK, NOTE verbatim. For each: function it appears in, risk of leaving it.
    If none found: "No TODO or FIXME comments found in source files."
    ### Fresher warnings:
    3-5 things a new engineer must know before modifying this module:
    ⚠️ WARNING: [what not to do and why]
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PromptPayload {
    systemPrompt: string;
    userPrompt: string;
    totalChars: number;
}

/**
 * Build the complete prompt payload for a module.
 *
 * @param module     The module folder metadata (name + layer)
 * @param moduleFiles  All .c/.h files read from the module folder
 * @param resolvedIncludes  Additional files resolved from #include chains
 * @param output     VS Code output channel for logging
 */
export function buildPrompt(
    module: ModuleFolder,
    moduleFiles: SourceFile[],
    resolvedIncludes: SourceFile[],
    output: vscode.OutputChannel
): PromptPayload {
    // Build the module files section
    const moduleFilesBlock = moduleFiles.map(sf =>
        `=== ${sf.relativePath} ===\n${sf.content}`
    ).join('\n\n');

    // Build the resolved includes section
    const resolvedBlock = resolvedIncludes.length > 0
        ? resolvedIncludes.map(sf =>
            `=== ${sf.relativePath} ===\n${sf.content}`
          ).join('\n\n')
        : '(none resolved)';

    // Determine BSW/ASW group for the module layer
    const bswLayers = ['MCAL', 'CDD', 'ESAL', 'SRVLayer'];
    const groupLabel = bswLayers.includes(module.layer) ? 'BSW' : 'ASW';

    const dynamicSection = `MODULE BEING DOCUMENTED: ${module.name}
LAYER: ${module.layer} (${groupLabel}) — BSW sub-layers: MCAL / CDD / ESAL / SRVLayer | ASW

FILES IN THIS MODULE:
${moduleFilesBlock}

CROSS-REFERENCED FILES RESOLVED FROM #includes:
${resolvedBlock}`;

    const userPrompt = `${dynamicSection}

---

${OUTPUT_FORMAT}`;

    const totalChars = SYSTEM_CONTEXT.length + userPrompt.length;

    output.appendLine(`[PromptBuilder] Module: ${module.name}`);
    output.appendLine(`[PromptBuilder] Module files: ${moduleFiles.length} (${moduleFiles.reduce((s, f) => s + f.sizeChars, 0).toLocaleString()} chars)`);
    output.appendLine(`[PromptBuilder] Resolved includes: ${resolvedIncludes.length} (${resolvedIncludes.reduce((s, f) => s + f.sizeChars, 0).toLocaleString()} chars)`);
    output.appendLine(`[PromptBuilder] Total prompt length: ${totalChars.toLocaleString()} chars`);

    return {
        systemPrompt: SYSTEM_CONTEXT,
        userPrompt,
        totalChars
    };
}
