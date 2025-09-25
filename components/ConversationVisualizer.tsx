import React, { useState } from 'react';
import { Persona, ConversationBranch, ArgumentMapData } from '../types';
import InfluenceMeter from './InfluenceMeter';
import SentimentGraph from './SentimentGraph';
import TopicFlowChart from './TopicFlowChart';
import ArgumentMapView from './ArgumentMapView';

interface ConversationVisualizerProps {
    persona1: Persona;
    persona2: Persona;
    branches: ConversationBranch[];
    activeBranchId: string;
    argumentMapData: ArgumentMapData | null;
    isMappingArguments: boolean;
    onGenerateArgumentMap: () => void;
}

const ConversationVisualizer: React.FC<ConversationVisualizerProps> = ({
    persona1,
    persona2,
    branches,
    activeBranchId,
    argumentMapData,
    isMappingArguments,
    onGenerateArgumentMap,
}) => {
    const [activeTab, setActiveTab] = useState<'dynamics' | 'map'>('dynamics');
    const activeBranch = branches.find(b => b.id === activeBranchId);
    const messages = activeBranch?.messages || [];

    const TabButton = ({ tab, label }: { tab: 'dynamics' | 'map', label: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 p-2 text-sm font-bold uppercase tracking-widest transition-colors duration-200 ${
                activeTab === tab 
                    ? 'bg-[var(--codex-border)] text-[var(--codex-bg-deep)]' 
                    : 'bg-black/50 text-[var(--codex-cyan)]/70 hover:bg-black/80 hover:text-[var(--codex-cyan)]'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0">
                <h3 className="text-xl font-bold text-center text-[var(--codex-cyan)] mb-4 uppercase tracking-widest">Analysis Matrix</h3>
                <div className="flex border border-[var(--codex-border)] mb-4">
                    <TabButton tab="dynamics" label="Dynamics" />
                    <TabButton tab="map" label="Argument Map" />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {activeTab === 'dynamics' && (
                    <div className="space-y-4 animate-fade-in-up">
                         <InfluenceMeter
                            messages={messages}
                            persona1Name={persona1.name}
                            persona2Name={persona2.name}
                        />
                        <SentimentGraph
                            messages={messages}
                            persona1Name={persona1.name}
                            persona2Name={persona2.name}
                        />
                        <TopicFlowChart
                            branches={branches}
                            activeBranchId={activeBranchId}
                            persona1Name={persona1.name}
                            persona2Name={persona2.name}
                        />
                    </div>
                )}
                {activeTab === 'map' && (
                    <div className="animate-fade-in-up">
                        <ArgumentMapView
                            mapData={argumentMapData}
                            isMapping={isMappingArguments}
                            onGenerate={onGenerateArgumentMap}
                            persona1Name={persona1.name}
                            persona2Name={persona2.name}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationVisualizer;