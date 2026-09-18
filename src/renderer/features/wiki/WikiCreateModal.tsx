import React, { useState } from 'react';
import { Sparkles, BookOpen, Layers, CheckCircle2, Loader2, X } from 'lucide-react';
import { DocumentItem, WikiPage, WikiCluster } from '../../types';
import { synthesizeWikiArticle } from '../../services/wikiEngine';

interface WikiCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: WikiCluster[];
  documents: DocumentItem[];
  allWikis: WikiPage[];
  onCreated: (wiki: WikiPage) => void;
}

export const WikiCreateModal: React.FC<WikiCreateModalProps> = ({
  isOpen,
  onClose,
  clusters,
  documents,
  allWikis,
  onCreated,
}) => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Technical');
  const [selectedClusterId, setSelectedClusterId] = useState(clusters[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState<'idle' | 'outline' | 'sections' | 'synthesis'>('idle');

  if (!isOpen) return null;

  const handleSynthesize = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      // Stage A: Outline
      setCurrentStage('outline');
      await new Promise((r) => setTimeout(r, 450));

      // Stage B: Section synthesis
      setCurrentStage('sections');
      await new Promise((r) => setTimeout(r, 600));

      // Stage C: Linking pass
      setCurrentStage('synthesis');

      // Select relevant documents based on cluster and topic
      const targetCluster = clusters.find((c) => c.id === selectedClusterId);
      const clusterDocIds = targetCluster ? targetCluster.documentIds : [];
      let sourceDocs = documents.filter((d) => clusterDocIds.includes(d.id));

      if (sourceDocs.length === 0) {
        sourceDocs = documents.filter(
          (d) =>
            d.category.toLowerCase() === category.toLowerCase() ||
            d.title.toLowerCase().includes(topic.toLowerCase())
        );
      }
      if (sourceDocs.length === 0) {
        sourceDocs = documents.slice(0, 3);
      }

      const newWiki = await synthesizeWikiArticle({
        topic,
        category,
        clusterId: selectedClusterId,
        sourceDocs,
        allWikis,
      });

      onCreated(newWiki);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setCurrentStage('idle');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '90%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
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
                Synthesize Living Wiki Article
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Multi-stage pipeline: Clustering → Outline → Section Context → Cross-Document Linking.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Article Topic or Research Domain
            </label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Asynchronous Ingestion & Semantic Chunking Architecture"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Primary Domain Category
              </label>
              <select
                className="input-base"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isGenerating}
              >
                <option value="Technical">Technical & Architecture</option>
                <option value="Research">Research & Compliance</option>
                <option value="Finance">Finance & Unit Economics</option>
                <option value="Work">Engineering & Systems</option>
                <option value="Legal">Legal & Contracts</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Source Topic Cluster
              </label>
              <select
                className="input-base"
                value={selectedClusterId}
                onChange={(e) => setSelectedClusterId(e.target.value)}
                disabled={isGenerating}
              >
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Stage Generation Progress Pipeline */}
        {isGenerating && (
          <div
            style={{
              background: 'var(--bg-base)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Executing Synthesis Pipeline:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: currentStage === 'outline' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {currentStage === 'outline' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />
                )}
                <span>Stage A: Hierarchical Outline & Evidence Extraction</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: currentStage === 'sections' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {currentStage === 'sections' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : currentStage === 'synthesis' ? (
                  <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />
                ) : (
                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />
                )}
                <span>Stage B: Section-by-Section Contextual Synthesis</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: currentStage === 'synthesis' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {currentStage === 'synthesis' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />
                )}
                <span>Stage C: Cross-Document Linking & Citation Normalization</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={isGenerating}>
            Cancel
          </button>
          <button
            onClick={handleSynthesize}
            className="btn btn-primary btn-sm"
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Synthesizing Article...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Synthesize Knowledge Article</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
