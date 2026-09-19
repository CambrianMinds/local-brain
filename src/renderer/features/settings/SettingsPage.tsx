import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Trash2,
  ShieldCheck,
  Zap,
  Check,
  Key,
  Globe,
  Sparkles,
  Eye,
  EyeOff,
  Filter,
  Layers,
} from 'lucide-react';
import { SettingsConfig, OpenRouterModelInfo, LMStudioModelInfo } from '../../types';
import { fetchOpenRouterModels, fetchLMStudioModels } from '../../services/localEngine';

interface SettingsPageProps {
  settings: SettingsConfig;
  onSaveSettings: (settings: SettingsConfig) => void;
  onResetRepository: () => void;
  onNukeLibrary?: () => void;
  documentCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  onResetRepository,
  onNukeLibrary,
  documentCount,
}) => {
  const [current, setCurrent] = useState<SettingsConfig>(settings);

  useEffect(() => {
    setCurrent(settings);
  }, [settings]);

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'failed' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  // OpenRouter state
  const [showApiKey, setShowApiKey] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModelInfo[]>([]);
  const [isLoadingOpenRouter, setIsLoadingOpenRouter] = useState(false);
  const [onlyFreeModels, setOnlyFreeModels] = useState(true);
  const [openRouterQueryError, setOpenRouterQueryError] = useState<string | null>(null);

  // LM Studio state
  const [lmStudioModels, setLmStudioModels] = useState<LMStudioModelInfo[]>([]);
  const [isLoadingLMStudio, setIsLoadingLMStudio] = useState(false);
  const [lmStudioConnected, setLmStudioConnected] = useState<boolean | null>(null);
  const [lmStudioStatusMsg, setLmStudioStatusMsg] = useState('');

  // Native Local SLM state
  const [slmStatus, setSlmStatus] = useState<any>(null);
  const [isLoadingSLM, setIsLoadingSLM] = useState(false);

  // xAI (Grok) state
  const [showXaiApiKey, setShowXaiApiKey] = useState(false);
  const [testingXai, setTestingXai] = useState(false);
  const [xaiTestStatus, setXaiTestStatus] = useState<string | null>(null);

  // Initial load of models on mount
  useEffect(() => {
    handleFetchOpenRouterModels(current.openRouterApiKey);
    handleFetchLMStudioModels(current.lmStudioUrl);
    handleFetchSLMStatus();

    // Auto-detect environment keys if not yet saved in current state
    if (window.api && window.api.getEnvKeys) {
      window.api.getEnvKeys().then((keys) => {
        if (keys && keys.xaiApiKey && !current.xaiApiKey) {
          setCurrent((prev) => ({
            ...prev,
            xaiApiKey: keys.xaiApiKey,
            xaiModel: (!prev.xaiModel || prev.xaiModel.startsWith('grok-2')) ? 'grok-4.20-non-reasoning' : prev.xaiModel,
          }));
        }
      }).catch(() => {});
    }
  }, []);

  const handleFetchSLMStatus = async () => {
    setIsLoadingSLM(true);
    try {
      if (window.api && window.api.getSLMStatus) {
        const s = await window.api.getSLMStatus();
        setSlmStatus(s);
      }
    } catch (e) {
      console.warn('Failed to load SLM status:', e);
    } finally {
      setIsLoadingSLM(false);
    }
  };

  const handleFetchOpenRouterModels = async (apiKey?: string) => {
    setIsLoadingOpenRouter(true);
    setOpenRouterQueryError(null);
    try {
      const data = await fetchOpenRouterModels(apiKey);
      if (data.models && data.models.length > 0) {
        setOpenRouterModels(data.models);
      } else {
        setOpenRouterQueryError('No models returned. Using default free models catalogue.');
      }
    } catch (err: any) {
      setOpenRouterQueryError(err?.message || 'Error reaching OpenRouter API');
    } finally {
      setIsLoadingOpenRouter(false);
    }
  };

  const handleFetchLMStudioModels = async (url?: string) => {
    setIsLoadingLMStudio(true);
    try {
      const data = await fetchLMStudioModels(url);
      setLmStudioConnected(data.connected);
      if (data.connected && data.models.length > 0) {
        setLmStudioModels(data.models);
        setLmStudioStatusMsg(`Connected: ${data.models.length} local model(s) available.`);
      } else {
        setLmStudioStatusMsg(data.message || 'LM Studio server offline (port 1234).');
        if (data.defaultModels) {
          setLmStudioModels(data.defaultModels);
        }
      }
    } catch (err: any) {
      setLmStudioConnected(false);
      setLmStudioStatusMsg('Could not connect to LM Studio daemon.');
    } finally {
      setIsLoadingLMStudio(false);
    }
  };

  const handleTestXAI = async () => {
    setTestingXai(true);
    setXaiTestStatus(null);
    try {
      if (window.api && window.api.testXAI) {
        const res = await window.api.testXAI(current.xaiApiKey);
        if (res.success) {
          setXaiTestStatus('Connected to xAI API successfully! Models verified.');
        } else {
          setXaiTestStatus(`Connection failed: ${res.error || 'Unknown error'}`);
        }
      } else {
        setXaiTestStatus('xAI test API not available in current window bridge.');
      }
    } catch (e: any) {
      setXaiTestStatus(`Error: ${e.message || e}`);
    } finally {
      setTestingXai(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const data = await window.api.askAI({
        question: 'Health check query: Confirm system operation.',
        documentTitle: 'System Diagnostic',
        documentContent: 'Local Brain document intelligence platform initialization verified.',
        provider: current.aiProvider,
        model:
          current.aiProvider === 'local-slm'
            ? 'gemma-4-e2b-it.Q4_K_M.gguf'
            : current.aiProvider === 'openrouter'
            ? current.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free'
            : current.aiProvider === 'lmstudio'
            ? current.chatModel || 'meta-llama-3.2-3b-instruct'
            : current.aiProvider === 'xai'
            ? current.xaiModel || 'grok-4.20-non-reasoning'
            : 'gemini-3.8-flash',
        apiKey: current.aiProvider === 'xai' ? current.xaiApiKey : current.openRouterApiKey,
        xaiApiKey: current.xaiApiKey,
        lmStudioUrl: current.lmStudioUrl,
      });
      if (data.answer && !data.answer.startsWith('[') && !data.answer.includes('Error')) {
        setConnectionStatus('success');
        setStatusMessage(`Active: ${data.provider} (${data.confidence ? Math.round(data.confidence * 100) + '% confidence' : 'Ready'})`);
      } else {
        setConnectionStatus('failed');
        setStatusMessage(data.answer || data.error || 'Provider returned an error');
      }
    } catch (err: any) {
      setConnectionStatus('failed');
      setStatusMessage('Network timeout or unhandled provider error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(current);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2600);
  };

  const handleSelectProvider = (provider: 'local-slm' | 'lmstudio' | 'openrouter' | 'gemini' | 'xai') => {
    const updated = { ...current, aiProvider: provider };
    setCurrent(updated);
    onSaveSettings(updated);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2600);
  };

  // Filtered OpenRouter models
  const displayedOpenRouterModels = openRouterModels.filter((m) => {
    if (!onlyFreeModels) return true;
    return m.isFree || m.id.endsWith(':free');
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '32px 48px',
        background: 'var(--bg-deep)',
      }}
      id="settings-page-view"
    >
      <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AI Providers & Infrastructure Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Switch between Local LM Studio, OpenRouter (including 100% free models), and Google Gemini.
          </p>
        </div>

        {savedBanner && (
          <div
            className="glass-panel"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--accent)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <Check size={16} />
            <span>Settings saved successfully. Active provider: <strong>{current.aiProvider.toUpperCase()}</strong></span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: AI Provider Selection Tabs */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Inference Engine & Provider Selection
                </h2>
              </div>
              <span
                className="tag-pill accent"
                style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Active: {current.aiProvider}
              </span>
            </div>

            {/* 5 Provider Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {/* Card 0: Local SLM */}
              <div
                onClick={() => handleSelectProvider('local-slm')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    current.aiProvider === 'local-slm'
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-medium)',
                  background:
                    current.aiProvider === 'local-slm'
                      ? 'var(--accent-dim)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Cpu size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Local SLM (Gemma 4)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Zero network egress. Runs embedded GGUF on device with node-llama-cpp.
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: slmStatus?.available ? 'var(--accent)' : 'var(--warning)',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {slmStatus?.available ? 'GGUF Model Ready' : 'Searching models/llm'}
                  </span>
                </div>
              </div>

              {/* Card 1: LM Studio */}
              <div
                onClick={() => handleSelectProvider('lmstudio')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    current.aiProvider === 'lmstudio'
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-medium)',
                  background:
                    current.aiProvider === 'lmstudio'
                      ? 'var(--accent-dim)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Local LM Studio
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Zero data egress. Runs offline via localhost:1234 with Metal / CUDA GPU.
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: lmStudioConnected ? 'var(--accent)' : 'var(--text-tertiary)',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {lmStudioConnected ? 'Local Daemon Online' : 'Local Daemon Offline'}
                  </span>
                </div>
              </div>

              {/* Card 2: OpenRouter */}
              <div
                onClick={() => handleSelectProvider('openrouter')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    current.aiProvider === 'openrouter'
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-medium)',
                  background:
                    current.aiProvider === 'openrouter'
                      ? 'var(--accent-dim)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Globe size={16} style={{ color: 'var(--accent-secondary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    OpenRouter
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Multi-provider gateway. Supports <strong>100% free models</strong> (Llama 3.2, DeepSeek).
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(110, 231, 183, 0.15)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    Free Models
                  </span>
                </div>
              </div>

              {/* Card 3: xAI (Grok) */}
              <div
                onClick={() => handleSelectProvider('xai')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    current.aiProvider === 'xai'
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-medium)',
                  background:
                    current.aiProvider === 'xai'
                      ? 'var(--accent-dim)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    xAI (Grok)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Grok 4.20 speed & deep reasoning via official xAI API key.
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: current.xaiApiKey ? 'var(--accent)' : 'var(--text-tertiary)',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {current.xaiApiKey ? 'Key Configured' : 'Needs API Key'}
                  </span>
                </div>
              </div>

              {/* Card 4: Google Gemini */}
              <div
                onClick={() => handleSelectProvider('gemini')}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    current.aiProvider === 'gemini'
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-medium)',
                  background:
                    current.aiProvider === 'gemini'
                      ? 'var(--accent-dim)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Zap size={16} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Google Gemini
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Direct server-side cloud inference via Gemini 3.8 Flash for fast processing.
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    Managed Server Key
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Configuration Details */}
            {/* 0. LOCAL SLM CONFIGURATION */}
            {current.aiProvider === 'local-slm' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Local SLM Engine (Embedded node-llama-cpp)
                    </span>
                  </div>
                  <span
                    className="tag-pill accent"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    100% On-Device Offline
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Detected Model:</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {slmStatus?.modelName || 'gemma-4-e2b-it.Q4_K_M.gguf'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Model Path:</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontFamily: 'monospace' }}>
                      models/llm/gemma-4-e2b-it.Q4_K_M.gguf
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Architecture & Quant:</span>
                    <span style={{ color: 'var(--text-primary)' }}>Gemma-4 E2B · Q4_K_M (3.42 GB)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Multimodal Projector:</span>
                    <span style={{ color: 'var(--text-primary)' }}>gemma-4-e2b-it.F16-mmproj.gguf (Present)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Context Window:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{slmStatus?.contextSize || 2048} tokens</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleFetchSLMStatus}
                    disabled={isLoadingSLM}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={12} className={isLoadingSLM ? 'animate-spin' : ''} />
                    <span>Rescan models/llm Directory</span>
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {slmStatus?.message || 'Ready for On-Device Inference'}
                  </span>
                </div>
              </div>
            )}

            {/* 1. OPENROUTER CONFIGURATION */}
            {current.aiProvider === 'openrouter' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      OpenRouter API Key & Model Configuration
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Get your key at openrouter.ai/keys
                  </span>
                </div>

                {/* API Key Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    OpenRouter API Key
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        className="input-base"
                        placeholder="sk-or-v1-..."
                        value={current.openRouterApiKey || ''}
                        onChange={(e) => setCurrent({ ...current, openRouterApiKey: e.target.value })}
                        style={{ paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                        }}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <button
                      onClick={() => handleFetchOpenRouterModels(current.openRouterApiKey)}
                      disabled={isLoadingOpenRouter}
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      title="Query available models from OpenRouter API"
                    >
                      <RefreshCw size={13} className={isLoadingOpenRouter ? 'animate-spin' : ''} />
                      <span>{isLoadingOpenRouter ? 'Querying API...' : 'Fetch Models'}</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Your key is securely stored locally in your desktop workspace and proxied server-side.
                  </p>
                </div>

                {/* Model Selection Dropdown with Free Models Filter */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Selected Model: <span style={{ color: 'var(--accent)' }}>{current.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free'}</span>
                    </label>

                    {/* Filter Toggle */}
                    <div
                      onClick={() => setOnlyFreeModels(!onlyFreeModels)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: onlyFreeModels ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}
                    >
                      <Filter size={12} />
                      <span>{onlyFreeModels ? 'Showing 100% Free Models' : 'Showing All Models'}</span>
                      <input
                        type="checkbox"
                        checked={onlyFreeModels}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                    </div>
                  </div>

                  {/* Dropdown list querying models */}
                  <select
                    className="input-base"
                    value={current.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free'}
                    onChange={(e) => setCurrent({ ...current, openRouterModel: e.target.value })}
                    style={{ fontSize: '13px', cursor: 'pointer' }}
                  >
                    {displayedOpenRouterModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.isFree || m.id.endsWith(':free') ? '🎁 [FREE] ' : ''}
                        {m.name || m.id} {m.context_length ? `(${Math.round(m.context_length / 1000)}k ctx)` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Quick Select Free Model Chips */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginRight: '8px' }}>
                      Popular Free Models:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {[
                        { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
                        { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash Exp (Free)' },
                        { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)' },
                        { id: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (Free)' },
                        { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCurrent({ ...current, openRouterModel: item.id })}
                          className={`btn btn-sm ${current.openRouterModel === item.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LM STUDIO CONFIGURATION */}
            {current.aiProvider === 'lmstudio' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      LM Studio Local Daemon Integration
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Requires LM Studio running locally
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Local API Endpoint URL
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-base"
                      value={current.lmStudioUrl || 'http://localhost:1234/v1'}
                      onChange={(e) => setCurrent({ ...current, lmStudioUrl: e.target.value })}
                    />
                    <button
                      onClick={() => handleFetchLMStudioModels(current.lmStudioUrl)}
                      disabled={isLoadingLMStudio}
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <RefreshCw size={13} className={isLoadingLMStudio ? 'animate-spin' : ''} />
                      <span>{isLoadingLMStudio ? 'Querying...' : 'Detect Models'}</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: lmStudioConnected ? 'var(--accent)' : 'var(--text-tertiary)', marginTop: '4px' }}>
                    {lmStudioStatusMsg || 'LM Studio server standard port is 1234.'}
                  </p>
                </div>

                {/* Local Models Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Active Local Model: <span style={{ color: 'var(--accent)' }}>{current.chatModel || 'meta-llama-3.2-3b-instruct'}</span>
                  </label>
                  <select
                    className="input-base"
                    value={current.chatModel || 'meta-llama-3.2-3b-instruct'}
                    onChange={(e) => setCurrent({ ...current, chatModel: e.target.value })}
                  >
                    {lmStudioModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} {m.owned_by ? `(${m.owned_by})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Common local model chips */}
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'meta-llama-3.2-3b-instruct',
                      'qwen2.5-7b-instruct',
                      'mistral-7b-instruct-v0.3',
                      'nomic-embed-text-v1.5',
                    ].map((mId) => (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => setCurrent({ ...current, chatModel: mId })}
                        className={`btn btn-sm ${current.chatModel === mId ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        {mId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. GEMINI CONFIGURATION */}
            {current.aiProvider === 'gemini' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={15} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Google Gemini Server Model
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Server-side high precision document summarization, QA citations, and wiki synthesis.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Model
                  </label>
                  <select
                    className="input-base"
                    value={current.embeddingModel || 'gemini-3.8-flash'}
                    onChange={(e) => setCurrent({ ...current, embeddingModel: e.target.value })}
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended - Ultra Fast &amp; Precise)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. xAI (GROK) CONFIGURATION */}
            {current.aiProvider === 'xai' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      xAI Grok Configuration
                    </span>
                  </div>
                  <span
                    className="tag-pill accent"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    api.x.ai/v1
                  </span>
                </div>

                {/* API Key Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    xAI API Key
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showXaiApiKey ? 'text' : 'password'}
                        className="input-base"
                        placeholder="xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={current.xaiApiKey || ''}
                        onChange={(e) => setCurrent({ ...current, xaiApiKey: e.target.value })}
                        style={{ paddingRight: '36px', width: '100%' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowXaiApiKey(!showXaiApiKey)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                        }}
                      >
                        {showXaiApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <button
                      onClick={handleTestXAI}
                      disabled={testingXai || !current.xaiApiKey}
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      title="Test xAI API Key"
                    >
                      <RefreshCw size={13} className={testingXai ? 'animate-spin' : ''} />
                      <span>{testingXai ? 'Testing...' : 'Verify Key'}</span>
                    </button>
                  </div>
                  {xaiTestStatus && (
                    <p style={{
                      fontSize: '11px',
                      color: xaiTestStatus.includes('successfully') ? 'var(--accent)' : 'var(--danger)',
                      marginTop: '6px',
                    }}>
                      {xaiTestStatus}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Get your key from the xAI Console (console.x.ai). Keys are stored locally on your device.
                  </p>
                </div>

                {/* Model Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Grok Model
                  </label>
                  <select
                    className="input-base"
                    value={current.xaiModel || 'grok-4.20-non-reasoning'}
                    onChange={(e) => setCurrent({ ...current, xaiModel: e.target.value })}
                  >
                    <option value="grok-4.20-non-reasoning">grok-4.20-non-reasoning (Fast &amp; Concise - Recommended)</option>
                    <option value="grok-4.20">grok-4.20 (Deep Reasoning)</option>
                    <option value="grok-4.3">grok-4.3</option>
                    <option value="grok-build-0.1">grok-build-0.1 (Grok Code Fast)</option>
                    <option value="grok-4.5">grok-4.5</option>
                  </select>

                  {/* Chips */}
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { id: 'grok-4.20-non-reasoning', label: 'grok-4.20-non-reasoning (Fast)' },
                      { id: 'grok-4.20', label: 'grok-4.20 (Reasoning)' },
                      { id: 'grok-4.3', label: 'grok-4.3' },
                      { id: 'grok-build-0.1', label: 'grok-build-0.1' },
                      { id: 'grok-4.5', label: 'grok-4.5' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCurrent({ ...current, xaiModel: m.id })}
                        className={`btn btn-sm ${current.xaiModel === m.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test Connection Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px' }}>
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw size={13} className={testingConnection ? 'animate-spin' : ''} />
                <span>{testingConnection ? 'Executing Test Prompt...' : 'Test Selected Model Connection'}</span>
              </button>

              {connectionStatus === 'success' && (
                <span style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> {statusMessage}
                </span>
              )}
              {connectionStatus === 'failed' && (
                <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> {statusMessage}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Storage & Database Paths */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <HardDrive size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Persistent Storage Topology
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  LanceDB Disk-ANN Vector Cache Path
                </label>
                <input
                  type="text"
                  className="input-base"
                  value={current.lanceDbPath || '~/.local-brain/vectors.lance'}
                  onChange={(e) => setCurrent({ ...current, lanceDbPath: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  SQLite Document Catalog & FTS5 Path
                </label>
                <input
                  type="text"
                  className="input-base"
                  value={current.sqlitePath || '~/.local-brain/library.db'}
                  onChange={(e) => setCurrent({ ...current, sqlitePath: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Semantic Chunker Settings */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Chunking & Vector Resolution
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Chunk Size Target: {current.chunkSize || 512} tokens
                </label>
                <input
                  type="range"
                  min="256"
                  max="1024"
                  step="64"
                  value={current.chunkSize || 512}
                  onChange={(e) => setCurrent({ ...current, chunkSize: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Optimal window size for technical & legal prose.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Chunk Overlap: {current.chunkOverlap || 64} tokens
                </label>
                <input
                  type="range"
                  min="32"
                  max="128"
                  step="16"
                  value={current.chunkOverlap || 64}
                  onChange={(e) => setCurrent({ ...current, chunkOverlap: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Preserves contextual continuity across paragraph borders.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onNukeLibrary && (
                <button
                  onClick={() => {
                    if (window.confirm('NUKE ALL LIBRARY DATA: Are you sure? This will delete all sample documents and wiki pages, leaving your vault completely empty.')) {
                      onNukeLibrary();
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  id="settings-nuke-button"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                >
                  <Trash2 size={13} />
                  <span>Nuke All Library Data</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (window.confirm('Reset the repository to the initial seed documents and version history?')) {
                    onResetRepository();
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <RefreshCw size={13} />
                <span>Restore Seed Documents</span>
              </button>
            </div>

            <button onClick={handleSave} className="btn btn-primary btn-md">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
