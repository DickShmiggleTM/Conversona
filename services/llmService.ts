// Fix: Created content for services/llmService.ts to act as a dispatcher.
import { Persona, ChatMessage, LLMResponse, LLMContext, Message, ArgumentMapData, ApiKeys } from '../types';
import { getGeminiResponse, getArgumentMap } from './geminiService';
import { getOllamaResponse } from './ollamaService';
import { getCohereResponse } from './cohereService';
import { getMistralResponse } from './mistralService';
import { getOpenRouterResponse } from './openrouterService';


export const getLLMResponse = (
    persona: Persona,
    history: ChatMessage[],
    prompt: string,
    context: LLMContext,
    apiKeys: ApiKeys,
): Promise<LLMResponse> => {
    switch (persona.apiProvider) {
        case 'gemini':
            return getGeminiResponse(persona, history, prompt, context);
        case 'ollama':
            return getOllamaResponse(persona, history, prompt, context);
        case 'cohere':
             if (!apiKeys.cohere) return Promise.resolve({ text: "ERROR: Cohere API key is not set. Please configure it in the API Keys panel.", internalMonologue: "API key missing." });
            return getCohereResponse(persona, history, prompt, context, apiKeys.cohere);
        case 'mistral':
            if (!apiKeys.mistral) return Promise.resolve({ text: "ERROR: Mistral API key is not set. Please configure it in the API Keys panel.", internalMonologue: "API key missing." });
            return getMistralResponse(persona, history, prompt, context, apiKeys.mistral);
        case 'openrouter':
            if (!apiKeys.openrouter) return Promise.resolve({ text: "ERROR: OpenRouter API key is not set. Please configure it in the API Keys panel.", internalMonologue: "API key missing." });
            return getOpenRouterResponse(persona, history, prompt, context, apiKeys.openrouter);
        default:
            return Promise.reject(new Error(`Unsupported API provider: ${persona.apiProvider}`));
    }
};

export const generateArgumentMap = (messages: Message[], p1Name: string, p2Name: string): Promise<ArgumentMapData> => {
    // For now, only Gemini supports the structured output required for argument mapping.
    // In the future, this could route to other providers if they gain similar capabilities.
    return getArgumentMap(messages, p1Name, p2Name);
};