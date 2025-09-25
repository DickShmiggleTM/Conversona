import React, { useState, useEffect, useMemo } from 'react';
import { GitFork, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '../types';
import CodeBlock from './CodeBlock';
import ConceptTooltip from './ConceptTooltip';
import { CONCEPTS } from '../data/concepts';

interface ChatBubbleProps {
  message: Message;
  persona1Name: string;
  isConversationRunning: boolean;
  onFork: (messageId: string) => void;
  onVote: (messageId: string, vote: number) => void;
  showMonologues: boolean;
  onVisualizeConcept: (concept: string) => void;
  isCurrentlySpoken?: boolean;
}

const conceptKeys = Object.keys(CONCEPTS);
const conceptRegex = new RegExp(`\\b(${conceptKeys.join('|')})\\b`, 'gi');

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-3">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
    </div>
);

const parseMessage = (text: string, onVisualizeConcept: (concept: string) => void): (string | React.ReactNode)[] => {
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;

    while ((codeMatch = codeRegex.exec(text)) !== null) {
        if (codeMatch.index > lastIndex) {
            const textSegment = text.substring(lastIndex, codeMatch.index);
            parts.push(...parseTextForConcepts(textSegment, onVisualizeConcept));
        }
        parts.push(<CodeBlock key={`code-${lastIndex}`} language={codeMatch[1] || 'text'} code={codeMatch[2]} />);
        lastIndex = codeMatch.index + codeMatch[0].length;
    }

    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        parts.push(...parseTextForConcepts(remainingText, onVisualizeConcept));
    }

    return parts;
};

const parseTextForConcepts = (text: string, onVisualizeConcept: (concept: string) => void): (string | React.ReactNode)[] => {
    if (conceptKeys.length === 0) return [text];
    
    const parts: (string | React.ReactNode)[] = [];
    
    text.split(conceptRegex).forEach((part, index) => {
        if (index % 2 === 1) { 
            parts.push(<ConceptTooltip key={`concept-${index}`} concept={part.toLowerCase()} onVisualize={onVisualizeConcept}>{part}</ConceptTooltip>);
        } else if (part) {
            parts.push(part);
        }
    });

    return parts;
};


