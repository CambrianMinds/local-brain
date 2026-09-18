// Test Suite for Living Personal Wiki & Knowledge Vault Architecture
import { TestSuiteRunner, assert, assertEqual } from './helpers.ts';
import {
  clusterDocuments,
  parseMarkdownSections,
  synthesizeWikiArticle,
  regenerateWikiSection,
  detectContradictions,
  detectKnowledgeGaps,
  exportWikiToObsidian,
  exportObsidianVaultZip,
} from '../src/services/wikiEngine.ts';
import { INITIAL_DOCUMENTS, INITIAL_WIKIS } from '../src/data/seedData.ts';
import JSZip from 'jszip';

export async function runLivingWikiTests(runner: TestSuiteRunner) {
  runner.setSuite('Living Personal Wiki & Vault Architecture');

  // Test 1: Document Clustering
  await runner.runTest('Document clustering groups items by category and semantic tags', () => {
    const clusters = clusterDocuments(INITIAL_DOCUMENTS, INITIAL_WIKIS);
    assert(clusters.length >= 3, 'Should produce at least 3 thematic clusters');
    const techCluster = clusters.find((c) => c.category === 'Technical');
    assert(!!techCluster, 'Technical cluster should exist');
    assert(techCluster!.documentIds.length >= 2, 'Technical cluster should contain related documents');
  });

  // Test 2: Section Parsing
  await runner.runTest('parseMarkdownSections parses ## and ### headings into structured sections', () => {
    const sampleMarkdown = `# Document Title

> Overview quotation

## 1. Primary Architecture
First paragraph of architecture.
Second paragraph with details.

### 1.1 Micro Mechanics
Subsection details.

## 2. Benchmark Findings
Benchmark numbers here.`;

    const sections = parseMarkdownSections(sampleMarkdown);
    assertEqual(sections.length, 3, 'Should parse exactly 3 sections');
    assertEqual(sections[0].heading, '1. Primary Architecture');
    assertEqual(sections[0].level, 2);
    assert(sections[0].content.includes('First paragraph'), 'Section 0 should contain its body');
    assertEqual(sections[1].heading, '1.1 Micro Mechanics');
    assertEqual(sections[1].level, 3);
    assertEqual(sections[2].heading, '2. Benchmark Findings');
  });

  // Test 3: Contradiction Detection
  await runner.runTest('detectContradictions flags known discrepancies between source texts', () => {
    const contradictions = detectContradictions(INITIAL_DOCUMENTS);
    assert(contradictions.length >= 1, 'Should detect at least 1 contradiction');
    const latencyContra = contradictions.find((c) => c.topic.toLowerCase().includes('latency'));
    assert(!!latencyContra, 'Should detect latency benchmark discrepancy');
  });

  // Test 4: Knowledge Gap Detection
  await runner.runTest('detectKnowledgeGaps identifies missing areas and research recommendations', () => {
    const clusters = clusterDocuments(INITIAL_DOCUMENTS, INITIAL_WIKIS);
    const gaps = detectKnowledgeGaps(clusters[0], INITIAL_DOCUMENTS);
    assert(gaps.length >= 1, 'Should identify technical knowledge gaps');
    assert(!!gaps[0].suggestedResearch, 'Gap should provide actionable research suggestion');
  });

  // Test 5: Section Regeneration preserves surrounding document
  await runner.runTest('regenerateWikiSection updates only targeted section content', async () => {
    const testPage = INITIAL_WIKIS[0];
    const targetHeading = testPage.sections![0].heading;

    const updated = await regenerateWikiSection({
      page: testPage,
      sectionHeading: targetHeading,
      sourceDocs: INITIAL_DOCUMENTS.slice(0, 2),
    });

    assert(updated.content.includes(targetHeading), 'Updated content must retain heading');
    assert(updated.content.includes('2. DiskANN'), 'Subsequent sections must remain intact');
    assertEqual(updated.id, testPage.id, 'Page ID should be preserved');
  });

  // Test 6: Obsidian Frontmatter & Markdown Export
  await runner.runTest('exportWikiToObsidian formats valid Obsidian YAML frontmatter and [[wiki links]]', () => {
    const testPage = INITIAL_WIKIS[0];
    const obsidianMarkdown = exportWikiToObsidian(testPage, INITIAL_DOCUMENTS);

    assert(obsidianMarkdown.startsWith('---'), 'Should start with YAML frontmatter delimiter');
    assert(obsidianMarkdown.includes('title: "Vector Databases'), 'Frontmatter should contain title');
    assert(obsidianMarkdown.includes('status: "auto"'), 'Frontmatter should contain status');
    assert(obsidianMarkdown.includes('coverage_score: 96'), 'Frontmatter should contain coverage score');
    assert(obsidianMarkdown.includes('sources:'), 'Frontmatter should list source files');
  });

  // Test 7: Obsidian Vault ZIP Generation
  await runner.runTest('exportObsidianVaultZip packages complete vault with Index.md and article notes', async () => {
    const zipBlob = await exportObsidianVaultZip(INITIAL_WIKIS, INITIAL_DOCUMENTS);
    assert(zipBlob.size > 100, 'Zip blob should contain real archive bytes');

    // Read back and verify ZIP structure
    const zip = await JSZip.loadAsync(zipBlob);
    assert(!!zip.file('Index.md'), 'Vault must contain Index.md map of content');
    const indexContent = await zip.file('Index.md')!.async('text');
    assert(indexContent.includes('Living Knowledge Vault'), 'Index.md should have header');
    assert(indexContent.includes('[[Vector Databases & Disk-Native Retrieval Architecture]]'), 'Index should link to pages');

    // Verify individual article files
    const firstArticle = zip.file(`Articles/${INITIAL_WIKIS[0].title.replace(/[^a-z0-9]+/gi, '-')}.md`);
    assert(!!firstArticle, 'Article markdown file should exist in Articles directory');
  });

  // Test 8: End-to-End Synthesis Pipeline
  await runner.runTest('synthesizeWikiArticle generates a complete Living Wiki article with citations and links', async () => {
    const newTopic = 'Zero-Trust Local Audit & Integrity Ledger';
    const synthesized = await synthesizeWikiArticle({
      topic: newTopic,
      category: 'Technical',
      sourceDocs: INITIAL_DOCUMENTS.slice(0, 3),
      allWikis: INITIAL_WIKIS,
    });

    assert(synthesized.title.includes(newTopic), 'Title should reflect prompt');
    assertEqual(synthesized.category, 'Technical');
    assertEqual(synthesized.status, 'auto');
    assert((synthesized.coverageScore ?? 0) >= 80, 'Coverage score should be >= 80%');
    assert(synthesized.sections!.length >= 3, 'Should have structured sections');
    assert(synthesized.content.includes('[[Vector Databases'), 'Should contain cross-wiki links');
  });

  // Test 9: Backend API for section regeneration
  await runner.runTest('Backend API /api/ai/wiki-section endpoint responds with updated section markdown', async () => {
    const response = await fetch('http://localhost:3000/api/ai/wiki-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageTitle: 'Vector Databases',
        sectionHeading: 'The Embedded Vector Paradigm',
        sourceDocTitles: ['LanceDB Architecture & Disk-Based Vector Indexing.md'],
        sectionContext: 'Previous baseline content.',
      }),
    });

    assertEqual(response.status, 200, 'API should return 200 OK');
    const data = await response.json();
    assert(!!data.content, 'API should return regenerated content');
  });

  // Test 10: Backend API for briefing generation
  await runner.runTest('Backend API /api/ai/wiki-briefing generates high-density briefing book', async () => {
    const response = await fetch('http://localhost:3000/api/ai/wiki-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Local-First Vector Architecture and Air-Gapped Compliance',
        mode: 'executive',
        sourceDocTitles: ['LanceDB Architecture & Disk-Based Vector Indexing.md', 'Privacy-Preserving Local AI & LM Studio Spec.pdf'],
        combinedExcerpts: 'Key points on privacy and local air-gapped models.',
      }),
    });

    assertEqual(response.status, 200, 'API should return 200 OK');
    const data = await response.json();
    assert(!!data.content, 'API should return briefing markdown');
    assert(
      data.content.toLowerCase().includes('briefing') || data.content.toLowerCase().includes('executive'),
      'Briefing should have proper header or content'
    );
  });
}
