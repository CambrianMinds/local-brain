import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Layers,
  Info,
  Send,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Tag,
  Hash,
  FileText,
  Calendar,
  HardDrive,
  Cpu,
  History,
  RotateCcw,
  Edit3,
  UploadCloud,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { DocumentItem, DocumentSummary, DocumentVersion, SettingsConfig } from '../../types';
import {
  askDocumentAI,
  askDocumentQuestionAI,
  summarizeDocumentAI,
  chunkText,
  updateDocumentWithVersion,
  restoreDocumentVersion,
} from '../../services/localEngine';
import { getFileTypeBadge, getFileTypeIcon, formatFileSize, formatDate } from '../../components/DocumentCard';

interface DocumentReaderPageProps {
  document: DocumentItem;
  onBack: () => void;
  onUpdateDocument: (updated: DocumentItem) => void;
  aiProvider: string;
  settings?: SettingsConfig;
  onUpdateSettings?: (settings: SettingsConfig) => void;
}

export const DocumentReaderPage: React.FC<DocumentReaderPageProps> = ({
  document,
  onBack,
  onUpdateDocument,
  aiProvider,
  settings,
  onUpdateSettings,
}) => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<'summary' | 'chat' | 'versions' | 'chunks' | 'meta'>('summary');
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; provider?: string }>
  >([
    {
      role: 'assistant',
      text: `Hello! I have indexed all ${document.chunksCount} chunks of "${document.title}". Ask me anything about its contents, methodology, or key metrics.`,
      provider: aiProvider,
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [regenElapsedSeconds, setRegenElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [restoreNotification, setRestoreNotification] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRegeneratingSummary) {
      setRegenElapsedSeconds(0);
      interval = setInterval(() => {
        setRegenElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRegenElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRegeneratingSummary]);

  // Edit / New Version Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(document.title);
  const [editContent, setEditContent] = useState(document.content);
  const [editChangeDescription, setEditChangeDescription] = useState('');
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  // Synchronize edit fields if active document changes
  useEffect(() => {
    setEditTitle(document.title);
    setEditContent(document.content);
  }, [document.id, document.title, document.content]);

  // Quick provider selector state in reader chat and summary
  const [readerProvider, setReaderProvider] = useState<string>(settings?.aiProvider || aiProvider || 'local-slm');
  const [readerModel, setReaderModel] = useState<string>(
    settings?.aiProvider === 'local-slm'
      ? 'gemma-4-e2b-it.Q4_K_M.gguf'
      : settings?.aiProvider === 'openrouter'
      ? settings?.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free'
      : settings?.aiProvider === 'lmstudio'
      ? settings?.chatModel || 'meta-llama-3.2-3b-instruct'
      : settings?.aiProvider === 'xai'
      ? settings?.xaiModel || 'grok-2-latest'
      : 'gemini-3.8-flash'
  );

  // Synchronize readerProvider and readerModel whenever settings.aiProvider updates
  useEffect(() => {
    const activeProv = settings?.aiProvider || aiProvider || 'local-slm';
    setReaderProvider(activeProv);
    if (activeProv === 'local-slm') {
      setReaderModel('gemma-4-e2b-it.Q4_K_M.gguf');
    } else if (activeProv === 'openrouter') {
      setReaderModel(settings?.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free');
    } else if (activeProv === 'lmstudio') {
      setReaderModel(settings?.chatModel || 'meta-llama-3.2-3b-instruct');
    } else if (activeProv === 'xai') {
      setReaderModel(settings?.xaiModel || 'grok-2-latest');
    } else {
      setReaderModel('gemini-3.8-flash');
    }
  }, [settings?.aiProvider, aiProvider, settings?.openRouterModel, settings?.chatModel, settings?.xaiModel]);

  const handleReaderProviderChange = (newProv: string) => {
    setReaderProvider(newProv);
    let newModel = 'gemini-3.8-flash';
    if (newProv === 'local-slm') {
      newModel = 'gemma-4-e2b-it.Q4_K_M.gguf';
    } else if (newProv === 'openrouter') {
      newModel = settings?.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free';
    } else if (newProv === 'lmstudio') {
      newModel = settings?.chatModel || 'meta-llama-3.2-3b-instruct';
    } else if (newProv === 'xai') {
      newModel = settings?.xaiModel || 'grok-2-latest';
    }
    setReaderModel(newModel);
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        aiProvider: newProv as any,
      });
    }
  };

  // Ensure document has at least a baseline version if none exists
  const versions: DocumentVersion[] = useMemo(() => {
    if (document.versions && document.versions.length > 0) {
      return document.versions;
    }
    return [
      {
        id: 'v-baseline-' + document.id,
        versionNumber: 1,
        timestamp: document.createdAt || new Date().toISOString(),
        title: document.title,
        content: document.content,
        summary: { ...document.summary },
        fileSize: document.fileSize,
        chunksCount: document.chunksCount,
        tokenCount: document.tokenCount,
        tags: [...document.tags],
        category: document.category,
        changeDescription: 'Initial ingestion baseline',
        author: 'Local Brain Ingestor',
      },
    ];
  }, [document]);

  // Split content into chunks for the inspector tab
  const chunks = useMemo(() => {
    return chunkText(document.content, 512, 64);
  }, [document.content]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || isAsking) return;

    const userQ = chatQuestion.trim();
    setChatQuestion('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userQ }]);
    setIsAsking(true);

    try {
      const response = await askDocumentQuestionAI(document, userQ, {
        provider: readerProvider as any,
        model: readerModel,
        apiKey: readerProvider === 'xai' ? settings?.xaiApiKey : settings?.openRouterApiKey,
        xaiApiKey: settings?.xaiApiKey,
        lmStudioUrl: settings?.lmStudioUrl,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.answer,
          provider: response.provider || readerProvider,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to analyze chunk vectors at this time.',
          provider: 'Local Engine',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSendChat = () => {
    handleAskQuestion({ preventDefault: () => {} } as any);
  };

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true);
    try {
      const newSummary = await summarizeDocumentAI(document.title, document.content, {
        provider: readerProvider as any,
        model: readerModel,
        apiKey: readerProvider === 'xai' ? settings?.xaiApiKey : settings?.openRouterApiKey,
        xaiApiKey: settings?.xaiApiKey,
        lmStudioUrl: settings?.lmStudioUrl,
      });
      
      // Update with version tracking so summary regenerations are logged
      const updated = updateDocumentWithVersion(
        document,
        { summary: newSummary },
        'AI multi-level summary regenerated via ' + (newSummary.provider || readerModel || readerProvider)
      );
      onUpdateDocument(updated);
      setRestoreNotification(`Summary synthesized via ${newSummary.provider || readerProvider}!`);
      setTimeout(() => setRestoreNotification(null), 3500);
    } catch (err: any) {
      console.error(err);
      setRestoreNotification('Error: ' + (err?.message || 'Failed to synthesize summary'));
      setTimeout(() => setRestoreNotification(null), 3500);
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Restore an older version
  const handleRestoreVersion = (v: DocumentVersion) => {
    if (window.confirm(`Are you sure you want to restore "${document.title}" to Version ${v.versionNumber}?`)) {
      const restoredDoc = restoreDocumentVersion(document, v);
      onUpdateDocument(restoredDoc);
      setRestoreNotification(`Successfully restored to Version ${v.versionNumber} (Created v${restoredDoc.version})`);
      setTimeout(() => setRestoreNotification(null), 4000);
    }
  };

  // Save new edited version
  const handleSaveEditAsVersion = () => {
    if (!editContent.trim()) return;
    const desc = editChangeDescription.trim() || `Content update at ${new Date().toLocaleTimeString()}`;
    const updated = updateDocumentWithVersion(
      document,
      {
        title: editTitle.trim() || document.title,
        content: editContent,
      },
      desc
    );
    onUpdateDocument(updated);
    setIsEditModalOpen(false);
    setEditChangeDescription('');
    setRestoreNotification(`Created new snapshot: Version ${updated.version}`);
    setTimeout(() => setRestoreNotification(null), 4000);
  };

  const openEditor = () => {
    setEditTitle(document.title);
    setEditContent(document.content);
    setEditChangeDescription('');
    setIsEditModalOpen(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-deep)',
      }}
      id="document-reader-view"
    >
      {/* Toast Notification Banner */}
      {restoreNotification && (
        <div
          style={{
            background: 'var(--accent)',
            color: 'var(--text-inverse)',
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} />
            <span>{restoreNotification}</span>
          </div>
          <button
            onClick={() => setRestoreNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '11px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div
        style={{
          height: '52px',
          minHeight: '52px',
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button
            onClick={onBack}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
            title="Back to Library"
          >
            <ArrowLeft size={16} />
            <span>Library</span>
          </button>

          <span style={{ color: 'var(--text-tertiary)' }}>/</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {getFileTypeIcon(document.fileType)}
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {document.title}
            </h2>
            {getFileTypeBadge(document.fileType)}

            {/* Version Badge */}
            <button
              onClick={() => setActiveInspectorTab('versions')}
              className="tag-pill"
              style={{
                background: 'rgba(110, 231, 183, 0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
              }}
              title="Click to view full Version History"
            >
              <History size={11} />
              <span>v{document.version || versions[0]?.versionNumber || 1} ({versions.length} versions)</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={openEditor} className="btn btn-secondary btn-sm" title="Edit text and create new version snapshot">
            <Edit3 size={13} style={{ color: 'var(--accent)' }} />
            <span>Edit / New Version</span>
          </button>

          <button onClick={handleCopyContent} className="btn btn-secondary btn-sm">
            {copied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Document Content, Right AI Inspector */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: Document Body Reader */}
        <div
          style={{
            flex: '1 1 58%',
            overflowY: 'auto',
            padding: '36px 44px',
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-deep)',
          }}
        >
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            {/* Header info in reader */}
            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '20px',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {document.tags.map((t) => (
                    <span key={t} className="tag-pill accent">
                      #{t}
                    </span>
                  ))}
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--accent)',
                    background: 'rgba(110, 231, 183, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Active Version: v{document.version || 1}
                </span>
              </div>

              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: '10px',
                }}
              >
                {document.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  flexWrap: 'wrap',
                }}
              >
                <span>Category: {document.category}</span>
                <span>•</span>
                <span>Size: {formatFileSize(document.fileSize)}</span>
                <span>•</span>
                <span>Tokens: ~{document.tokenCount}</span>
                <span>•</span>
                <span>Updated: {formatDate(document.updatedAt || document.createdAt)}</span>
                <span>•</span>
                <span
                  onClick={() => setActiveInspectorTab('versions')}
                  style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {versions.length} recorded version snapshot{versions.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Rendered Text with Markdown Styling */}
            <div className="prose">
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {document.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: AI Inspector & Tools */}
        <div
          style={{
            flex: '1 1 42%',
            minWidth: '350px',
            maxWidth: '540px',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-base)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs Bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            <button
              onClick={() => setActiveInspectorTab('summary')}
              className={`btn btn-ghost btn-sm ${activeInspectorTab === 'summary' ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '11px',
                borderBottom: activeInspectorTab === 'summary' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeInspectorTab === 'summary' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Sparkles size={12} />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveInspectorTab('chat')}
              className={`btn btn-ghost btn-sm ${activeInspectorTab === 'chat' ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '11px',
                borderBottom: activeInspectorTab === 'chat' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeInspectorTab === 'chat' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <MessageSquare size={12} />
              <span>Ask AI</span>
            </button>

            {/* Version History Tab */}
            <button
              onClick={() => setActiveInspectorTab('versions')}
              className={`btn btn-ghost btn-sm ${activeInspectorTab === 'versions' ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '11px',
                borderBottom: activeInspectorTab === 'versions' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeInspectorTab === 'versions' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <History size={12} />
              <span>Versions ({versions.length})</span>
            </button>

            <button
              onClick={() => setActiveInspectorTab('chunks')}
              className={`btn btn-ghost btn-sm ${activeInspectorTab === 'chunks' ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '11px',
                borderBottom: activeInspectorTab === 'chunks' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeInspectorTab === 'chunks' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Layers size={12} />
              <span>Vectors ({chunks.length})</span>
            </button>

            <button
              onClick={() => setActiveInspectorTab('meta')}
              className={`btn btn-ghost btn-sm ${activeInspectorTab === 'meta' ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '11px',
                borderBottom: activeInspectorTab === 'meta' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeInspectorTab === 'meta' ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Info size={12} />
              <span>Meta</span>
            </button>
          </div>

          {/* Inspector Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* 1. SUMMARY TAB */}
            {activeInspectorTab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      Multi-Level AI Summary
                    </span>
                    <select
                      className="input-base"
                      id="summary-provider-select"
                      value={readerProvider}
                      onChange={(e) => handleReaderProviderChange(e.target.value)}
                      style={{ padding: '1px 6px', fontSize: '10px', height: '22px' }}
                      title="Active AI Inference Engine for Summary"
                    >
                      <option value="local-slm">Local SLM (Gemma-4 E2B)</option>
                      <option value="openrouter">OpenRouter (Free Models)</option>
                      <option value="lmstudio">LM Studio (Local)</option>
                      <option value="xai">xAI (Grok)</option>
                      <option value="gemini">Gemini (Server)</option>
                    </select>
                    {document.summary?.provider && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        {document.summary.provider}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleRegenerateSummary}
                    disabled={isRegeneratingSummary}
                    className="btn btn-ghost btn-sm"
                    id="regenerate-summary-btn"
                    style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--accent)' }}
                  >
                    <RefreshCw size={11} className={isRegeneratingSummary ? 'animate-spin' : ''} />
                    <span>{isRegeneratingSummary ? `Synthesizing (${regenElapsedSeconds}s)...` : 'Regenerate Summary'}</span>
                  </button>
                </div>

                {/* Active Synthesis Progress Banner */}
                {isRegeneratingSummary && (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--accent)',
                      background: 'rgba(59, 130, 246, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
                          Synthesizing Multi-Level Summary ({regenElapsedSeconds}s)
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        Engine: {readerProvider === 'local-slm' ? 'Local Gemma-4 (Vulkan GPU)' : readerProvider}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: 'var(--accent)', animation: 'pulse 1.2s infinite' }} />
                    </div>
                  </div>
                )}

                {/* Level 1: 1-line Brief */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--accent)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                    1-Sentence Executive Takeaway
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {document.summary?.brief || 'Generating brief overview...'}
                  </p>
                </div>

                {/* Level 2: Detailed paragraph */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Detailed Synthesis
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {document.summary?.detailed || document.content.slice(0, 300) + '...'}
                  </p>
                </div>

                {/* Level 3: Bullet points */}
                {document.summary?.keyPoints && document.summary.keyPoints.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Key Bullet Points
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {document.summary.keyPoints.map((pt, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                          }}
                        >
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ASK AI CHAT TAB */}
            {activeInspectorTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Model & Provider Switcher Bar */}
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Provider:</span>
                    <select
                      className="input-base"
                      value={readerProvider}
                      onChange={(e) => handleReaderProviderChange(e.target.value)}
                      style={{ padding: '2px 6px', fontSize: '11px', height: '26px' }}
                    >
                      <option value="local-slm">Local SLM (Gemma-4 E2B GGUF)</option>
                      <option value="openrouter">OpenRouter (Free Models)</option>
                      <option value="lmstudio">LM Studio (Local)</option>
                      <option value="xai">xAI (Grok)</option>
                      <option value="gemini">Gemini (Server)</option>
                    </select>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--accent)',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={readerModel}
                  >
                    {readerModel}
                  </span>
                </div>

                {/* Messages list */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '88%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                        color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {msg.text}
                      {msg.provider && (
                        <div
                          style={{
                            fontSize: '10px',
                            marginTop: '4px',
                            opacity: 0.7,
                            textAlign: 'right',
                          }}
                        >
                          via {msg.provider}
                        </div>
                      )}
                    </div>
                  ))}
                  {isAsking && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--accent)',
                      }}
                    >
                      <Loader2 size={13} className="animate-spin" />
                      <span>Synthesizing vector chunks...</span>
                    </div>
                  )}
                </div>

                {/* Question Input */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Ask about parameters, formulas, or concepts..."
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatQuestion.trim() || isAsking}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0 12px' }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. VERSION HISTORY TAB */}
            {activeInspectorTab === 'versions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Document Version History
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Immutable timeline snapshots stored in local repository.
                    </p>
                  </div>
                  <button
                    onClick={openEditor}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Edit3 size={11} style={{ color: 'var(--accent)' }} />
                    <span>Create Snapshot</span>
                  </button>
                </div>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {versions.map((v, index) => {
                    const isLatest = index === 0;
                    const isCurrent = v.versionNumber === (document.version || 1);
                    const isExpanded = expandedVersionId === v.id;

                    return (
                      <div
                        key={v.id}
                        className="glass-panel"
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                          background: isCurrent ? 'rgba(110, 231, 183, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                        }}
                      >
                        {/* Version Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                                background: isCurrent ? 'var(--accent-dim)' : 'rgba(255, 255, 255, 0.06)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              Version {v.versionNumber}
                            </span>

                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: 'var(--accent)',
                                  background: 'rgba(110, 231, 183, 0.15)',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                }}
                              >
                                CURRENT ACTIVE
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!isCurrent && (
                              <button
                                onClick={() => handleRestoreVersion(v)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '11px', padding: '3px 8px', gap: '4px', color: 'var(--accent)' }}
                                title={`Rollback to Version ${v.versionNumber}`}
                              >
                                <RotateCcw size={11} />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '6px' }}>
                          {v.changeDescription || 'Snapshot created'}
                        </p>

                        {/* Meta info */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginBottom: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            {formatDate(v.timestamp)}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={11} />
                            {v.author || 'Local User'}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(v.fileSize)}</span>
                          <span>•</span>
                          <span>~{v.tokenCount} tokens ({v.chunksCount} chunks)</span>
                        </div>

                        {/* Collapsible Content Preview */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedVersionId(isExpanded ? null : v.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: 0,
                            }}
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span>{isExpanded ? 'Hide Snapshot Text' : 'View Snapshot Text & Summary'}</span>
                          </button>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '10px',
                                borderRadius: '4px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                maxHeight: '200px',
                                overflowY: 'auto',
                              }}
                            >
                              {v.summary?.brief && (
                                <div style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                                  <strong style={{ color: 'var(--accent)' }}>Summary: </strong>
                                  <span>{v.summary.brief}</span>
                                </div>
                              )}
                              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                                {v.content.slice(0, 800)}
                                {v.content.length > 800 ? '\n\n...[snapshot continues]' : ''}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. CHUNKS TAB */}
            {activeInspectorTab === 'chunks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    LanceDB Vector Table Chunks ({chunks.length})
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)' }}>512 tokens / 64 overlap</span>
                </div>

                {chunks.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>
                        Chunk #{i + 1}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        ~{Math.round(c.length / 4)} tokens
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
                      {c}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 5. METADATA TAB */}
            {activeInspectorTab === 'meta' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  SQLite & LanceDB Node Metadata
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Document ID</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{document.id}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Active Version</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Version {document.version || 1}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Snapshot Count</span>
                    <span style={{ color: 'var(--text-primary)' }}>{versions.length} versions recorded</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>SHA-256 Digest</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '11px' }}>
                      {document.hash || 'a7b8e901f4c2847d8b5e612034981aef'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Disk File Path</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '11px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {document.filePath}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Embedding Model</span>
                    <span style={{ color: 'var(--accent)' }}>{document.embeddingModel || 'nomic-embed-text-v1.5'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Content & Create Version Modal */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-base)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Edit Document & Create New Version
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  This will snapshot the current state and commit a new Version {(document.version || versions.length || 1) + 1} to the repository timeline.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                Target: Version {(document.version || versions.length || 1) + 1}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  className="input-base"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Change Description / Snapshot Log Note
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="e.g. Updated architecture diagram notes and added security compliance rules"
                  value={editChangeDescription}
                  onChange={(e) => setEditChangeDescription(e.target.value)}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Document Content (Markdown / Text)
                </label>
                <textarea
                  className="input-base"
                  style={{
                    flex: 1,
                    minHeight: '260px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                  }}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleSaveEditAsVersion} className="btn btn-primary btn-md">
                Commit & Create Version {(document.version || versions.length || 1) + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
