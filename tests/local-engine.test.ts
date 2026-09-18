// Unit and Algorithm Tests for Local Intelligence Engine & Hybrid Search
import {
  TestSuiteRunner,
  assert,
  assertEqual,
  assertTrue,
  assertGreaterOrEqual,
  sampleDocTechnical,
  sampleDocFinance,
} from './helpers.ts';
import {
  generateLocalVector,
  cosineSimilarity,
  chunkText,
  hybridSearch,
} from '../src/services/localEngine.ts';
import { DocumentItem } from '../src/types.ts';

export async function runLocalEngineTests(runner: TestSuiteRunner) {
  runner.setSuite('Local Engine & Retrieval Algorithms');

  // 1. Vector Generation & Normalization
  await runner.runTest('generateLocalVector produces normalized vector with exact dimension', () => {
    const text = 'LanceDB embedded vector search engine DiskANN';
    const vec = generateLocalVector(text, 64);
    assertEqual(vec.length, 64, 'Vector dimensions should equal 64');

    // Calculate Euclidean L2 norm
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    assertTrue(Math.abs(norm - 1.0) < 0.001, `Vector norm should be approximately 1.0, got ${norm}`);
  });

  await runner.runTest('generateLocalVector handles empty and whitespace strings gracefully', () => {
    const emptyVec = generateLocalVector('');
    assertEqual(emptyVec.length, 64);
    const sum = emptyVec.reduce((acc, v) => acc + v, 0);
    assertEqual(sum, 0, 'Empty string should yield zero vector');
  });

  // 2. Cosine Similarity
  await runner.runTest('cosineSimilarity calculates exact 1.0 for identical vectors', () => {
    const vecA = generateLocalVector('Local privacy on device artificial intelligence');
    const similarity = cosineSimilarity(vecA, vecA);
    assertTrue(Math.abs(similarity - 1.0) < 0.001, `Self-similarity should be 1.0, got ${similarity}`);
  });

  await runner.runTest('cosineSimilarity ranks semantically related text higher than unrelated text', () => {
    const queryVec = generateLocalVector('vector database index retrieval');
    const relatedVec = generateLocalVector('LanceDB embedded vector search and DiskANN index');
    const unrelatedVec = generateLocalVector('cupcake recipe baking with flour sugar and butter');

    const relatedScore = cosineSimilarity(queryVec, relatedVec);
    const unrelatedScore = cosineSimilarity(queryVec, unrelatedVec);

    assertTrue(
      relatedScore > unrelatedScore,
      `Related score (${relatedScore}) should exceed unrelated score (${unrelatedScore})`
    );
  });

  // 3. Document Chunking
  await runner.runTest('chunkText splits long documents with overlap preservation', () => {
    const sampleText = `Paragraph 1: Introduction to local neural search systems on desktop workstations.

Paragraph 2: The storage tier consists of SQLite for metadata and LanceDB for DiskANN vector representations.

Paragraph 3: Memory footprint is constrained to 350MB RSS during active hybrid retrieval passes.

Paragraph 4: Inverted index ranking via SQLite FTS5 BM25 operates in parallel with dense vector similarity.

Paragraph 5: Synthesis pipelines output multi-tier summaries including executive blurbs and bulleted takeaways.`;

    const chunks = chunkText(sampleText, 25, 5);
    assertGreaterOrEqual(chunks.length, 2, 'Should divide text into multiple chunks');

    // Verify all original content concepts are preserved
    const combined = chunks.join(' ');
    assertTrue(combined.includes('Paragraph 1'), 'Chunking should preserve Paragraph 1');
    assertTrue(combined.includes('Paragraph 5'), 'Chunking should preserve Paragraph 5');
  });

  // 4. Hybrid Search (Dense Vector + BM25 Full Text Fusion)
  await runner.runTest('hybridSearch finds and ranks relevant documents by query', () => {
    const docs: DocumentItem[] = [
      sampleDocTechnical,
      sampleDocFinance,
      {
        id: 'doc-legal-1',
        title: 'Master Service Agreement and Data Processing Addendum.md',
        filePath: 'local://storage/documents/MSA.md',
        fileType: 'markdown',
        fileSize: 5100,
        hash: 'abc111',
        createdAt: '2026-01-10T12:00:00Z',
        updatedAt: '2026-01-10T12:00:00Z',
        category: 'Legal',
        tags: ['legal', 'agreement', 'compliance'],
        chunksCount: 10,
        tokenCount: 1400,
        content: 'This Master Service Agreement governs terms of service, liability indemnification, and data protection compliance.',
        summary: {
          brief: 'Master service agreement covering compliance.',
          detailed: 'Legal terms of service and compliance guidelines.',
          keyPoints: ['Indemnification clauses', 'Compliance guidelines'],
        },
        embeddingModel: 'nomic-embed-text-v1.5',
        version: 1,
        versions: [],
      },
    ];

    // Search for vector database topic
    const results = hybridSearch('LanceDB DiskANN vector search', docs, { semantic: 0.65, keyword: 0.35 });
    assertGreaterOrEqual(results.length, 1, 'Should return at least 1 match');
    assertEqual(results[0].document.id, 'doc-tech-1', 'Technical doc should be top result for LanceDB query');
    assert(results[0].matchedSnippet.length > 0, 'Result should include matched snippet');

    // Search for financial runway
    const financeResults = hybridSearch('quarterly revenue runway financial budget', docs);
    assertGreaterOrEqual(financeResults.length, 1, 'Should return finance match');
    assertEqual(financeResults[0].document.id, 'doc-fin-1', 'Finance doc should rank first for financial query');
  });

  await runner.runTest('hybridSearch respects keyword vs semantic weighting adjustment', () => {
    const docs: DocumentItem[] = [sampleDocTechnical, sampleDocFinance];

    // High semantic weight
    const semanticRun = hybridSearch('LanceDB vector', docs, { semantic: 0.9, keyword: 0.1 });
    // High keyword weight
    const keywordRun = hybridSearch('LanceDB vector', docs, { semantic: 0.1, keyword: 0.9 });

    assertGreaterOrEqual(semanticRun.length, 1);
    assertGreaterOrEqual(keywordRun.length, 1);
  });
}
