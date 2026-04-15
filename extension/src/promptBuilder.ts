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
