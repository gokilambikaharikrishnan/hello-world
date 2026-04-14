import { SourceFile } from './fileReader';
import { ModuleFolder } from './folderScanner';
import * as vscode from 'vscode';

// ---------------------------------------------------------------------------
// Prompt sections — kept as named constants for clarity and future editing
// ---------------------------------------------------------------------------

const SYSTEM_CONTEXT = `You are a senior embedded firmware engineer documenting a Battery Management System
(BMS) codebase for LFP batteries used in UPS and ESS applications.

Project context:
- Target MCU: STM32, bare metal drivers written in C
- Battery pack: 14S LFP prismatic cells, 314Ah capacity, max 75A, max 50V
- AFE communicates over SPI; pack data reported over CAN bus
- Standards in scope: IEC 62133, IEC 61960, UL 1973, UN 38.3

Software architecture (bottom to top):
- BSW — Basic Software (everything below the application layer):
    - MCAL  (Microcontroller Abstraction Layer): bare metal STM32 peripheral drivers
    - CDD   (Complex Device Drivers): external IC drivers e.g. AFE, SerialFlash
    - ESAL  (ECU Software Abstraction Layer): interface/abstraction between BSW and ASW
    - SRVLayer (Service Layer): cross-cutting services — NVM, Scheduler, Diagnostics, CAN NM
- ASW — Application Software: BMS logic, SOC estimation, protection, state machines

Your documentation will be read by a new firmware engineer joining the team.
Be specific, be technical, never hallucinate. Only document what you can see in the code.
If you infer something that isn't explicitly stated, say "inferred from code."`;

const OUTPUT_FORMAT = `Generate a complete engineering design document with exactly these sections:

1. MODULE OVERVIEW
   - What this module is, what problem it solves, why it exists in this BMS

2. HARDWARE / PERIPHERAL INVOLVED
   - What physical hardware or peripheral this module talks to
   - Relevant register names, peripheral base addresses if visible in code

3. CONFIGURATION
   - All #defines, constants, baud rates, buffer sizes, interrupt settings
   - Pull exact values from the code, do not guess

4. FUNCTION INVENTORY
   - Every function: signature, purpose, parameters, return value, side effects
   - Group by: init functions / runtime functions / ISRs / helper functions

5. DATA FLOW
   - What data enters this module, from where, in what format
   - What data leaves this module, to where, in what format
   - Any queues, buffers, or shared memory involved

6. CROSS-MODULE DEPENDENCIES
   - What other modules does this one call?
   - What other modules call into this one?
   - Draw this as a Mermaid graph diagram

7. SEQUENCE / FLOW DIAGRAM
   - The key operational sequence (e.g. CAN message receive flow, init sequence)
   - Render as a Mermaid sequenceDiagram or flowchart

8. STATE MACHINE (if applicable)
   - If this module has states or modes, document them
   - Render as a Mermaid stateDiagram-v2

9. DESIGN DECISIONS
   - Why is it designed this way? (infer from code if not commented)
   - Any notable trade-offs visible in the implementation

10. KNOWN ISSUES / TODOs
    - Extract all TODO, FIXME, HACK, NOTE comments verbatim

All Mermaid diagrams must be in fenced code blocks with \`\`\`mermaid syntax.
Do not wrap the entire response in markdown. Output clean structured text with
clear section headers. This will be rendered directly into an HTML document.`;

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
