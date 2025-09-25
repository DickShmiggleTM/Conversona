import React, { useState, useEffect } from 'react';
import { X, Save, Wifi, WifiOff } from 'lucide-react';
import { ApiKeys } from '../types';
import Spinner from './Spinner';

interface ApiConfigModalProps {
    initialKeys: ApiKeys;
    onSave: (keys: ApiKeys) => void;
    onClose: () => void;
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ initialKeys, onSave, onClose }) => {
    const [keys, setKeys] = useState(initialKeys);
    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    useEffect(() => {
        const checkOllama = async () => {
            try {
                const response = await fetch('http://localhost:11434/api/tags');
                if (response.ok) {
                    const data = await response.json();
                    setOllamaStatus('connected');
                    setOllamaModels(data.models.map((m: any) => m.name));
                } else {
                    setOllamaStatus('disconnected');
                }
            } catch (error) {
                setOllamaStatus('disconnected');
            }
        };
        checkOllama();
    }, []);

    const handleSave = () => {
        onSave(keys);
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const inputStyles = "w-full bg-black/50 border border-[var(--panel-border)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--glow-color)] focus:bg-black";
    const labelStyles = "block text-xs font-bold uppercase tracking-widest text-[var(--primary-color)]/80 mb-1";

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ animation: 'fade-in 0.3s ease-out forwards' }}
            onClick={onClose}
        >
            <div 
                className="component-bezel w-full max-w-lg flex flex-col"
                style={{ animation: 'slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-3 border-b-2 border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold text-[var(--primary-color)] tracking-widest">API Keys & Connections</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-[var(--panel-border)]/30 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>
                
                <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                    {/* Remote Providers */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--glow-color)] mb-2 tracking-wider">Remote Providers</h3>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="cohere-key" className={labelStyles}>Cohere API Key</label>
                                <input type="password" id="cohere-key" name="cohere" value={keys.cohere} onChange={handleKeyChange} className={inputStyles} />
                            </div>
                             <div>
                                <label htmlFor="mistral-key" className={labelStyles}>Mistral API Key</label>
                                <input type="password" id="mistral-key" name="mistral" value={keys.mistral} onChange={handleKeyChange} className={inputStyles} />
                            </div>
                             <div>
                                <label htmlFor="openrouter-key" className={labelStyles}>OpenRouter API Key</label>
                                <input type="password" id="openrouter-key" name="openrouter" value={keys.openrouter} onChange={handleKeyChange} className={inputStyles} />
                            </div>
                        </div>
                    </div>
                    {/* Local Provider */}
                     <div className="pt-4 border-t border-[var(--panel-border)]">
                        <h3 className="text-lg font-semibold text-[var(--glow-color)] mb-2 tracking-wider">Local Provider (Ollama)</h3>
                        <div className="bg-black/50 p-3 border border-[var(--panel-border)]">
                           <div className="flex items-center gap-3 mb-2">
                               {ollamaStatus === 'checking' && <Spinner />}
                               {ollamaStatus === 'connected' && <Wifi className="text-green-400" />}
                               {ollamaStatus === 'disconnected' && <WifiOff className="text-red-400" />}
                               <div>
                                   <p className="font-bold text-base">Status: 
                                    <span className={ollamaStatus === 'connected' ? 'text-green-400' : ollamaStatus === 'disconnected' ? 'text-red-400' : ''}>
                                       {ollamaStatus.charAt(0).toUpperCase() + ollamaStatus.slice(1)}
                                    </span>
                                   </p>
                                   <p className="text-xs text-gray-400">@ http://localhost:11434</p>
                               </div>
                           </div>
                           {ollamaStatus === 'connected' && (
                               <div>
                                   <h4 className="text-sm font-bold text-[var(--primary-color)]/80 uppercase tracking-widest mt-3 mb-1">Detected Models:</h4>
                                   <div className="max-h-24 overflow-y-auto bg-black/30 p-2 text-xs font-mono space-y-1">
                                    {ollamaModels.length > 0 ? ollamaModels.map(m => <div key={m}>{m}</div>) : <p className="text-gray-500">No models found.</p>}
                                   </div>
                               </div>
                           )}
                           {ollamaStatus === 'disconnected' && (
                                <p className="text-xs text-amber-400/80 mt-2">Could not connect to Ollama server. Make sure it is running locally and that you have enabled web access.</p>
                           )}
                        </div>
                    </div>

                </div>

                <footer className="p-3 border-t-2 border-[var(--panel-border)] flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 border-2 border-[var(--primary-color)] text-[var(--primary-color)] font-bold text-sm transition flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-[var(--primary-color)] hover:text-black"
                    >
                        <Save size={16} />
                        Save & Close
                    </button>
                </footer>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ApiConfigModal;
