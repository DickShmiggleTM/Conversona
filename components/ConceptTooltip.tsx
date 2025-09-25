import React from 'react';
import { Eye } from 'lucide-react';
import { CONCEPTS } from '../data/concepts';

interface ConceptTooltipProps {
  children: React.ReactNode;
  concept: string;
  onVisualize: (concept: string) => void;
}

const ConceptTooltip: React.FC<ConceptTooltipProps> = ({ children, concept, onVisualize }) => {
  const definition = CONCEPTS[concept.toLowerCase()] || 'No definition found.';

  return (
    <span className="relative group cursor-help">
      <span className="border-b border-dashed border-sky-400/60 font-bold text-sky-300 hover:text-sky-200 transition">
        {children}
      </span>
      <div className="absolute bottom-full mb-2 w-72 p-2 bg-[var(--background-color)] border border-sky-500/50 text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 left-1/2 -translate-x-1/2">
        <h4 className="font-bold text-sky-400 capitalize mb-1 tracking-widest text-center border-b border-sky-500/30 pb-1">{concept}</h4>
        <p className="text-xs leading-relaxed my-2 px-1">{definition}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onVisualize(concept);
          }}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 text-xs p-1.5 bg-sky-800/50 hover:bg-sky-700/50 border border-sky-500/50 transition-colors"
        >
            <Eye size={14} />
            Visualize Concept
        </button>
      </div>
    </span>
  );
};

export default ConceptTooltip;