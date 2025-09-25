import React from 'react';
import { Message } from '../types';

interface InfluenceMeterProps {
  messages: Message[];
  persona1Name: string;
  persona2Name: string;
}

const InfluenceMeter: React.FC<InfluenceMeterProps> = ({ messages, persona1Name, persona2Name }) => {
  const scores = messages
    .filter(m => !m.isInternalMonologue && m.influenceScore !== undefined)
    .reduce((acc, msg) => {
      acc[msg.author] = (acc[msg.author] || 0) + msg.influenceScore!;
      return acc;
    }, {} as Record<string, number>);

  const p1Score = scores[persona1Name] || 0;
  const p2Score = scores[persona2Name] || 0;
  const totalScore = p1Score + p2Score;

  const p1Percentage = totalScore > 0 ? (p1Score / totalScore) * 100 : 50;
  
  return (
    <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
      <h4 className="text-md font-semibold text-gray-300 mb-2">Influence Meter</h4>
       <div className="flex w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-indigo-500 h-2.5 rounded-l-full transition-all duration-500" 
            style={{ width: `${p1Percentage}%` }}
            title={`${persona1Name}: ${p1Percentage.toFixed(1)}%`}
          ></div>
          <div 
            className="bg-teal-500 h-2.5 rounded-r-full transition-all duration-500" 
            style={{ width: `${100 - p1Percentage}%` }}
            title={`${persona2Name}: ${(100 - p1Percentage).toFixed(1)}%`}
          ></div>
       </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
            {persona1Name}
        </span>
        <span className="flex items-center">
            {persona2Name}
            <span className="w-2 h-2 rounded-full bg-teal-400 ml-2"></span>
        </span>
      </div>
    </div>
  );
};

export default InfluenceMeter;
