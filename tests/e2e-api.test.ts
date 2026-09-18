// End-to-End API Integration & Verification Tests for Local Brain
import {
  TestSuiteRunner,
  assert,
  assertTrue,
  assertContains,
  assertGreaterOrEqual,
} from './helpers.ts';
import { CURATED_OPENROUTER_FREE_MODELS, executeLLM, generateDeterministicOfflineResponse } from '../src/main/services/ai/provider.ts';

export async function runApiE2ETests(runner: TestSuiteRunner) {
  runner.setSuite('Backend API Provider (Node.js)');

  // 1. OpenRouter Models Check
  await runner.runTest('OpenRouter free models catalog returns list', async () => {
    assertTrue(Array.isArray(CURATED_OPENROUTER_FREE_MODELS), 'Expected models array');
    assertGreaterOrEqual(CURATED_OPENROUTER_FREE_MODELS.length, 1, 'Expected at least 1 model');
    
    // Verify model structure
    const sampleModel = CURATED_OPENROUTER_FREE_MODELS[0];
    assert(sampleModel.id, 'Model should have an id');
    assert(sampleModel.name, 'Model should have a name');
    assertTrue(typeof sampleModel.isFree === 'boolean', 'Model should have isFree boolean');
  });

  // 2. Deterministic AI Provider Check
  await runner.runTest('Offline Engine deterministic response yields valid synthesized text', async () => {
    const res = generateDeterministicOfflineResponse({ prompt: 'Provide a summary of local vector DBs' });
    assert(res.text, 'Response should contain text');
    assertContains(res.providerName.toLowerCase(), 'offline', 'Provider should indicate offline context');
  });

  // 3. Fallback executeLLM Check
  await runner.runTest('executeLLM falls back to deterministic provider successfully', async () => {
    const res = await executeLLM({ provider: 'gemini', prompt: 'test prompt' });
    assert(res.text, 'executeLLM should return fallback text without failing');
    assert(res.providerName, 'executeLLM should return a provider name');
  });
}
