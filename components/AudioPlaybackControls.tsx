import React from 'react';
import { Play, Pause, StopCircle, DownloadCloud, Speaker } from 'lucide-react';
import Spinner from './Spinner';

interface AudioPlaybackControlsProps {
  isPlaying: boolean;
  isGenerating: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onDownload: () => void;
  isDisabled: boolean;
}

const AudioPlaybackControls: React.FC<AudioPlaybackControlsProps> = ({
  isPlaying,
  isGenerating,
  onPlay,
  onPause,
  onStop,
  onDownload,
  isDisabled,
}) => {

    const baseButtonStyles = "p-2 transition duration-200 border border-[var(--codex-border)] text-[var(--codex-cyan)]/80 hover:text-[var(--codex-cyan)] hover:border-[var(--codex-cyan)] disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className={`flex items-center gap-2 transition-opacity ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
             <span className="text-sm text-[var(--codex-cyan)]/80 flex items-center gap-2 pr-2 border-r border-[var(--codex-border)]"><Speaker size={16}/> Audio</span>
            <button
                onClick={isPlaying ? onPause : onPlay}
                className={baseButtonStyles}
                title={isPlaying ? "Pause Narration" : "Play Narration"}
                disabled={isGenerating}
            >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
                onClick={onStop}
                className={baseButtonStyles}
                title="Stop Narration"
                disabled={!isPlaying && !speechSynthesis.speaking}
            >
                <StopCircle size={16} />
            </button>
             <button
                onClick={onDownload}
                className={`${baseButtonStyles} flex items-center gap-2`}
                title="Download conversation as audio file"
                disabled={isGenerating}
            >
                {isGenerating ? <Spinner /> : <DownloadCloud size={16} />}
            </button>
        </div>
    );
};

export default AudioPlaybackControls;