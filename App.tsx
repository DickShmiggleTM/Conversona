import React from 'react';
import { Play, StopCircle, KeyRound, Menu, X, Send, Dices, FilePlus, Trash2 } from 'lucide-react';

import PersonaConfigurator from './components/PersonaConfigurator';
import ChatBubble from './components/ChatBubble';
import BranchNavigator from './components/BranchNavigator';
import MemoryBank from './components/MemoryBank';
import ConversationSummary from './components/ConversationSummary';
import VisualizationModal from './components/VisualizationModal';
import ConversationVisualizer from './components/ConversationVisualizer';
import ExportControls from './components/ExportControls';
import ApiConfigModal from './components/ApiConfigModal';
import PlaybackControls from './components/PlaybackControls';
import AudioPlaybackControls from './components/AudioPlaybackControls';
import CodexPanel from './components/CodexPanel';
import CodexSymbol from './components/CodexSymbol';


import { getLLMResponse, generateArgumentMap } from './services/llmService';
import { getSummary, generateImageForConcept, generateRandomTopic } from './services/geminiService';
import { CONCEPTS } from './data/concepts';

import { Persona, Message, ConversationBranch, ChatMessage, LLMContext, ArgumentMapData, ApiKeys } from './types';
import { DEFAULT_MODELS, CONVERSATION_TYPES, CONVERSATION_START_TONES } from './constants';

const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const initialPersona1: Persona = {
    name: 'Philosopher',
    supportingPresetName: '',
    systemPrompt: 'You are a Philosopher.',
    apiProvider: 'gemini',
    model: DEFAULT_MODELS.gemini,
    temperature: 0.7,
    agreeableness: 0.5,
    communicationStyle: 'eloquent',
    verbosity: 'medium',
    formality: 'academic',
    humorStyle: 'witty',
    interruptTendency: 'never',
    curiosityLevel: 'High',
    pessimismOptimism: 'Neutral',
    selfCorrectionTendency: 'Often',
    temperament: 'Calm',
    assertiveness: 0.6,
    openness: 0.8,
    conscientiousness: 0.7,
    voiceURI: undefined,
    voicePitch: 1,
    voiceRate: 1,
};

const initialPersona2: Persona = {
    name: 'Scientist',
    supportingPresetName: '',
    systemPrompt: 'You are a Scientist.',
    apiProvider: 'gemini',
    model: DEFAULT_MODELS.gemini,
    temperature: 0.7,
    agreeableness: 0.5,
    communicationStyle: 'direct',
    verbosity: 'medium',
    formality: 'formal',
    humorStyle: 'dry',
    interruptTendency: 'occasional',
    curiosityLevel: 'High',
    pessimismOptimism: 'Neutral',
    selfCorrectionTendency: 'Always',
    temperament: 'Neutral',
    assertiveness: 0.8,
    openness: 0.6,
    conscientiousness: 0.9,
    voiceURI: undefined,
    voicePitch: 1,
    voiceRate: 1,
};


