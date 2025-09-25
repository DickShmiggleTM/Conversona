
import React, { useState } from 'react';
import { Brain, Trash2 } from 'lucide-react';

interface MemoryBankProps {
    longTermMemory: string[];
    setLongTermMemory: (updater: (prev: string[]) => string[]) => void;
    isConversationRunning: boolean;
}

const MemoryBank: React.FC<MemoryBankProps> = ({ longTermMemory, setLongTermMemory, isConversationRunning }) => {
    const [newMemory, setNewMemory] = useState('');

    const handleAddMemory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMemory.trim()) {
            setLongTermMemory(prev => [...prev, newMemory.trim()]);
            setNewMemory('');
        }
    };

    const handleDeleteMemory = (index: number) => {
        setLongTermMemory(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={`p-3 transition-opacity duration-300 ${isConversationRunning ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-bold text-[var(--primary-color)] mb-2 flex items-center uppercase tracking-widest"><Brain size={16} className="mr-2" /> Memory Bank</h3>
            <form onSubmit={handleAddMemory} className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={newMemory}
                    onChange={(e) => setNewMemory(e.target.value)}
                    placeholder="Add core memory..."
                    className="flex-grow bg-black/50 border border-[var(--panel-border)] p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--glow-color)] focus:border-[var(--glow-color)]"
                />
                <button type="submit" className="relative px-3 py-1 bg-black border border-[var(--primary-color)] text-[var(--primary-color)] font-bold text-sm transition-colors hover:bg-[var(--primary-color)] hover:text-black hover:shadow-[0_0_10px_var(--primary-color)] group overflow-hidden">
                   <span className="absolute left-0 top-0 h-full w-0 transition-all duration-300 ease-out group-hover:w-full bg-[var(--primary-color)]"></span>
                   <span className="relative">Add</span>
                </button>
            </form>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {longTermMemory.length === 0 && <p className="text-sm text-gray-500 italic px-2">No long-term memories stored.</p>}
                {longTermMemory.map((memory, index) => (
                    <div key={index} className="flex justify-between items-center bg-black/30 p-2 border border-transparent hover:border-[var(--panel-border)]/50 text-sm group">
                        <span className="truncate pr-2 text-gray-300">{memory}</span>
                        <button onClick={() => handleDeleteMemory(index)} className="text-gray-500 hover:text-red-500 transition-colors p-1 flex-shrink-0 opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemoryBank;
