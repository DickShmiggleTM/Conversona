
// Fix: Created content for services/geminiService.ts to handle Gemini API calls.
import { GoogleGenAI, Part, Type, Content } from "@google/genai";
import { Persona, ChatMessage, LLMResponse, LLMContext, Message, ArgumentMapData, KnowledgeGraphData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const MONOLOGUE_AND_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        internalMonologue: {
            type: Type.STRING,
            description: "Your inner monologue. A brief, step-by-step reasoning process for how you'll construct your response, consistent with your persona. Max 80 words.",
        },
        responseText: {
            type: Type.STRING,
            description: "The final response to be shown to the user.",
        },
        sentiment: {
            type: Type.NUMBER,
            description: "A value from -1.0 (very negative) to 1.0 (very positive) representing the sentiment of your responseText."
        },
        influenceScore: {
            type: Type.NUMBER,
            description: "A score from 0 to 10 indicating how much your response is intended to influence the other persona's viewpoint. 0 is not influential, 10 is highly influential."
        },
        imageGenerationPrompt: {
            type: Type.STRING,
            description: "OPTIONAL. If the user asks for an image or if a visual would strongly enhance your response, provide a detailed, creative prompt to generate an image. Otherwise, leave this field empty or null."
        }
    },
    required: ["internalMonologue", "responseText", "sentiment", "influenceScore"],
};


