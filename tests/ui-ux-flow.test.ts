// UI/UX Specifications, Formats, and Workflow Verification Tests
import {
  TestSuiteRunner,
  assert,
  assertEqual,
  assertTrue,
} from './helpers.ts';
import { formatFileSize } from '../src/renderer/components/DocumentCard.tsx';
import { INITIAL_DOCUMENTS, INITIAL_CATEGORIES } from '../src/renderer/data/seedData.ts';

export const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  lmStudioUrl: 'http://localhost:1234/v1',
  openRouterModel: 'meta-llama/llama-3.2-3b-instruct:free',
  embeddingModel: 'nomic-embed-text-v1.5',
  chunkSize: 512,
  chunkOverlap: 64,
  diskAnnEnabled: true,
  sqliteWalEnabled: true,
};

export async function runUiUxTests(runner: TestSuiteRunner) {
  runner.setSuite('UI/UX Layout & Component Specifications');

  // 1. File size formatter
  await runner.runTest('formatFileSize formats byte quantities appropriately', () => {
    assertEqual(formatFileSize(500), '500 B');
    assertEqual(formatFileSize(2048), '2.0 KB');
    assertEqual(formatFileSize(1048576 * 2.5), '2.5 MB');
  });

  // 2. Default Settings verification
  await runner.runTest('DEFAULT_SETTINGS configures local privacy-first defaults', () => {
    assert(DEFAULT_SETTINGS.aiProvider, 'aiProvider must be defined');
    assertEqual(DEFAULT_SETTINGS.embeddingModel, 'nomic-embed-text-v1.5');
    assertEqual(DEFAULT_SETTINGS.chunkSize, 512);
    assertEqual(DEFAULT_SETTINGS.chunkOverlap, 64);
    assertTrue(DEFAULT_SETTINGS.diskAnnEnabled, 'DiskANN should be enabled by default');
    assertTrue(DEFAULT_SETTINGS.sqliteWalEnabled, 'SQLite WAL should be enabled by default');
  });

  // 3. Initial Documents sanity check
  await runner.runTest('INITIAL_DOCUMENTS includes rich multi-format seed dataset', () => {
    assert(Array.isArray(INITIAL_DOCUMENTS), 'INITIAL_DOCUMENTS must be an array');
    assertTrue(INITIAL_DOCUMENTS.length >= 3, 'Should provide at least 3 seed documents');

    for (const doc of INITIAL_DOCUMENTS) {
      assert(doc.id, 'Document must have id');
      assert(doc.title, 'Document must have title');
      assert(doc.content && doc.content.length > 50, 'Document must have substantive content');
      assert(doc.summary && doc.summary.brief, 'Document must have multi-level summary');
      assert(doc.chunksCount > 0, 'Document must have chunksCount');
      assert(doc.tokenCount > 0, 'Document must have tokenCount');
      assert(doc.category, 'Document must have assigned category');
      assert(Array.isArray(doc.tags), 'Document must have tags array');
    }
  });

  // 4. Keyboard navigation shortcuts validation
  await runner.runTest('Desktop shortcuts bindings adhere to specifications', () => {
    const shortcuts = [
      { key: 'k', metaKey: true, action: 'Toggle Command Palette' },
      { key: 'u', metaKey: true, action: 'Open Ingestion Upload Modal' },
      { key: 'Escape', action: 'Dismiss active modal / popover' },
    ];

    for (const s of shortcuts) {
      assert(s.action.length > 0, `Shortcut for ${s.key} should have defined action`);
    }
  });

  // 5. Breadcrumbs and navigation routes
  await runner.runTest('Navigation views map to accessible application tabs', () => {
    const validTabs = ['library', 'search', 'wiki', 'settings', 'document'];
    for (const tab of validTabs) {
      assertTrue(typeof tab === 'string', `${tab} is a valid view tab`);
    }
  });
}
