import React from 'react';
import { Download } from 'lucide-react';
import { Message } from '../types';

interface ExportControlsProps {
    messages: Message[];
    branchName: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({ messages, branchName }) => {

    const handleExport = () => {
        if (messages.length === 0) return;

        const fileContent = messages
            .filter(msg => !msg.isLoading)
            .map(msg => {
                if (msg.author === 'System') {
                    return `[Director's Note]: ${msg.text}`;
                }
                if (msg.isInternalMonologue) {
                    return `[${msg.author}'s Inner Monologue]:\n${msg.text}`;
                }
                return `${msg.author}:\n${msg.text}`;
            })
            .join('\n\n---\n\n');

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const sanitizedBranchName = branchName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `persona-duel-${sanitizedBranchName}.txt`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={messages.length === 0}
            className="p-2 border border-[var(--panel-border)] text-gray-300 hover:bg-[var(--panel-border)] hover:text-[var(--primary-color)] transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export conversation as .txt"
        >
            <Download size={20} />
        </button>
    );
};

export default ExportControls;