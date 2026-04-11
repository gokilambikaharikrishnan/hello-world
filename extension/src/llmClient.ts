import * as vscode from 'vscode';
import { PromptPayload } from './promptBuilder';

/**
 * Callback invoked with each streaming token from the LLM.
 */
export type TokenCallback = (token: string) => void;

/**
 * Select the best available Copilot model (gpt-4o preferred, fallback to any copilot model).
 */
async function selectModel(output: vscode.OutputChannel): Promise<vscode.LanguageModelChat> {
    output.appendLine('[LLMClient] Selecting language model...');

    // First try: exact family gpt-4o from copilot vendor
    let models = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });

    if (models.length > 0) {
        output.appendLine(`[LLMClient] Selected model: ${models[0].id} (${models[0].name})`);
        return models[0];
    }

    output.appendLine('[LLMClient] gpt-4o not available, trying any copilot model...');

    // Fallback: any copilot model
    models = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    if (models.length > 0) {
        output.appendLine(`[LLMClient] Fallback model selected: ${models[0].id} (${models[0].name})`);
        return models[0];
    }

    throw new Error(
        'No GitHub Copilot language models available. ' +
        'Please ensure GitHub Copilot Chat extension is installed and you are signed in.'
    );
}

/**
 * Call the vscode.lm API with the prompt, streaming tokens to the callback.
 * Returns the full assembled response string.
 */
export async function generateDocumentation(
    payload: PromptPayload,
    onToken: TokenCallback,
    output: vscode.OutputChannel,
    cancellationToken?: vscode.CancellationToken
): Promise<string> {
    const model = await selectModel(output);

    const messages: vscode.LanguageModelChatMessage[] = [
        vscode.LanguageModelChatMessage.User(payload.systemPrompt + '\n\n' + payload.userPrompt)
    ];

    output.appendLine(`[LLMClient] Sending prompt (${payload.totalChars.toLocaleString()} chars) to ${model.id}`);
    output.appendLine('[LLMClient] Streaming response...');

    let response: vscode.LanguageModelChatResponse;
    try {
        response = await model.sendRequest(
            messages,
            {},
            cancellationToken ?? new vscode.CancellationTokenSource().token
        );
    } catch (err) {
        const errMsg = String(err);

        if (errMsg.includes('model_not_found') || errMsg.includes('not supported')) {
            throw new Error(`Model not available: ${errMsg}`);
        }
        if (errMsg.includes('not signed in') || errMsg.includes('unauthorized') || errMsg.includes('401')) {
            throw new Error('GitHub Copilot: not signed in. Please sign in to GitHub Copilot in VS Code.');
        }
        if (errMsg.includes('rate limit') || errMsg.includes('429')) {
            throw new Error('GitHub Copilot: rate limit reached. Please wait a moment and try again.');
        }

        throw new Error(`LLM request failed: ${errMsg}`);
    }

    // Stream tokens
    const chunks: string[] = [];
    try {
        for await (const chunk of response.text) {
            chunks.push(chunk);
            onToken(chunk);
        }
    } catch (err) {
        if (String(err).includes('Canceled')) {
            output.appendLine('[LLMClient] Generation cancelled by user');
            throw new Error('Generation cancelled');
        }
        throw err;
    }

    const fullText = chunks.join('');
    output.appendLine(`[LLMClient] Response complete: ${fullText.length.toLocaleString()} chars`);
    return fullText;
}
