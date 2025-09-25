import React from 'react';
import { BrainCircuit, Bot, Dices, Sparkles } from 'lucide-react';
import { Persona } from '../types';
import RoleInput from './RoleInput';
import { 
    PREDEFINED_PERSONAS, 
    API_PROVIDERS, 
    DEFAULT_MODELS, 
    PREDEFINED_PROMPTS,
    COMMUNICATION_STYLES,
    VERBOSITY_LEVELS,
    FORMALITY_LEVELS,
    HUMOR_STYLES,
    INTERRUPT_TENDENCIES,
    CURIOSITY_LEVELS_ARRAY,
    PESSIMISM_OPTIMISM_LEVELS_ARRAY,
    SELF_CORRECTION_TENDENCIES_ARRAY,
    TEMPERAMENT_LEVELS_ARRAY
} from '../constants';
import { generatePersonaPrompt } from '../services/geminiService';

interface PersonaConfiguratorProps {
  persona1: Persona;
  setPersona1: (persona: Persona) => void;
  persona2: Persona;
  setPersona2: (persona: Persona) => void;
  isConversationRunning: boolean;
  voices: SpeechSynthesisVoice[];
}

// Fix: Moved helper function outside the component and changed to a standard function declaration
// to avoid potential TSX parsing ambiguity and improve type inference. This resolves the error
// where `getRandomElement(voices)` was incorrectly typed as `unknown`.
function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

