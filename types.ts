// Fix: Added all missing type definitions and removed constants.
export type APIProvider = 'gemini' | 'ollama' | 'cohere' | 'mistral' | 'openrouter';

export type HumorStyle = 'none' | 'sarcastic' | 'witty' | 'dry' | 'obscure' | 'dark' | 'silly' | 'corny';
export type Formality = 'casual' | 'informal' | 'formal' | 'academic' | 'stoic' | 'empathic' | 'apathic' | 'hostile';
export type CommunicationStyle = 'direct' | 'eloquent' | 'hesitant';
export type Verbosity = 'minimal' | 'discrete' | 'medium' | 'overwhelming';
export type InterruptTendency = 'never' | 'occasional' | 'frequently';
export type CuriosityLevel = 'Uninterested' | 'Low' | 'Mid' | 'High';
export type PessimismOptimism = 'Pessimist' | 'Neutral' | 'Optimist';
export type SelfCorrectionTendency = 'Never' | 'Occasionally' | 'Often' | 'Always';
export type Temperament = 'Easygoing' | 'Neutral' | 'Calm' | 'Rude' | 'Hateful' | 'Threatening' | 'Impatient';

export interface Persona {
    name: string;
    systemPrompt: string;
    supportingPresetName?: string;
    apiProvider: APIProvider;
    model: string;
    temperature: number;
    agreeableness?: number;
    communicationStyle?: CommunicationStyle;
    verbosity?: Verbosity;
    formality?: Formality;
    humorStyle?: HumorStyle;
    interruptTendency?: InterruptTendency;
    curiosityLevel?: CuriosityLevel;
    pessimismOptimism?: PessimismOptimism;
    selfCorrectionTendency?: SelfCorrectionTendency;
    temperament?: Temperament;
    assertiveness?: number;
    openness?: number;
    conscientiousness?: number;
    voiceURI?: string;
    voicePitch?: number;
    voiceRate?: number;
}

export interface Message {
    id: string;
    author: string;
    text: string;
    isInternalMonologue: boolean;
    isLoading: boolean;
    imageBase64?: string;
    sentiment?: number;
    influenceScore?: number;
    vote?: number; // 1 for upvote, -1 for downvote
}

export interface ConversationBranch {
    id: string;
    name: string;
    messages: Message[];
    parentId: string | null;
    parentBranchId: string | null;
}

export interface ChatMessage {
    role: 'user' | 'model'; // or 'assistant' for some APIs
    content: string;
}

export interface LLMContext {
    longTermMemory: string[];
    constraints?: string;
    emotion?: string;
    conversationType?: string;
    conversationStartTone?: string;
}

export interface LLMResponse {
    text: string;
    internalMonologue: string;
    imageBase64?: string;
    sentiment?: number;
    influenceScore?: number;
}

export interface ApiKeys {
    cohere: string;
    mistral: string;
    openrouter: string;
}

// For Argument Map
export interface ArgumentNode {
    id: string;
    text: string;
    author: string;
    type: 'premise' | 'argument' | 'counter-argument' | 'conclusion';
}

export interface ArgumentEdge {
    source: string;
    target: string;
    type: 'supports' | 'refutes';
}

export interface ArgumentMapData {
    nodes: ArgumentNode[];
    edges: ArgumentEdge[];
}

// For Knowledge Graph
export interface KnowledgeNode {
    id: string; // The concept itself, e.g., "consciousness"
    summary: string;
    group: number; // For coloring/categorization
}

export interface KnowledgeEdge {
    source: string; // ID of source node
    target: string; // ID of target node
    relationship: string;
}

export interface KnowledgeGraphData {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}