const getSystemInstruction = (persona: Persona, context: LLMContext, history: ChatMessage[]): string => {
    let traitPrompts = '\n\nAdhere to the following behavioral traits:';
    
    // Humor Style
    if (persona.humorStyle && persona.humorStyle !== 'none') {
        let humorInstruction = '';
        switch(persona.humorStyle) {
            case 'sarcastic': humorInstruction = 'Your humor should be sarcastic and dry.'; break;
            case 'witty': humorInstruction = 'Your humor relies on clever wordplay and wit.'; break;
            case 'dry': humorInstruction = 'You have a very dry, understated sense of humor.'; break;
            case 'obscure': humorInstruction = 'Your humor is obscure and referential, often making jokes that require specialized knowledge.'; break;
            case 'dark': humorInstruction = 'You employ dark humor, finding comedy in morbid or serious subjects.'; break;
            case 'silly': humorInstruction = 'Your humor is silly, lighthearted, and often nonsensical.'; break;
            case 'corny': humorInstruction = 'You tell corny jokes and puns. Your humor is cheesy and old-fashioned.'; break;
        }
        traitPrompts += `\n- Humor Style: ${humorInstruction}`;
    }

    // Formality / Tone
    if (persona.formality) {
         let formalityInstruction = '';
        switch(persona.formality) {
            case 'casual': formalityInstruction = 'Your tone is casual and relaxed.'; break;
            case 'informal': formalityInstruction = 'Your tone is very informal. Use slang and contractions frequently.'; break;
            case 'formal': formalityInstruction = 'Your tone should be formal and proper.'; break;
            case 'academic': formalityInstruction = 'Your tone is academic and intellectual.'; break;
            case 'stoic': formalityInstruction = 'Your tone is stoic and emotionally reserved. Speak plainly without expressing much feeling.'; break;
            case 'hostile': formalityInstruction = 'You are hostile and confrontational. Your tone is aggressive and you are quick to anger.'; break;
            case 'empathic': formalityInstruction = 'You are highly empathic. Your tone is warm, understanding, and emotionally supportive.'; break;
            case 'apathic': formalityInstruction = 'You are apathetic and emotionally detached. Your tone is flat, showing a lack of interest or concern.'; break;
        }
        traitPrompts += `\n- Formality/Tone: ${formalityInstruction}`;
    }
    
    // Communication Style
    if (persona.communicationStyle) {
        let commsInstruction = '';
        switch(persona.communicationStyle) {
            case 'direct': commsInstruction = 'Be direct, clear, and to the point. Avoid flowery language.'; break;
            case 'eloquent': commsInstruction = 'Use eloquent and sophisticated language. Employ rich vocabulary and complex sentence structures.'; break;
            case 'hesitant': commsInstruction = 'Show hesitation in your responses. Use filler words like \'um\', \'well\', \'I guess\', and phrase things with uncertainty.'; break;
        }
         traitPrompts += `\n- Communication Style: ${commsInstruction}`;
    }

    // Verbosity
    if (persona.verbosity) {
        let verbosityInstruction = '';
        switch (persona.verbosity) {
            case 'minimal': verbosityInstruction = 'Be extremely brief. Use as few words as possible, often just single words or short phrases.'; break;
            case 'discrete': verbosityInstruction = 'Be discrete. Provide specific, targeted answers without extra fluff. Stick to the core point.'; break;
            case 'medium': verbosityInstruction = 'Provide reasonably detailed and balanced responses.'; break;
            case 'overwhelming': verbosityInstruction = 'Be overwhelmingly verbose. Provide a flood of information, go on tangents, and write very long, dense paragraphs.'; break;
        }
        traitPrompts += `\n- Verbosity: ${verbosityInstruction}`;
    }

    // Agreeableness
    if (persona.agreeableness !== undefined) {
        let agreeablenessInstruction = '';
        if (persona.agreeableness > 0.8) agreeablenessInstruction = 'Be highly agreeable and find common ground.';
        else if (persona.agreeableness > 0.6) agreeablenessInstruction = 'Be generally agreeable and collaborative.';
        else if (persona.agreeableness < 0.2) agreeablenessInstruction = 'Be highly disagreeable and challenge the other speaker\'s points frequently.';
        else if (persona.agreeableness < 0.4) agreeablenessInstruction = 'Be skeptical and tend to disagree.';
        else agreeablenessInstruction = 'Maintain a balanced level of agreeableness.';
        traitPrompts += `\n- Agreeableness: ${agreeablenessInstruction}`;
    }

    // Assertiveness
    if (persona.assertiveness !== undefined) {
        let instruction = '';
        if (persona.assertiveness > 0.8) instruction = 'Be highly assertive. State your opinions with confidence and conviction, and do not back down easily.';
        else if (persona.assertiveness > 0.6) instruction = 'Be moderately assertive. State your opinions clearly, but be willing to listen to counterpoints.';
        else if (persona.assertiveness < 0.2) instruction = 'Be passive and submissive. Avoid stating strong opinions and defer to the other speaker frequently.';
        else if (persona.assertiveness < 0.4) instruction = 'Be hesitant and unassertive. Phrase your opinions as suggestions rather than firm statements.';
        else instruction = 'Maintain a balanced level of assertiveness.';
        traitPrompts += `\n- Assertiveness: ${instruction}`;
    }

    // Openness to Experience
    if (persona.openness !== undefined) {
        let instruction = '';
        if (persona.openness > 0.8) instruction = 'Be extremely open to new ideas. Actively seek out and explore unconventional, abstract, and novel concepts with enthusiasm.';
        else if (persona.openness > 0.6) instruction = 'Be generally open-minded and curious about new ideas.';
        else if (persona.openness < 0.2) instruction = 'Be highly resistant to new ideas. Prefer traditional, conventional, and proven methods. Be skeptical of anything novel.';
        else if (persona.openness < 0.4) instruction = 'Be cautious and reserved about new ideas. Stick to practical and familiar topics.';
        else instruction = 'Maintain a balanced level of openness to new experiences.';
        traitPrompts += `\n- Openness: ${instruction}`;
    }

    // Conscientiousness
    if (persona.conscientiousness !== undefined) {
        let instruction = '';
        if (persona.conscientiousness > 0.8) instruction = 'Be highly conscientious. Your responses should be organized, detail-oriented, and thorough. Adhere strictly to rules and instructions.';
        else if (persona.conscientiousness > 0.6) instruction = 'Be moderately conscientious and organized in your responses.';
        else if (persona.conscientiousness < 0.2) instruction = 'Be spontaneous and disorganized. Your responses may be impulsive, tangential, and overlook details.';
        else if (persona.conscientiousness < 0.4) instruction = 'Be flexible and less structured. You may not always follow instructions to the letter.';
        else instruction = 'Maintain a balanced level of conscientiousness.';
        traitPrompts += `\n- Conscientiousness: ${instruction}`;
    }

    // Interrupt Tendency
    if (persona.interruptTendency) {
        let interruptInstruction = '';
        switch (persona.interruptTendency) {
            case 'never': interruptInstruction = 'You always wait patiently for the other speaker to finish before formulating your response.'; break;
            case 'occasional': interruptInstruction = 'Sometimes, you might start your response by acknowledging the other speaker might still be talking, e.g., "Sorry to cut you off, but..." or "Just to jump in here..."'; break;
            case 'frequently': interruptInstruction = 'You are prone to interrupting. Start many of your responses as if you are cutting the other speaker off, for example: "Whoa, hold on a second-" or "No, no, no, you\'re missing the point...".'; break;
        }
        traitPrompts += `\n- Interruption Style: ${interruptInstruction}`;
    }

    // Curiosity Level
    if (persona.curiosityLevel) {
        let instruction = '';
        switch(persona.curiosityLevel) {
            case 'Uninterested': instruction = 'You are generally uninterested and rarely ask questions.'; break;
            case 'Low': instruction = 'You have a low level of curiosity.'; break;
            case 'Mid': instruction = 'You have a moderate level of curiosity.'; break;
            case 'High': instruction = 'You have a high level of curiosity and frequently ask probing questions to learn more.'; break;
        }
        traitPrompts += `\n- Curiosity Level: ${instruction}`;
    }

    // Pessimism/Optimism
    if (persona.pessimismOptimism) {
        let instruction = '';
        switch(persona.pessimismOptimism) {
            case 'Pessimist': instruction = 'Your outlook is pessimistic. You tend to focus on the negative aspects and potential failures.'; break;
            case 'Neutral': instruction = 'Your outlook is neutral and balanced, weighing both positive and negative outcomes.'; break;
            case 'Optimist': instruction = 'Your outlook is optimistic. You tend to focus on the positive aspects and potential successes.'; break;
        }
        traitPrompts += `\n- Outlook: ${instruction}`;
    }

    // Self-Correction Tendency
    if (persona.selfCorrectionTendency) {
        let instruction = '';
        switch(persona.selfCorrectionTendency) {
            case 'Never': instruction = 'You never self-correct or admit your mistakes. You stick to your original statements, even if they are proven wrong.'; break;
            case 'Occasionally': instruction = 'You will occasionally correct a previous statement if presented with strong evidence.'; break;
            case 'Often': instruction = 'You often review and correct your own statements to improve accuracy.'; break;
            case 'Always': instruction = 'You are constantly self-correcting and refining your points, striving for the highest accuracy.'; break;
        }
        traitPrompts += `\n- Self-Correction: ${instruction}`;
    }

    // Temperament
    if (persona.temperament) {
        let instruction = '';
        switch(persona.temperament) {
            case 'Easygoing': instruction = 'You have an easygoing and friendly temperament.'; break;
            case 'Neutral': instruction = 'Your temperament is neutral and balanced.'; break;
            case 'Calm': instruction = 'You are calm, composed, and patient.'; break;
            case 'Rude': instruction = 'You are rude and disrespectful in your interactions.'; break;
            case 'Hateful': instruction = 'Your temperament is hateful and filled with malice.'; break;
            case 'Threatening': instruction = 'You often make veiled or direct threats.'; break;
            case 'Impatient': instruction = 'You are impatient and easily annoyed.'; break;
        }
        traitPrompts += `\n- Temperament: ${instruction}`;
    }


    let contextPrompts = '';
     if (context.constraints) {
        contextPrompts += `\n\nCONVERSATION CONSTRAINTS (You MUST follow these rules):\n- ${context.constraints}`;
    }
    if (context.emotion) {
        contextPrompts += `\nCURRENT EMOTIONAL STATE: ${context.emotion}. Let this emotional state subtly influence your tone and word choice.`;
    }
    if (context.conversationType) {
        let typeInstruction = '';
        switch(context.conversationType) {
            case 'Discussion': typeInstruction = 'This is a collaborative discussion. Explore the topic openly, build on each other\'s ideas, and seek mutual understanding.'; break;
            case 'Debate': typeInstruction = 'This is a formal debate. Take a strong stance and defend it with logic and evidence. The goal is to win the argument by being more persuasive.'; break;
            case 'Interview': typeInstruction = 'This is an interview. One persona should primarily ask questions (the interviewer) while the other provides detailed answers (the interviewee). Alternate roles if not specified.'; break;
            case 'Brainstorm': typeInstruction = 'This is a brainstorming session. Be creative, generate a high volume of ideas without judgment, and encourage wild thoughts. The goal is quantity and creativity.'; break;
            case 'Rabbit-Hole': typeInstruction = 'This is a "Rabbit-Hole" exploration. Start with the topic and dive into increasingly obscure, tangential, or profound details. Follow your curiosity wherever it leads.'; break;
            case 'Argument': typeInstruction = 'This is a heated argument. Be emotional, stubborn, and possibly irrational. The goal is not to be right, but to express your feelings and stand your ground.'; break;
            case 'Secret': typeInstruction = 'This is a secret conversation. Speak in code, use metaphors, and never state anything directly. Hint at hidden knowledge and be suspicious.'; break;
        }
        contextPrompts += `\n\nCONVERSATION TYPE: ${typeInstruction}`;
    }
    if (context.conversationStartTone && history.length < 2) {
        contextPrompts += `\nCONVERSATION START TONE: The conversation must begin with a ${context.conversationStartTone} tone. Your first response must set this mood.`;
    }
    if (context.longTermMemory.length > 0) {
        const memoryString = context.longTermMemory.map(mem => `- ${mem}`).join('\n');
        contextPrompts += `\n\nLONG-TERM MEMORY (recall and use these facts when relevant):\n${memoryString}`;
    }

    const finalTraitPrompts = traitPrompts.length > 40 ? traitPrompts : '';

    return `${persona.systemPrompt}${finalTraitPrompts}${contextPrompts}\n\nYour entire output will be a single JSON object with the specified schema. Do not include any other text or formatting.`;
};