const App: React.FC = () => {
    const [persona1, setPersona1] = React.useState<Persona>(initialPersona1);
    const [persona2, setPersona2] = React.useState<Persona>(initialPersona2);
    
    const [topic, setTopic] = React.useState<string>('The nature of consciousness.');
    const [conversationType, setConversationType] = React.useState<string>('Debate');
    const [conversationStartTone, setConversationStartTone] = React.useState<string>('Neutral');
    
    const [activePersona, setActivePersona] = React.useState<'p1' | 'p2'>('p1');
    const isAiRespondingRef = React.useRef<boolean>(false);

    const [branches, setBranches] = React.useState<ConversationBranch[]>([
        { id: 'main', name: 'Main Conversation', messages: [], parentId: null, parentBranchId: null },
    ]);
    const [activeBranchId, setActiveBranchId] = React.useState<string>('main');
    const [isBranchTransitioning, setIsBranchTransitioning] = React.useState(false);
    
    const [longTermMemory, setLongTermMemory] = React.useState<string[]>(['The conversation is about to start.']);
    const [showMonologues, setShowMonologues] = React.useState<boolean>(true);

    const [summary, setSummary] = React.useState('');
    const [isSummarizing, setIsSummarizing] = React.useState(false);

    const [visualizationData, setVisualizationData] = React.useState<{
        concept: string;
        definition: string;
        imageBase64: string;
        isLoading: boolean;
    } | null>(null);
    
    const [argumentMapData, setArgumentMapData] = React.useState<ArgumentMapData | null>(null);
    const [isMappingArguments, setIsMappingArguments] = React.useState(false);

    const [isApiModalOpen, setIsApiModalOpen] = React.useState(false);
    const [apiKeys, setApiKeys] = React.useState<ApiKeys>({ cohere: '', mistral: '', openrouter: '' });

    // Playback State
    const [isPlayingBack, setIsPlayingBack] = React.useState(false);
    const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
    const [playbackIndex, setPlaybackIndex] = React.useState(0);
    
    // Audio TTS State
    const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
    const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
    const [currentAudioIndex, setCurrentAudioIndex] = React.useState(-1);
    const [isPreparingDownload, setIsPreparingDownload] = React.useState(false);
    const [isGeneratingDownload, setIsGeneratingDownload] = React.useState(false);
    const utteranceQueueRef = React.useRef<Message[]>([]);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);

    // Knowledge Graph State
    const [isCodexOpen, setIsCodexOpen] = React.useState(false);
    const [isControlsVisible, setIsControlsVisible] = React.useState(false);

    // User Input & Simulation State
    const [userInput, setUserInput] = React.useState('');
    const [isUserTyping, setIsUserTyping] = React.useState(false);
    const typingTimeoutRef = React.useRef<number | null>(null);
    const [isSimulating, setIsSimulating] = React.useState<boolean>(false);
    const [maxTurns, setMaxTurns] = React.useState<number>(10);
    const [messagesPerTurn, setMessagesPerTurn] = React.useState<number>(1);
    const [currentTurn, setCurrentTurn] = React.useState<number>(0);
    const isSimulatingRef = React.useRef(isSimulating);
    const [isRandomizingTopic, setIsRandomizingTopic] = React.useState(false);
    
    React.useEffect(() => {
        isSimulatingRef.current = isSimulating;
    }, [isSimulating]);


    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];
    const visibleMessages = isPlayingBack ? activeBranch.messages.slice(0, playbackIndex) : activeBranch.messages;

    React.useEffect(() => {
        try {
            const storedKeys = localStorage.getItem('persona-duel-apikeys');
            if (storedKeys) {
                setApiKeys(JSON.parse(storedKeys));
            }
        } catch (error) {
            console.error("Failed to load API keys from localStorage:", error);
        }
        if (window.innerWidth >= 1024) {
            setIsControlsVisible(true);
        }
        
        // Load TTS voices
        const loadVoices = () => setVoices(speechSynthesis.getVoices());
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        
        return () => {
             speechSynthesis.onvoiceschanged = null;
             speechSynthesis.cancel();
        }
    }, []);

    React.useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [visibleMessages, isUserTyping]);

    React.useEffect(() => {
        if (isPlayingBack && playbackIndex < activeBranch.messages.length) {
            const timer = setTimeout(() => {
                setPlaybackIndex(prev => prev + 1);
            }, 1000 / playbackSpeed);
            return () => clearTimeout(timer);
        } else if (isPlayingBack) {
            setIsPlayingBack(false);
        }
    }, [isPlayingBack, playbackIndex, playbackSpeed, activeBranch.messages.length]);
    
    const updateMessagesInBranch = (branchId: string, updater: (messages: Message[]) => Message[]) => {
        setBranches(prevBranches => prevBranches.map(b =>
            b.id === branchId ? { ...b, messages: updater(b.messages) } : b
        ));
    };

    const runSingleTurn = async (persona: Persona, prompt: string): Promise<string> => {
        const currentMessages = branches.find(b => b.id === activeBranchId)?.messages || [];
        const loadingMessageId = uuid();
        const loadingMonologueId = uuid();

        updateMessagesInBranch(activeBranchId, (msgs) => [
            ...msgs,
            { id: loadingMonologueId, author: persona.name, text: '...', isInternalMonologue: true, isLoading: true },
            { id: loadingMessageId, author: persona.name, text: '...', isInternalMonologue: false, isLoading: true },
        ]);

        const history: ChatMessage[] = currentMessages
            .filter(m => !m.isInternalMonologue && m.author !== 'System' && m.author !== 'User' && !m.isLoading)
            .map(m => ({
                role: m.author === persona.name ? 'model' : 'user',
                content: m.text,
            }));

        const context: LLMContext = { 
            longTermMemory,
            conversationType,
            conversationStartTone,
        };

        try {
            const llmResponse = await getLLMResponse(persona, history, prompt, context, apiKeys);
            
            updateMessagesInBranch(activeBranchId, (msgs) => msgs.map(m =>
                m.id === loadingMonologueId ? { ...m, text: llmResponse.internalMonologue || 'No monologue provided.', isLoading: false } : m
            ));
            
            updateMessagesInBranch(activeBranchId, (msgs) => msgs.map(m =>
                m.id === loadingMessageId ? {
                    ...m,
                    text: llmResponse.text,
                    isLoading: false,
                    imageBase64: llmResponse.imageBase64,
                    sentiment: llmResponse.sentiment,
                    influenceScore: llmResponse.influenceScore
                } : m
            ));
            
            return llmResponse.text;

        } catch (error) {
            console.error("Error during LLM response processing:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            updateMessagesInBranch(activeBranchId, (msgs) => msgs.filter(m => m.id !== loadingMonologueId));
            updateMessagesInBranch(activeBranchId, (msgs) => msgs.map(m =>
                m.id === loadingMessageId ? {
                    ...m,
                    text: `[SYSTEM ERROR] Failed to get response: ${errorMessage}`,
                    isLoading: false,
                    author: 'System'
                } : m
            ));
            
            throw error; // Propagate error to stop the sequence
        }
    };
    
    const runDuelResponseSequence = async (userPrompt: string) => {
        isAiRespondingRef.current = true;
        
        const firstResponder = activePersona === 'p1' ? persona1 : persona2;
        const secondResponder = activePersona === 'p1' ? persona2 : persona1;
    
        try {
            const firstResponseText = await runSingleTurn(firstResponder, userPrompt);
            await runSingleTurn(secondResponder, firstResponseText);
        } catch (error) {
            console.error("Duel sequence halted due to error.", error);
        } finally {
            // Switch persona for the next user interaction
            setActivePersona(activePersona === 'p1' ? 'p2' : 'p1');
            isAiRespondingRef.current = false;
        }
    };

    const runSimulationTurn = async () => {
        if (!isSimulatingRef.current) return;
    
        isAiRespondingRef.current = true;
        
        const currentMessages = branches.find(b => b.id === activeBranchId)?.messages || [];
        const lastMessage = currentMessages.filter(m => !m.isInternalMonologue && m.author !== 'System' && m.author !== 'User').pop();
        
        let nextPrompt = lastMessage ? lastMessage.text : topic;
        
        let firstResponder = activePersona === 'p1' ? persona1 : persona2;
        let secondResponder = activePersona === 'p1' ? persona2 : persona1;
        
        try {
            const firstResponseText = await runSingleTurn(firstResponder, nextPrompt);
    
            if (messagesPerTurn === 2 && isSimulatingRef.current) {
                await runSingleTurn(secondResponder, firstResponseText);
            }
    
        } catch (error) {
            console.error("Simulation turn halted due to error.", error);
            setIsSimulating(false);
        } finally {
            if (messagesPerTurn === 1) {
                 setActivePersona(prev => prev === 'p1' ? 'p2' : 'p1');
            }
            
            isAiRespondingRef.current = false;
    
            if (isSimulatingRef.current) {
                setCurrentTurn(prev => prev + 1);
            }
        }
    };
    
    React.useEffect(() => {
        if (isSimulating && currentTurn < maxTurns) {
            const turnTimer = setTimeout(() => {
                runSimulationTurn();
            }, 500); 
            return () => clearTimeout(turnTimer);
        } else if (isSimulating) {
            setIsSimulating(false);
        }
    }, [isSimulating, currentTurn, maxTurns, activeBranchId]);

    const handleUserTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInput(e.target.value);
        if (!isUserTyping) setIsUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => {
            setIsUserTyping(false);
        }, 1500);
    };

    const handleFormAction = (e: React.FormEvent) => {
        e.preventDefault();

        if (isSimulating) { // STOP Action
            setIsSimulating(false);
            isAiRespondingRef.current = false;
            return;
        }

        if (userInput.trim()) { // SEND Action
            if (isAiRespondingRef.current) return;
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setIsUserTyping(false);

            const userMessage: Message = {
                id: uuid(),
                author: 'User',
                text: userInput,
                isInternalMonologue: false,
                isLoading: false,
            };
            updateMessagesInBranch(activeBranchId, (msgs) => [...msgs, userMessage]);
            
            runDuelResponseSequence(userInput);
            setUserInput('');
            setCurrentTurn(0);
        } else { // PLAY Action
            if (isAiRespondingRef.current) return;
            setCurrentTurn(0);
            setIsSimulating(true);
        }
    };

    React.useEffect(() => {
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
    }, []);

    const handleFork = (messageId: string) => {
        const branch = activeBranch;
        const messageIndex = branch.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const newBranchId = uuid();
        const newBranchName = `Branch from "${branch.messages[messageIndex].text.substring(0, 20)}..."`;
        
        const newBranch: ConversationBranch = {
            id: newBranchId,
            name: newBranchName,
            messages: branch.messages.slice(0, messageIndex + 1),
            parentId: messageId,
            parentBranchId: branch.id,
        };
        
        setBranches(prev => [...prev, newBranch]);
        handleSelectBranch(newBranchId);
    };

    const handleSelectBranch = (id: string) => {
        if (!isAiRespondingRef.current && id !== activeBranchId) {
            setIsSimulating(false);
            setIsBranchTransitioning(true);
            setArgumentMapData(null); 
            setTimeout(() => {
                setActiveBranchId(id);
                const newBranchLength = branches.find(b => b.id === id)?.messages.length || 0;
                setPlaybackIndex(newBranchLength);
                setIsBranchTransitioning(false);
            }, 300);
        }
    };
    
    const handleDeleteBranch = (id: string) => {
        if (id === 'main' || isAiRespondingRef.current || isSimulating) return;
        setBranches(prev => prev.filter(b => b.id !== id));
        if (activeBranchId === id) {
            handleSelectBranch('main');
        }
    };
    
    const handleVote = (messageId: string, vote: number) => {
        updateMessagesInBranch(activeBranchId, (msgs) => msgs.map(m => {
            if (m.id === messageId) {
                return { ...m, vote: m.vote === vote ? undefined : vote };
            }
            return m;
        }));
    };

    const handleResetPlayback = () => {
        setIsPlayingBack(false);
        setPlaybackIndex(0);
    };
    
    const handleGenerateSummary = async () => {
        setIsSummarizing(true);
        const result = await getSummary(activeBranch.messages);
        setSummary(result);
        setIsSummarizing(false);
    };

    const handleVisualizeConcept = async (concept: string) => {
        const lowerConcept = concept.toLowerCase();
        const definition = CONCEPTS[lowerConcept];
        if (!definition) return;
        setVisualizationData({ concept, definition, imageBase64: '', isLoading: true });
        const imageBase64 = await generateImageForConcept(concept, definition);
        setVisualizationData({ concept, definition, imageBase64: imageBase64 || '', isLoading: false });
    };

    const handleGenerateArgumentMap = async () => {
        setIsMappingArguments(true);
        const result = await generateArgumentMap(activeBranch.messages, persona1.name, persona2.name);
        setArgumentMapData(result);
        setIsMappingArguments(false);
    }

    const handleSaveApiKeys = (keys: ApiKeys) => {
        setApiKeys(keys);
        try {
            localStorage.setItem('persona-duel-apikeys', JSON.stringify(keys));
        } catch (error) {
            console.error("Failed to save API keys to localStorage:", error);
        }
        setIsApiModalOpen(false);
    };
    
    const handleRandomizeTopic = async () => {
        if (isAiRespondingRef.current || isSimulating || isRandomizingTopic) return;
        setIsRandomizingTopic(true);
        try {
            const newTopic = await generateRandomTopic();
            setTopic(newTopic);
        } catch (error) {
            console.error("Failed to fetch random topic:", error);
            setTopic("Could not generate topic. What is the sound of one hand clapping?");
        } finally {
            setIsRandomizingTopic(false);
        }
    };
    
    const handleClearSession = () => {
        if (isAiRespondingRef.current || isSimulating) return;
        updateMessagesInBranch(activeBranchId, () => []);
        handleResetPlayback();
        setSummary('');
        setArgumentMapData(null);
    };

    const handleNewSession = () => {
        if (isAiRespondingRef.current || isSimulating) return;
        setIsSimulating(false);
        setTopic('The nature of consciousness.');
        setConversationType('Debate');
        setConversationStartTone('Neutral');
        setActivePersona('p1');
        setBranches([{ id: 'main', name: 'Main Conversation', messages: [], parentId: null, parentBranchId: null }]);
        setActiveBranchId('main');
        setLongTermMemory(['The conversation is about to start.']);
        setSummary('');
        setArgumentMapData(null);
        handleResetPlayback();
        setUserInput('');
    };

    // --- TTS Handlers ---
    const speakNext = React.useCallback((index: number) => {
        if (index >= utteranceQueueRef.current.length) {
            setIsAudioPlaying(false);
            setCurrentAudioIndex(-1);
            if(mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            return;
        }

        const message = utteranceQueueRef.current[index];
        if (!message || message.isLoading || message.isInternalMonologue || !message.text.trim()) {
            speakNext(index + 1);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message.text);
        let persona = null;
        if (message.author === persona1.name) persona = persona1;
        else if (message.author === persona2.name) persona = persona2;

        const voice = persona?.voiceURI ? voices.find(v => v.voiceURI === persona.voiceURI) : null;
        if (voice) utterance.voice = voice;
        utterance.pitch = persona?.voicePitch ?? 1;
        utterance.rate = persona?.voiceRate ?? 1;

        utterance.onend = () => speakNext(index + 1);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            speakNext(index + 1); // Skip to next on error
        };
        
        setCurrentAudioIndex(visibleMessages.findIndex(m => m.id === message.id));
        speechSynthesis.speak(utterance);
    }, [voices, persona1, persona2, visibleMessages]);

    const handlePlayAudio = () => {
        if (isAudioPlaying) {
            speechSynthesis.resume();
            return;
        }
        utteranceQueueRef.current = visibleMessages;
        setIsAudioPlaying(true);
        speakNext(0);
    };

    const handlePauseAudio = () => {
        speechSynthesis.pause();
    };
    
    const handleStopAudio = () => {
        speechSynthesis.cancel();
        setIsAudioPlaying(false);
        setCurrentAudioIndex(-1);
        utteranceQueueRef.current = [];
    };

    const handleDownloadAudio = () => setIsPreparingDownload(true);

    const confirmDownload = async () => {
        setIsPreparingDownload(false);
        if (activeBranch.messages.length === 0) return;

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
            setIsGeneratingDownload(true);

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `conversona-export.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                setIsGeneratingDownload(false);
                 stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            utteranceQueueRef.current = activeBranch.messages;
            speakNext(0);

        } catch (err) {
            console.error("Error capturing audio:", err);
            alert("Could not start audio recording. Permission might have been denied.");
            setIsGeneratingDownload(false);
        }
    };


    const baseInputStyles = "w-full bg-black/50 border border-[var(--codex-border)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--codex-accent)] focus:border-[var(--codex-border-glow)] transition-all duration-200 text-sm";
    const labelStyles = "block text-xs font-bold uppercase tracking-widest text-[var(--codex-cyan)]/80 mb-1";
    const customSelectStyles = `${baseInputStyles} appearance-none bg-no-repeat bg-right bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')]`;


    return (
        <div className="bg-[var(--codex-bg-deep)] text-[var(--codex-cyan)] h-screen p-2 sm:p-4 font-['Share_Tech_Mono',_monospace] relative overflow-hidden flex flex-col">
             <div className="absolute inset-0 bg-grid opacity-20"></div>
             <div id="particle-container" className="absolute inset-0"></div>
             <div className="absolute inset-0 bg-gradient-to-tr from-[var(--codex-bg-deep)] via-transparent to-[var(--codex-bg-deep)]"></div>
             <div className="absolute inset-0 scanline-overlay"></div>

            <style>{`
              :root {
                --codex-cyan: #00f0ff;
                --codex-magenta: #f000f0;
                --codex-gold: #ffd700;
                --codex-blue: #4f8fef;
                --codex-accent: var(--codex-gold);
                --codex-bg-deep: #05080a;
                --codex-bg-panel: rgba(10, 20, 30, 0.85);
                --codex-border: rgba(79, 143, 239, 0.3);
                --codex-border-glow: rgba(0, 240, 255, 0.5);
                --codex-persona1-pri: var(--codex-magenta);
                --codex-persona1-sec: #ff80ff;
                --codex-persona2-pri: var(--codex-cyan);
                --codex-persona2-sec: #80ffeb;
              }
              
              @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
              
              @keyframes text-glow-pulsate { 0%, 100% { text-shadow: 0 0 4px var(--codex-cyan), 0 0 8px var(--codex-cyan), 0 0 16px var(--codex-border-glow); } 50% { text-shadow: 0 0 6px var(--codex-cyan), 0 0 12px var(--codex-border-glow), 0 0 24px var(--codex-border-glow); } }
              @keyframes panel-boot-flicker { 0% { opacity: 0.8; } 5% { opacity: 0.5; } 10% { opacity: 0.9; } 15% { opacity: 0.6; } 20% { opacity: 1; } 100% { opacity: 1; } }
              @keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
              
              .scanline-overlay { pointer-events: none; background: linear-gradient(0deg, transparent 50%, rgba(255, 255, 255, 0.02) 50%); background-size: 100% 4px; animation: scanline 15s linear infinite; }
              .bg-grid { background-image: linear-gradient(var(--codex-border) 1px, transparent 1px), linear-gradient(90deg, var(--codex-border) 1px, transparent 1px); background-size: 40px 40px; }
              
              .component-bezel { 
                background: var(--codex-bg-panel);
                border: 1px solid var(--codex-border);
                backdrop-filter: blur(16px);
                box-shadow: 0 0 35px rgba(0, 240, 255, 0.1), inset 0 0 20px rgba(10, 20, 30, 0.7);
                animation: panel-boot-flicker 0.7s ease-out;
                position: relative;
                clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
                transition: box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out;
              }
               .component-bezel:hover {
                box-shadow: 0 0 45px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(10, 20, 30, 0.7);
                border-color: rgba(79, 143, 239, 0.5);
               }
              .component-bezel::before, .component-bezel::after { content: ''; position: absolute; width: 12px; height: 12px; border-color: var(--codex-cyan); border-style: solid; opacity: 0.7; transition: all 0.3s ease; }
              .component-bezel::before { top: -2px; left: -2px; border-width: 2px 0 0 2px; }
              .component-bezel::after { bottom: -2px; right: -2px; border-width: 0 2px 2px 0; }
              
              .component-bezel h3, .component-bezel h4 { text-shadow: 0 0 4px var(--codex-cyan); letter-spacing: 0.1em; }
              
              ::-webkit-scrollbar { width: 8px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: var(--codex-border); border: 1px solid var(--codex-cyan); }
              ::-webkit-scrollbar-thumb:hover { background: var(--codex-cyan); box-shadow: 0 0 10px var(--codex-cyan); }
              
              #particle-container { pointer-events: none; }
              .particle { position: absolute; background-color: var(--codex-border-glow); border-radius: 50%; opacity: 0; animation: float 20s infinite linear; }
              @keyframes float { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }
            `}</style>

            <header className="relative mb-2 sm:mb-4 text-center p-2 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setIsControlsVisible(!isControlsVisible)}
                        className="p-2 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200 lg:hidden"
                        style={{clipPath: 'polygon(5px 0, 100% 0, 100% 100%, 0 100%, 0 5px)'}}
                        title="Toggle Controls"
                    >
                       {isControlsVisible ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <button 
                        onClick={() => setIsCodexOpen(true)}
                        className="p-2 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200"
                        style={{clipPath: 'polygon(5px 0, 100% 0, 100% 100%, 0 100%, 0 5px)'}}
                        title="Open Knowledge Codex"
                    >
                       <CodexSymbol className="w-5 h-5" style={{filter: 'drop-shadow(0 0 3px var(--codex-border-glow))'}} />
                    </button>
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-widest uppercase" style={{animation: 'text-glow-pulsate 3s infinite'}}>
                      <span className="text-[var(--codex-cyan)]/50">&lt;</span> Conversona <span className="text-[var(--codex-cyan)]/50">&gt;</span>
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-[var(--codex-border-glow)] mt-1 tracking-wider">A I // P E R S O N A // C O N V E R S A T I O N // L A B</p>
                </div>
                <button 
                    onClick={() => setIsApiModalOpen(true)}
                    className="p-2 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200"
                    style={{clipPath: 'polygon(5px 0, 100% 0, 100% 100%, 0 100%, 0 5px)'}}
                    title="Configure API Keys"
                >
                    <KeyRound size={20} style={{filter: 'drop-shadow(0 0 3px var(--codex-border-glow))'}} />
                </button>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 min-h-0">
                
                <aside className={`lg:col-span-1 xl:col-span-1 component-bezel p-1 sm:p-2 flex-col gap-3 min-h-0 overflow-y-auto ${isControlsVisible ? 'flex' : 'hidden'} lg:flex`}>
                    <PersonaConfigurator persona1={persona1} setPersona1={setPersona1} persona2={persona2} setPersona2={setPersona2} isConversationRunning={isAiRespondingRef.current || isSimulating} voices={voices} />
                    <MemoryBank longTermMemory={longTermMemory} setLongTermMemory={setLongTermMemory} isConversationRunning={isAiRespondingRef.current || isSimulating} />
                    <BranchNavigator branches={branches} activeBranchId={activeBranchId} onSelectBranch={handleSelectBranch} onDeleteBranch={handleDeleteBranch} isConversationRunning={isAiRespondingRef.current || isSimulating} />
                    <ConversationSummary summary={summary} isSummarizing={isSummarizing} onGenerate={handleGenerateSummary} />
                </aside>

                <main className={`component-bezel flex flex-col min-h-0 ${isControlsVisible ? 'hidden' : 'flex'} lg:flex lg:col-span-2 xl:col-span-2`}>
                    <div className="p-3 border-b border-[var(--codex-border)] space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div>
                                <label htmlFor="topic" className={labelStyles}>Conversation Topic</label>
                                <div className="flex gap-2">
                                <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={`${baseInputStyles} flex-1`} disabled={isAiRespondingRef.current || isSimulating || isRandomizingTopic} />
                                 <button onClick={handleRandomizeTopic} disabled={isAiRespondingRef.current || isSimulating || isRandomizingTopic} className="p-2 border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200 disabled:opacity-50" title="Randomize Topic"><Dices size={16} className={isRandomizingTopic ? 'animate-spin' : ''}/></button>
                                </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label htmlFor="conv-type" className={labelStyles}>Conversation Type</label>
                                   <select id="conv-type" value={conversationType} onChange={e => setConversationType(e.target.value)} className={customSelectStyles} disabled={isAiRespondingRef.current || isSimulating}>
                                       {CONVERSATION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label htmlFor="conv-tone" className={labelStyles}>Start Tone</label>
                                   <select id="conv-tone" value={conversationStartTone} onChange={e => setConversationStartTone(e.target.value)} className={customSelectStyles} disabled={isAiRespondingRef.current || isSimulating}>
                                        {CONVERSATION_START_TONES.map(tone => <option key={tone} value={tone}>{tone}</option>)}
                                   </select>
                               </div>
                           </div>
                        </div>
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[var(--codex-border)]/50">
                              <div className="flex items-center gap-2">
                                  <button onClick={handleNewSession} disabled={isAiRespondingRef.current || isSimulating} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200 disabled:opacity-50" title="Start a completely new session"><FilePlus size={14}/> New</button>
                                  <button onClick={handleClearSession} disabled={isAiRespondingRef.current || isSimulating || activeBranch.messages.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--codex-border)] text-gray-300 hover:bg-[var(--codex-border)] hover:text-[var(--codex-cyan)] transition duration-200 disabled:opacity-50" title="Clear messages in the current timeline"><Trash2 size={14}/> Clear</button>
                                  <ExportControls messages={activeBranch.messages} branchName={activeBranch.name} />
                              </div>
                               <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                   <input type="checkbox" checked={showMonologues} onChange={() => setShowMonologues(!showMonologues)} className="sr-only peer" />
                                   <div className="w-11 h-6 bg-gray-700 border border-[var(--codex-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--codex-accent)] peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-500 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--codex-cyan)] peer-checked:after:border-white"></div>
                                   <span className="ml-3 text-sm font-medium text-[var(--codex-cyan)]/80">Monologues</span>
                                 </label>
                              </div>
                         </div>
                         <div className="flex flex-wrap justify-between items-center gap-y-3 gap-x-6 pt-3 border-t border-[var(--codex-border)]/50">
                              <div className="flex items-center gap-3">
                                <label htmlFor="max-turns" className="text-sm text-[var(--codex-cyan)]/80">Turns:</label>
                                <input type="number" id="max-turns" value={maxTurns} onChange={(e) => setMaxTurns(Math.max(1, parseInt(e.target.value, 10) || 1))} className={`${baseInputStyles} w-16 p-1 text-center`} disabled={isSimulating} min="1" />
                                <label htmlFor="msgs-per-turn" className="text-sm text-[var(--codex-cyan)]/80">Msgs/Turn:</label>
                                <select id="msgs-per-turn" value={messagesPerTurn} onChange={e => setMessagesPerTurn(parseInt(e.target.value, 10))} className={`${customSelectStyles} w-16 p-1 text-center`} disabled={isSimulating}>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                </select>
                              </div>
                               <PlaybackControls isPlaying={isPlayingBack} setIsPlaying={setIsPlayingBack} speed={playbackSpeed} setSpeed={setPlaybackSpeed} onReset={handleResetPlayback} isDisabled={isAiRespondingRef.current || isSimulating || activeBranch.messages.length < 2} />
                               <AudioPlaybackControls
                                    isPlaying={isAudioPlaying}
                                    isGenerating={isGeneratingDownload}
                                    onPlay={handlePlayAudio}
                                    onPause={handlePauseAudio}
                                    onStop={handleStopAudio}
                                    onDownload={handleDownloadAudio}
                                    isDisabled={isAiRespondingRef.current || isSimulating || activeBranch.messages.length === 0}
                               />
                         </div>
                    </div>
                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto min-h-0">
                        <div className={`w-full transition-opacity duration-300 ${isBranchTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                            {visibleMessages.map((message, index) => (
                                <ChatBubble 
                                    key={message.id} 
                                    message={message} 
                                    persona1Name={persona1.name} 
                                    isConversationRunning={isAiRespondingRef.current || isSimulating} 
                                    onFork={handleFork} 
                                    onVote={handleVote} 
                                    showMonologues={showMonologues} 
                                    onVisualizeConcept={handleVisualizeConcept} 
                                    isCurrentlySpoken={!isGeneratingDownload && isAudioPlaying && currentAudioIndex === index}
                                />
                            ))}
                             {isUserTyping && !isAiRespondingRef.current && (
                                <ChatBubble
                                    message={{
                                        id: 'typing-indicator',
                                        author: activePersona === 'p1' ? persona1.name : persona2.name,
                                        text: '...',
                                        isInternalMonologue: false,
                                        isLoading: true,
                                    }}
                                    persona1Name={persona1.name}
                                    isConversationRunning={false}
                                    onFork={() => {}}
                                    onVote={() => {}}
                                    showMonologues={true}
                                    onVisualizeConcept={() => {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="p-2 border-t border-[var(--codex-border)]">
                       <form onSubmit={handleFormAction} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={handleUserTyping}
                                placeholder={isAiRespondingRef.current ? "Awaiting response..." : isSimulating ? `Simulation in progress... (Turn ${currentTurn}/${maxTurns})` : `Type to interrupt, or press Play...`}
                                disabled={isAiRespondingRef.current || isSimulating}
                                className="flex-1 w-full bg-black/50 border border-[var(--codex-border)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--codex-accent)] focus:border-[var(--codex-border-glow)] transition-all duration-200 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isAiRespondingRef.current}
                                className="p-2.5 border border-[var(--codex-accent)] text-[var(--codex-accent)] transition-all duration-200 enabled:hover:bg-[var(--codex-accent)] enabled:hover:text-black enabled:hover:shadow-[0_0_10px_var(--codex-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={isSimulating ? "Stop simulation" : userInput.trim() ? "Send message" : "Start simulation"}
                                title={isSimulating ? "Stop simulation" : userInput.trim() ? "Send message" : "Start simulation"}
                            >
                                {isSimulating ? <StopCircle size={20} /> : (userInput.trim() ? <Send size={20} /> : <Play size={20} />)}
                            </button>
                       </form>
                    </div>
                </main>
                
                 <aside className="hidden xl:block lg:col-span-1 component-bezel p-2 min-h-0 flex flex-col">
                    <ConversationVisualizer persona1={persona1} persona2={persona2} branches={branches} activeBranchId={activeBranchId} argumentMapData={argumentMapData} isMappingArguments={isMappingArguments} onGenerateArgumentMap={handleGenerateArgumentMap} />
                </aside>
            </div>
            
            {visualizationData && (<VisualizationModal data={visualizationData} onClose={() => setVisualizationData(null)} />)}
            {isApiModalOpen && (<ApiConfigModal initialKeys={apiKeys} onSave={handleSaveApiKeys} onClose={() => setIsApiModalOpen(false)} />)}
            {isCodexOpen && (<CodexPanel topic={topic} onClose={() => setIsCodexOpen(false)} />)}
            
            {(isPreparingDownload || isGeneratingDownload) && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="component-bezel w-full max-w-lg flex flex-col p-4 text-center">
                        <h2 className="text-xl font-bold text-[var(--codex-gold)] tracking-widest mb-3">
                           {isGeneratingDownload ? 'Generating Audio File...' : 'Prepare Audio Download'}
                        </h2>
                        {isGeneratingDownload ? (
                            <p className="text-gray-300">Recording in progress. Please do not navigate away. The file will be downloaded automatically when complete.</p>
                        ) : (
                            <>
                               <p className="text-gray-300 mb-4">
                                This process requires capturing your browser tab's audio output. The entire conversation will be played aloud while it's being recorded.
                               </p>
                                <p className="text-xs text-amber-400/80 mb-4">You will be prompted for permission to share your tab's audio. Please ensure you select the correct tab.</p>
                               <div className="flex justify-center gap-4">
                                   <button onClick={() => setIsPreparingDownload(false)} className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700">Cancel</button>
                                   <button onClick={confirmDownload} className="px-4 py-2 border border-[var(--codex-gold)] text-[var(--codex-gold)] hover:bg-[var(--codex-gold)] hover:text-black">Proceed</button>
                               </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;