const ChatBubble: React.FC<ChatBubbleProps> = ({ message, persona1Name, isConversationRunning, onFork, onVote, showMonologues, onVisualizeConcept, isCurrentlySpoken }) => {
  const isUser = message.author === 'User';
  const isPersona1 = message.author === persona1Name;
  const [displayText, setDisplayText] = useState('');
  const [isDoneTyping, setIsDoneTyping] = useState(false);

  useEffect(() => {
    if (message.isLoading || !message.text || message.text === '...') {
      setDisplayText('');
      setIsDoneTyping(false);
      return;
    }
    
    let i = 0;
    const fullText = message.text;

    // Instantly show full text for user, or if not in a live conversation, or if it's an old message
    if (isUser || !isConversationRunning || isDoneTyping) {
      setDisplayText(fullText);
      setIsDoneTyping(true);
      return;
    }

    setDisplayText('');
    const intervalId = setInterval(() => {
        if (i < fullText.length) {
            setDisplayText(fullText.substring(0, i + 1));
            i++;
        } else {
            clearInterval(intervalId);
            setIsDoneTyping(true);
        }
    }, 20);

    return () => clearInterval(intervalId);
  }, [message.id, message.text, message.isLoading, isConversationRunning, isUser]);

  const contentParts = useMemo(() => parseMessage(displayText, onVisualizeConcept), [displayText, onVisualizeConcept]);
  
  const sentimentStyle = useMemo(() => {
    if (typeof message.sentiment !== 'number') return {};
    const intensity = Math.min(Math.abs(message.sentiment) * 0.8 + 0.2, 1);
    const color = message.sentiment > 0 
        ? `rgba(74, 222, 128, ${intensity})`
        : `rgba(248, 113, 113, ${intensity})`;
    
    if (isPersona1) {
      return { borderRight: `3px solid ${color}` };
    } else if (!isUser) {
      return { borderLeft: `3px solid ${color}` };
    }
    return {};
  }, [message.sentiment, isPersona1, isUser]);

  let bubbleClasses = '';
  if (isUser) {
    bubbleClasses = 'border-[var(--codex-gold)]/80 text-[var(--codex-gold)] self-center bg-gradient-to-t from-[var(--codex-gold)]/10 to-transparent shadow-[0_0_15px_-3px_var(--codex-gold),0_4px_6px_-4px_var(--codex-gold)]';
  } else if (isPersona1) {
    bubbleClasses = 'border-[var(--codex-persona1-pri)]/80 text-[var(--codex-persona1-sec)] self-end bg-gradient-to-br from-[var(--codex-persona1-pri)]/10 to-transparent shadow-[0_0_15px_-3px_var(--codex-persona1-pri),0_4px_6px_-4px_var(--codex-persona1-pri)]';
  } else {
    bubbleClasses = 'border-[var(--codex-persona2-pri)]/80 text-[var(--codex-persona2-sec)] self-start bg-gradient-to-bl from-[var(--codex-persona2-pri)]/10 to-transparent shadow-[0_0_15px_-3px_var(--codex-persona2-pri),0_4px_6px_-4px_var(--codex-persona2-pri)]';
  }

  if (isCurrentlySpoken) {
      bubbleClasses += ' ring-2 ring-offset-2 ring-offset-[var(--codex-bg-deep)] ring-[var(--codex-gold)]';
  }
  
  if (message.isInternalMonologue && !showMonologues) {
      return null;
  }
  
  const containerAlignment = isUser ? 'items-center' : isPersona1 ? 'items-end' : 'items-start';

  const isForkable = !message.isInternalMonologue && !message.isLoading && message.author !== 'System' && !isUser;
  
  if (message.author === 'System') {
      return (
          <div className={`my-2 p-3 border-l-2 border-[var(--codex-gold)]/50 text-gray-400 self-center w-full max-w-[85%] md:max-w-[75%] text-sm animate-fade-in-up bg-black/20`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
      );
  }

  if (message.isInternalMonologue) {
    const title = `// ${message.author} Internal Monologue //`;
    return (
      <div className={`w-full flex flex-col my-2 p-3 text-sm animate-fade-in-up bg-black/30 border-t border-b border-dashed border-[var(--codex-gold)]/30 text-[var(--codex-gold)]/80`}>
        <div className={`font-bold text-[var(--codex-gold)] mb-2 text-xs uppercase tracking-widest`}>{title}</div>
        <pre className="text-xs italic whitespace-pre-wrap opacity-70">{message.isLoading ? <TypingIndicator /> : message.text}</pre>
      </div>
    );
  }
  
  return (
    <div 
        className={`group w-full flex flex-col my-2 max-w-[85%] md:max-w-[75%] ${containerAlignment} animate-fade-in-up`}
        title={typeof message.sentiment === 'number' ? `Sentiment: ${message.sentiment.toFixed(2)}` : undefined}
    >
      <div className={`font-bold text-xs mb-1 px-1 tracking-widest ${isUser ? 'text-[var(--codex-gold)]' : isPersona1 ? 'text-[var(--codex-persona1-pri)]' : 'text-[var(--codex-persona2-pri)]'}`}>{message.author}</div>
      <div 
        className={`relative p-3 bg-black/50 border transition-shadow duration-300 ${bubbleClasses}`}
        style={{
            clipPath: isUser ? 'polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)' : isPersona1 ? 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' : 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
            ...sentimentStyle
        }}>
        {isForkable && !isConversationRunning && (
           <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1/2 translate-x-1/4 z-10">
                <button
                    onClick={() => onVote(message.id, 1)}
                    className={`p-1.5 border transition-all transform hover:scale-110 active:scale-95 ${message.vote === 1 ? 'bg-green-500 border-green-400 text-white' : 'bg-gray-800 border-gray-600 hover:bg-green-500 hover:border-green-400 text-gray-300'}`}
                > <ThumbsUp size={14} /> </button>
                 <button
                    onClick={() => onVote(message.id, -1)}
                    className={`p-1.5 border transition-all transform hover:scale-110 active:scale-95 ${message.vote === -1 ? 'bg-red-500 border-red-400 text-white' : 'bg-gray-800 border-gray-600 hover:bg-red-500 hover:border-red-400 text-gray-300'}`}
                > <ThumbsDown size={14} /> </button>
                <button
                    onClick={() => onFork(message.id)}
                    className="bg-gray-800 border-gray-600 hover:bg-indigo-500 hover:border-indigo-400 text-gray-300 p-1.5 border transition-all transform hover:scale-110 active:scale-95"
                > <GitFork size={14} /> </button>
            </div>
        )}
        {message.isLoading ? (
          <TypingIndicator />
        ) : (
          <div className="whitespace-pre-wrap">
            {contentParts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}
            {isConversationRunning && !isDoneTyping && !isUser && <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />}
          </div>
        )}
        {message.imageBase64 && (
            <div className="mt-3 border-t border-white/10 pt-3">
                <img 
                    src={`data:image/png;base64,${message.imageBase64}`} 
                    alt="AI generated" 
                    className="max-w-full h-auto border-2 border-white/20"
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;