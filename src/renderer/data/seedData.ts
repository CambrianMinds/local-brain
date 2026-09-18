import { DocumentItem, CategoryItem, WikiPage } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All Documents', iconName: 'Files', count: 8, color: '#6ee7b7' },
  { id: 'Technical', name: 'Technical & Architecture', iconName: 'Cpu', count: 3, color: '#7dd3fc' },
  { id: 'Research', name: 'Research & AI Papers', iconName: 'BookOpen', count: 2, color: '#a78bfa' },
  { id: 'Finance', name: 'Finance & Operations', iconName: 'TrendingUp', count: 1, color: '#34d399' },
  { id: 'Legal', name: 'Legal & Contracts', iconName: 'Scale', count: 1, color: '#f59e0b' },
  { id: 'Work', name: 'Work & Engineering', iconName: 'Briefcase', count: 1, color: '#ec4899' },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'LanceDB Architecture & Disk-Based Vector Indexing.md',
    filePath: 'd:/documents/tech/LanceDB-Architecture-2026.md',
    fileType: 'markdown',
    fileSize: 42800,
    hash: 'a7b8e901f4c2847d8b5e612034981aef',
    createdAt: '2026-09-12T14:22:10Z',
    updatedAt: '2026-09-16T18:40:00Z',
    category: 'Technical',
    tags: ['lancedb', 'vector-db', 'disk-ann', 'zero-server', 'embeddings'],
    chunksCount: 14,
    tokenCount: 4120,
    embeddingModel: 'nomic-embed-text-v1.5',
    version: 2,
    versions: [
      {
        id: 'v-102',
        versionNumber: 2,
        timestamp: '2026-09-16T18:40:00Z',
        title: 'LanceDB Architecture & Disk-Based Vector Indexing.md',
        content: `# LanceDB Architecture & Disk-Based Vector Indexing\n\n## 1. Executive Overview\nModern desktop AI systems encounter a severe bottleneck when deploying server-oriented vector databases. LanceDB solves this by embedding vector search natively within the desktop application process using disk-backed columnar tables.`,
        summary: {
          brief: 'Technical evaluation of LanceDB as an embedded, zero-server vector database with persistent disk-backed columnar indexing.',
          detailed: 'LanceDB provides an embedded vector engine built upon the Lance columnar format.',
          keyPoints: [
            'Zero-server deployment model requiring only an npm package and local file storage',
            'Native Apache Arrow & Lance columnar layout enables fast zero-copy reads',
          ],
        },
        fileSize: 42800,
        chunksCount: 14,
        tokenCount: 4120,
        tags: ['lancedb', 'vector-db', 'disk-ann', 'zero-server', 'embeddings'],
        category: 'Technical',
        changeDescription: 'Updated code snippet and added DiskANN benchmark notes',
        author: 'Justin Bogner (Local)',
      },
      {
        id: 'v-101',
        versionNumber: 1,
        timestamp: '2026-09-12T14:22:10Z',
        title: 'LanceDB Architecture & Disk-Based Vector Indexing.md',
        content: `# LanceDB Architecture & Disk-Based Vector Indexing\n\n## 1. Initial Draft\nEvaluation of LanceDB embedded storage engine.`,
        summary: {
          brief: 'Initial draft: Evaluation of LanceDB for embedded local document retrieval.',
          detailed: 'Initial analysis of LanceDB embedded storage engine.',
          keyPoints: [
            'Embedded vector engine deployment',
            'Eliminates Docker requirement for desktop clients',
          ],
        },
        fileSize: 28400,
        chunksCount: 9,
        tokenCount: 2650,
        tags: ['lancedb', 'vector-db', 'embeddings'],
        category: 'Technical',
        changeDescription: 'Initial ingestion and chunking baseline',
        author: 'Local Brain Ingestor',
      },
    ],
    summary: {
      brief: 'Technical evaluation of LanceDB as an embedded, zero-server vector database with persistent disk-backed columnar indexing.',
      detailed: 'LanceDB provides an embedded vector engine built upon the Lance columnar format. Unlike in-memory databases like FAISS or server-dependent engines like Milvus/Pinecone, LanceDB writes indices directly to NVMe/SSD storage without memory blow-up. It supports sub-millisecond approximate nearest neighbor (ANN) lookups with IVFPQ and HNSW graphs while maintaining zero infrastructure overhead.',
      keyPoints: [
        'Zero-server deployment model requiring only an npm package and local file storage',
        'Native Apache Arrow & Lance columnar layout enables fast zero-copy reads',
        'DiskANN-inspired secondary indexing allows collections with millions of vectors on standard laptops',
        'Seamless integration with SQLite for hybrid vector + FTS metadata filtering',
      ],
    },
    content: `# LanceDB Architecture & Disk-Based Vector Indexing

## 1. Executive Overview
Modern desktop AI systems encounter a severe bottleneck when deploying server-oriented vector databases (e.g. Pinecone, Weaviate, Qdrant). Requiring Docker containers or external cloud connections undermines offline resilience, privacy guarantees, and lightweight desktop distribution. LanceDB solves this by embedding vector search natively within the desktop application process using disk-backed columnar tables.

\`\`\`typescript
import * as lancedb from 'vectordb';

// Open or create a local disk-backed vector database
const db = await lancedb.connect('~/.local-brain/vectors.lance');
const table = await db.openTable('document_vectors');

// Perform fast cosine similarity query with distance cutoff
const results = await table
  .search(queryEmbedding)
  .metricType('cosine')
  .limit(10)
  .execute();
\`\`\`

## 2. The Lance Columnar Data Format
Lance was engineered from the ground up to replace Parquet for multi-modal and AI workflows:
- **Fast Random Access**: Parquet requires decompressing entire row groups to read a single vector; Lance optimizes for low-latency random seeks (<1ms).
- **Zero-Copy Vector Slicing**: Leverages Apache Arrow memory mapping for instant query execution without serialization overhead.
- **Nested Schema Support**: Deeply nested JSON metadata, chunk tokens, and source document identifiers are stored alongside high-dimensional float32 arrays.

## 3. Approximate Nearest Neighbor (ANN) Indexing
LanceDB incorporates Product Quantization (IVF-PQ) and Graph-based indexes (HNSW) directly on disk:
1. **Centroid Partitioning (IVF)**: Vectors are clustered into Voronoi cells. During search, only vectors in the closest centroids are evaluated.
2. **Product Quantization (PQ)**: 1536-dimensional vectors are compressed into 8-bit quantized byte representations, achieving 16x memory compression.
3. **Refinement Pass**: Top candidates retrieved from quantized disk space are re-ranked using uncompressed source vectors for 99.2% recall accuracy.

## 4. Benchmark Summary
On an M2 Max workstation with 500,000 documents indexed at 768 dimensions:
- Query Latency (k=10): 4.2 milliseconds
- RAM footprint: 120 MB (disk residency absorbs 95% of data)
- Ingestion Throughput: 14,200 vectors/second with batched Arrow tables.

## 5. Architectural Recommendation for Local Brain
LanceDB should be paired with better-sqlite3. LanceDB handles heavy dense vector retrieval, while SQLite handles relational tables (document hierarchy, tags, user notes, and FTS5 full-text indexing).`,
  },
  {
    id: 'doc-2',
    title: 'Q3 2026 Financial Performance & Runway Analysis.xlsx',
    filePath: 'd:/finance/reports/2026-Q3-Runway-Operating-Plan.xlsx',
    fileType: 'spreadsheet',
    fileSize: 89400,
    hash: 'f5d1c2384a7e908b1a324901f4c2847d',
    createdAt: '2026-09-08T09:15:00Z',
    updatedAt: '2026-09-14T11:20:00Z',
    category: 'Finance',
    tags: ['runway', 'cash-flow', 'q3-2026', 'ebitda', 'budget', 'operating-expenses'],
    chunksCount: 8,
    tokenCount: 2840,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Quarterly financial report presenting $4.2M gross ARR, 26 months of remaining cash runway, and net burn reduction of 18%.',
      detailed: 'The Q3 2026 financial analysis outlines significant margin improvements following the transition to local inference infrastructure. Cloud API spend dropped from $42,000/month to $8,400/month as desktop clients began utilizing on-device quantization. Total ending cash balance stands at $7.85M with an average net monthly burn of $295K, providing an extended runway of 26.6 months through November 2028.',
      keyPoints: [
        'Ending Cash Balance: $7,850,000 across SVB and Mercury treasury accounts',
        'Net Monthly Burn: $295,000 (an 18.2% reduction quarter-over-quarter)',
        'Cloud LLM Inference Savings: 80% decrease due to local model deployment',
        'Runway: 26.6 months at projected hiring and compute investment rates',
      ],
    },
    content: `# Q3 2026 Financial Performance & Runway Analysis

## Financial Summary Dashboard
| Metric | Q2 2026 | Q3 2026 | Variance (%) | Status |
|:---|:---|:---|:---|:---|
| Annual Recurring Revenue (ARR) | $3,650,000 | $4,220,000 | +15.6% | Exceeded Target |
| Gross Margin | 74.2% | 81.8% | +7.6% | Favorable |
| Monthly Operating Expenses | $485,000 | $412,000 | -15.0% | Optimized |
| Cloud Compute / LLM Spend | $42,100 | $8,450 | -79.9% | Significant Saving |
| Net Cash Burn Rate | $361,000 | $295,000 | -18.2% | Controlled |
| Total Cash & Equivalents | $8,735,000 | $7,850,000 | -10.1% | Stable |
| Calculated Cash Runway | 24.1 Mos | 26.6 Mos | +2.5 Mos | Strong |

## Operating Expense Breakdown
1. **Engineering & R&D**: $210,000 / month (71% of total spend)
2. **Sales & Marketing**: $94,000 / month
3. **General & Administrative (Legal, Compliance, Office)**: $58,000 / month
4. **Cloud Infrastructure & Hosting**: $8,450 / month (reduced from $42,100)
5. **Software Tooling & Subscriptions**: $41,550 / month

## Notes on Infrastructure Cost Reduction
The architectural decision to ship Local Brain as an on-device Electron application powered by local LM Studio inference dramatically reduced our OpenRouter token liabilities. Prior to Q3, every document uploaded required remote cloud tokenization and chunk embeddings. By moving embedding and summarization on-device, our per-user marginal cost dropped to near zero.`,
  },
  {
    id: 'doc-3',
    title: 'Privacy-Preserving Local AI & LM Studio Spec.pdf',
    filePath: 'd:/research/papers/Local-AI-Privacy-LMStudio-2026.pdf',
    fileType: 'pdf',
    fileSize: 124500,
    hash: 'c8301f4c2847d8b5e612034981aefa7b',
    createdAt: '2026-09-05T16:04:22Z',
    updatedAt: '2026-09-15T12:00:00Z',
    category: 'Research',
    tags: ['privacy', 'lm-studio', 'open-weights', 'security', 'gdpr', 'air-gapped'],
    chunksCount: 18,
    tokenCount: 5240,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Comprehensive architecture specification detailing air-gapped local AI inference via LM Studio OpenAI-compatible endpoints.',
      detailed: 'This paper establishes the security and compliance guarantees of deploying enterprise document retrieval systems with zero cloud data transmission. By utilizing LM Studio (bound to localhost:1234) and quantized GGUF weights, organizations maintain 100% compliance with HIPAA, GDPR Article 9, and SOC 2 Type II controls. Document chunks never leave the physical device memory.',
      keyPoints: [
        'Localhost API binding ensures zero telemetry, zero logging, and zero egress packets',
        'Compatible with standard OpenAI REST SDKs via http://localhost:1234/v1',
        'Nomic Embed Text achieves 81.4 MTEB score at 4-bit quantization with 280MB VRAM footprint',
        'Automatic fallback mechanism gracefully routes to OpenRouter when local daemon is paused',
      ],
    },
    content: `# Privacy-Preserving Local AI & LM Studio Spec

## Abstract
Enterprise knowledge workers routinely handle sensitive intellectual property, proprietary financial statements, legal contracts, and health records. Transmitting raw documents to centralized cloud APIs introduces confidentiality risks and regulatory compliance liabilities. This specification introduces the Local Brain offline ingestion engine coupled with LM Studio daemon execution.

## 1. System Topology & Air-Gap Guarantees
\`\`\`
+-------------------------------------------------------+
|  Local Brain Desktop Container (Electron Renderer)    |
|   - Document Parsing (PDF, DOCX, MD, XLSX, EML)       |
|   - Semantic Chunker (512 tokens / 64 overlap)        |
+---------------------------+---------------------------+
                            |
           IPC (Internal OS Pipe / Localhost)
                            v
+---------------------------+---------------------------+
|  LM Studio Local Engine (http://localhost:1234/v1)    |
|   - Embedding: nomic-embed-text (GGUF Q4_K_M)         |
|   - Chat/Summary: llama-3.2-3b-instruct               |
|   - Apple Silicon Metal / NVIDIA CUDA acceleration    |
+-------------------------------------------------------+
\`\`\`

## 2. Model Performance Benchmarks
We evaluated three local embedding models on our proprietary 10,000-document technical corpus:

| Model | Size | Quant | MTEB Score | Inference Time (512 tokens) | VRAM Usage |
|:---|:---|:---|:---|:---|:---|
| **Nomic Embed Text v1.5** | 137M | Q4_K_M | 81.4 | 11.4 ms | 280 MB |
| **BGE-Small-EN v1.5** | 33M | F16 | 77.8 | 6.8 ms | 130 MB |
| **All-MiniLM-L6-v2** | 22M | F16 | 74.2 | 4.9 ms | 90 MB |

## 3. Fallback Protocols
When LM Studio is inactive or unreachable, Local Brain implements a 3-tier fallback matrix:
1. **Local Daemon Ping**: Attempt HTTP GET on http://localhost:1234/v1/models with 300ms timeout.
2. **OpenRouter Relay**: If configured with user API key, route embeddings to free liquid/lfm2.5-embedding-350m model.
3. **Internal Neural Heuristic**: Pure offline CPU cosine similarity matching with SQLite FTS5 fallback.`,
  },
  {
    id: 'doc-4',
    title: 'Hybrid Search with Reciprocal Rank Fusion.ts',
    filePath: 'd:/tools/local-brain/src/services/search/hybrid.ts',
    fileType: 'code',
    fileSize: 31200,
    hash: 'b1e612034981aefa7b8e901f4c2847d8',
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-15T09:30:00Z',
    category: 'Technical',
    tags: ['hybrid-search', 'rrf', 'fts5', 'bm25', 'vector-search', 'algorithms'],
    chunksCount: 11,
    tokenCount: 3410,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Implementation of Reciprocal Rank Fusion (RRF) combining dense LanceDB vector search with sparse SQLite FTS5 keyword queries.',
      detailed: 'Pure vector search frequently misses exact keyword terms (product names, serial codes, acronyms), while BM25 keyword search fails on semantic phrasing. This TypeScript module unifies both search paradigms using Reciprocal Rank Fusion with a k=60 dampening constant, normalizing scores into a unified 0-100% relevance metric.',
      keyPoints: [
        'Solves the vocabulary mismatch problem by pairing semantic dense embeddings with exact token BM25',
        'RRF scoring formula: RRF_score = Sum( 1 / (k + rank_i) ) with default k=60',
        'Deduplicates multiple matching chunks per document to present high-signal document-level results',
        'Supports dynamic slider adjustment between semantic weight and keyword weight',
      ],
    },
    content: `/**
 * Hybrid Search Engine using Reciprocal Rank Fusion (RRF)
 * Merges dense vector similarity scores with sparse SQLite BM25 rankings.
 */

export interface RankedChunk {
  documentId: string;
  chunkId: string;
  textSnippet: string;
  score: number;
  rank: number;
}

export interface HybridSearchResult {
  documentId: string;
  combinedScore: number;
  semanticRank?: number;
  keywordRank?: number;
  topSnippet: string;
}

const RRF_K = 60; // Standard dampening constant from Cormack et al.

export function reciprocalRankFusion(
  semanticResults: RankedChunk[],
  keywordResults: RankedChunk[],
  weights = { semantic: 0.65, keyword: 0.35 }
): HybridSearchResult[] {
  const scoreMap = new Map<string, {
    score: number;
    semanticRank?: number;
    keywordRank?: number;
    snippet: string;
  }>();

  // 1. Process Semantic Results
  semanticResults.forEach((item, index) => {
    const rank = index + 1;
    const rrfScore = weights.semantic * (1.0 / (RRF_K + rank));
    
    scoreMap.set(item.documentId, {
      score: rrfScore,
      semanticRank: rank,
      snippet: item.textSnippet,
    });
  });

  // 2. Process Keyword Results
  keywordResults.forEach((item, index) => {
    const rank = index + 1;
    const rrfScore = weights.keyword * (1.0 / (RRF_K + rank));
    
    const existing = scoreMap.get(item.documentId);
    if (existing) {
      existing.score += rrfScore;
      existing.keywordRank = rank;
      // Prefer keyword snippet if it contains exact phrase matches
      if (item.textSnippet.length > existing.snippet.length) {
        existing.snippet = item.textSnippet;
      }
    } else {
      scoreMap.set(item.documentId, {
        score: rrfScore,
        keywordRank: rank,
        snippet: item.textSnippet,
      });
    }
  });

  // 3. Sort by aggregated score descending
  return Array.from(scoreMap.entries())
    .map(([documentId, data]) => ({
      documentId,
      combinedScore: Math.min(1.0, data.score * 120), // Normalized 0..1 scale
      semanticRank: data.semanticRank,
      keywordRank: data.keywordRank,
      topSnippet: data.snippet,
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore);
}`,
  },
  {
    id: 'doc-5',
    title: 'Master Services Agreement & Data Protection Addendum.docx',
    filePath: 'd:/legal/contracts/Enterprise-MSA-DPA-2026.docx',
    fileType: 'docx',
    fileSize: 67300,
    hash: '901f4c2847d8b5e612034981aefa7b8e',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-02T15:10:00Z',
    category: 'Legal',
    tags: ['contract', 'legal', 'msa', 'dpa', 'gdpr', 'subprocessors'],
    chunksCount: 16,
    tokenCount: 4890,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Enterprise Master Services Agreement and GDPR-compliant Data Protection Addendum governing software licensing and local data tenancy.',
      detailed: 'This bilateral agreement defines customer intellectual property protections, software warranty disclaimers, and data protection commitments. It specifically guarantees that when the Local Brain on-premise license is installed, the licensor has no access, telemetry, or storage rights over customer input documents, embeddings, or metadata.',
      keyPoints: [
        'Customer maintains exclusive ownership over all documents, vectors, summaries, and generated wikis',
        'Section 4.2 confirms Zero Data Ingress/Egress: software operates under local runtime isolation',
        'Standard limitation of liability capped at 12 months fees paid preceding the incident',
        'Includes standard European Commission Standard Contractual Clauses (SCCs) for cross-border protection',
      ],
    },
    content: `# MASTER SERVICES AGREEMENT & DATA PROTECTION ADDENDUM (2026)

## SECTION 1: DEFINITIONS & RECITALS
"Customer Data" means any electronic documents, PDF files, spreadsheets, source code files, email archives, and vectorized representations processed by the Software.
"Local Brain Software" means the standalone desktop executable and associated neural indexing utilities licensed to Customer.

## SECTION 2: INTELLECTUAL PROPERTY & DATA SOVEREIGNTY
2.1 **Customer Ownership**: As between Licensor and Customer, Customer exclusively owns all rights, title, and interest in and to Customer Data, including all derived vector embeddings, semantic indexes, generated summaries, and synthesized wiki articles.
2.2 **Zero Telemetry Guarantee**: The Software does not transmit, replicate, or synchronize Customer Data to any external servers, third-party LLM providers, or cloud analytics endpoints unless expressly enabled by Customer via custom API key configuration.

## SECTION 3: WARRANTIES & LIABILITIES
3.1 **Warranty of Operation**: Licensor warrants that the Software shall function substantially in accordance with documentation and that embedded vector libraries (including LanceDB and SQLite) operate in conformance with ACID transactional standards.
3.2 **Limitation of Liability**: To the maximum extent permitted by applicable law, neither party's aggregate liability under this agreement shall exceed the total fees paid by Customer during the twelve (12) month period immediately preceding the event giving rise to liability.

## SECTION 4: DATA PROTECTION & SECURITY ADDENDUM (GDPR / CCPA)
4.1 **Role of Licensor**: Because the Software executes entirely within Customer's local computing environment without transmission of personal data to Licensor, Licensor does not act as a Data Processor under Article 28 of Regulation (EU) 2016/679 (GDPR).
4.2 **Subprocessors**: Licensor employs zero third-party cloud subprocessors for core document processing.`,
  },
  {
    id: 'doc-6',
    title: 'Distributed Ingestion Pipeline Design & Chunker Spec.md',
    filePath: 'd:/documents/tech/Ingestion-Pipeline-Spec.md',
    fileType: 'markdown',
    fileSize: 38400,
    hash: '2847d8b5e612034981aefa7b8e901f4c',
    createdAt: '2026-09-04T13:45:00Z',
    updatedAt: '2026-09-17T17:15:00Z',
    category: 'Technical',
    tags: ['pipeline', 'chunking', 'parsers', 'tokenization', 'workers', 'ingestion'],
    chunksCount: 12,
    tokenCount: 3650,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Architecture of the multi-stage ingestion worker pipeline: Parse -> Chunk -> Embed -> Categorize -> Store.',
      detailed: 'Details the asynchronous multi-threaded ingestion architecture in Local Brain. By delegating format-specific file parsing to dedicated worker threads, the main UI thread maintains 60 FPS responsiveness during batch uploads. Chunker uses recursive character boundary detection with sentence-preserving windowing.',
      keyPoints: [
        '5-Stage Pipeline: File Extraction -> Recursive Chunking -> Vectorization -> Classification -> SQLite/LanceDB Commit',
        'Chunking strategy: 512 target tokens, 64 token overlap, respects heading/code boundaries',
        'Background Worker Pool prevents UI freeze when dropping large multi-megabyte PDFs',
        'Real-time IPC telemetry reports granular completion percentages to desktop progress rings',
      ],
    },
    content: `# Distributed Ingestion Pipeline Design & Chunker Spec

## 1. Pipeline Stages
Local Brain executes an unyielding, fault-tolerant ingestion pipeline:

\`\`\`
[ Raw File ]
     │
     ▼ (Stage 1: Format Parsing via pdf-parse, mammoth, xlsx, mailparser)
[ Normalized UTF-8 Clean Text ]
     │
     ▼ (Stage 2: Recursive Character / Token Chunker ~512 tokens, 64 overlap)
[ Array of Document Chunks with Metadata ]
     │
     ▼ (Stage 3: Vectorization via LM Studio / OpenRouter / Nomic)
[ Dense 768-dim Embedding Vectors ]
     │
     ▼ (Stage 4: LLM Categorization & Auto-Tagging)
[ Classification & Metadata Enrichment ]
     │
     ▼ (Stage 5: Atomic Write)
[ LanceDB Table (.lance) + SQLite Catalog (.db) ]
\`\`\`

## 2. Recursive Chunker Implementation
Rather than slicing text arbitrarily at fixed character counts (which fractures words and code blocks), the chunker evaluates natural separators in hierarchical order:
1. Double newlines (Paragraph boundaries \`\\n\\n\`)
2. Markdown headings (\`# \`, \`## \`, \`### \`)
3. Code fence delimiters (\`\`\`\`\`)
4. Punctuation boundaries (\`. \`, \`? \`, \`! \`)
5. Space boundaries (\` \`)

## 3. Worker Thread Isolation
To prevent blocking Electron's V8 event loop during heavy PDF parsing, file streams are dispatched to a Node.js \`worker_threads\` pool with worker count constrained to \`Math.max(1, os.cpus().length - 1)\`.`,
  },
  {
    id: 'doc-7',
    title: 'Enterprise Knowledge Base Taxonomy Guidelines.txt',
    filePath: 'd:/documents/work/Taxonomy-Guidelines.txt',
    fileType: 'text',
    fileSize: 18200,
    hash: 'e612034981aefa7b8e901f4c2847d8b5',
    createdAt: '2026-08-28T08:30:00Z',
    updatedAt: '2026-09-11T14:20:00Z',
    category: 'Work',
    tags: ['taxonomy', 'governance', 'naming-conventions', 'organization'],
    chunksCount: 6,
    tokenCount: 1980,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Organizational guidelines for document metadata naming, categorization hierarchies, and auto-tag deduplication.',
      detailed: 'Establishes the corporate standard for structuring digital assets across engineering, product, and administrative departments. Explains how Local Brain automated tagging maps colloquial names into canonical taxonomy nodes.',
      keyPoints: [
        'Seven primary top-level categories: Research, Technical, Finance, Legal, Work, Personal, Creative',
        'Tag normalization rules: lowercased, hyphen-separated, singular noun form',
        'Periodic clustering suggestions prune redundant tags and merge duplicates',
      ],
    },
    content: `ENTERPRISE KNOWLEDGE BASE TAXONOMY GUIDELINES (v2.4)
=====================================================

1. PURPOSE & SCOPE
This document outlines standard classifications for enterprise document repositories indexed by Local Brain. Automated categorization algorithms leverage these guidelines to auto-assign incoming files.

2. PRIMARY TAXONOMY CATEGORIES
- Technical: System designs, API specs, database schemas, code snippets, architecture diagrams.
- Research: Academic papers, benchmark evaluations, LLM research, algorithm experiments.
- Finance: Budget spreadsheets, runway models, revenue reports, expense audits, billing statements.
- Legal: Master service agreements, vendor contracts, NDA templates, terms of service, compliance filings.
- Work: Meeting notes, project charters, sprint retrospectives, operational checklists.
- Personal: Private notes, journals, creative writing, personal research.

3. TAGGING CONVENTIONS
- All tags must be formatted in kebab-case (e.g., 'vector-database', not 'VectorDatabase' or 'vector database').
- Discourage ambiguous single-character tags.
- Tag depth should not exceed 6 tags per individual document.`,
  },
  {
    id: 'doc-8',
    title: 'Weekly Engineering Sync & LLM Latency Benchmarks.eml',
    filePath: 'd:/email/archives/2026-09-sync-latency-benchmarks.eml',
    fileType: 'email',
    fileSize: 24500,
    hash: '12034981aefa7b8e901f4c2847d8b5e6',
    createdAt: '2026-09-16T17:00:00Z',
    updatedAt: '2026-09-16T17:05:00Z',
    category: 'Work',
    tags: ['engineering-sync', 'benchmarks', 'latency', 'metal', 'cuda'],
    chunksCount: 5,
    tokenCount: 1650,
    embeddingModel: 'nomic-embed-text-v1.5',
    summary: {
      brief: 'Engineering team email detailing Apple Silicon Metal vs NVIDIA CUDA benchmark results for local embeddings.',
      detailed: 'In this weekly sync thread, lead engineer Alex reports that Nomic Embed Text achieves 11ms chunk embedding times on Apple M3 Max using Metal shader offloading, beating the 18ms target. Discussion highlights memory optimizations for low-end 16GB laptops.',
      keyPoints: [
        'Apple Silicon M3 Max achieves 11.2ms per 512-token chunk embedding',
        'NVIDIA RTX 4070 achieves 5.8ms per chunk via TensorRT-LLM',
        'UI stay responsive with zero jitter during 2,000 document bulk import',
        'V1 release candidate approved for packaging with Electron 34',
      ],
    },
    content: `From: alex.chen@localbrain.internal
To: eng-core@localbrain.internal
Date: Wed, 16 Sep 2026 17:00:00 -0700
Subject: Weekly Engineering Sync & LLM Latency Benchmarks (Sep 16, 2026)

Team,

Here is our latency scorecard from the latest benchmark run across desktop hardware targets:

1. EMBEDDING INGESTION LATENCY (Nomic Embed Text Q4_K_M, 512 Tokens):
- Apple M3 Max (Metal): 11.2 ms / chunk
- Apple M2 Base (Metal): 21.4 ms / chunk
- NVIDIA RTX 4080 (CUDA): 4.1 ms / chunk
- Intel Core Ultra 7 (OpenVINO NPU): 16.8 ms / chunk

2. SEARCH LATENCY (LanceDB ANN + SQLite FTS5 RRF, 50k vectors):
- P50 Query Latency: 3.8 ms
- P99 Query Latency: 9.2 ms

3. MEMORY OCCUPANCY:
- Base Electron Renderer + Preload: 88 MB RAM
- SQLite in WAL Mode: 14 MB RAM
- LanceDB Cache: 45 MB RAM
- Total idle memory consumption remains under 160 MB!

Next milestones:
- Finalize wiki auto-generation generator with cross-reference anchor linking.
- Ship Settings panel with one-click LM Studio auto-discovery.

Best,
Alex Chen
Lead Systems Architect, Local Brain`,
  },
];