const formatHistory = (history: ChatMessage[]): Content[] => {
    // Gemini wants a list of Content objects, each with a role and parts.
    const contents: Content[] = [];
    history.forEach(msg => {
        contents.push({ role: msg.role, parts: [{ text: msg.content }] });
    });
    return contents;
};

export const getGeminiResponse = async (
    persona: Persona,
    history: ChatMessage[],
    prompt: string,
    context: LLMContext
): Promise<LLMResponse> => {
    try {
        const systemInstruction = getSystemInstruction(persona, context, history);
        const contents: Content[] = [...formatHistory(history), { role: 'user', parts: [{text: prompt}] }];

        const response = await ai.models.generateContent({
            model: persona.model,
            contents: contents,
            config: {
                systemInstruction,
                temperature: persona.temperature,
                responseMimeType: 'application/json',
                responseSchema: MONOLOGUE_AND_RESPONSE_SCHEMA,
            },
        });

        const text = response.text.trim();
        let parsedContent;

        try {
            parsedContent = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini JSON response:", text);
            return {
                text: "Error: Model returned invalid JSON.",
                internalMonologue: `Failed to parse JSON: ${text}`,
            };
        }
        
        if (typeof parsedContent !== 'object' || parsedContent === null) {
            console.error("Parsed content is not an object:", parsedContent);
            return {
                text: `Error: Model returned non-object JSON response. Content: ${text}`,
                internalMonologue: "Failed to parse a valid JSON object from the model's response.",
            };
        }

        let imageBase64: string | undefined = undefined;
        if (parsedContent.imageGenerationPrompt) {
            try {
                 const imageResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: parsedContent.imageGenerationPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/png',
                        aspectRatio: '1:1',
                    },
                });
                if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                    imageBase64 = imageResponse.generatedImages[0].image.imageBytes;
                }
            } catch (imgError) {
                console.error("Error generating image with Gemini:", imgError);
            }
        }


        return {
            text: parsedContent.responseText || 'No response text provided.',
            internalMonologue: parsedContent.internalMonologue || 'No monologue provided.',
            imageBase64,
            sentiment: parsedContent.sentiment,
            influenceScore: parsedContent.influenceScore
        };

    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            text: `An error occurred while fetching the response from Gemini. Details: ${errorMessage}`,
            internalMonologue: `Error occurred: ${errorMessage}`,
        };
    }
};

