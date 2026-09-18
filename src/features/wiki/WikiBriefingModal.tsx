import React, { useState } from 'react';
import { Sparkles, BookOpen, FileText, Download, Copy, Check, Loader2, X } from 'lucide-react';
import { DocumentItem, WikiCluster, WikiPage } from '../../types';
import { generateBriefingAI } from '../../services/wikiEngine';

interface WikiBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: WikiCluster[];
  documents: DocumentItem[];
  selectedWiki?: WikiPage;
}

export const WikiBriefingModal: React.FC<WikiBriefingModalProps> = ({
  isOpen,
  onClose,
  clusters,
  documents,
  selectedWiki,
}) => {
  const [mode, setMode] = useState<'executive' | 'study-guide'>('executive');
  const [selectedClusterId, setSelectedClusterId] = useState<string>(
    selectedWiki?.clusterId || clusters[0]?.id || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
  const clusterDocs = documents.filter((d) => currentCluster?.documentIds?.includes(d.id));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const topic = currentCluster?.name || selectedWiki?.title || 'Knowledge Base Synthesis';
      const result = await generateBriefingAI({
        topic,
        mode,
        sourceDocs: clusterDocs.length > 0 ? clusterDocs : documents.slice(0, 4),
      });
      setGeneratedContent(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode === 'executive' ? 'Executive-Briefing' : 'Study-Guide'}-${(currentCluster?.name || 'Topic').replace(/[^a-z0-9]+/gi, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '90%',
          maxHeight: '85vh',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {mode === 'executive' ? 'Executive Briefing Generator' : 'Academic Study Guide Generator'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Synthesize high-density briefing books with trade-offs, evidence matrices, and key strategic takeaways.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', color: 'var(--text-tertiary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setMode('executive')}
            className={`btn btn-sm ${mode === 'executive' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px' }}
          >
            <Sparkles size={14} />
            <span>Executive Briefing</span>
          </button>
          <button
            onClick={() => setMode('study-guide')}
            className={`btn btn-sm ${mode === 'study-guide' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px' }}
          >
            <BookOpen size={14} />
            <span>Study Guide & Hypotheses</span>
          </button>
        </div>

        {/* Scope Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Target Topic Cluster
          </label>
          <select
            className="input-base"
            value={selectedClusterId}
            onChange={(e) => setSelectedClusterId(e.target.value)}
          >
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.documentIds.length} source documents)
              </option>
            ))}
          </select>
        </div>

        {/* Source Documents Preview */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-base)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <strong>Sources Included ({clusterDocs.length}):</strong>{' '}
          {clusterDocs.map((d) => d.title).join(', ') || 'Default core assets'}
        </div>

        {/* Generated Output Preview Area */}
        {generatedContent ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Generated Synthesis
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                >
                  {copied ? <Check size={12} style={{ color: 'var(--accent)' }} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                >
                  <Download size={12} />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                maxHeight: '300px',
              }}
            >
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}>
                {generatedContent}
              </pre>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={isGenerating}>
            Close
          </button>
          <button
            onClick={handleGenerate}
            className="btn btn-primary btn-sm"
            disabled={isGenerating}
            style={{ minWidth: '140px', justifyContent: 'center' }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>{generatedContent ? 'Re-synthesize' : 'Generate Briefing'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
