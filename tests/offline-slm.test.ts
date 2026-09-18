// Integration and unit tests for Local Embedder, SLM engine, and AI Router
import {
  TestSuiteRunner,
  assert,
  assertTrue,
  assertEqual,
  assertContains,
  assertGreaterOrEqual,
} from './helpers.ts';
import { LocalTransformersEmbedder, createLanceDBSchemaWithEmbedder } from '../src/lib/embedder.ts';
import { LocalSLMEngine, localSLMEngine } from '../src/lib/llm.ts';
import {
  routeLLM,
  formatChatML,
  getAllProvidersStatus,
  generateDeterministicOfflineResponse,
} from '../src/services/ai-router.ts';

export async function runOfflineSLMTests(runner: TestSuiteRunner) {
  runner.setSuite('Offline SLM & Transformers Embedder');

  // 1. Local Transformers Embedder Tests
  await runner.runTest('LocalTransformersEmbedder initializes with 384 dimensions', async () => {
    const embedder = new LocalTransformersEmbedder();
    assertEqual(embedder.ndims, 384, 'MiniLM-L6-v2 vector dimension must be 384');
    assertEqual(embedder.sourceColumn, 'text');
    assertEqual(embedder.vectorColumn, 'vector');

    const vector = await embedder.computeQueryEmbedding('Local Brain zero-cloud vector indexing');
    assertEqual(vector.length, 384, 'Generated vector must match 384 dimensions');

    // Test normalization (L2 norm should be approximately 1.0)
    const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    assertGreaterOrEqual(magnitude, 0.99, 'Vector should be L2 normalized');
  });

  await runner.runTest('LocalTransformersEmbedder batch embed returns matching row count', async () => {
    const embedder = new LocalTransformersEmbedder();
    const texts = [
      'LanceDB DiskANN storage specifications',
      'SQLite WAL metadata persistence',
      'Qwen-2.5-3B local offline inference',
    ];
    const embeddings = await embedder.embed(texts);
    assertEqual(embeddings.length, 3, 'Should generate 3 embeddings for 3 inputs');
    assertEqual(embeddings[0].length, 384);
    assertEqual(embeddings[1].length, 384);
    assertEqual(embeddings[2].length, 384);
  });

  await runner.runTest('createLanceDBSchemaWithEmbedder binds 384-dim vector column', async () => {
    const schemaDef = createLanceDBSchemaWithEmbedder();
    assertEqual(schemaDef.tableName, 'documents_v1');
    assertEqual(schemaDef.schema.vector.dimensions, 384);
    assertEqual(schemaDef.schema.vector.type, 'float32');
  });

  // 2. Local SLM Engine Tests
  await runner.runTest('LocalSLMEngine singleton pattern and lifecycle disposal', async () => {
    const instance1 = LocalSLMEngine.getInstance();
    const instance2 = LocalSLMEngine.getInstance();
    assertEqual(instance1, instance2, 'Singleton getInstance must return identical instance');

    const status = instance1.getStatus();
    assertTrue(typeof status.available === 'boolean');
    assertEqual(status.contextSize, 2048);

    // Test disposal lifecycle completes without throwing
    await instance1.dispose();
  });

  // 3. AI Router & ChatML Formatting Tests
  await runner.runTest('formatChatML correctly constructs ChatML delimiters', async () => {
    const formatted = formatChatML([
      { role: 'system', content: 'You are Local Brain.' },
      { role: 'user', content: 'What is our storage architecture?' },
    ]);

    assertContains(formatted, '<|im_start|>system\nYou are Local Brain.\n<|im_end|>');
    assertContains(formatted, '<|im_start|>user\nWhat is our storage architecture?\n<|im_end|>');
    assertContains(formatted, '<|im_start|>assistant\n');
  });

  await runner.runTest('getAllProvidersStatus exposes Local SLM while preserving existing providers', async () => {
    const allStatus = getAllProvidersStatus();
    assert(allStatus.localSLM, 'Must contain localSLM status');
    assert(allStatus.gemini, 'Must preserve gemini status');
    assert(allStatus.lmStudio, 'Must preserve lmStudio status');
    assert(allStatus.openRouter, 'Must preserve openRouter status');
    assertEqual(allStatus.lmStudio.endpoint, 'http://localhost:1234/v1');
  });

  await runner.runTest('routeLLM falls back gracefully with offline flag set to true', async () => {
    const res = await routeLLM({
      provider: 'local-slm',
      prompt: 'Summarize system requirements in 5 words',
      systemPrompt: 'System assistant',
      maxTokens: 16,
    });

    assert(res.text, 'Response must contain text');
    assertTrue(res.isOffline, 'Response must have isOffline: true');
    assertTrue(
      res.providerName.toLowerCase().includes('offline') || res.providerName.toLowerCase().includes('local slm'),
      'Provider name should indicate local or offline operation'
    );
  });

  await runner.runTest('Deterministic offline response handles JSON classification format', async () => {
    const res = generateDeterministicOfflineResponse({
      prompt: 'Classify this document excerpt: LanceDB DiskANN vector search database schema',
      jsonMode: true,
    });

    const parsed = JSON.parse(res.text);
    assertEqual(parsed.category, 'Technical', 'Should identify database/vector as Technical');
    assertTrue(Array.isArray(parsed.tags), 'Tags must be an array');
  });
}
