// Test assertion utilities and fixtures for Local Brain test suite

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: any, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertTrue(actual: boolean, message = 'Expected true') {
  if (actual !== true) {
    throw new AssertionError(message);
  }
}

export function assertFalse(actual: boolean, message = 'Expected false') {
  if (actual !== false) {
    throw new AssertionError(message);
  }
}

export function assertContains(haystack: string, needle: string, message?: string) {
  if (!haystack.includes(needle)) {
    throw new AssertionError(
      message || `Expected text to contain "${needle}", but it did not.\nText:\n${haystack.slice(0, 300)}...`
    );
  }
}

export function assertGreaterOrEqual(actual: number, threshold: number, message?: string) {
  if (actual < threshold) {
    throw new AssertionError(
      message || `Expected ${actual} to be >= ${threshold}`
    );
  }
}

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export class TestSuiteRunner {
  results: TestResult[] = [];
  currentSuite = 'General';

  setSuite(name: string) {
    this.currentSuite = name;
  }

  async runTest(name: string, fn: () => Promise<void> | void) {
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        durationMs,
      });
      console.log(`  \x1b[32m✔\x1b[0m ${name} \x1b[90m(${durationMs}ms)\x1b[0m`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        error: err,
        durationMs,
      });
      console.log(`  \x1b[31m✖\x1b[0m ${name} \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.log(`    \x1b[31mError: ${err?.message || err}\x1b[0m`);
    }
  }
}

export const sampleDocTechnical = {
  id: 'doc-tech-1',
  title: 'LanceDB DiskANN Vector Indexing Architecture.md',
  filePath: 'local://storage/documents/LanceDB DiskANN Vector Indexing Architecture.md',
  fileType: 'markdown' as const,
  fileSize: 4520,
  hash: 'a1b2c3d4e5f6',
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
  category: 'Technical',
  tags: ['lancedb', 'vector-search', 'diskann', 'hybrid'],
  chunksCount: 8,
  tokenCount: 1130,
  content: `# LanceDB DiskANN Vector Indexing Architecture
LanceDB provides an embedded vector database designed for high-performance AI retrieval.
By utilizing DiskANN (Disk-based Approximate Nearest Neighbor) search algorithms, LanceDB achieves sub-5ms latency on standard SSD storage.
The vector table is stored locally on disk without requiring a remote daemon or network egress.
Embeddings are generated with Nomic Embed Text v1.5 with 768 dimensions and quantized into int8.
SQLite is paired as the relational metadata store using WAL (Write-Ahead Logging) mode for thread-safe concurrent transactions.
Reciprocal Rank Fusion (RRF) combines BM25 keyword rankings from SQLite FTS5 with dense vector cosine similarity.`,
  summary: {
    brief: 'High-performance embedded vector indexing using LanceDB and DiskANN.',
    detailed: 'Technical specification describing local-first DiskANN vector indexing, SQLite WAL catalog persistence, and hybrid reciprocal rank fusion search.',
    keyPoints: [
      'LanceDB embedded vector database on NVMe SSD',
      'DiskANN approximate nearest neighbor with sub-5ms query times',
      'SQLite WAL for concurrent metadata cataloging',
      'Reciprocal Rank Fusion with SQLite FTS5 BM25',
    ],
  },
  embeddingModel: 'nomic-embed-text-v1.5',
  version: 1,
  versions: [],
};

export const sampleDocFinance = {
  id: 'doc-fin-1',
  title: 'Q4 2025 Financial Performance & Operating Budget.md',
  filePath: 'local://storage/documents/Q4 2025 Financial Performance & Operating Budget.md',
  fileType: 'markdown' as const,
  fileSize: 3200,
  hash: 'f9e8d7c6b5a4',
  createdAt: '2026-02-15T09:30:00Z',
  updatedAt: '2026-02-15T09:30:00Z',
  category: 'Finance',
  tags: ['finance', 'budget', 'revenue', 'runway'],
  chunksCount: 6,
  tokenCount: 800,
  content: `# Q4 2025 Financial Performance & Operating Budget
Total revenue for Q4 reached $4.2M, representing a 28% quarter-over-quarter growth.
Gross margins improved to 82% due to local on-premise compute optimization, reducing cloud GPU spend.
Operating expenses were kept at $2.1M, extending current runway to 34 months without requiring additional capital.
Capital expenditure in hardware and workstations totaled $140,000 for local LLM inference clusters.`,
  summary: {
    brief: 'Financial report detailing Q4 revenue growth of 28% and 34 months runway.',
    detailed: 'Operating budget report demonstrating $4.2M quarterly revenue and strong gross margin expansion.',
    keyPoints: [
      '$4.2M Q4 revenue with 28% QoQ growth',
      '82% gross margins driven by on-premise compute',
      '34 months runway on current balance sheet',
    ],
  },
  embeddingModel: 'nomic-embed-text-v1.5',
  version: 1,
  versions: [],
};
