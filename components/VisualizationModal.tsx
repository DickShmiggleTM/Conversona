
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Spinner from './Spinner';

interface VisualizationModalProps {
  data: {
    concept: string;
    definition: string;
    imageBase64: string;
    isLoading: boolean;
  };
  onClose: () => void;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({ data, onClose }) => {
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="component-bezel w-full max-w-xl flex flex-col animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-3 border-b border-[var(--codex-border)]">
                    <h2 className="text-xl font-bold text-sky-400 capitalize tracking-widest">Visualize: {data.concept}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-sky-500/30 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>
                <div className="p-4 flex-grow overflow-y-auto">
                    <div className="aspect-square bg-black/50 border border-sky-500/30 flex items-center justify-center mb-4 p-1">
                        {data.isLoading ? (
                            <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                                <Spinner />
                                <p className="mt-2 uppercase tracking-widest">Generating visual concept...</p>
                            </div>
                        ) : data.imageBase64 ? (
                            <img 
                                src={`data:image/png;base64,${data.imageBase64}`} 
                                alt={`AI visualization of ${data.concept}`}
                                className="object-contain w-full h-full"
                            />
                        ) : (
                             <p className="text-red-400">Image generation failed.</p>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-2 border border-transparent">{data.definition}</p>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                
                @keyframes slide-up {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
