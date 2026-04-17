import * as path from 'path'
import { FORMAT_RULES, IDENTITY, BMS_CONTEXT, SECTION_INSTRUCTIONS } from './constants'
import { MCAL_FOCUS }     from './layers/mcal'
import { CDD_FOCUS }      from './layers/cdd'
import { ESAL_FOCUS }     from './layers/esal'
import { SRVLAYER_FOCUS } from './layers/srvlayer'
import { ASW_FOCUS }      from './layers/asw'
import { MODULE_HINTS }   from './moduleHints'
import { CAN_SPECS }         from './specs/canSpecs'
import { PROTECTION_SPECS }  from './specs/protectionSpecs'
import { NVM_SPECS }         from './specs/nvmSpecs'
import { SourceFile }     from '../fileReader'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BundledContext {
    primaryFiles: SourceFile[]
    resolvedIncludes: SourceFile[]
    truncated: boolean
}

export interface PromptInput {
    moduleName: string
    layerName: string
    bundle: BundledContext
}

export interface PromptChunk {
    prompt: string
    chunkIndex: number
    totalChunks: number
    isFirstChunk: boolean
    isLastChunk: boolean
}

// ---------------------------------------------------------------------------
// Spec selector — Amendment 3
// ---------------------------------------------------------------------------

const CAN_MODULES        = new Set(['CAN', 'CANIF', 'CANAppl', 'CAN_NM'])
const PROTECTION_MODULES = new Set(['BatProtection', 'BattStateMachine', 'CriticalFaultControl', 'Safety_Appl'])
const NVM_MODULES        = new Set(['NVM', 'BatteryEstimation', 'BootManagerSw'])

function getModuleSpecs(moduleName: string): string {
    if (CAN_MODULES.has(moduleName) && CAN_SPECS) {
        return BMS_CONTEXT + '\n\nMODULE-SPECIFIC SPECS:\n' + CAN_SPECS
    }
    if (PROTECTION_MODULES.has(moduleName) && PROTECTION_SPECS) {
        return BMS_CONTEXT + '\n\nMODULE-SPECIFIC SPECS:\n' + PROTECTION_SPECS
    }
    if (NVM_MODULES.has(moduleName) && NVM_SPECS) {
        return BMS_CONTEXT + '\n\nMODULE-SPECIFIC SPECS:\n' + NVM_SPECS
    }
    return BMS_CONTEXT
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLayerFocus(layerName: string): string {
    switch (layerName) {
        case 'MCAL':     return MCAL_FOCUS
        case 'CDD':      return CDD_FOCUS
        case 'ESAL':     return ESAL_FOCUS
        case 'SRVLayer': return SRVLAYER_FOCUS
        case 'ASW':      return ASW_FOCUS
        default:         return ''
    }
}

function getLayerFullName(layerName: string): string {
    const names: Record<string, string> = {
        'MCAL':     'Microcontroller Abstraction Layer',
        'CDD':      'Complex Device Drivers',
        'ESAL':     'ECU Software Abstraction Layer',
        'SRVLayer': 'Service Layer',
        'ASW':      'Application Software'
    }
    return names[layerName] ?? layerName
}

function buildFileContext(bundle: BundledContext): string {
    let ctx = '\nSOURCE FILES TO ANALYSE:\n'
    ctx += '='.repeat(50) + '\n\n'

    for (const f of bundle.primaryFiles) {
        ctx += `=== ${f.relativePath} (primary — this module) ===\n`
        ctx += f.content + '\n\n'
    }

    if (bundle.resolvedIncludes.length > 0) {
        ctx += '\nCROSS-REFERENCED FILES (from #includes):\n'
        ctx += '='.repeat(50) + '\n\n'
        for (const f of bundle.resolvedIncludes) {
            ctx += `=== ${f.relativePath} (from ${path.dirname(f.relativePath)}) ===\n`
            ctx += f.content + '\n\n'
        }
    }

    if (bundle.truncated) {
        ctx += '\n[Some files omitted — context limit reached. '
        ctx += 'Document based on what is shown above.]\n'
    }

    return ctx
}

function chunkPrompt(
    header: string,
    fileContext: string,
    footer: string,
    chunkLimit: number
): PromptChunk[] {

    const total = header + fileContext + footer

    if (total.length <= chunkLimit) {
        return [{
            prompt: total,
            chunkIndex: 0,
            totalChunks: 1,
            isFirstChunk: true,
            isLastChunk: true
        }]
    }

    const available = chunkLimit - header.length - footer.length
    const lines = fileContext.split('\n')
    const chunks: string[] = []
    let current = ''

    for (const line of lines) {
        if (
            line.startsWith('===') &&
            current.length + line.length > available &&
            current.length > 0
        ) {
            chunks.push(current)
            current = line + '\n'
        } else {
            current += line + '\n'
        }
    }
    if (current.trim()) { chunks.push(current) }

    return chunks.map((c, i) => ({
        prompt: header + c + footer,
        chunkIndex: i,
        totalChunks: chunks.length,
        isFirstChunk: i === 0,
        isLastChunk: i === chunks.length - 1
    }))
}

// ---------------------------------------------------------------------------
// Hint validation — Step 9
// ---------------------------------------------------------------------------

function validateHint(moduleName: string): void {
    const hint = MODULE_HINTS[moduleName]
    if (!hint || hint === 'INSERT_HINT_HERE') {
        console.warn(
            `[BMS DocGen] No hint for module: ${moduleName}. ` +
            `Doc quality will be lower. ` +
            `Fill in moduleHints.ts to improve output.`
        )
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildPrompt(input: PromptInput): PromptChunk[] {
    const { moduleName, layerName, bundle } = input
    const layerFullName = getLayerFullName(layerName)
    const layerFocus    = getLayerFocus(layerName)
    const moduleHint    = MODULE_HINTS[moduleName] ?? ''
    const moduleSpecs   = getModuleSpecs(moduleName)

    validateHint(moduleName)

    const header =
        FORMAT_RULES +
        '\n\n' +
        IDENTITY +
        '\n\n' +
        moduleSpecs +
        '\n\n' +
        `MODULE BEING DOCUMENTED: ${moduleName}\n` +
        `LAYER: ${layerName} — ${layerFullName}\n` +
        (moduleHint && moduleHint !== 'INSERT_HINT_HERE'
            ? `\nMODULE CONTEXT:\n${moduleHint}\n`
            : '') +
        '\n\n' +
        layerFocus +
        '\n\n'

    const fileContext = buildFileContext(bundle)
    const footer = '\n\n' + SECTION_INSTRUCTIONS

    const CHUNK_LIMIT = 14_000

    return chunkPrompt(header, fileContext, footer, CHUNK_LIMIT)
}
