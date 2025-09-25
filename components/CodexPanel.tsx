import React, { useState, useEffect } from 'react';
import { X, Share2, BrainCircuit, View } from 'lucide-react';
import { KnowledgeGraphData, KnowledgeNode } from '../types';
import { getKnowledgeGraph, expandKnowledgeGraphNode } from '../services/geminiService';
import Spinner from './Spinner';
import CodexSymbol from './CodexSymbol';
import KnowledgeGraphPanel from './KnowledgeGraphPanel';
import KnowledgeGraph3D from './KnowledgeGraph3D';

interface CodexPanelProps {
    topic: string;
    onClose: () => void;
}

const CodexPanel: React.FC<CodexPanelProps> = ({ topic, onClose }) => {
    const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    useEffect(() => {
        const fetchGraph = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getKnowledgeGraph(topic);
                if (data.nodes.length === 0) {
                    setError("Could not generate a knowledge graph for this topic.");
                } else {
                    setGraphData(data);
                }
            } catch (err) {
                setError("An unexpected error occurred while fetching the graph.");
                console.error(err);
            }
            setIsLoading(false);
        };
        fetchGraph();
    }, [topic]);

    const handleGoDeeper = async () => {
        if (!selectedNode || isExpanding) return;
        setIsExpanding(true);
        const newData = await expandKnowledgeGraphNode(graphData, selectedNode.id);
        
        // Combine new data with existing, avoiding duplicates
        const existingNodeIds = new Set(graphData.nodes.map(n => n.id));
        const uniqueNewNodes = newData.nodes.filter(n => !existingNodeIds.has(n.id));
        
        setGraphData(prev => ({
            nodes: [...prev.nodes, ...uniqueNewNodes],
            edges: [...prev.edges, ...newData.edges],
        }));
        
        setIsExpanding(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex animate-fade-in" style={{'--tw-bg-opacity': 0.95}}>
            <div className="flex-1 flex flex-col component-bezel m-4 p-0">
                <header className="flex justify-between items-center p-3 border-b-2 border-[var(--codex-border)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <CodexSymbol className="w-8 h-8 text-[var(--codex-cyan)]" />
                         <div>
                            <h2 className="text-xl font-bold text-[var(--codex-cyan)] tracking-widest">KNOWLEDGE CODEX</h2>
                            <p className="text-xs text-[var(--codex-cyan)]/70">Topic: {topic}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex border border-[var(--codex-border)]">
                            <button onClick={() => setViewMode('2d')} className={`px-3 py-1 text-sm ${viewMode === '2d' ? 'bg-[var(--codex-cyan)] text-black' : 'bg-transparent text-[var(--codex-cyan)]/70'}`}>2D Map</button>
                            <button onClick={() => setViewMode('3d')} className={`px-3 py-1 text-sm ${viewMode === '3d' ? 'bg-[var(--codex-cyan)] text-black' : 'bg-transparent text-[var(--codex-cyan)]/70'}`}>3D Space</button>
                         </div>
                         <button onClick={onClose} className="p-2 text-gray-400 hover:bg-[var(--codex-border)]/30 hover:text-white transition-colors"> <X size={24} /> </button>
                    </div>
                </header>
                <div className="flex-1 flex min-h-0">
                    <div className="flex-[3] bg-black/30 relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"> <Spinner /> <p>Generating Knowledge Graph...</p> </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex items-center justify-center"><p className="text-red-500">{error}</p></div>
                        ) : (
                             viewMode === '2d' 
                                ? <KnowledgeGraphPanel graphData={graphData} onSelectNode={setSelectedNode} />
                                : <KnowledgeGraph3D graphData={graphData} onSelectNode={setSelectedNode} />
                        )}
                    </div>
                    <aside className="flex-1 border-l-2 border-[var(--codex-border)] p-4 overflow-y-auto flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-[var(--codex-gold)] tracking-widest border-b border-[var(--codex-border)] pb-2 flex items-center gap-2"><View/> Node Inspector</h3>
                        {selectedNode ? (
                            <div className="animate-fade-in-up">
                                <h4 className="text-xl font-bold text-[var(--codex-cyan)]">{selectedNode.id}</h4>
                                <p className="text-sm text-gray-300 mt-2 mb-4 h-24 overflow-y-auto">{selectedNode.summary}</p>
                                <button
                                    onClick={handleGoDeeper}
                                    disabled={isExpanding}
                                    className="w-full px-4 py-2 border-2 border-[var(--codex-gold)] text-[var(--codex-gold)] font-bold text-sm transition flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-[var(--codex-gold)] hover:text-black disabled:opacity-50"
                                >
                                    {isExpanding ? <Spinner/> : <BrainCircuit size={16}/>}
                                    {isExpanding ? 'Expanding...' : 'Go Deeper (Rabbit Hole)'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Select a node to inspect its details and explore deeper connections.</p>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default CodexPanel;
