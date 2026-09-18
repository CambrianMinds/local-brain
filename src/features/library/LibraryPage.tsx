import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Upload,
  Plus,
  Files,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import { DocumentItem, DocumentType } from '../../types';
import { DocumentCard } from '../../components/DocumentCard';

interface LibraryPageProps {
  documents: DocumentItem[];
  selectedCategory: string;
  onSelectDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onOpenUpload: () => void;
  onOpenCommandPalette: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  documents,
  selectedCategory,
  onSelectDocument,
  onDeleteDocument,
  onOpenUpload,
  onOpenCommandPalette,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'size' | 'chunks'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && doc.fileType !== selectedType) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesTags = doc.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSummary = doc.summary?.brief?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTags && !matchesSummary) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'size') {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === 'chunks') {
        return b.chunksCount - a.chunksCount;
      }
      return 0;
    });
  }, [documents, selectedCategory, selectedType, searchQuery, sortBy]);

  const fileTypes: { label: string; value: string }[] = [
    { label: 'All Formats', value: 'all' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'PDF', value: 'pdf' },
    { label: 'DOCX', value: 'docx' },
    { label: 'Code', value: 'code' },
    { label: 'Sheets', value: 'spreadsheet' },
    { label: 'Email', value: 'email' },
    { label: 'Text', value: 'text' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
      id="library-page-view"
    >
      {/* Top Toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--bg-base)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              {selectedCategory === 'all' ? 'All Ingested Documents' : `${selectedCategory} Documents`}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {filteredDocuments.length} files indexed into LanceDB and SQLite catalog
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenUpload}
              className="btn btn-primary btn-sm"
              id="library-ingest-button"
            >
              <Upload size={14} />
              <span>Import Files</span>
            </button>
          </div>
        </div>

        {/* Filter and View Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={14}
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
              placeholder="Filter by title, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '32px', fontSize: '12px' }}
            />
          </div>

          {/* Type Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            {fileTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setSelectedType(ft.value)}
                className={`tag-pill ${selectedType === ft.value ? 'accent' : ''}`}
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  border: 'none',
                  background:
                    selectedType === ft.value ? 'var(--accent-dim)' : 'rgba(255, 255, 255, 0.04)',
                }}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {/* Right: Sort and View mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={13} style={{ color: 'var(--text-tertiary)' }} />
              <select
                className="input-base"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ height: '32px', padding: '2px 8px', fontSize: '12px', width: 'auto' }}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="chunks">Sort by Chunks</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
              }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '4px 6px',
                  background: viewMode === 'grid' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-tertiary)',
                }}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 6px',
                  background: viewMode === 'list' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-tertiary)',
                }}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document Content Grid/List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        {filteredDocuments.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-tertiary)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <FolderOpen size={28} style={{ opacity: 0.4 }} />
            </div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              No documents found
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '360px', marginBottom: '16px' }}>
              No documents matched your filter criteria in category "{selectedCategory}".
            </p>
            <button onClick={onOpenUpload} className="btn btn-primary btn-sm">
              <Upload size={14} />
              <span>Import Documents</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onSelect={onSelectDocument}
                onDelete={onDeleteDocument}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onSelect={onSelectDocument}
                onDelete={onDeleteDocument}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
