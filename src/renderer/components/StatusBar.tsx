import React from 'react';
import { Database, Cpu, HardDrive, CheckCircle2, Loader2, Sparkles, Sliders } from 'lucide-react';
import { SettingsConfig } from '../types';

interface StatusBarProps {
  documentCount: number;
  totalChunks: number;
  isIndexing?: boolean;
  aiProvider: string;
  settings?: SettingsConfig;
  onOpenSettings?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  documentCount,
  totalChunks,
  isIndexing = false,
  aiProvider,
  settings,
  onOpenSettings,
}) => {
  const getModelSnippet = () => {
    if (!settings) return '';
    if (aiProvider === 'local-slm') {
      return ' (Gemma-4 E2B)';
    }
    if (aiProvider === 'openrouter') {
      return ` (${(settings.openRouterModel || 'llama-3.2:free').split('/').pop()})`;
    }
    if (aiProvider === 'lmstudio') {
      return ` (${settings.chatModel || 'meta-llama-3.2'})`;
    }
    return ' (3.8-flash)';
  };

  return (
    <footer className="app-statusbar" id="app-desktop-statusbar">
      <div className="status-left">
        <button
          onClick={onOpenSettings}
          className="status-model-btn"
          id="statusbar-ai-model-indicator"
          title="Click to configure AI Providers & Models in Settings"
        >
          <span className="status-dot" />
          <span className="status-model-label">AI:</span>
          <span className="status-model-provider">{aiProvider.toUpperCase()}</span>
          <span className="status-model-name">{getModelSnippet()}</span>
          <Sliders size={11} style={{ opacity: 0.8, marginLeft: '4px', color: 'var(--accent)' }} />
        </button>

        <div className="status-pill" title="Embedded SQLite Database">
          <Database size={12} style={{ color: 'var(--text-tertiary)' }} />
          <span>SQLite: library.db (WAL)</span>
        </div>

        <div className="status-pill" title="LanceDB Embedded Vector Table">
          <HardDrive size={12} style={{ color: 'var(--text-tertiary)' }} />
          <span>LanceDB: {totalChunks} vectors</span>
        </div>
      </div>

      <div className="status-right">
        {isIndexing ? (
          <div className="status-pill" style={{ color: 'var(--accent)' }}>
            <Loader2 size={12} className="animate-spin" />
            <span>Worker ingesting documents...</span>
          </div>
        ) : (
          <div className="status-pill">
            <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />
            <span>Index synchronized ({documentCount} files)</span>
          </div>
        )}

        <span style={{ opacity: 0.6 }}>Shortcuts: ⌘K Search · ⌘U Upload · Esc Close</span>
      </div>
    </footer>
  );
};
