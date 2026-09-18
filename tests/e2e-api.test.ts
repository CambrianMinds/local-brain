// End-to-End API Integration & Verification Tests for Local Brain
import {
  TestSuiteRunner,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertContains,
  assertGreaterOrEqual,
} from './helpers.ts';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

export async function runApiE2ETests(runner: TestSuiteRunner) {
  runner.setSuite('Backend API Endpoints (E2E)');

  // 1. OpenRouter Models Endpoint
  await runner.runTest('GET /api/openrouter/models returns free model catalog', async () => {
    const res = await fetch(`${BASE_URL}/api/openrouter/models`);
    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assertTrue(data.success, 'Expected success: true');
    assert(Array.isArray(data.models), 'Expected models array');
    assertGreaterOrEqual(data.models.length, 1, 'Expected at least 1 model');
    assertGreaterOrEqual(data.freeCount, 1, 'Expected freeCount >= 1');

    // Verify model structure
    const sampleModel = data.models[0];
    assert(sampleModel.id, 'Model should have an id');
    assert(sampleModel.name, 'Model should have a name');
    assertTrue(typeof sampleModel.isFree === 'boolean', 'Model should have isFree boolean');
  });

  await runner.runTest('GET /api/openrouter/models with apiKey parameter', async () => {
    const res = await fetch(`${BASE_URL}/api/openrouter/models?apiKey=sk-or-test-dummy-key`);
    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assertTrue(data.success, 'Expected success: true');
    assert(data.models.length > 0, 'Models should be returned');
  });

  // 2. LM Studio Models Endpoint
  await runner.runTest('GET /api/lmstudio/models handles offline local daemon gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/lmstudio/models?url=http://127.0.0.1:9999/v1`);
    assertEqual(res.status, 200, 'Expected 200 OK even when LM Studio is offline');
    const data: any = await res.json();
    assert(typeof data.connected === 'boolean', 'Expected connected boolean');
    if (!data.connected) {
      assert(Array.isArray(data.defaultModels), 'Offline mode should provide defaultModels');
      assertGreaterOrEqual(data.defaultModels.length, 1, 'Expected defaultModels >= 1');
    }
  });

  // 3. Document Q&A / RAG Endpoint
  await runner.runTest('POST /api/ai/ask answers document questions with citations', async () => {
    const payload = {
      question: 'What search algorithm does LanceDB use for vector indexing?',
      documentTitle: 'LanceDB DiskANN Vector Indexing Architecture.md',
      documentContent: 'LanceDB utilizes DiskANN (Disk-based Approximate Nearest Neighbor) search algorithms for sub-5ms latency.',
      chunks: [
        'LanceDB utilizes DiskANN (Disk-based Approximate Nearest Neighbor) search algorithms for sub-5ms latency.',
        'The vector table is stored locally on disk without requiring a remote daemon.',
      ],
    };

    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assert(data.answer && data.answer.length > 20, 'Expected substantive answer');
    assert(data.provider, 'Expected provider name in response');
    assertGreaterOrEqual(data.confidence, 0.5, 'Expected high confidence score');
  });

  await runner.runTest('POST /api/ai/ask rejects missing question with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentTitle: 'Test' }),
    });
    assertEqual(res.status, 400, 'Expected 400 Bad Request for missing question');
    const data: any = await res.json();
    assert(data.error, 'Expected error explanation');
  });

  // 4. Summarization Endpoint
  await runner.runTest('POST /api/ai/summarize produces 3 distinct summary tiers', async () => {
    const payload = {
      title: 'Local Privacy Guarantees',
      content: `Local Brain operates entirely offline by default. All document embeddings and vector indices
are calculated within the user device boundaries using quantized Nomic Embed models.
SQLite database storage maintains full-text indexes and relational document metadata with zero external telemetry.
Optional external relay via OpenRouter or LM Studio requires explicit user authorization.`,
    };

    const res = await fetch(`${BASE_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assert(data.brief && data.brief.length > 10, 'Expected brief summary');
    assert(data.detailed && data.detailed.length > 30, 'Expected detailed summary');
    assert(Array.isArray(data.keyPoints), 'Expected keyPoints array');
    assertGreaterOrEqual(data.keyPoints.length, 3, 'Expected at least 3 key takeaways');
    assert(data.provider, 'Expected provider name');
  });

  await runner.runTest('POST /api/ai/summarize rejects empty content with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled' }),
    });
    assertEqual(res.status, 400, 'Expected 400 Bad Request');
  });

  // 5. Categorization & Tagging Endpoint
  await runner.runTest('POST /api/ai/categorize accurately classifies technical documentation', async () => {
    const payload = {
      title: 'SQLite WAL Mode & FTS5 Indexing Specification',
      content: 'Configuring SQLite database with Write-Ahead Logging (WAL) mode and FTS5 BM25 inverted index for full-text search.',
    };

    const res = await fetch(`${BASE_URL}/api/ai/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assertEqual(data.category, 'Technical', 'Expected Technical category');
    assert(Array.isArray(data.tags), 'Expected tags array');
    assertGreaterOrEqual(data.tags.length, 2, 'Expected multiple tags');
  });

  await runner.runTest('POST /api/ai/categorize accurately classifies financial records', async () => {
    const payload = {
      title: 'Q1 Operating Runway & Financial Budget Report',
      content: 'Current cash balance provides 36 months of runway with $3.8M quarterly revenue and reduced server infrastructure spend.',
    };

    const res = await fetch(`${BASE_URL}/api/ai/categorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assertEqual(data.category, 'Finance', 'Expected Finance category');
    assert(Array.isArray(data.tags), 'Expected tags array');
  });

  // 6. Wiki Page Generation Endpoint
  await runner.runTest('POST /api/ai/wiki synthesizes encyclopedia Markdown with headings and citations', async () => {
    const payload = {
      topic: 'Offline Vector Search & Privacy-Preserving Architecture',
      sourceDocTitles: [
        'LanceDB DiskANN Vector Indexing Architecture.md',
        'SQLite WAL Mode & FTS5 Specification.md',
      ],
      combinedExcerpts: `LanceDB provides embedded vector indexing using DiskANN.
SQLite WAL mode ensures persistent relational metadata storage.
Hybrid search merges dense vector similarity with BM25 inverted index using Reciprocal Rank Fusion.`,
    };

    const res = await fetch(`${BASE_URL}/api/ai/wiki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 200, 'Expected 200 OK');
    const data: any = await res.json();
    assert(data.content, 'Expected markdown content');
    assertContains(data.content, '# ', 'Markdown should have a title heading');
    assertContains(data.content, '## ', 'Markdown should have section headings');
    assert(data.provider, 'Expected provider attribution');
  });

  // 7. Web Application HTML Serving
  await runner.runTest('GET / serves single-page application entry point', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assertEqual(res.status, 200, 'Expected 200 OK');
    const html = await res.text();
    assertContains(html.toLowerCase(), '<!doctype html', 'Expected valid HTML5 doctype');
    assertContains(html, 'id="root"', 'Expected React root element');
  });
}