const PersonaConfigurator: React.FC<PersonaConfiguratorProps> = ({
  persona1,
  setPersona1,
  persona2,
  setPersona2,
  isConversationRunning,
  voices,
}) => {
    const [generatingPromptFor, setGeneratingPromptFor] = React.useState<'p1' | 'p2' | null>(null);

    const generateCombinedPrompt = (primaryName: string, supportingName?: string): string => {
        const primaryPrompt = PREDEFINED_PROMPTS[primaryName] || `You are a ${primaryName}.`;

        if (!supportingName || supportingName === "") {
            return primaryPrompt;
        }

        const supportingPrompt = PREDEFINED_PROMPTS[supportingName] || `You are a ${supportingName}.`;

        // Clean up the start of the supporting prompt to avoid repetition
        const cleanedSupportingPrompt = supportingPrompt.replace(/^You are a [^,.]+[,.]?\s?/, '');

        return `You are a hybrid persona. Your primary role is a ${primaryName}, but you are strongly influenced by the mindset and characteristics of a ${supportingName}. Synthesize these two roles in your responses.

**Core Persona: ${primaryName}**
${primaryPrompt}

**Influencing Persona: ${supportingName}**
${cleanedSupportingPrompt}`;
    };

  const handleProviderChange = (personaSetter: (p: Persona) => void, currentPersona: Persona) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as Persona['apiProvider'];
    personaSetter({ ...currentPersona, apiProvider: newProvider, model: DEFAULT_MODELS[newProvider] });
  };
  
    const handleRandomize = (
        personaSetter: (p: Persona) => void,
        currentPersona: Persona
    ) => {
        const randomName = getRandomElement(PREDEFINED_PERSONAS);
        const randomSupportingName = Math.random() > 0.5 ? getRandomElement(PREDEFINED_PERSONAS) : '';

        const newPersona: Persona = {
            // Keep provider and model
            apiProvider: currentPersona.apiProvider,
            model: currentPersona.model,

            // Randomize everything else
            name: randomName,
            supportingPresetName: randomSupportingName,
            systemPrompt: generateCombinedPrompt(randomName, randomSupportingName),
            temperature: Math.random(),
            agreeableness: Math.random(),
            assertiveness: Math.random(),
            openness: Math.random(),
            conscientiousness: Math.random(),
            communicationStyle: getRandomElement(COMMUNICATION_STYLES),
            verbosity: getRandomElement(VERBOSITY_LEVELS),
            formality: getRandomElement(FORMALITY_LEVELS),
            humorStyle: getRandomElement(HUMOR_STYLES),
            interruptTendency: getRandomElement(INTERRUPT_TENDENCIES),
            curiosityLevel: getRandomElement(CURIOSITY_LEVELS_ARRAY),
            pessimismOptimism: getRandomElement(PESSIMISM_OPTIMISM_LEVELS_ARRAY),
            selfCorrectionTendency: getRandomElement(SELF_CORRECTION_TENDENCIES_ARRAY),
            temperament: getRandomElement(TEMPERAMENT_LEVELS_ARRAY),
            voiceURI: voices.length > 0 ? getRandomElement(voices).voiceURI : undefined,
            voicePitch: 0.8 + Math.random() * 0.4,
            voiceRate: 0.8 + Math.random() * 0.4,
        };

        personaSetter(newPersona);
    };

    const handleGeneratePrompt = async (
        persona: Persona,
        personaSetter: (p: Persona) => void,
        personaId: 'p1' | 'p2'
    ) => {
        if (isConversationRunning || generatingPromptFor) return;
        setGeneratingPromptFor(personaId);
        try {
            const newPrompt = await generatePersonaPrompt(persona);
            personaSetter({ ...persona, systemPrompt: newPrompt });
        } catch (error) {
            console.error(`Failed to generate prompt for ${personaId}`, error);
        } finally {
            setGeneratingPromptFor(null);
        }
    };


    const baseInputStyles = "w-full bg-black/50 border border-[var(--codex-border)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--codex-accent)] focus:border-[var(--codex-border-glow)] transition-all duration-200";
    const labelStyles = "block text-xs font-bold uppercase tracking-widest text-[var(--codex-cyan)]/80 mb-1";
    
    const customSelectStyles = `${baseInputStyles} appearance-none bg-no-repeat bg-right bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')]`;
    
    const customSliderStyles = `
      w-full h-1 bg-[var(--codex-border)] rounded-full appearance-none cursor-pointer transition-all duration-200
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:h-4
      [&::-webkit-slider-thumb]:w-4
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:bg-[var(--codex-accent)]
      [&::-webkit-slider-thumb]:border-2
      [&::-webkit-slider-thumb]:border-[var(--codex-bg-deep)]
      [&::-webkit-slider-thumb]:shadow-[0_0_8px_var(--codex-accent)]
      hover:bg-[var(--codex-cyan)]
    `;

  const renderPersonaInputs = (
    persona: Persona,
    personaSetter: (p: Persona) => void,
    icon: React.ReactNode,
    idPrefix: string
  ) => {
     const handlePrimaryPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrimaryName = e.target.value;
        const newPrompt = generateCombinedPrompt(newPrimaryName, persona.supportingPresetName);
        personaSetter({ ...persona, name: newPrimaryName, systemPrompt: newPrompt });
    };

    const handleSupportingPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSupportingName = e.target.value;
        const newPrompt = generateCombinedPrompt(persona.name, newSupportingName);
        personaSetter({ ...persona, supportingPresetName: newSupportingName, systemPrompt: newPrompt });
    };

    return (
      <div className="space-y-3">
        <RoleInput
          id={`${idPrefix}-name`}
          label="Designation"
          value={persona.name}
          onChange={(e) => {
             const newName = e.target.value;
             const newPrompt = generateCombinedPrompt(newName, persona.supportingPresetName);
             personaSetter({ ...persona, name: newName, systemPrompt: newPrompt });
          }}
          placeholder="e.g., Philosopher"
          icon={icon}
        />

        <div>
          <label htmlFor={`${idPrefix}-preset`} className={labelStyles}>Preset Matrix</label>
          <select id={`${idPrefix}-preset`} value={PREDEFINED_PERSONAS.includes(persona.name) ? persona.name : ""} onChange={handlePrimaryPresetChange} className={customSelectStyles}>
            <option value="">:: Custom Persona ::</option>
            {PREDEFINED_PERSONAS.map((name) => (<option key={name} value={name}>{name}</option>))}
          </select>
        </div>
        
        <div>
          <label htmlFor={`${idPrefix}-supporting-preset`} className={labelStyles}>Supporting Influence</label>
          <select id={`${idPrefix}-supporting-preset`} value={persona.supportingPresetName || ""} onChange={handleSupportingPresetChange} className={customSelectStyles}>
            <option value="">:: None ::</option>
            {PREDEFINED_PERSONAS.map((name) => (<option key={name} value={name}>{name}</option>))}
          </select>
        </div>

        <div>
            <div className="flex justify-between items-center mb-1">
                 <label htmlFor={`${idPrefix}-system-prompt`} className={labelStyles}>Core Directives</label>
                 <button
                    onClick={() => handleGeneratePrompt(persona, personaSetter, idPrefix as 'p1' | 'p2')}
                    disabled={isConversationRunning || !!generatingPromptFor}
                    className="p-1 border border-transparent text-gray-400 hover:text-[var(--codex-accent)] hover:border-[var(--codex-border)] transition duration-200 disabled:opacity-50"
                    title="Generate a new prompt based on current traits"
                >
                    <Sparkles size={14} className={generatingPromptFor === idPrefix ? 'animate-spin' : ''} />
                </button>
            </div>
            <textarea
                id={`${idPrefix}-system-prompt`}
                rows={4}
                value={persona.systemPrompt}
                onChange={(e) => personaSetter({ ...persona, systemPrompt: e.target.value })}
                placeholder="Define core principles..."
                className={baseInputStyles}
                disabled={isConversationRunning || !!generatingPromptFor}
             />
        </div>

        <div>
            <label htmlFor={`${idPrefix}-temperature`} className={labelStyles}>Creativity: {persona.temperature.toFixed(2)}</label>
            <input type="range" id={`${idPrefix}-temperature`} min="0" max="1" step="0.05" value={persona.temperature} onChange={(e) => personaSetter({ ...persona, temperature: parseFloat(e.target.value) })} className={customSliderStyles}/>
        </div>
        
        <details className="pt-3 mt-3 border-t border-[var(--codex-border)]">
             <summary className="cursor-pointer text-sm font-semibold text-[var(--codex-accent)]/90 tracking-widest -mb-1 list-none marker:content-['']">BEHAVIORAL TRAITS</summary>
             <div className="mt-3 space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label htmlFor={`${idPrefix}-agreeableness`} className={labelStyles}>Agreeableness: {(persona.agreeableness ?? 0.5).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-agreeableness`} min="0" max="1" step="0.05" value={persona.agreeableness ?? 0.5} onChange={(e) => personaSetter({ ...persona, agreeableness: parseFloat(e.target.value) })} className={customSliderStyles}/>
                     </div>
                     <div>
                        <label htmlFor={`${idPrefix}-assertiveness`} className={labelStyles}>Assertiveness: {(persona.assertiveness ?? 0.5).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-assertiveness`} min="0" max="1" step="0.05" value={persona.assertiveness ?? 0.5} onChange={(e) => personaSetter({ ...persona, assertiveness: parseFloat(e.target.value) })} className={customSliderStyles}/>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor={`${idPrefix}-openness`} className={labelStyles}>Openness: {(persona.openness ?? 0.5).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-openness`} min="0" max="1" step="0.05" value={persona.openness ?? 0.5} onChange={(e) => personaSetter({ ...persona, openness: parseFloat(e.target.value) })} className={customSliderStyles}/>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-conscientiousness`} className={labelStyles}>Conscientiousness: {(persona.conscientiousness ?? 0.5).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-conscientiousness`} min="0" max="1" step="0.05" value={persona.conscientiousness ?? 0.5} onChange={(e) => personaSetter({ ...persona, conscientiousness: parseFloat(e.target.value) })} className={customSliderStyles}/>
                    </div>
                </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label htmlFor={`${idPrefix}-curiosity`} className={labelStyles} title="Controls how inquisitive the persona is and how often it asks questions.">
                            Curiosity
                        </label>
                         <select id={`${idPrefix}-curiosity`} value={persona.curiosityLevel || 'Mid'} onChange={(e) => personaSetter({ ...persona, curiosityLevel: e.target.value as Persona['curiosityLevel'] })} className={customSelectStyles}>
                            {CURIOSITY_LEVELS_ARRAY.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor={`${idPrefix}-pessimism`} className={labelStyles} title="Determines the persona's general outlook, from negative to positive.">
                            Outlook
                        </label>
                        <select id={`${idPrefix}-pessimism`} value={persona.pessimismOptimism || 'Neutral'} onChange={(e) => personaSetter({ ...persona, pessimismOptimism: e.target.value as Persona['pessimismOptimism'] })} className={customSelectStyles}>
                            {PESSIMISM_OPTIMISM_LEVELS_ARRAY.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label htmlFor={`${idPrefix}-selfcorrection`} className={labelStyles} title="How often the persona admits mistakes or corrects its own statements.">
                            Self-Correction
                        </label>
                         <select id={`${idPrefix}-selfcorrection`} value={persona.selfCorrectionTendency || 'Occasionally'} onChange={(e) => personaSetter({ ...persona, selfCorrectionTendency: e.target.value as Persona['selfCorrectionTendency'] })} className={customSelectStyles}>
                            {SELF_CORRECTION_TENDENCIES_ARRAY.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor={`${idPrefix}-temperament`} className={labelStyles} title="The general mood and attitude of the persona during conversation.">
                            Temperament
                        </label>
                         <select id={`${idPrefix}-temperament`} value={persona.temperament || 'Neutral'} onChange={(e) => personaSetter({ ...persona, temperament: e.target.value as Persona['temperament'] })} className={customSelectStyles}>
                            {TEMPERAMENT_LEVELS_ARRAY.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label htmlFor={`${idPrefix}-verbosity`} className={labelStyles}>Verbosity</label>
                        <select id={`${idPrefix}-verbosity`} value={persona.verbosity || 'medium'} onChange={(e) => personaSetter({ ...persona, verbosity: e.target.value as Persona['verbosity'] })} className={customSelectStyles}>
                            {VERBOSITY_LEVELS.map(level => <option key={level} value={level} className="capitalize">{level === 'medium' ? 'Balanced' : level}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-interrupt`} className={labelStyles}>Interrupt Tendency</label>
                        <select id={`${idPrefix}-interrupt`} value={persona.interruptTendency || 'occasional'} onChange={(e) => personaSetter({ ...persona, interruptTendency: e.target.value as Persona['interruptTendency'] })} className={customSelectStyles}>
                            {INTERRUPT_TENDENCIES.map(level => <option key={level} value={level} className="capitalize">{level}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor={`${idPrefix}-formality`} className={labelStyles}>Formality / Tone</label>
                        <select id={`${idPrefix}-formality`} value={persona.formality || 'formal'} onChange={(e) => personaSetter({ ...persona, formality: e.target.value as Persona['formality'] })} className={customSelectStyles}>
                            {FORMALITY_LEVELS.map(level => <option key={level} value={level} className="capitalize">{level}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor={`${idPrefix}-humorStyle`} className={labelStyles}>Humor Style</label>
                        <select id={`${idPrefix}-humorStyle`} value={persona.humorStyle || 'none'} onChange={(e) => personaSetter({ ...persona, humorStyle: e.target.value as Persona['humorStyle'] })} className={customSelectStyles}>
                            {HUMOR_STYLES.map(level => <option key={level} value={level} className="capitalize">{level}</option>)}
                        </select>
                    </div>
                 </div>
             </div>
        </details>
        
        <details className="pt-3 mt-3 border-t border-[var(--codex-border)]" open>
             <summary className="cursor-pointer text-sm font-semibold text-[var(--codex-accent)]/90 tracking-widest list-none marker:content-['']">VOICE CONFIGURATION</summary>
             <div className="mt-3 space-y-3">
                <div>
                    <label htmlFor={`${idPrefix}-voice`} className={labelStyles}>Voice Engine</label>
                    <select id={`${idPrefix}-voice`} value={persona.voiceURI || ''} onChange={(e) => personaSetter({ ...persona, voiceURI: e.target.value })} className={customSelectStyles} disabled={voices.length === 0}>
                        <option value="">:: System Default ::</option>
                        {voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
                    </select>
                    {voices.length === 0 && <p className="text-xs text-amber-400/70 mt-1">No voices found. Your browser may not support the Web Speech API.</p>}
                </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor={`${idPrefix}-voice-pitch`} className={labelStyles}>Pitch: {(persona.voicePitch ?? 1).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-voice-pitch`} min="0" max="2" step="0.1" value={persona.voicePitch ?? 1} onChange={(e) => personaSetter({ ...persona, voicePitch: parseFloat(e.target.value) })} className={customSliderStyles}/>
                    </div>
                     <div>
                        <label htmlFor={`${idPrefix}-voice-rate`} className={labelStyles}>Rate: {(persona.voiceRate ?? 1).toFixed(2)}</label>
                        <input type="range" id={`${idPrefix}-voice-rate`} min="0.5" max="2" step="0.1" value={persona.voiceRate ?? 1} onChange={(e) => personaSetter({ ...persona, voiceRate: parseFloat(e.target.value) })} className={customSliderStyles}/>
                    </div>
                </div>
             </div>
        </details>

        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-[var(--codex-border)]">
          <div>
            <label htmlFor={`${idPrefix}-provider`} className={labelStyles}>API Provider</label>
            <select id={`${idPrefix}-provider`} value={persona.apiProvider} onChange={handleProviderChange(personaSetter, persona)} className={customSelectStyles}>
              {API_PROVIDERS.map((provider) => (<option key={provider.id} value={provider.id}>{provider.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-model`} className={labelStyles}>Model</label>
            <input type="text" id={`${idPrefix}-model`} value={persona.model} onChange={(e) => personaSetter({ ...persona, model: e.target.value })} className={baseInputStyles} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-3 transition-opacity duration-300 ${isConversationRunning ? 'opacity-50 pointer-events-none' : ''}`}>
      <h3 className="text-xl font-bold text-center text-[var(--codex-cyan)] mb-4 uppercase tracking-widest">Configure Personas</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
           <div className="flex justify-center items-center gap-2 mb-3">
                <h4 className="text-lg font-semibold text-[var(--codex-persona1-pri)] text-center tracking-wider">:: Persona 1 ::</h4>
                <button
                    onClick={() => handleRandomize(setPersona1, persona1)}
                    className="p-1.5 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200"
                    title="Randomize Persona 1"
                    aria-label="Randomize Persona 1"
                >
                    <Dices size={16} />
                </button>
            </div>
          {renderPersonaInputs(persona1, setPersona1, <BrainCircuit size={16} />, 'p1')}
        </div>
        <div>
            <div className="flex justify-center items-center gap-2 mb-3">
                <h4 className="text-lg font-semibold text-[var(--codex-persona2-pri)] text-center tracking-wider">:: Persona 2 ::</h4>
                 <button
                    onClick={() => handleRandomize(setPersona2, persona2)}
                    className="p-1.5 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200"
                    title="Randomize Persona 2"
                    aria-label="Randomize Persona 2"
                >
                    <Dices size={16} />
                </button>
            </div>
          {renderPersonaInputs(persona2, setPersona2, <Bot size={16} />, 'p2')}
        </div>
      </div>
    </div>
  );
};

export default PersonaConfigurator;