export const INITIAL_WIKIS: WikiPage[] = [
  {
    id: 'wiki-1',
    title: 'Vector Databases & Disk-Native Retrieval Architecture',
    slug: 'vector-databases-disk-native-retrieval',
    category: 'Technical',
    clusterId: 'cluster-vector-retrieval',
    status: 'auto',
    coverageScore: 96,
    lastUpdated: '2026-09-17T16:00:00Z',
    lastGeneratedAt: '2026-09-17T16:00:00Z',
    sourceDocIds: ['doc-1', 'doc-4', 'doc-6'],
    summary: 'A consolidated architectural review of embedded vector databases, disk-based Product Quantization, and hybrid RRF search engines.',
    stalenessCount: 0,
    sources: [
      {
        documentId: 'doc-1',
        documentTitle: 'LanceDB Architecture & Disk-Based Vector Indexing.md',
        relevanceScore: 98,
        matchedSnippet: 'Architectural evaluation of embedded vector databases operating directly against disk via memory-mapped IO.',
      },
      {
        documentId: 'doc-4',
        documentTitle: 'Hybrid Search with Reciprocal Rank Fusion.ts',
        relevanceScore: 94,
        matchedSnippet: 'Implementation of Reciprocal Rank Fusion (RRF) combining dense LanceDB vector search with sparse SQLite FTS5.',
      },
      {
        documentId: 'doc-6',
        documentTitle: 'Distributed Ingestion Pipeline Design & Chunker Spec.md',
        relevanceScore: 91,
        matchedSnippet: 'Architecture of multi-stage ingestion worker pipeline: Parse -> Chunk -> Embed -> Categorize -> Store.',
      },
    ],
    sections: [
      {
        id: 'sec-1',
        heading: '1. The Embedded Vector Paradigm',
        level: 2,
        content: `Historically, Retrieval-Augmented Generation (RAG) demanded external server clusters running Milvus, Weaviate, or Pinecone. This created an insurmountable barrier for native desktop software:
- **Operational Complexity**: Users were forced to install Docker or run local Python microservices.
- **Memory Consumption**: In-memory vector indexes (like pure FAISS) consume gigabytes of RAM for modest document collections.
- **Privacy Breaches**: Cloud vector databases mirror customer embeddings to remote servers, violating strict data sovereignty mandates.

Embedded engines like LanceDB flip this paradigm by decoupling query compute from disk storage.`,
      },
      {
        id: 'sec-2',
        heading: '2. DiskANN & Columnar Quantization Mechanics',
        level: 2,
        content: `By storing vectors in the Lance columnar layout, documents and vectors are read directly from disk via operating system \`mmap\` (memory mapping):

1. **Centroid Clustering (IVF)**: Vectors are grouped into Voronoi partitions during index generation.
2. **Product Quantization (PQ)**: High-dimensional embeddings (e.g. 768 float32 values) are compressed to 8-bit quantized codes, reducing index size by over 90%.
3. **Refinement Query Pass**: Top candidates fetched from disk are verified against uncompressed embeddings to achieve >99% recall.`,
      },
      {
        id: 'sec-3',
        heading: '3. Hybrid Search via Reciprocal Rank Fusion (RRF)',
        level: 2,
        content: `Vector embeddings alone suffer from the vocabulary mismatch paradox—they understand conceptual similarity but often fail to match exact strings, technical acronyms, or serial IDs.

Local Brain resolves this by merging:
- **Dense Vector Search** (LanceDB cosine similarity)
- **Sparse Full-Text Search** (SQLite FTS5 BM25)

\`\`\`
RRF_Score = w_dense * (1 / (60 + Rank_dense)) + w_sparse * (1 / (60 + Rank_sparse))
\`\`\`

This guarantees that queries containing exact keywords rank at the top while semantic nuances remain fully preserved.`,
      },
      {
        id: 'sec-4',
        heading: '4. References & Primary Sources',
        level: 2,
        content: `- [[LanceDB Architecture & Disk-Based Vector Indexing.md]]
- [[Hybrid Search with Reciprocal Rank Fusion.ts]]
- [[Distributed Ingestion Pipeline Design & Chunker Spec.md]]`,
      },
    ],
    contradictions: [
      {
        id: 'contra-seed-1',
        topic: 'Hardware Latency Variations',
        statementA: 'Nomic Embed Text v1.5 benchmark cites 11.4 ms inference on 512 tokens.',
        sourceDocA: 'Privacy-Preserving Local AI & LM Studio Spec.pdf',
        statementB: 'Apple M3 Max Metal benchmark records 11.2 ms, while Apple M2 Base records 21.4 ms.',
        sourceDocB: 'Weekly Engineering Sync & LLM Latency Benchmarks.eml',
        notes: 'GPU shader core count and memory bandwidth differences account for the 10ms delta between chip tiers.',
      },
    ],
    knowledgeGaps: [
      {
        id: 'gap-seed-1',
        topic: 'Multi-Modal Vector Embedding Support',
        description: 'Current architecture exclusively indexes text chunks. Image embeddings (CLIP/SigLIP) are not yet specified in local pipeline.',
        suggestedResearch: 'Benchmark multimodal ONNX models for local visual document indexing.',
        importance: 'high',
      },
    ],
    content: `# Vector Databases & Disk-Native Retrieval Architecture

> **Executive Overview**: This synthesized knowledge base documents the evolution from server-heavy vector stores to embedded, zero-server architectures. It details how LanceDB and SQLite operate in symbiosis within Local Brain to power sub-5ms hybrid queries across hundreds of thousands of local documents. See related governance in [[Local-First AI Governance & Privacy Guarantees]].

---

## 1. The Embedded Vector Paradigm
Historically, Retrieval-Augmented Generation (RAG) demanded external server clusters running Milvus, Weaviate, or Pinecone. This created an insurmountable barrier for native desktop software:
- **Operational Complexity**: Users were forced to install Docker or run local Python microservices.
- **Memory Consumption**: In-memory vector indexes (like pure FAISS) consume gigabytes of RAM for modest document collections.
- **Privacy Breaches**: Cloud vector databases mirror customer embeddings to remote servers, violating strict data sovereignty mandates.

Embedded engines like LanceDB flip this paradigm by decoupling query compute from disk storage.

---

## 2. DiskANN & Columnar Quantization Mechanics
By storing vectors in the **Lance columnar layout**, documents and vectors are read directly from disk via operating system \`mmap\` (memory mapping):

1. **Centroid Clustering (IVF)**: Vectors are grouped into Voronoi partitions during index generation.
2. **Product Quantization (PQ)**: High-dimensional embeddings (e.g. 768 float32 values) are compressed to 8-bit quantized codes, reducing index size by over 90%.
3. **Refinement Query Pass**: Top candidates fetched from disk are verified against uncompressed embeddings to achieve >99% recall.

---

## 3. Hybrid Search via Reciprocal Rank Fusion (RRF)
Vector embeddings alone suffer from the **vocabulary mismatch paradox**—they understand conceptual similarity but often fail to match exact strings, technical acronyms, or serial IDs.

Local Brain resolves this by merging:
- **Dense Vector Search** (LanceDB cosine similarity)
- **Sparse Full-Text Search** (SQLite FTS5 BM25)

\`\`\`
RRF_Score = w_dense * (1 / (60 + Rank_dense)) + w_sparse * (1 / (60 + Rank_sparse))
\`\`\`

This guarantees that queries containing exact keywords rank at the top while semantic nuances remain fully preserved.

---

## 4. References & Primary Sources
- [[LanceDB Architecture & Disk-Based Vector Indexing.md]]
- [[Hybrid Search with Reciprocal Rank Fusion.ts]]
- [[Distributed Ingestion Pipeline Design & Chunker Spec.md]]`,
  },
  {
    id: 'wiki-2',
    title: 'Local-First AI Governance & Privacy Guarantees',
    slug: 'local-first-ai-governance-privacy',
    category: 'Research',
    clusterId: 'cluster-ai-privacy',
    status: 'auto',
    coverageScore: 92,
    lastUpdated: '2026-09-16T12:00:00Z',
    lastGeneratedAt: '2026-09-16T12:00:00Z',
    sourceDocIds: ['doc-3', 'doc-5', 'doc-8'],
    summary: 'Compliance, security boundaries, and air-gapped guarantees for enterprise document management under GDPR and HIPAA.',
    stalenessCount: 0,
    sources: [
      {
        documentId: 'doc-3',
        documentTitle: 'Privacy-Preserving Local AI & LM Studio Spec.pdf',
        relevanceScore: 97,
        matchedSnippet: 'Comprehensive architecture specification detailing air-gapped local AI inference via LM Studio.',
      },
      {
        documentId: 'doc-5',
        documentTitle: 'Master Services Agreement & Data Protection Addendum.docx',
        relevanceScore: 93,
        matchedSnippet: 'Legal contract governing on-premise software licensing and zero telemetry compliance.',
      },
      {
        documentId: 'doc-8',
        documentTitle: 'Weekly Engineering Sync & LLM Latency Benchmarks.eml',
        relevanceScore: 89,
        matchedSnippet: 'Hardware benchmark metrics measuring Apple Silicon Metal and CUDA inference latency.',
      },
    ],
    sections: [
      {
        id: 'sec-2-1',
        heading: '1. The Zero-Egress Principle',
        level: 2,
        content: `Under traditional enterprise software agreements, organizations must negotiate complex Business Associate Agreements (BAA) and Data Protection Addendums (DPA) because document files are routinely uploaded to remote clouds.

Local Brain adheres strictly to the Zero-Egress Principle:
- Document parsing occurs on CPU worker threads inside the desktop process.
- Embeddings are generated locally via LM Studio bound to \`http://localhost:1234\`.
- LanceDB tables and SQLite metadata remain confined to the user's encrypted home directory (\`~/.local-brain\`).`,
      },
      {
        id: 'sec-2-2',
        heading: '2. Regulatory Compliance Matrix',
        level: 2,
        content: `| Regulation | Cloud LLM Risk | Local Brain Mitigation |
|:---|:---|:---|
| **GDPR Article 9 (Special Category Data)** | High risk of unauthorized third-party processing | Data never leaves customer device memory |
| **HIPAA Security Rule** | Requires signed BAA and transit encryption audits | Zero transit across public internet networks |
| **SOC 2 Type II** | Continuous vendor subprocessor risk management | Zero third-party subprocessors involved |`,
      },
      {
        id: 'sec-2-3',
        heading: '3. Hardware Acceleration & Latency Realities',
        level: 2,
        content: `Empirical testing validates that modern desktop silicon (Apple Silicon Metal shaders and NVIDIA CUDA cores) delivers sub-15ms chunk vectorization, outperforming cloud roundtrip network hops.`,
      },
      {
        id: 'sec-2-4',
        heading: '4. References & Primary Sources',
        level: 2,
        content: `- [[Privacy-Preserving Local AI & LM Studio Spec.pdf]]
- [[Master Services Agreement & Data Protection Addendum.docx]]
- [[Weekly Engineering Sync & LLM Latency Benchmarks.eml]]`,
      },
    ],
    contradictions: [
      {
        id: 'contra-seed-2',
        topic: 'Zero Telemetry vs Cloud Fallback Toggles',
        statementA: 'MSA Section 2.2 guarantees that the software does not transmit customer data to any third party.',
        sourceDocA: 'Master Services Agreement & Data Protection Addendum.docx',
        statementB: 'Architecture spec provides an optional fallback relay to OpenRouter when local daemon is paused.',
        sourceDocB: 'Privacy-Preserving Local AI & LM Studio Spec.pdf',
        notes: 'Air-gapped compliance requires setting AI Provider strictly to Local LM Studio in Settings.',
      },
    ],
    knowledgeGaps: [
      {
        id: 'gap-seed-2',
        topic: 'Tamper-Evident Audit Logging Protocol',
        description: 'Current specifications lack cryptographic hashing of query logs to satisfy continuous compliance verification under SOC 2 CC6.8.',
        suggestedResearch: 'Design append-only Merkle tree audit log for local retrieval actions.',
        importance: 'high',
      },
    ],
    content: `# Local-First AI Governance & Privacy Guarantees

> **Executive Overview**: Explains how Local Brain eliminates cloud data leakage by binding all LLM inference, embedding generation, and vector retrieval strictly to on-device hardware. See retrieval architecture in [[Vector Databases & Disk-Native Retrieval Architecture]].

---

## 1. The Zero-Egress Principle
Under traditional enterprise software agreements, organizations must negotiate complex Business Associate Agreements (BAA) and Data Protection Addendums (DPA) because document files are routinely uploaded to remote clouds.

Local Brain adheres strictly to the **Zero-Egress Principle**:
- Document parsing occurs on CPU worker threads inside the desktop process.
- Embeddings are generated locally via LM Studio bound to \`http://localhost:1234\`.
- LanceDB tables and SQLite metadata remain confined to the user's encrypted home directory (\`~/.local-brain\`).

---

## 2. Regulatory Compliance Matrix
| Regulation | Cloud LLM Risk | Local Brain Mitigation |
|:---|:---|:---|
| **GDPR Article 9 (Special Category Data)** | High risk of unauthorized third-party processing | Data never leaves customer device memory |
| **HIPAA Security Rule** | Requires signed BAA and transit encryption audits | Zero transit across public internet networks |
| **SOC 2 Type II** | Continuous vendor subprocessor risk management | Zero third-party subprocessors involved |

---

## 3. Hardware Acceleration & Latency Realities
Empirical testing validates that modern desktop silicon (Apple Silicon Metal shaders and NVIDIA CUDA cores) delivers sub-15ms chunk vectorization, outperforming cloud roundtrip network hops.

---

## 4. References & Primary Sources
- [[Privacy-Preserving Local AI & LM Studio Spec.pdf]]
- [[Master Services Agreement & Data Protection Addendum.docx]]
- [[Weekly Engineering Sync & LLM Latency Benchmarks.eml]]`,
  },
  {
    id: 'wiki-3',
    title: 'Corporate Financial Strategy & Cloud Spend Optimization',
    slug: 'corporate-financial-strategy-cloud-spend',
    category: 'Finance',
    clusterId: 'cluster-finance-cloud',
    status: 'auto',
    coverageScore: 88,
    lastUpdated: '2026-09-15T18:00:00Z',
    lastGeneratedAt: '2026-09-15T18:00:00Z',
    sourceDocIds: ['doc-2'],
    summary: 'Financial analysis demonstrating an 80% reduction in cloud token liabilities through desktop model offloading.',
    stalenessCount: 0,
    sources: [
      {
        documentId: 'doc-2',
        documentTitle: 'Q3 2026 Financial Performance & Runway Analysis.xlsx',
        relevanceScore: 95,
        matchedSnippet: 'Detailed operating statement, cash runway projections, and per-user token margin analysis.',
      },
    ],
    sections: [
      {
        id: 'sec-3-1',
        heading: '1. Cloud API Margin Compression',
        level: 2,
        content: `During Q1 and Q2 2026, cloud inference bills grew exponentially with user document volume. Commercial RAG providers incurred marginal costs of $0.004 to $0.02 per query, compressing gross margins to 74%.

By transferring embedding computation and summarization to client-side silicon:
- Monthly cloud compute expenses plummeted from **$42,100** to **$8,450**.
- Gross margins expanded to **81.8%**.`,
      },
      {
        id: 'sec-3-2',
        heading: '2. Cash Runway & Growth Trajectory',
        level: 2,
        content: `With $7.85M in liquid reserves and net burn constrained to $295K/month, the organization enjoys **26.6 months of cash runway** extending through late 2028 without requiring dilutive equity financing.`,
      },
      {
        id: 'sec-3-3',
        heading: '3. References & Primary Sources',
        level: 2,
        content: `- [[Q3 2026 Financial Performance & Runway Analysis.xlsx]]`,
      },
    ],
    content: `# Corporate Financial Strategy & Cloud Spend Optimization

> **Executive Overview**: Synthesizes Q3 2026 operating results, balance sheet health, and the economic impact of transitioning from cloud LLM APIs to client-side inference. See technical foundations in [[Vector Databases & Disk-Native Retrieval Architecture]].

---

## 1. Cloud API Margin Compression
During Q1 and Q2 2026, cloud inference bills grew exponentially with user document volume. Commercial RAG providers incurred marginal costs of $0.004 to $0.02 per query, compressing gross margins to 74%.

By transferring embedding computation and summarization to client-side silicon:
- Monthly cloud compute expenses plummeted from **$42,100** to **$8,450**.
- Gross margins expanded to **81.8%**.

---

## 2. Cash Runway & Growth Trajectory
With $7.85M in liquid reserves and net burn constrained to $295K/month, the organization enjoys **26.6 months of cash runway** extending through late 2028 without requiring dilutive equity financing.

---

## 3. References & Primary Sources
- [[Q3 2026 Financial Performance & Runway Analysis.xlsx]]`,
  },
];
