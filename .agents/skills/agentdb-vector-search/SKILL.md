Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/ruvnet/ruflo/main/.agents/skills/agentdb-vector-search/SKILL.md

---

---
name: "AgentDB Vector Search"
description: "Implement semantic vector search with AgentDB for intelligent document retrieval, similarity matching, and context-aware querying. Use when building RAG systems, semantic search engines, or intelligent knowledge bases."
---

# AgentDB Vector Search

## What This Skill Does

Implements vector-based semantic search using AgentDB's high-performance vector database with **150x-12,500x faster** operations than traditional solutions. Features HNSW indexing, quantization, and sub-millisecond search (<100µs).

## Prerequisites

- Node.js 18+
- AgentDB v1.0.7+ (via agentic-flow or standalone)
- OpenAI API key (for embeddings) or custom embedding model

## Quick Start with CLI

### Initialize Vector Database

```bash
# Initialize with default dimensions (1536 for OpenAI ada-002)
npx agentdb@latest init .$vectors.db

# Custom dimensions for different embedding models
npx agentdb@latest init .$vectors.db --dimension 768  # sentence-transformers
npx agentdb@latest init .$vectors.db --dimension 384  # all-MiniLM-L6-v2

# Use preset configurations
npx agentdb@latest init .$vectors.db --preset small   # <10K vectors
npx agentdb@latest init .$vectors.db --preset medium  # 10K-100K vectors
npx agentdb@latest init .$vectors.db --preset large   # >100K vectors

# In-memory database for testing
npx agentdb@latest init .$vectors.db --in-memory
```

### Query Vector Database

```bash
# Basic similarity search
npx agentdb@latest query .$vectors.db "[0.1,0.2,0.3,...]"

# Top-k results
npx agentdb@latest query .$vectors.db "[0.1,0.2,0.3]" -k 10

# With similarity threshold (cosine similarity)
npx agentdb@latest query .$vectors.db "0.1 0.2 0.3" -t 0.75 -m cosine

# Different distance metrics
npx agentdb@latest query .$vectors.db "[...]" -m euclidean  # L2 distance
npx agentdb@latest query .$vectors.db "[...]" -m dot        # Dot product

# JSON output for automation
npx agentdb@latest query .$vectors.db "[...]" -f json -k 5

# Verbose output with distances
npx agentdb@latest query .$vectors.db "[...]" -v
```

### Import/Export Vectors

```bash
# Export vectors to JSON
npx agentdb@latest export .$vectors.db .$backup.json

# Import vectors from JSON
npx agentdb@latest import .$backup.json

# Get database statistics
npx agentdb@latest stats .$vectors.db
```

## Quick Start with API

```typescript
import { createAgentDBAdapter, computeEmbedding } from 'agentic-flow$reasoningbank';

// Initialize with vector search optimizations
const adapter = await createAgentDBAdapter({
  dbPath: '.agentdb$vectors.db',
  enableLearning: false,       // Vector search only
  enableReasoning: true,       // Enable semantic matching
  quantizationType: 'binary',  // 32x memory reduction
  cacheSize: 1000,             // Fast retrieval
});

// Store document with embedding
const text = "The quantum computer achieved 100 qubits";
const embedding = await computeEmbedding(text);

await adapter.insertPattern({
  id: '',
  type: 'document',
  domain: 'technology',
  pattern_data: JSON.stringify({
    embedding,
    text,
    metadata: { category: "quantum", date: "2025-01-15" }
  }),
  confidence: 1.0,
  usage_count: 0,
  success_count: 0,
  created_at: Date.now(),
  last_used: Date.now(),
});

// Semantic search with MMR (Maximal Marginal Relevance)
const queryEmbedding = awa

