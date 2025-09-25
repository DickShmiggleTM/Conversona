import React from 'react';
import { KnowledgeGraphData, KnowledgeNode } from '../types';
import useKnowledgeGraphD3 from '../hooks/useKnowledgeGraphD3';

interface KnowledgeGraphPanelProps {
    graphData: KnowledgeGraphData;
    onSelectNode: (node: KnowledgeNode | null) => void;
}

const KnowledgeGraphPanel: React.FC<KnowledgeGraphPanelProps> = ({ graphData, onSelectNode }) => {
    const { ref, width, height } = useKnowledgeGraphD3(graphData, onSelectNode);

    return (
        <div className="w-full h-full bg-black/50 overflow-hidden" ref={ref}>
            <svg width={width} height={height} className="min-w-full min-h-full">
                {/* D3 will render here */}
            </svg>
        </div>
    );
};

export default KnowledgeGraphPanel;
