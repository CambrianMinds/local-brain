import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  FolderTree,
  BookOpen,
  Sliders,
  Cpu,
  ChevronDown,
  ShieldCheck,
  Globe,
  Zap,
  Check,
} from 'lucide-react';
import { ActiveTab, SettingsConfig } from '../types';

interface DesktopTitlebarProps {
  activeTab: ActiveTab;
  activeCategoryName?: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  documentCount: number;
  settings?: SettingsConfig;
  onUpdateSettings?: (settings: SettingsConfig) => void;
  onOpenSettings?: () => void;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({
  activeTab,
  activeCategoryName,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  documentCount,
  settings,
  onUpdateSettings,
  onOpenSettings,
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        switcherRef.current &&
        event.target &&
        event.target instanceof Node &&
        !switcherRef.current.contains(event.target)
      ) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'library':
        return activeCategoryName ? `Library › ${activeCategoryName}` : 'Document Library';
      case 'search':
        return 'Hybrid Semantic Search & Vectors';
      case 'document':
        return 'Document Reader & Version History';
      case 'wiki':
        return 'Knowledge Wiki Synthesizer';
      case 'settings':
        return 'Preferences & AI Providers';
      default:
        return 'Local Brain';
    }
  };

  const getProviderDisplay = () => {
    if (!settings) return { name: 'Gemini', icon: <Zap size={12} color="var(--warning)" />, model: 'gemini-3.8-flash' };
    switch (settings.aiProvider) {
      case 'openrouter':
        return {
          name: 'OpenRouter',
          icon: <Globe size={12} color="var(--accent-secondary)" />,
          model: settings.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free',
          tag: 'Cloud / Free',
        };
      case 'lmstudio':
        return {
          name: 'LM Studio',
          icon: <ShieldCheck size={12} color="var(--accent)" />,
          model: settings.chatModel || 'meta-llama-3.2-3b-instruct',
          tag: 'Local Offline',
        };
      case 'gemini':
      default:
        return {
          name: 'Gemini Flash',
          icon: <Zap size={12} color="var(--warning)" />,
          model: settings.embeddingModel || 'gemini-3.8-flash',
          tag: 'Server Fast',
        };
    }
  };

  const providerInfo = getProviderDisplay();

  const handleSelectProvider = (provider: 'lmstudio' | 'openrouter' | 'gemini') => {
    if (!settings || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      aiProvider: provider,
    });
    setIsSwitcherOpen(false);
  };

  return (
    <header className="desktop-titlebar" id="desktop-window-titlebar">
      <div className="titlebar-left">
        <div className="window-dots" title="Desktop Window Controls">
          <span className="dot dot-close" />
          <span className="dot dot-minimize" />
          <span className="dot dot-maximize" />
        </div>

        <div className="titlebar-center">
          <span>Local Brain v1.0.4</span>
          <span>/</span>
          <span className="titlebar-breadcrumb-active">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      <div className="titlebar-right">
        {/* Active AI Provider & Model Quick Switcher */}
        <div ref={switcherRef} style={{ position: 'relative' }}>
          <button
            id="ai-provider-quick-switcher"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="btn btn-secondary btn-sm"
            style={{
              height: '26px',
              fontSize: '11px',
              padding: '2px 8px',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium)',
            }}
            title="Click to switch between OpenRouter (Free models), LM Studio (Local), and Gemini"
          >
            {providerInfo.icon}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{providerInfo.name}</span>
            <span style={{ color: 'var(--text-tertiary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {providerInfo.model.split('/').pop()}
            </span>
            <ChevronDown size={11} style={{ opacity: 0.6 }} />
          </button>

          {/* Quick Switcher Popover */}
          {isSwitcherOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '32px',
                right: 0,
                width: '310px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                border: '1px solid var(--border-medium)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Switch AI Inference Provider
                </span>
                <button
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Configure ›
                </button>
              </div>

              {/* Option 1: OpenRouter */}
              <div
                onClick={() => handleSelectProvider('openrouter')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: settings?.aiProvider === 'openrouter' ? 'var(--accent-dim)' : 'rgba(255, 255, 255, 0.02)',
                  border: settings?.aiProvider === 'openrouter' ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={13} color="var(--accent-secondary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      OpenRouter (Free Models)
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {settings?.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free'}
                  </div>
                </div>
                {settings?.aiProvider === 'openrouter' && <Check size={14} color="var(--accent)" />}
              </div>

              {/* Option 2: LM Studio */}
              <div
                onClick={() => handleSelectProvider('lmstudio')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: settings?.aiProvider === 'lmstudio' ? 'var(--accent-dim)' : 'rgba(255, 255, 255, 0.02)',
                  border: settings?.aiProvider === 'lmstudio' ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={13} color="var(--accent)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Local LM Studio (Offline)
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {settings?.chatModel || 'meta-llama-3.2-3b-instruct'} (localhost:1234)
                  </div>
                </div>
                {settings?.aiProvider === 'lmstudio' && <Check size={14} color="var(--accent)" />}
              </div>

              {/* Option 3: Gemini */}
              <div
                onClick={() => handleSelectProvider('gemini')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: settings?.aiProvider === 'gemini' ? 'var(--accent-dim)' : 'rgba(255, 255, 255, 0.02)',
                  border: settings?.aiProvider === 'gemini' ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} color="var(--warning)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Google Gemini (Server)
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    gemini-3.8-flash (High speed)
                  </div>
                </div>
                {settings?.aiProvider === 'gemini' && <Check size={14} color="var(--accent)" />}
              </div>
            </div>
          )}
        </div>

        <button
          id="cmd-k-trigger-button"
          onClick={onOpenCommandPalette}
          className="btn btn-secondary btn-sm"
          style={{
            height: '26px',
            fontSize: '11px',
            padding: '2px 10px',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
          title="Open Command Palette (Cmd/Ctrl + K)"
        >
          <Search size={12} style={{ color: 'var(--accent)' }} />
          <span>Quick Search</span>
          <kbd
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        <button
          id="theme-toggle-button"
          onClick={onToggleTheme}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px', width: '28px', height: '28px' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={14} style={{ color: 'var(--warning)' }} />
          ) : (
            <Moon size={14} style={{ color: 'var(--accent-secondary)' }} />
          )}
        </button>
      </div>
    </header>
  );
};
