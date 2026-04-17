/**
 * Compatibility shim — keeps extension.ts unchanged.
 * Delegates to the new prompts/index.ts system.
 */
import * as vscode from 'vscode'
import { SourceFile } from './fileReader'
import { ModuleFolder } from './folderScanner'
import { buildPrompt as newBuildPrompt, BundledContext } from './prompts/index'

export interface PromptPayload {
    systemPrompt: string
    userPrompt: string
    totalChars: number
}

export function buildPrompt(
    module: ModuleFolder,
    moduleFiles: SourceFile[],
    resolvedIncludes: SourceFile[],
    output: vscode.OutputChannel
): PromptPayload {
    const bundle: BundledContext = {
        primaryFiles: moduleFiles,
        resolvedIncludes,
        truncated: false
    }

    const chunks = newBuildPrompt({
        moduleName: module.name,
        layerName:  module.layer,
        bundle
    })

    // Use first chunk — covers all modules within context budget.
    // Multi-chunk support (large modules) is a future enhancement.
    const userPrompt = chunks[0]?.prompt ?? ''

    output.appendLine(`[PromptBuilder] Module: ${module.name}  layer: ${module.layer}`)
    output.appendLine(`[PromptBuilder] Chunks: ${chunks.length}  (using chunk 1)`)
    output.appendLine(`[PromptBuilder] Prompt length: ${userPrompt.length.toLocaleString()} chars`)

    return {
        systemPrompt: '',
        userPrompt,
        totalChars: userPrompt.length
    }
}
