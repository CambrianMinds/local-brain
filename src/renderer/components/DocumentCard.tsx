import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Mail,
  File,
  MoreVertical,
  BookOpen,
  Trash2,
  Sparkles,
  Layers,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem, DocumentType } from '../types';

interface DocumentCardProps {
  document: DocumentItem;
  onSelect: (doc: DocumentItem) => void;
  onDelete?: (id: string) => void;
  onSummarize?: (doc: DocumentItem) => void;
  viewMode?: 'grid' | 'list';
  relevanceScore?: number;
}

export const getFileTypeBadge = (type: DocumentType) => {
  switch (type) {
    case 'pdf':
      return <span className="file-badge pdf">PDF</span>;
    case 'docx':
      return <span className="file-badge docx">DOCX</span>;
    case 'markdown':
      return <span className="file-badge markdown">MD</span>;
    case 'code':
      return <span className="file-badge code">CODE</span>;
    case 'spreadsheet':
      return <span className="file-badge spreadsheet">XLSX</span>;
    case 'email':
      return <span className="file-badge email">EML</span>;
    case 'text':
    default:
      return <span className="file-badge text">TXT</span>;
  }
};

export const getFileTypeIcon = (type: DocumentType) => {
  switch (type) {
    case 'spreadsheet':
      return <FileSpreadsheet size={16} style={{ color: '#4ade80' }} />;
    case 'code':
      return <FileCode size={16} style={{ color: '#34d399' }} />;
    case 'email':
      return <Mail size={16} style={{ color: '#fbbf24' }} />;
    case 'pdf':
      return <FileText size={16} style={{ color: '#f87171' }} />;
    case 'markdown':
    case 'docx':
    case 'text':
    default:
      return <FileText size={16} style={{ color: '#7dd3fc' }} />;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onSelect,
  onDelete,
  onSummarize,
  viewMode = 'grid',
  relevanceScore,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        className="glass-panel"
        id={`doc-card-${document.id}`}
        onClick={() => onSelect(document)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all var(--duration-fast) var(--ease-out)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getFileTypeIcon(document.fileType)}
          {getFileTypeBadge(document.fileType)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {document.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {document.summary?.brief || document.content.slice(0, 100)}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
          {document.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>

        {/* Chunks & Tokens */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
          }}
        >
          {document.chunksCount} chunks · {formatFileSize(document.fileSize)}
        </div>

        {/* Relevance score bar if present */}
        {relevanceScore !== undefined && (
          <div style={{ width: '70px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: 'var(--accent)' }}>Match</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {Math.round(relevanceScore * 100)}%
              </span>
            </div>
            <div
              style={{
                height: '3px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(relevanceScore * 100)}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
          </div>
        )}

        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px', color: 'var(--text-tertiary)' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(document);
          }}
          title="Open Document"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="document-card"
      id={`doc-card-${document.id}`}
      onClick={() => onSelect(document)}
    >
      {/* Top row */}
      <div className="document-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getFileTypeIcon(document.fileType)}
          {getFileTypeBadge(document.fileType)}
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontWeight: 500,
            }}
          >
            {document.category}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px 4px', height: '22px' }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Card Options"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div
              className="glass-panel-elevated"
              style={{
                position: 'absolute',
                top: '26px',
                right: 0,
                zIndex: 40,
                borderRadius: 'var(--radius-md)',
                minWidth: '150px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => {
                  setMenuOpen(false);
                  onSelect(document);
                }}
              >
                <BookOpen size={13} />
                <span>Open Reader</span>
              </button>
              {onSummarize && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => {
                    setMenuOpen(false);
                    onSummarize(document);
                  }}
                >
                  <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                  <span>AI Summary</span>
                </button>
              )}
              {onDelete && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    color: 'var(--danger)',
                  }}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(document.id);
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="document-title">{document.title}</h3>

      {/* Summary preview */}
      <p className="document-summary">
        {document.summary?.brief || document.content.slice(0, 120) + '...'}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {document.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag-pill">
            #{tag}
          </span>
        ))}
        {document.tags.length > 3 && (
          <span className="tag-pill" style={{ opacity: 0.7 }}>
            +{document.tags.length - 3}
          </span>
        )}
      </div>

      {/* Relevance Score Bar (if applicable in search mode) */}
      {relevanceScore !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Relevance Score</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {Math.round(relevanceScore * 100)}%
            </span>
          </div>
          <div
            style={{
              height: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(relevanceScore * 100)}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="document-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {formatDate(document.updatedAt || document.createdAt)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} />
            {document.chunksCount} chunks
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatFileSize(document.fileSize)}</span>
      </div>
    </div>
  );
};
