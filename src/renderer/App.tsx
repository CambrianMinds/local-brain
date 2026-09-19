import React, { useState, useEffect } from 'react';
import { ActiveTab, DocumentItem, CategoryItem, WikiPage as WikiPageType, SettingsConfig } from './types';
import { INITIAL_CATEGORIES, INITIAL_DOCUMENTS, INITIAL_WIKIS } from './data/seedData';
import { DesktopTitlebar } from './components/DesktopTitlebar';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { UploadModal } from './components/UploadModal';
import { LibraryPage } from './features/library/LibraryPage';
import { SearchPage } from './features/search/SearchPage';
import { DocumentReaderPage } from './features/document/DocumentReaderPage';
import { WikiPage } from './features/wiki/WikiPage';
import { SettingsPage } from './features/settings/SettingsPage';

const STORAGE_DOCS_KEY = 'localbrain_documents_v1';
const STORAGE_WIKIS_KEY = 'localbrain_wikis_v1';
const STORAGE_SETTINGS_KEY = 'localbrain_settings_v1';
const STORAGE_THEME_KEY = 'localbrain_theme_v1';

export default function App() {
  // Theme state: dark mode first
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(STORAGE_THEME_KEY) as 'dark' | 'light') || 'dark';
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Documents state with localStorage fallback
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DOCS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DOCUMENTS;
  });

  // Wiki Pages state
  const [wikis, setWikis] = useState<WikiPageType[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WIKIS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WIKIS;
  });

  // Settings state
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.xaiModel || parsed.xaiModel.startsWith('grok-2')) {
          parsed.xaiModel = 'grok-4.20-non-reasoning';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      aiProvider: 'xai',
      xaiModel: 'grok-4.20-non-reasoning',
      lmStudioUrl: 'http://localhost:1234/v1',
      openRouterModel: 'meta-llama/llama-3.2-3b-instruct:free',
      lanceDbPath: '~/.local-brain/vectors.lance',
      sqlitePath: '~/.local-brain/library.db',
      chunkSize: 512,
      chunkOverlap: 64,
      chunkSizeTokens: 512,
      chunkOverlapTokens: 64,
      theme: 'dark',
    };
  });

  // Dynamic Categories calculation based on current documents
  const categories: CategoryItem[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });

    return [
      { id: 'all', name: 'All Documents', iconName: 'Files', count: documents.length, color: '#6ee7b7' },
      { id: 'Technical', name: 'Technical & Systems', iconName: 'Cpu', count: counts['Technical'] || 0, color: '#7dd3fc' },
      { id: 'Research', name: 'Research & Papers', iconName: 'BookOpen', count: counts['Research'] || 0, color: '#a78bfa' },
      { id: 'Finance', name: 'Finance & Runway', iconName: 'TrendingUp', count: counts['Finance'] || 0, color: '#34d399' },
      { id: 'Legal', name: 'Legal & Contracts', iconName: 'Scale', count: counts['Legal'] || 0, color: '#f59e0b' },
      { id: 'Work', name: 'Work & Engineering', iconName: 'Briefcase', count: counts['Work'] || 0, color: '#ec4899' },
    ];
  }, [documents]);

  // Persist documents & wikis safely with quota protection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(documents));
    } catch {
      // Handled quota exceeded or storage disabled
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WIKIS_KEY, JSON.stringify(wikis));
    } catch {
      // Handled quota exceeded
    }
  }, [wikis]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Handled quota exceeded
    }
  }, [settings]);

  // Sync environment variables (such as XAI_API_KEY) into local settings
  useEffect(() => {
    const syncEnv = async () => {
      try {
        if (window.api && window.api.getEnvKeys) {
          const envKeys = await window.api.getEnvKeys();
          setSettings((prev) => {
            let updated = { ...prev };
            let changed = false;

            if (envKeys.xaiApiKey && !prev.xaiApiKey) {
              updated.xaiApiKey = envKeys.xaiApiKey;
              changed = true;
            }
            if (envKeys.openRouterApiKey && !prev.openRouterApiKey) {
              updated.openRouterApiKey = envKeys.openRouterApiKey;
              changed = true;
            }
            if ((prev.aiProvider === 'gemini' || !prev.aiProvider) && !envKeys.geminiApiKey && (envKeys.xaiApiKey || updated.xaiApiKey)) {
              updated.aiProvider = 'xai';
              changed = true;
            }
            if (!updated.xaiModel || updated.xaiModel.startsWith('grok-2')) {
              updated.xaiModel = 'grok-4.20-non-reasoning';
              changed = true;
            }
            return changed ? updated : prev;
          });
        }
      } catch (e) {
        console.warn('Could not sync environment keys:', e);
      }
    };
    syncEnv();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Handled storage disabled
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Keyboard shortcut listener (Cmd/Ctrl + K, Cmd/Ctrl + U)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setIsUploadModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsUploadModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectDocument = (doc: DocumentItem) => {
    setActiveDocument(doc);
    setActiveTab('document');
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocument?.id === id) {
      setActiveDocument(null);
      setActiveTab('library');
    }
  };

  const handleUpdateDocument = (updated: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (activeDocument?.id === updated.id) {
      setActiveDocument(updated);
    }
  };

  const handleDocumentAdded = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleAddWiki = (newWiki: WikiPageType) => {
    setWikis((prev) => [newWiki, ...prev]);
  };

  const handleUpdateWiki = (updated: WikiPageType) => {
    setWikis((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleResetRepository = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setWikis(INITIAL_WIKIS);
    setActiveDocument(null);
    setActiveTab('library');
  };

  const handleNukeLibrary = () => {
    setDocuments([]);
    setWikis([]);
    setActiveDocument(null);
    try {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify([]));
      localStorage.setItem(STORAGE_WIKIS_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear local library cache:', e);
    }
    setActiveTab('library');
  };

  const totalChunks = documents.reduce((acc, d) => acc + d.chunksCount, 0);

  return (
    <div className="app-container" id="local-brain-desktop-root">
      {/* Native Desktop Window Header */}
      <DesktopTitlebar
        activeTab={activeTab}
        activeCategoryName={selectedCategory !== 'all' ? selectedCategory : undefined}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        documentCount={documents.length}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Shell */}
      <div className="app-shell">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'library' && activeDocument) {
              // keep activeDocument in background or switch to list
            }
          }}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          totalDocuments={documents.length}
          totalWikis={wikis.length}
        />

        {/* Center Main Stage */}
        <main className="app-main" id="app-main-viewport">
          {activeTab === 'library' && (
            <LibraryPage
              documents={documents}
              selectedCategory={selectedCategory}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDeleteDocument}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onNukeLibrary={handleNukeLibrary}
              onResetRepository={handleResetRepository}
            />
          )}

          {activeTab === 'search' && (
            <SearchPage
              documents={documents}
              onSelectDocument={handleSelectDocument}
            />
          )}

          {activeTab === 'document' && activeDocument && (
            <DocumentReaderPage
              document={activeDocument}
              onBack={() => setActiveTab('library')}
              onUpdateDocument={handleUpdateDocument}
              aiProvider={settings.aiProvider}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}

          {activeTab === 'wiki' && (
            <WikiPage
              wikis={wikis}
              documents={documents}
              onOpenDocument={handleSelectDocument}
              onAddWiki={handleAddWiki}
              onUpdateWiki={handleUpdateWiki}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSaveSettings={setSettings}
              onResetRepository={handleResetRepository}
              onNukeLibrary={handleNukeLibrary}
              documentCount={documents.length}
            />
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        documentCount={documents.length}
        totalChunks={totalChunks}
        aiProvider={settings.aiProvider}
        settings={settings}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Command Palette Modal (Cmd/Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        onSelectDocument={handleSelectDocument}
      />

      {/* Document Upload & Ingestion Pipeline Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentAdded={handleDocumentAdded}
        settings={settings}
      />
    </div>
  );
}
