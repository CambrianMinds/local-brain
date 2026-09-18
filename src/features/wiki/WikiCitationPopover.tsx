import React from 'react';
import { FileText, ExternalLink, Tag, Cpu, HardDrive } from 'lucide-react';
import { DocumentItem } from '../../types';
import { formatDate } from '../../components/DocumentCard';

interface WikiCitationPopoverProps {
  document: DocumentItem;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
}

export const WikiCitationPopover: React.FC<WikiCitationPopoverProps> = ({
  document,
  position,
  onClose,
  onOpenDocument,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(position.x, window.innerWidth - 380),
        top: Math.min(position.y + 16, window.innerHeight - 320),
        width: '360px',
        maxHeight: '380px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-focus)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg), var(--glow-accent)',
        padding: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={15} />
          </div>
          <div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Source Document · {document.category}
            </span>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                marginTop: '1px',
              }}
            >
              {document.title}
            </h4>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          maxHeight: '140px',
          overflowY: 'auto',
        }}
      >
        {document.summary?.brief || document.content.slice(0, 240) + '...'}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Cpu size={12} /> {document.chunksCount} chunks
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={12} /> {document.tokenCount} tokens
        </span>
        <span style={{ marginLeft: 'auto' }}>
          {formatDate(document.updatedAt || document.createdAt)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
        <button
          onClick={onClose}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '11px', padding: '4px 10px' }}
        >
          Dismiss
        </button>
        <button
          onClick={() => {
            onClose();
            onOpenDocument(document);
          }}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '11px', padding: '4px 12px', gap: '6px' }}
        >
          <span>Open Full Document</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};