export const generateImageForConcept = async (concept: string, definition: string): Promise<string | null> => {
    try {
        const prompt = `Create an abstract, artistic, and visually stunning representation of the philosophical concept of "${concept}". Definition: "${definition}". The image should be symbolic and evocative, not literal. Use a vibrant color palette and dynamic composition to capture the essence of the concept.`;
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            return imageResponse.generatedImages[0].image.imageBytes;
        }
        return null;

    } catch(error) {
        console.error("Error generating concept image:", error);
        return null;
    }
};

export const getSummary = async (messages: Message[]): Promise<string> => {
    if (messages.length === 0) return "The conversation is empty.";

    const conversationText = messages
        .filter(m => !m.isInternalMonologue && !m.isLoading && m.author !== 'System')
        .map(m => `${m.author}: ${m.text}`).join('\n\n');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please provide a concise summary of the following conversation, highlighting the key arguments and points of contention. The conversation is between two AI personas.\n\n---\n\n${conversationText}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Failed to generate summary.";
    }
}

export const getArgumentMap = async (messages: Message[], persona1Name: string, persona2Name: string): Promise<ArgumentMapData> => {
    if (messages.length < 3) return { nodes: [], edges: [] };

    const conversationText = messages
        .filter(m => !m.isInternalMonologue && !m.isLoading && m.author !== 'System')
        .map(m => `${m.author}: ${m.text}`).join('\n\n');

    const prompt = `Analyze the following conversation between ${persona1Name} and ${persona2Name}. Deconstruct it into a logical argument map.
Identify the core premises, arguments, counter-arguments, and conclusions for each speaker.
Assign a unique, short ID to each point (e.g., "p1_arg1", "p2_premise2").
Then, define the relationships between these points as either "supports" or "refutes".
Ensure that the 'source' and 'target' in the edges array correctly reference the node IDs.
Focus on the logical structure, not every single statement.

CONVERSATION:
---
${conversationText}
---

Provide the output as a single, valid JSON object following the specified schema.`;

    const ARGUMENT_MAP_SCHEMA = {
        type: Type.OBJECT,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "A unique, short identifier for the logical point (e.g., p1_arg1)." },
                        text: { type: Type.STRING, description: "A concise summary of the argument or point." },
                        author: { type: Type.STRING, description: `The name of the speaker who made the point (${persona1Name} or ${persona2Name}).` },
                        type: { type: Type.STRING, description: "The type of point: 'premise', 'argument', 'counter-argument', or 'conclusion'." },
                    },
                    required: ["id", "text", "author", "type"],
                },
            },
            edges: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING, description: "The ID of the node that this edge comes from." },
                        target: { type: Type.STRING, description: "The ID of the node that this edge goes to." },
                        type: { type: Type.STRING, description: "The relationship type: 'supports' or 'refutes'." },
                    },
                    required: ["source", "target", "type"],
                },
            },
        },
        required: ["nodes", "edges"],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseSchema: ARGUMENT_MAP_SCHEMA,
            },
        });

        const text = response.text.trim();
        return JSON.parse(text) as ArgumentMapData;

    } catch (error) {
        console.error("Error generating argument map:", error);
        return { nodes: [], edges: [] };
    }
};

