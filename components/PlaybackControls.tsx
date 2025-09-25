
import React from 'react';
import { Play, Pause, Rewind, Rabbit, Snail, Turtle } from 'lucide-react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    speed: number;
    setSpeed: (speed: number) => void;
    onReset: () => void;
    isDisabled: boolean;
}

const speedIcons = {
    0.5: <Snail size={14} />,
    1: <Turtle size={14} />,
    2: <Rabbit size={14} />,
    4: <Rabbit size={14} />,
};

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, setIsPlaying, speed, setSpeed, onReset, isDisabled }) => {
    
    const baseButtonStyles = "p-2 transition duration-200 border border-transparent hover:border-[var(--codex-cyan)]/50 hover:bg-[var(--codex-bg-deep)] text-[var(--codex-cyan)]/80 hover:text-[var(--codex-cyan)]";
    const baseInputStyles = "w-full bg-black/50 border border-[var(--codex-border)] p-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--codex-accent)] focus:border-[var(--codex-border-glow)] transition-all duration-200";
    const customSelectStyles = `${baseInputStyles} appearance-none bg-no-repeat bg-right bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')]`;

    return (
        <div className={`flex items-center justify-between gap-2 transition-opacity ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-1">
                <button
                    onClick={onReset}
                    className={baseButtonStyles}
                    title="Restart Playback"
                >
                    <Rewind size={16} />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 w-24 flex justify-center items-center gap-2 bg-[var(--codex-blue)]/20 border border-[var(--codex-blue)] text-[var(--codex-blue)] hover:bg-[var(--codex-blue)] hover:text-black font-semibold text-sm transition duration-300 ease-in-out transform hover:scale-105"
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="speed-select" className="text-sm text-[var(--codex-cyan)]/80">Speed:</label>
                <div className="relative">
                    <select
                        id="speed-select"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className={`${customSelectStyles} py-1.5 pl-7 pr-4 text-sm`}
                    >
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1.0x</option>
                        <option value={2}>2.0x</option>
                        <option value={4}>4.0x</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[var(--codex-cyan)]">
                         {speedIcons[speed as keyof typeof speedIcons] || <Turtle size={14} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaybackControls;
