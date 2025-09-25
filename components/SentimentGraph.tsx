import React from 'react';
import { Message } from '../types';

interface SentimentGraphProps {
  messages: Message[];
  persona1Name: string;
  persona2Name: string;
}

const SentimentGraph: React.FC<SentimentGraphProps> = ({ messages, persona1Name, persona2Name }) => {
  const dataPoints = messages
    .filter(m => !m.isInternalMonologue && !m.isLoading && m.sentiment !== undefined)
    .map(m => ({ author: m.author, sentiment: m.sentiment! }));

  const width = 300;
  const height = 100;
  const padding = 20;

  const getPoints = (personaName: string) => {
      const points: {x: number, y: number}[] = [];
      const relevantMessages = dataPoints.filter(p => p.author === personaName);
      if (relevantMessages.length <= 1 && dataPoints.length > 1) {
           // Create a single point in the middle if only one message exists
          const index = dataPoints.findIndex(p => p.author === personaName);
          const x = padding + index * (width - 2 * padding) / (dataPoints.length -1);
          const y = height / 2 - relevantMessages[0].sentiment * (height / 2 - padding);
          return [{x, y}];
      }

      dataPoints.forEach((point, index) => {
          if (point.author === personaName) {
              const x = padding + (dataPoints.length > 1 ? (index * (width - 2 * padding) / (dataPoints.length - 1)) : (width - 2 * padding) / 2);
              const y = height / 2 - point.sentiment * (height / 2 - padding);
              points.push({x, y});
          }
      });
      return points;
  }
  
  const persona1Points = getPoints(persona1Name);
  const persona2Points = getPoints(persona2Name);

  const toPathString = (points: {x: number, y: number}[]) => {
      if (points.length === 0) return '';
      return 'M ' + points.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
  }

  const path1 = toPathString(persona1Points);
  const path2 = toPathString(persona2Points);


  return (
    <div className="mt-4 p-2 bg-black/30 border border-[var(--codex-border)]">
      <h4 className="text-md font-semibold text-[var(--codex-cyan)]/80 mb-2 text-center tracking-wider">Sentiment Analysis Graph</h4>
      {dataPoints.length < 1 ? (
        <div className="flex items-center justify-center h-28 bg-black/50">
          <p className="text-gray-500 text-sm">Awaiting sentiment data...</p>
        </div>
      ) : (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y Axis Line */}
                <line x1={padding} y1={padding/2} x2={padding} y2={height-padding/2} stroke="var(--codex-border)" strokeWidth="0.5" />
                {/* Mid Line (Neutral) */}
                <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--codex-border)" strokeWidth="0.5" strokeDasharray="2,2" />
                
                {/* Paths */}
                <path d={path1} fill="none" stroke="var(--codex-persona1-pri)" strokeWidth="1.5" />
                <path d={path2} fill="none" stroke="var(--codex-persona2-pri)" strokeWidth="1.5" />

                {/* Points */}
                {persona1Points.map((p, i) => <circle key={`p1-${i}`} cx={p.x} cy={p.y} r="2" fill="var(--codex-persona1-pri)" />)}
                {persona2Points.map((p, i) => <circle key={`p2-${i}`} cx={p.x} cy={p.y} r="2" fill="var(--codex-persona2-pri)" />)}
            </svg>
            <div className="absolute top-0 left-0 text-xs text-gray-400">+1.0</div>
             <div className="absolute left-0" style={{top: 'calc(50% - 8px)'}}><span className="text-xs text-gray-400">0.0</span></div>
            <div className="absolute bottom-0 left-0 text-xs text-gray-400">-1.0</div>
        </div>
      )}
      <div className="flex justify-center space-x-4 mt-2 text-xs">
          <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[var(--codex-persona1-pri)] mr-2"></span>
              <span>{persona1Name}</span>
          </div>
          <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[var(--codex-persona2-pri)] mr-2"></span>
              <span>{persona2Name}</span>
          </div>
      </div>
    </div>
  );
};

export default SentimentGraph;