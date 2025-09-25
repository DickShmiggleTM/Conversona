import React, { useMemo } from 'react';
import { ConversationBranch } from '../types';

interface TopicFlowChartProps {
  branches: ConversationBranch[];
  activeBranchId: string;
  persona1Name: string;
  persona2Name: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  branchId: string;
}

interface Edge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  branchId: string;
}

const NODE_WIDTH = 100;
const NODE_HEIGHT = 40;
const X_SPACING = 140;
const Y_SPACING = 90;

const TopicFlowChart: React.FC<TopicFlowChartProps> = ({ branches, activeBranchId, persona1Name, persona2Name }) => {
  const { nodes, edges, width, height } = useMemo(() => {
    if (!branches.length) return { nodes: [], edges: [], width: 0, height: 0 };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, Node>();
    const branchDepths = new Map<string, number>();

    const calculateBranchDepth = (branchId: string): number => {
      if (branchId === 'main') return 0;
      if (branchDepths.has(branchId)) return branchDepths.get(branchId)!;

      const branch = branches.find(b => b.id === branchId);
      if (!branch || !branch.parentBranchId) return 1;

      const depth = calculateBranchDepth(branch.parentBranchId) + 1;
      branchDepths.set(branchId, depth);
      return depth;
    };

    branches.forEach(b => calculateBranchDepth(b.id));

    let maxX = 0;
    let maxY = 0;

    const sortedBranches = [...branches].sort((a, b) => (branchDepths.get(a.id) ?? 0) - (branchDepths.get(b.id) ?? 0));

    sortedBranches.forEach(branch => {
      const parentNode = branch.parentId ? nodeMap.get(branch.parentId) : null;
      let startX = 20;
      if (parentNode) {
        startX = parentNode.x;
      }
      
      const yPos = (branchDepths.get(branch.id) ?? 0) * Y_SPACING + 40;
      let lastNodeInBranch: Node | null = parentNode;

      const newMessages = branch.messages.filter(msg => !nodeMap.has(msg.id));
      
      if (parentNode && newMessages.length > 0) {
           const firstNewNode = newMessages[0];
           const firstNodeX = parentNode.x + X_SPACING;
           const firstNodeY = yPos;
           edges.push({
                id: `edge-${parentNode.id}-${firstNewNode.id}`,
                sourceX: parentNode.x,
                sourceY: parentNode.y,
                targetX: firstNodeX,
                targetY: firstNodeY,
                branchId: branch.id,
            });
            startX = parentNode.x;
      }


      newMessages.forEach((msg, index) => {
        const xPos = startX + (index + 1) * X_SPACING;
        const node: Node = {
          id: msg.id,
          x: xPos,
          y: yPos,
          text: msg.text.substring(0, 15) + (msg.text.length > 15 ? '...' : ''),
          author: msg.author,
          branchId: branch.id,
        };

        nodes.push(node);
        nodeMap.set(msg.id, node);

        if (lastNodeInBranch) {
          edges.push({
            id: `edge-${lastNodeInBranch.id}-${node.id}`,
            sourceX: lastNodeInBranch.x,
            sourceY: lastNodeInBranch.y,
            targetX: node.x,
            targetY: node.y,
            branchId: branch.id,
          });
        }
        lastNodeInBranch = node;
        maxX = Math.max(maxX, xPos);
        maxY = Math.max(maxY, yPos);
      });
    });

    return { nodes, edges, width: maxX + NODE_WIDTH + 40, height: maxY + NODE_HEIGHT + 40 };
  }, [branches]);

  const allMessages = branches.flatMap(b => b.messages);
  if (allMessages.length < 2) {
    return (
      <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-300 mb-2">Topic Flow Chart</h4>
        <div className="flex items-center justify-center h-28 bg-gray-700/50 rounded-md">
          <p className="text-gray-500 text-sm">More messages needed for chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
      <h4 className="text-md font-semibold text-gray-300 mb-2">Topic Flow Chart</h4>
      <div className="w-full overflow-x-auto bg-gray-800/30 p-2 rounded-md">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
          </defs>
          {edges.map(edge => {
            const isActive = edge.branchId === activeBranchId;
            const strokeColor = isActive ? '#a78bfa' : '#4b5563'; // Indigo-300 vs Gray-600
            return (
               <line
                  key={edge.id}
                  x1={edge.sourceX + NODE_WIDTH / 2}
                  y1={edge.sourceY}
                  x2={edge.targetX - NODE_WIDTH / 2}
                  y2={edge.targetY}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 1.5 : 1}
                  markerEnd="url(#arrowhead)"
                  opacity={isActive ? 1 : 0.7}
               />
            );
          })}
          {nodes.map(node => {
            const isPersona1 = node.author === persona1Name;
            const isActive = node.branchId === activeBranchId;
            const fill = isPersona1 
                ? (isActive ? 'hsl(231, 86%, 68%)' : 'hsl(231, 48%, 38%)')
                : (isActive ? 'hsl(167, 86%, 60%)' : 'hsl(167, 48%, 30%)');
            const stroke = isPersona1
                ? (isActive ? 'hsl(231, 86%, 78%)' : 'hsl(231, 48%, 48%)')
                : (isActive ? 'hsl(167, 86%, 70%)' : 'hsl(167, 48%, 40%)');

            const fullMessage = allMessages.find(m => m.id === node.id)?.text;

            return (
              <g key={node.id} transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y - NODE_HEIGHT / 2})`} className="transition-all duration-300">
                 <title>{`${node.author}:\n${fullMessage}`}</title>
                 <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="8"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1.5"
                 />
                 <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none"
                 >
                    {node.text}
                 </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default TopicFlowChart;
