import React from 'react';
import { GitFork, Trash2 } from 'lucide-react';
import { ConversationBranch } from '../types';

interface BranchNavigatorProps {
  branches: ConversationBranch[];
  activeBranchId: string;
  onSelectBranch: (id: string) => void;
  onDeleteBranch: (id: string) => void;
  isConversationRunning: boolean;
}

const BranchNavigator: React.FC<BranchNavigatorProps> = ({ branches, activeBranchId, onSelectBranch, onDeleteBranch, isConversationRunning }) => {
  return (
    <div className="p-3">
      <h3 className="text-lg font-bold text-[var(--primary-color)] mb-2 flex items-center uppercase tracking-widest">
        <GitFork className="mr-2" size={16} />
        Timelines
      </h3>
      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
        {branches.map(branch => (
          <div
            key={branch.id}
            onClick={() => onSelectBranch(branch.id)}
            className={`flex justify-between items-center p-2 border-l-2 transition-all duration-200 group ${
              activeBranchId === branch.id
                ? 'border-[var(--primary-color)] bg-black/50 text-[var(--primary-color)]'
                : 'border-transparent hover:bg-black/30 hover:border-[var(--panel-border)] text-gray-400'
            } ${isConversationRunning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <span className="text-sm font-medium truncate">{branch.name}</span>
            {branch.id !== 'main' && !isConversationRunning && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBranch(branch.id);
                }}
                className="text-gray-500 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                aria-label={`Delete branch ${branch.name}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {branches.length === 0 && <p className="text-sm text-gray-500 px-2 italic">No branches yet.</p>}
      </div>
    </div>
  );
};

export default BranchNavigator;