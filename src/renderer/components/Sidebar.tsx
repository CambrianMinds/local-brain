import React from 'react';
import {
  BrainCircuit,
  Files,
  Search,
  BookOpen,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { ActiveTab, CategoryItem } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  categories: CategoryItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenUpload: () => void;
  totalDocuments: number;
  totalWikis: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  categories,
  selectedCategory,
  setSelectedCategory,
  isCollapsed,
  setIsCollapsed,
  onOpenUpload,
  totalDocuments,
  totalWikis,
}) => {
  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="app-desktop-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div
          className="brand-wrapper"
          onClick={() => setActiveTab('library')}
          title="Local Brain Desktop"
        >
          <div className="brand-icon">
            <BrainCircuit size={18} />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">Local Brain</span>
              <span className="brand-subtitle">AI Knowledge Base</span>
            </div>
          )}
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          id="sidebar-collapse-toggle"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="sidebar-nav-section">
        {!isCollapsed && <div className="sidebar-section-title">Navigation</div>}

        <button
          className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
          id="nav-library-btn"
          title="Documents Library"
        >
          <Files size={17} />
          {!isCollapsed && <span>Library</span>}
          {!isCollapsed && <span className="nav-badge">{totalDocuments}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          id="nav-search-btn"
          title="Vector & Keyword Search"
        >
          <Search size={17} />
          {!isCollapsed && <span>Semantic Search</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'wiki' ? 'active' : ''}`}
          onClick={() => setActiveTab('wiki')}
          id="nav-wiki-btn"
          title="Knowledge Wiki"
        >
          <BookOpen size={17} />
          {!isCollapsed && <span>Knowledge Wiki</span>}
          {!isCollapsed && <span className="nav-badge">{totalWikis}</span>}
        </button>

        <button
          className="nav-item"
          onClick={onOpenUpload}
          id="nav-upload-btn"
          title="Import / Ingest Documents"
          style={{ color: 'var(--accent)' }}
        >
          <Upload size={17} />
          {!isCollapsed && <span>Import Files</span>}
          {!isCollapsed && <Plus size={14} style={{ marginLeft: 'auto' }} />}
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          id="nav-settings-btn"
          title="Settings & AI Providers"
        >
          <Settings size={17} />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Categories / Folder Tree */}
      {!isCollapsed && (
        <div className="sidebar-nav-section" style={{ marginTop: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: '10px',
            }}
          >
            <div className="sidebar-section-title">Categories</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {categories.map((cat) => {
              const isActive = activeTab === 'library' && selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`category-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab('library');
                  }}
                  title={`${cat.name} (${cat.count})`}
                  id={`cat-item-${cat.id}`}
                >
                  <span
                    className="category-dot"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {cat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Storage & Engine Status Widget */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={13} style={{ color: 'var(--accent)' }} />
              LanceDB Vector Cache
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              1.4 MB
            </span>
          </div>

          <div className="storage-progress-bar">
            <div className="storage-progress-fill" style={{ width: '28%' }} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'var(--text-tertiary)',
            }}
          >
            <span>WAL Mode Active</span>
            <span>8 Docs Indexed</span>
          </div>
        </div>
      )}
    </aside>
  );
};
