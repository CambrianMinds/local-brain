import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  SlidersHorizontal,
  CornerDownLeft,
} from 'lucide-react';
import { DocumentItem, SearchResult } from '../types';
import { hybridSearch } from '../services/localEngine';
import { getFileTypeBadge, getFileTypeIcon } from './DocumentCard';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
}

const RECENT_QUERIES = [
  'LanceDB disk-based vector indexing',
  'Cash runway and operating expenses',
  'GDPR compliance and local air-gapped guarantees',
  'Reciprocal Rank Fusion hybrid search',
  'Apple Silicon Metal vs CUDA benchmarks',
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const searchResults = hybridSearch(query, documents, { semantic: 0.65, keyword: 0.35 });
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, documents]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectDocument(results[selectedIndex].document);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} id="command-palette-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: 0 }}
      >
        {/* Search input bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-base)',
          }}
        >
          <Search size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="input-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, concepts, or ask a question... (↑↓ to navigate)"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              padding: 0,
              boxShadow: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
          <kbd
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-tertiary)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results / Suggestions Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {query.trim() === '' ? (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-tertiary)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} />
                Recent Queries & Suggested Topics
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {RECENT_QUERIES.map((rq) => (
                  <div
                    key={rq}
                    onClick={() => setQuery(rq)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background var(--duration-fast) var(--ease-out)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ flex: 1 }}>{rq}</span>
                    <ArrowRight size={12} style={{ opacity: 0.5 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                No direct document matches found for "{query}"
              </p>
              <p style={{ fontSize: '12px' }}>
                Try searching for technical keywords like "LanceDB", "Finance", "GDPR", or "Metal".
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  padding: '4px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Matching Documents ({results.length})</span>
                <span>Hybrid RRF Ranking</span>
              </div>

              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={res.document.id}
                    onClick={() => {
                      onSelectDocument(res.document);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(110, 231, 183, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(110, 231, 183, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease-out)',
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {getFileTypeIcon(res.document.fileType)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {res.document.title}
                        </span>
                        {getFileTypeBadge(res.document.fileType)}
                      </div>

                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {res.matchedSnippet}
                      </p>
                    </div>

                    {/* Score Bar */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent)',
                          fontWeight: 600,
                        }}
                      >
                        {Math.round(res.score * 100)}%
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          color: 'var(--text-tertiary)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {res.searchType}
                      </span>
                    </div>

                    {isSelected && (
                      <CornerDownLeft size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-base)',
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 4px', borderRadius: '3px' }}>↑↓</kbd> Navigate
            </span>
            <span>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 4px', borderRadius: '3px' }}>↵</kbd> Open
            </span>
            <span>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 4px', borderRadius: '3px' }}>ESC</kbd> Close
            </span>
          </div>

          <span>Reciprocal Rank Fusion Engine</span>
        </div>
      </div>
    </div>
  );
};