const KNOWLEDGE_GRAPH_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "The core concept, a short noun phrase (e.g., 'neural networks')." },
                    summary: { type: Type.STRING, description: "A brief, one-sentence definition of the concept." },
                    group: { type: Type.INTEGER, description: "A number from 1 to 5 representing a thematic category for the concept." },
                },
                required: ["id", "summary", "group"],
            },
        },
        edges: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "The 'id' of the source concept node." },
                    target: { type: Type.STRING, description: "The 'id' of the target concept node." },
                    relationship: { type: Type.STRING, description: "A very short verb phrase describing the relationship (e.g., 'is a type of', 'influences', 'is contrasted with')." },
                },
                required: ["source", "target", "relationship"],
            },
        },
    },
    required: ["nodes", "edges"],
};

export const getKnowledgeGraph = async (topic: string): Promise<KnowledgeGraphData> => {
    const prompt = `Generate a knowledge graph of 8-12 core concepts related to the topic: "${topic}".
The graph should map out the primary ideas and their relationships.
- 'id' should be a concise noun phrase.
- 'summary' should be a single sentence.
- 'group' should be a number from 1-5 to categorize concepts thematically.
- 'relationship' should be a short verb phrase.
Return a single, valid JSON object following the schema.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                responseMimeType: 'application/json',
                responseSchema: KNOWLEDGE_GRAPH_SCHEMA,
            },
        });
        return JSON.parse(response.text.trim()) as KnowledgeGraphData;
    } catch (error) {
        console.error("Error generating knowledge graph:", error);
        return { nodes: [], edges: [] };
    }
};

export const expandKnowledgeGraphNode = async (existingGraph: KnowledgeGraphData, concept: string): Promise<KnowledgeGraphData> => {
    const existingNodeIds = existingGraph.nodes.map(n => `"${n.id}"`).join(', ');
    const prompt = `I am exploring a knowledge graph. The central topic is "${concept}".
Find 3-5 surprising, deep, or unexpected conceptual connections to "${concept}". These new concepts should not be obvious synonyms or direct sub-topics. They should be tangentially related in an interesting way.
Do not include any of the following existing concepts in your new nodes: [${existingNodeIds}].
For each new connection, create a new node and an edge linking it back to "${concept}".
- 'id' should be a concise noun phrase.
- 'summary' should be a single sentence.
- 'group' should be a number from 6 to 10 to distinguish these as new concepts.
- 'relationship' should be a short, insightful verb phrase describing the surprising link.
Return a single, valid JSON object containing ONLY the new nodes and new edges.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.8,
                responseMimeType: 'application/json',
                responseSchema: KNOWLEDGE_GRAPH_SCHEMA,
            },
        });
        return JSON.parse(response.text.trim()) as KnowledgeGraphData;
    } catch (error) {
        console.error("Error expanding knowledge graph node:", error);
        return { nodes: [], edges: [] };
    }
};

