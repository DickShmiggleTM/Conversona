
import { Persona, ChatMessage, LLMResponse, LLMContext } from '../types';

const COHERE_API_URL = 'https://api.cohere.com/v1/chat';

// A common prompt instruction for models that don't have a native, structured output schema
const JSON_PROMPT_INSTRUCTION = `
Your entire output will be a single JSON object with three keys: "internalMonologue", "responseText", and "sentiment".
- internalMonologue: Your brief, step-by-step reasoning process for the response, consistent with your persona. Max 80 words.
- responseText: The final response to be shown to the user.
- sentiment: A value from -1.0 (very negative) to 1.0 (very positive) representing the sentiment of your responseText.
Do not include any other text or formatting outside of this JSON object.
`;

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

    const finalTraitPrompts = traitPrompts.length > 40 ? traitPrompts : ''; // Check if any traits were added
    
    return `${persona.systemPrompt}${finalTraitPrompts}${contextPrompts}\n\n${JSON_PROMPT_INSTRUCTION}`;
};

const formatCohereHistory = (history: ChatMessage[]) => {
    return history.map(msg => ({
        role: msg.role === 'user' ? 'USER' : 'CHATBOT',
        message: msg.content
    }));
};

export const getCohereResponse = async (
    persona: Persona,
    history: ChatMessage[],
    prompt: string,
    context: LLMContext,
    apiKey: string
): Promise<LLMResponse> => {
    try {
        const response = await fetch(COHERE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: persona.model,
                chat_history: formatCohereHistory(history),
                message: prompt,
                preamble: getSystemInstruction(persona, context, history),
                temperature: persona.temperature,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Cohere API request failed: ${errorBody.message}`);
        }

        const data = await response.json();
        const responseText = data.text || '';
        
        try {
            const parsedContent = JSON.parse(responseText);
            if (typeof parsedContent !== 'object' || parsedContent === null) {
                return {
                    text: `Error: Model returned non-object JSON response. Content: ${responseText}`,
                    internalMonologue: "Failed to parse a valid JSON object from the model's response.",
                };
            }
            return {
                text: parsedContent.responseText || 'The model did not provide a responseText.',
                internalMonologue: parsedContent.internalMonologue || 'The model did not provide an internalMonologue.',
                sentiment: parsedContent.sentiment,
            };
        } catch (parseError) {
             console.warn("Failed to parse JSON from Cohere, treating as plain text:", responseText);
             return {
                text: responseText,
                internalMonologue: "The model's response was not valid JSON.",
             }
        }

    } catch (error) {
        console.error("Error fetching Cohere response:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            text: `An error occurred while fetching the response from Cohere. Details: ${errorMessage}`,
            internalMonologue: `Error occurred: ${errorMessage}`,
        };
    }
};