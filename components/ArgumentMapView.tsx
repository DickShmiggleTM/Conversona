// Fix: Created placeholder content for ArgumentMapView.tsx.
import React from 'react';
import { Zap } from 'lucide-react';
import { ArgumentMapData } from '../types';
import useD3Graph from '../hooks/useD3Graph';
import Spinner from './Spinner';

interface ArgumentMapViewProps {
    mapData: ArgumentMapData | null;
    isMapping: boolean;
    onGenerate: () => void;
    persona1Name: string;
    persona2Name: string;
}

const ArgumentMapView: React.FC<ArgumentMapViewProps> = ({ mapData, isMapping, onGenerate, persona1Name, persona2Name }) => {
    
    // d3 expects links, not edges. The hook handles this.
    const graphData = mapData ? { nodes: mapData.nodes, links: mapData.edges } : null;

    const graphRef = useD3Graph(graphData, { 
        width: 400, 
        height: 300, 
        persona1Name,
        persona2Name,
    });

    return (
        <div className="p-2 bg-black/30 border border-[var(--panel-border)]">
            <h4 className="text-md font-semibold text-[var(--primary-color)]/80 mb-3 text-center tracking-wider">Logical Structure</h4>
            
            {isMapping ? (
                <div className="flex flex-col items-center justify-center h-72 bg-black/50">
                    <Spinner />
                    <p className="mt-2 text-sm text-[var(--primary-color)]/70 uppercase tracking-widest">Deconstructing Arguments...</p>
                </div>
            ) : mapData ? (
                 <div className="flex items-center justify-center h-72 bg-black/50 border border-[var(--panel-border)]/50">
                     <svg ref={graphRef} width="100%" height="100%" viewBox="0 0 400 300" />
                 </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-72 bg-black/50 space-y-3">
                    <p className="text-sm text-center text-gray-400/80">
                        Generate an AI-powered map of the conversation's logical flow.
                    </p>
                    <button
                        onClick={onGenerate}
                        disabled={isMapping}
                        className="w-full px-4 py-1.5 border-2 border-[var(--primary-color)] text-[var(--primary-color)] font-bold text-sm transition flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-[var(--primary-color)] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <Zap size={14} />
                         Generate Map
                    </button>
                </div>
            )}
        </div>
    );
};

export default ArgumentMapView;