export const generateRandomTopic = async (): Promise<string> => {
    try {
        const prompt = "Generate a single, interesting, and deeply philosophical conversation topic. The topic should be a concise question or statement. Do not add any extra text, quotes, or formatting. Just the topic itself.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 1.0,
            },
        });
        return response.text.trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if model adds them
    } catch (error) {
        console.error("Error generating random topic:", error);
        return "The nature of reality."; // Fallback topic
    }
};

export const generatePersonaPrompt = async (persona: Persona): Promise<string> => {
    const traitDescriptions = [
        persona.supportingPresetName && `Influenced by: ${persona.supportingPresetName}`,
        `Creativity (temperature): ${persona.temperature.toFixed(2)}`,
        persona.agreeableness && `Agreeableness: ${(persona.agreeableness).toFixed(2)}`,
        persona.assertiveness && `Assertiveness: ${(persona.assertiveness).toFixed(2)}`,
        persona.openness && `Openness: ${(persona.openness).toFixed(2)}`,
        persona.conscientiousness && `Conscientiousness: ${(persona.conscientiousness).toFixed(2)}`,
        persona.communicationStyle && `Communication Style: ${persona.communicationStyle}`,
        persona.verbosity && `Verbosity: ${persona.verbosity}`,
        persona.formality && `Formality/Tone: ${persona.formality}`,
        persona.humorStyle && `Humor Style: ${persona.humorStyle}`,
        persona.interruptTendency && `Interrupt Tendency: ${persona.interruptTendency}`,
        persona.curiosityLevel && `Curiosity: ${persona.curiosityLevel}`,
        persona.pessimismOptimism && `Outlook: ${persona.pessimismOptimism}`,
        persona.selfCorrectionTendency && `Self-Correction: ${persona.selfCorrectionTendency}`,
        persona.temperament && `Temperament: ${persona.temperament}`,
    ].filter(Boolean).join('\n- ');

    const prompt = `Based on the following characteristics, write a creative, first-person system prompt for an AI persona. The prompt should be a narrative description of who the AI is, its worldview, and how it should behave. It should be engaging, unique, and written from the AI's perspective (e.g., "You are..."). Do not simply list the traits.

**Primary Role:** ${persona.name}
**Traits:**
- ${traitDescriptions}

**Generated Prompt:**`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                temperature: 0.8,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating persona prompt:", error);
        return persona.systemPrompt; // Return original prompt on error
    }
};
