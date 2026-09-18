import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Filter,
  FileText,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem, SearchResult } from '../../types';
import { hybridSearch } from '../../services/localEngine';
import { getFileTypeBadge, getFileTypeIcon, formatFileSize } from '../../components/DocumentCard';

interface SearchPageProps {
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  documents,
  onSelectDocument,
}) => {
  const [query, setQuery] = useState('');
  const [semanticWeight, setSemanticWeight] = useState(0.65); // 0.0 .. 1.0
  const [results, setResults] = useState<SearchResult[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(3.8);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const executeSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t0 = performance.now();
    const filteredDocs =
      selectedCategory === 'all'
        ? documents
        : documents.filter((d) => d.category === selectedCategory);

    const res = hybridSearch(query, filteredDocs, {
      semantic: semanticWeight,
      keyword: 1.0 - semanticWeight,
    });
    const t1 = performance.now();
    setLatencyMs(Number((t1 - t0 + 2.1).toFixed(1))); // Include small base disk seek simulation
    setResults(res);
  };

  useEffect(() => {
    executeSearch();
  }, [query, semanticWeight, selectedCategory, documents]);

  const sampleQueries = [
    'LanceDB zero-server vector database',
    'Gross margin & monthly cash burn',
    'Air-gapped GDPR compliance and zero-egress',
    'BM25 and Reciprocal Rank Fusion formula',
    'Apple Silicon Metal vs CUDA benchmarks',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-deep)',
      }}
      id="search-page-view"
    >
      {/* Search Header Banner */}
      <div
        style={{
          padding: '24px 32px 20px 32px',
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Hybrid Semantic Search
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dual-engine indexing: LanceDB DiskANN dense vectors + SQLite FTS5 BM25 keyword rankings
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
              <Zap size={13} />
              <span>RRF Engine</span>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {latencyMs} ms P50
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>Zero Cloud Calls</span>
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent)',
            }}
          />
          <input
            type="text"
            className="input-base"
            placeholder="Type a concept, query, or phrase (e.g. 'how does disk-based vector storage work?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              paddingLeft: '44px',
              paddingRight: '120px',
              height: '44px',
              fontSize: '14px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.04)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-sm"
              style={{
                position: 'absolute',
                right: '80px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                padding: '2px 8px',
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={executeSearch}
            className="btn btn-primary btn-sm"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '6px 14px',
            }}
          >
            Search
          </button>
        </div>

        {/* Sliders and Query Weight Tuning */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Preset query chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
              Suggestions:
            </span>
            {sampleQueries.map((sq) => (
              <button
                key={sq}
                onClick={() => setQuery(sq)}
                className="tag-pill"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  fontSize: '11px',
                }}
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Slider control */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Sliders size={13} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Dense Vector ({Math.round(semanticWeight * 100)}%)
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={semanticWeight}
              onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              title="Balance between Dense Vector Similarity and Exact Keyword Matching"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Sparse BM25 ({Math.round((1.0 - semanticWeight) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
        }}
      >
        {query.trim() === '' ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Search size={26} />
            </div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Search Across Local Knowledge Base
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '440px', lineHeight: 1.6 }}>
              Enter any query to perform combined dense vector retrieval and BM25 full-text rank fusion.
              Click any suggestion above to test immediate hybrid scoring.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              No matches found for "{query}"
            </p>
            <p style={{ fontSize: '13px' }}>
              Try adjusting the Dense / Sparse slider or searching for broader terms.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '900px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                paddingBottom: '4px',
              }}
            >
              <span>
                Found <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> matching documents
              </span>
              <span>Sorted by Normalized RRF Score</span>
            </div>

            {results.map((res, i) => (
              <div
                key={res.document.id}
                className="glass-panel"
                id={`search-result-${res.document.id}`}
                onClick={() => onSelectDocument(res.document)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                  border: '1px solid var(--border-subtle)',
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
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getFileTypeIcon(res.document.fileType)}
                    {getFileTypeBadge(res.document.fileType)}
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {res.document.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                      }}
                    >
                      {Math.round(res.score * 100)}% Match
                    </span>
                    <ExternalLink size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>

                {/* Match snippet */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    borderLeft: '3px solid var(--accent)',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 600, marginRight: '6px' }}>
                    Best Excerpt:
                  </span>
                  {res.matchedSnippet}
                </div>

                {/* Footer metadata & tags */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Category: {res.document.category}</span>
                    <span>•</span>
                    <span>{res.document.chunksCount} chunks</span>
                    <span>•</span>
                    <span>{formatFileSize(res.document.fileSize)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {res.document.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag-pill">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
