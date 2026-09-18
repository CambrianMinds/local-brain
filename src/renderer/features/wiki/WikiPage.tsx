import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Edit3,
  Check,
  Download,
  AlertTriangle,
  Lightbulb,
  Share2,
  Compass,
  Layers,
  ArrowUpRight,
  Copy,
  Sliders,
} from 'lucide-react';
import { WikiPage as WikiPageType, DocumentItem, WikiStatus } from '../../types';
import {
  clusterDocuments,
  parseMarkdownSections,
  regenerateWikiSection,
  synthesizeWikiArticle,
  exportWikiToObsidian,
  exportObsidianVaultZip,
} from '../../services/wikiEngine';
import { formatDate } from '../../components/DocumentCard';
import { WikiMarkdownRenderer } from './WikiMarkdownRenderer';
import { WikiCitationPopover } from './WikiCitationPopover';
import { WikiBriefingModal } from './WikiBriefingModal';
import { WikiCreateModal } from './WikiCreateModal';

interface WikiPageProps {
  wikis: WikiPageType[];
  documents: DocumentItem[];
  onOpenDocument: (doc: DocumentItem) => void;
  onAddWiki: (wiki: WikiPageType) => void;
  onUpdateWiki?: (wiki: WikiPageType) => void;
}

export const WikiPage: React.FC<WikiPageProps> = ({
  wikis,
  documents,
  onOpenDocument,
  onAddWiki,
  onUpdateWiki,
}) => {
  const [selectedWikiId, setSelectedWikiId] = useState<string>(wikis[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Citation popover state
  const [activeCitationDoc, setActiveCitationDoc] = useState<{ doc: DocumentItem; pos: { x: number; y: number } } | null>(null);

  // Clusters calculation
  const clusters = useMemo(() => clusterDocuments(documents, wikis), [documents, wikis]);

  const selectedWiki = wikis.find((w) => w.id === selectedWikiId) || wikis[0];

  // Sync editedContent when selected wiki changes
  React.useEffect(() => {
    if (selectedWiki) {
      setEditedContent(selectedWiki.content);
      setIsEditMode(false);
    }
  }, [selectedWiki?.id]);

  const filteredWikis = wikis.filter(
    (w) =>
      w.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Extract headings for Table of Contents
  const tocItems = useMemo(() => {
    if (!selectedWiki) return [];
    const lines = selectedWiki.content.split('\n');
    const items: Array<{ id: string; title: string; level: number }> = [];

    lines.forEach((line) => {
      const h2 = line.match(/^##\s+(.+)$/);
      const h3 = line.match(/^###\s+(.+)$/);
      if (h2) {
        items.push({
          id: h2[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: h2[1],
          level: 2,
        });
      } else if (h3) {
        items.push({
          id: h3[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: h3[1],
          level: 3,
        });
      }
    });
    return items;
  }, [selectedWiki?.content]);

  // Navigate to linked wiki
  const handleNavigateWiki = (targetIdOrTitle: string) => {
    const found = wikis.find(
      (w) =>
        w.id === targetIdOrTitle ||
        w.title.toLowerCase() === targetIdOrTitle.toLowerCase() ||
        w.title.toLowerCase().includes(targetIdOrTitle.toLowerCase())
    );
    if (found) {
      setSelectedWikiId(found.id);
    }
  };

  // Handle citation popover
  const handleCitationClick = (docTitle: string, event: React.MouseEvent) => {
    const doc = documents.find(
      (d) => d.title.toLowerCase() === docTitle.toLowerCase() || d.title.toLowerCase().includes(docTitle.toLowerCase())
    );
    if (doc) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setActiveCitationDoc({
        doc,
        pos: { x: rect.left, y: rect.bottom + 6 },
      });
    }
  };

  // Lock toggle handler
  const handleToggleLock = () => {
    if (!selectedWiki || !onUpdateWiki) return;
    const newStatus: WikiStatus = selectedWiki.status === 'locked' ? (selectedWiki.userEditedAt ? 'user-edited' : 'auto') : 'locked';
    const updated = {
      ...selectedWiki,
      status: newStatus,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateWiki(updated);
  };

  // Save manual edit
  const handleSaveEdit = () => {
    if (!selectedWiki || !onUpdateWiki) return;
    const updated: WikiPageType = {
      ...selectedWiki,
      content: editedContent,
      status: 'user-edited',
      userEditedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sections: parseMarkdownSections(editedContent),
    };
    onUpdateWiki(updated);
    setIsEditMode(false);
  };

  // Revert manual edits to original auto-generated version
  const handleRevertToOriginal = () => {
    if (!selectedWiki || !selectedWiki.originalContent || !onUpdateWiki) return;
    const updated: WikiPageType = {
      ...selectedWiki,
      content: selectedWiki.originalContent,
      status: 'auto',
      lastUpdated: new Date().toISOString(),
      sections: parseMarkdownSections(selectedWiki.originalContent),
    };
    onUpdateWiki(updated);
    setEditedContent(selectedWiki.originalContent);
    setIsEditMode(false);
  };

  // Regenerate entire page
  const handleRegeneratePage = async () => {
    if (!selectedWiki || !onUpdateWiki) return;
    if (selectedWiki.status === 'locked') {
      alert('This wiki article is locked to preserve human curation. Please unlock it to regenerate.');
      return;
    }

    setIsRegenerating(true);
    try {
      const sourceDocs = documents.filter((d) => selectedWiki.sourceDocIds.includes(d.id));
      const regenerated = await synthesizeWikiArticle({
        topic: selectedWiki.title,
        category: selectedWiki.category,
        clusterId: selectedWiki.clusterId,
        sourceDocs: sourceDocs.length > 0 ? sourceDocs : documents.slice(0, 3),
        allWikis: wikis,
      });

      const merged: WikiPageType = {
        ...selectedWiki,
        content: regenerated.content,
        summary: regenerated.summary,
        coverageScore: regenerated.coverageScore,
        lastGeneratedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        sections: regenerated.sections,
        contradictions: regenerated.contradictions,
        knowledgeGaps: regenerated.knowledgeGaps,
        stalenessCount: 0,
      };

      onUpdateWiki(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Regenerate specific section
  const handleRegenerateSection = async (heading: string) => {
    if (!selectedWiki || !onUpdateWiki) return;
    if (selectedWiki.status === 'locked') {
      alert('This article is locked against automatic changes.');
      return;
    }

    setRegeneratingSection(heading);
    try {
      const sourceDocs = documents.filter((d) => selectedWiki.sourceDocIds.includes(d.id));
      const updated = await regenerateWikiSection({
        page: selectedWiki,
        sectionHeading: heading,
        sourceDocs,
      });
      onUpdateWiki(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Export single page to Obsidian Markdown
  const handleDownloadSingleNote = () => {
    if (!selectedWiki) return;
    const markdown = exportWikiToObsidian(selectedWiki, documents);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedWiki.title.replace(/[^a-z0-9]+/gi, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export entire Obsidian Vault ZIP
  const handleExportVault = async () => {
    try {
      const zipBlob = await exportObsidianVaultZip(wikis, documents);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LocalBrain-Obsidian-Vault-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export vault:', err);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status?: WikiStatus) => {
    switch (status) {
      case 'locked':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--warning)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Lock size={11} />
            <span>Locked</span>
          </span>
        );
      case 'user-edited':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Edit3 size={11} />
            <span>User Curated</span>
          </span>
        );
      case 'auto':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(110, 231, 183, 0.15)',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Sparkles size={11} />
            <span>Auto Synthesized</span>
          </span>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-deep)',
      }}
      id="wiki-synthesizer-view"
      onClick={() => setActiveCitationDoc(null)}
    >
      {/* Citation Popover floating element */}
      {activeCitationDoc && (
        <WikiCitationPopover
          document={activeCitationDoc.doc}
          position={activeCitationDoc.pos}
          onClose={() => setActiveCitationDoc(null)}
          onOpenDocument={onOpenDocument}
        />
      )}

      {/* LEFT COLUMN: Clusters & Living Articles List */}
      <div
        style={{
          width: '340px',
          minWidth: '340px',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-base)',
        }}
      >
        {/* Header & Global Actions */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  Living Knowledge Wiki
                </h2>
                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
                  Continuous Synthesis & Disk Vault
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
              title="Synthesize New Topic from Documents"
            >
              <Plus size={13} />
              <span>Synthesize</span>
            </button>
          </div>

          {/* Quick Action Tools: Briefing Generator & Vault Export */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => setShowBriefingModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'center', gap: '5px' }}
              title="Generate Executive Briefing or Academic Study Guide"
            >
              <Sparkles size={12} style={{ color: 'var(--accent)' }} />
              <span>Briefing Book</span>
            </button>

            <button
              onClick={handleExportVault}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'center', gap: '5px' }}
              title="Export Obsidian & Logseq compatible Markdown Vault (.zip)"
            >
              <Download size={12} />
              <span>Obsidian Vault</span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              className="input-base"
              placeholder="Search wiki articles..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ paddingLeft: '30px', height: '30px', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Article List with Status & Coverage */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px 8px' }}>
            Living Articles ({filteredWikis.length})
          </div>

          {filteredWikis.map((wiki) => {
            const isSelected = wiki.id === selectedWikiId;
            const cluster = clusters.find((c) => c.id === wiki.clusterId || c.category === wiki.category);
            const hasStaleness = cluster && cluster.stalenessCount > 0;

            return (
              <div
                key={wiki.id}
                onClick={() => setSelectedWikiId(wiki.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-dim)' : 'transparent',
                  border: isSelected ? '1px solid rgba(110, 231, 183, 0.3)' : '1px solid transparent',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent)' : 'var(--accent-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {wiki.category}
                  </span>
                  {renderStatusBadge(wiki.status)}
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                    marginBottom: '6px',
                  }}
                >
                  {wiki.title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <span>{wiki.sourceDocIds.length} source docs</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {wiki.coverageScore || 90}% coverage
                  </span>
                </div>

                {hasStaleness && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '10.5px',
                      color: 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={11} />
                    <span>{cluster.stalenessCount} new docs ready to sync</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN AREA: Reading View + Sticky TOC + Knowledge Controls */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          background: 'var(--bg-deep)',
        }}
      >
        {selectedWiki ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '36px 44px',
            }}
          >
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>
              {/* Article Meta Header */}
              <div
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={12} />
                      <span>{selectedWiki.category} Knowledge Domain</span>
                    </div>
                    {renderStatusBadge(selectedWiki.status)}
                  </div>

                  {/* Top Header Controls: Lock, Edit, Regenerate, Export */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handleToggleLock}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        gap: '4px',
                        color: selectedWiki.status === 'locked' ? 'var(--warning)' : 'var(--text-secondary)',
                      }}
                      title={selectedWiki.status === 'locked' ? 'Unlock to allow AI regeneration' : 'Lock to preserve curation'}
                    >
                      {selectedWiki.status === 'locked' ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>{selectedWiki.status === 'locked' ? 'Locked' : 'Lock'}</span>
                    </button>

                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`btn btn-sm ${isEditMode ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                      title="Edit article Markdown"
                    >
                      <Edit3 size={12} />
                      <span>{isEditMode ? 'Reading View' : 'Edit Note'}</span>
                    </button>

                    <button
                      onClick={handleRegeneratePage}
                      className="btn btn-secondary btn-sm"
                      disabled={isRegenerating || selectedWiki.status === 'locked'}
                      style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                      title="Regenerate article across source documents"
                    >
                      {isRegenerating ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={handleDownloadSingleNote}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                      title="Download as Obsidian / Logseq Markdown file (.md)"
                    >
                      <Download size={12} />
                      <span>.md</span>
                    </button>
                  </div>
                </div>

                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                    marginBottom: '8px',
                  }}
                >
                  {selectedWiki.title}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>Last synthesized: {formatDate(selectedWiki.lastUpdated)}</span>
                  <span>•</span>
                  <span>Coverage Confidence: <strong>{selectedWiki.coverageScore || 92}%</strong></span>
                  <span>•</span>
                  <span>Obsidian Vault Native</span>
                </div>
              </div>

              {/* Staleness Detection Alert Banner */}
              {(() => {
                const cluster = clusters.find((c) => c.id === selectedWiki.clusterId || c.category === selectedWiki.category);
                if (cluster && cluster.stalenessCount > 0) {
                  return (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          <strong>{cluster.stalenessCount} new document{cluster.stalenessCount > 1 ? 's' : ''} added</strong> in this cluster since last synthesis.
                        </div>
                      </div>
                      <button
                        onClick={handleRegeneratePage}
                        className="btn btn-primary btn-sm"
                        disabled={isRegenerating || selectedWiki.status === 'locked'}
                        style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                      >
                        <RefreshCw size={11} />
                        <span>Sync & Refresh Wiki</span>
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Contradiction Detection Banner */}
              {selectedWiki.contradictions && selectedWiki.contradictions.length > 0 && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '13px' }}>
                    <AlertTriangle size={15} />
                    <span>Cross-Document Contradiction Detected</span>
                  </div>
                  {selectedWiki.contradictions.map((c) => (
                    <div key={c.id} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {c.topic}
                      </div>
                      <div style={{ paddingLeft: '10px', borderLeft: '2px solid rgba(239, 68, 68, 0.4)', margin: '6px 0' }}>
                        <div>• <em>{c.sourceDocA}</em>: "{c.statementA}"</div>
                        <div>• <em>{c.sourceDocB}</em>: "{c.statementB}"</div>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Analysis: {c.notes}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Referenced Primary Documents Bar */}
              <div
                className="glass-panel"
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Referenced Source Documents ({selectedWiki.sourceDocIds.length}):
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Hover citations in text for live previews
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedWiki.sourceDocIds.map((docId) => {
                    const doc = documents.find((d) => d.id === docId);
                    if (!doc) return null;
                    return (
                      <button
                        key={docId}
                        onClick={() => onOpenDocument(doc)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px', gap: '6px' }}
                        title={`Open "${doc.title}"`}
                      >
                        <FileText size={12} style={{ color: 'var(--accent)' }} />
                        <span>{doc.title}</span>
                        <ExternalLink size={10} style={{ opacity: 0.6 }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDIT MODE vs READING VIEW */}
              {isEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Markdown Editor (Obsidian Compatible)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedWiki.originalContent && (
                        <button
                          onClick={handleRevertToOriginal}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          Revert to Auto-Generated
                        </button>
                      )}
                      <button
                        onClick={handleSaveEdit}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 12px', gap: '4px' }}
                      >
                        <Check size={12} />
                        <span>Save Curated Version</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '480px',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                /* Rich Markdown Rendered Body */
                <WikiMarkdownRenderer
                  content={selectedWiki.content}
                  allWikis={wikis}
                  allDocs={documents}
                  onNavigateWiki={handleNavigateWiki}
                  onCitationClick={handleCitationClick}
                  onRegenerateSection={handleRegenerateSection}
                  isLocked={selectedWiki.status === 'locked'}
                />
              )}

              {/* Knowledge Gap Insights Card */}
              {selectedWiki.knowledgeGaps && selectedWiki.knowledgeGaps.length > 0 && (
                <div
                  style={{
                    marginTop: '40px',
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(125, 211, 252, 0.05)',
                    border: '1px solid rgba(125, 211, 252, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '13px' }}>
                    <Lightbulb size={16} />
                    <span>Identified Knowledge Gaps & Next Research Plan</span>
                  </div>

                  {selectedWiki.knowledgeGaps.map((gap) => (
                    <div key={gap.id} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {gap.topic}
                      </div>
                      <div>{gap.description}</div>
                      <div style={{ marginTop: '4px', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 500 }}>
                        Recommendation: {gap.suggestedResearch}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            Select or synthesize a wiki topic to read
          </div>
        )}

        {/* STICKY TABLE OF CONTENTS (TOC) RIGHT DRAWER */}
        {selectedWiki && tocItems.length > 0 && !isEditMode && (
          <aside
            style={{
              width: '240px',
              minWidth: '240px',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--bg-base)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Compass size={13} />
              <span>Table of Contents</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tocItems.map((item, idx) => (
                <a
                  key={idx}
                  href={`#${item.id}`}
                  style={{
                    fontSize: item.level === 2 ? '12px' : '11.5px',
                    color: item.level === 2 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    paddingLeft: item.level === 2 ? '0' : '10px',
                    textDecoration: 'none',
                    lineHeight: 1.35,
                    borderLeft: '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.borderLeftColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = item.level === 2 ? 'var(--text-secondary)' : 'var(--text-tertiary)';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                >
                  {item.title}
                </a>
              ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={handleDownloadSingleNote}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '11px', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={12} />
                <span>Export Note (.md)</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Synthesis Modal */}
      <WikiCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        clusters={clusters}
        documents={documents}
        allWikis={wikis}
        onCreated={(newWiki) => {
          onAddWiki(newWiki);
          setSelectedWikiId(newWiki.id);
        }}
      />

      {/* Executive Briefing / Study Guide Modal */}
      <WikiBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        clusters={clusters}
        documents={documents}
        selectedWiki={selectedWiki}
      />
    </div>
  );
};
