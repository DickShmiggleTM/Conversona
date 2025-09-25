
import React from 'react';
import { BookText } from 'lucide-react';
import Spinner from './Spinner';

interface ConversationSummaryProps {
    summary: string;
    isSummarizing: boolean;
    onGenerate: () => void;
}

const ConversationSummary: React.FC<ConversationSummaryProps> = ({ summary, isSummarizing, onGenerate }) => {
    return (
        <div className="p-3">
            <h3 className="text-lg font-bold text-[var(--primary-color)] mb-2 flex items-center uppercase tracking-widest">
                <BookText size={16} className="mr-2" />
                Summary
            </h3>
            <div className="space-y-2">
                <button
                    onClick={onGenerate}
                    disabled={isSummarizing}
                    className="relative w-full px-4 py-1.5 border border-[var(--primary-color)] text-[var(--primary-color)] font-bold text-sm transition flex items-center justify-center gap-2 uppercase tracking-widest hover:text-black disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                >
                    <span className="absolute left-0 top-0 h-full w-0 transition-all duration-300 ease-out group-hover:w-full bg-[var(--primary-color)]"></span>
                    <span className="relative flex items-center gap-2">
                        {isSummarizing && <Spinner />}
                        {isSummarizing ? 'Generating...' : 'Generate Summary'}
                    </span>
                </button>
                <div className="bg-black/50 border border-[var(--panel-border)] p-2 text-sm min-h-[6rem] max-h-32 overflow-y-auto">
                    {summary ? (
                        <p className="text-gray-300 whitespace-pre-wrap">{summary}</p>
                    ) : (
                        <p className="text-gray-500 italic">
                            {isSummarizing ? 'Analyzing transmission...' : 'Awaiting summary generation command.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationSummary;
