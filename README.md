<div align="center">
  <h1>Local Brain</h1>
  <p><strong>Zero-Egress Desktop Document Intelligence & Embedded Fine-Tuned SLM Workstation.</strong></p>
  <p>
    <a href="#what-is-local-brain">Overview</a> ·
    <a href="#hybrid-cpu--gpu-acceleration">CPU & GPU Acceleration</a> ·
    <a href="#embedded-slm-engine">Embedded SLM Engine</a> ·
    <a href="#ai-providers--model-persistence">AI Providers</a> ·
    <a href="#library-management--nuke-seed-data">Library & Nuke Data</a> ·
    <a href="#living-personal-wiki">Personal Wiki</a> ·
    <a href="#automated-test-suite">Test Suite</a> ·
    <a href="#installers--quick-start">Quick Install</a> ·
    <a href="https://cambrianminds.github.io/local-brain/">Live Showcase</a>
  </p>
</div>

---

## What is Local Brain?

**Local Brain** is an air-gapped, zero-cloud desktop document intelligence platform designed for researchers, legal professionals, and enterprise engineering teams handling sensitive data. It enables you to search, query, summarize, and cross-synthesize large collections of documents with complete data sovereignty.

### Core Pillars
1. **Embedded On-Device SLM Inference**: Runs quantized **Gemma-4 E2B** directly within the Electron Node.js main process via C++ bindings (`node-llama-cpp` v3). Zero Python runtime, zero PyTorch, and zero external daemon servers required.
2. **Dense Vector Search**: Embedded **LanceDB** vector store with 384-dimensional `all-MiniLM-L6-v2` embeddings for sub-5ms semantic retrieval.
3. **Relational Document Catalog & Versioning**: **SQLite WAL** mode maintaining immutable revision history snapshots, tags, and category taxonomies.
4. **Living Personal Wiki & Knowledge Vault**: Automatically clusters related documents, resolves cross-document concepts, flags contradictions, and exports directly to Obsidian.
5. **Universal AI Interoperability**: Seamlessly toggles between Local SLM, local LM Studio, OpenRouter free models, and Google Gemini with persistent global state.

**Official Documentation & Web Showcase**: [https://cambrianminds.github.io/local-brain/](https://cambrianminds.github.io/local-brain/)

---

## Hybrid CPU & GPU Acceleration

A common question is: **"Can we use both CPU and GPU together like LM Studio?"**

**Yes! Local Brain supports hybrid CPU + GPU offloading in two distinct ways:**

```
┌────────────────────────────────────────────────────────────────────────┐
│               Hybrid Hardware Acceleration Architecture                │
├───────────────────────────────────┬────────────────────────────────────┤
│         Option A: Embedded Engine │     Option B: LM Studio Relay      │
│  (Zero dependencies, out-of-box)  │   (Connects to localhost:1234)     │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Vulkan Compute Backend          │ • Auto-detects running models      │
│ • Hybrid Layer Offload (12 GPU,   │ • Zero configuration required      │
│   remainder on CPU AVX2 SIMD)     │ • Preserves user's custom offload  │
│ • Intelligent VRAM Safety Probe   │   sliders in LM Studio             │
│ • Hardware-aware fallback:        │ • Full access to multi-GPU setups  │
│   Uses 40GB+ system RAM if VRAM   │ • Toggles in Titlebar or Settings  │
│   is fully saturated              │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 1. Embedded Hybrid Offload (Native Vulkan & CPU SIMD)
In `node-llama-cpp`, traditional CUDA backends often trigger driver aborts on consumer cards (such as 4GB GTX 1050 Ti Pascal architecture) when allocating KV context cache into saturated VRAM.
Local Brain solves this with **intelligent hardware routing**:
- **Vulkan Compute Engine**: Offloads transformer layers (e.g. 12 layers) directly to GPU VRAM while streaming remaining layers through CPU AVX2 SIMD.
- **Hardware-Aware Safety Probe**: Probes free GPU VRAM against model weights and context requirements. If VRAM is constrained, it routes smoothly to CPU AVX2 SIMD, utilizing your high-capacity system RAM (16GB–64GB) with zero crashes.

### 2. Native LM Studio Integration
If you already use LM Studio on your workstation:
1. Start your local server in LM Studio on port `1234`.
2. In Local Brain, select **Local LM Studio** from the Titlebar Quick Switcher or Settings cards.
3. Local Brain automatically detects all loaded models, streaming responses through LM Studio's customized GPU/CPU offload configuration.

---

## Embedded SLM Engine

Local Brain includes native support for fine-tuned Small Language Models (SLMs) running directly inside the desktop application:

```
┌──────────────────────────────────────────────────────────────┐
│                    Local Brain Desktop                       │
├──────────────────────────────┬───────────────────────────────┤
│    React UI (Renderer)       │    Node.js (Main Process)     │
│  - Document Reader & Chat    │  - SQLite WAL (library.db)    │
│  - Multi-Level AI Summaries  │  - LanceDB (vectors.lance)    │
│  - Titlebar Quick Switcher   │  - node-llama-cpp (llama.cpp) │
│  - Living Wiki & Obsidian    │  - Intelligent Hardware Probe │
└──────────────┬───────────────┴───────────────┬───────────────┘
               │           IPC Bridge          │
               └───────────────────────────────┘
                               │
               ┌───────────────▼───────────────┐
               │ Native C++ In-Process Engine  │
               │   • node-llama-cpp (v3.21)    │
               │   • Direct mmap memory mapping│
               │   • Vulkan GPU / CPU AVX2 SIMD│
               └───────────────┬───────────────┘
                               │
         ┌─────────────────────▼─────────────────────┐
         │ models/llm/gemma-4-e2b-it.Q4_K_M.gguf     │
         │ models/embeddings/all-MiniLM-L6-v2/       │
         └───────────────────────────────────────────┘
```

### Gemma-4 E2B Specifications
- **Model Format**: GGUF v3 (`Q4_K_M` 4-bit quantization, 3.42 GB)
- **Tensors**: 601 transformer weight tensors
- **Multimodal Projector**: Compatible with `gemma-4-e2b-it.F16-mmproj.gguf`
- **Context Size**: 1,024–2,048 tokens with dynamic sliding-window KV management
- **Generation Guard**: 45-second execution timeout guard preventing frozen processes

---

## AI Providers & Model Persistence

Local Brain features a unified AI provider layer with instant global state synchronization:

| Provider | Backend | Egress | Best For |
| :--- | :--- | :--- | :--- |
| **Local SLM** | Embedded Gemma-4 E2B GGUF | 0% (Air-Gapped) | Confidential document analysis, air-gapped environments |
| **LM Studio** | Localhost daemon (`:1234`) | 0% (Air-Gapped) | Heavy GPU rigs, custom quantization profiles |
| **OpenRouter** | Cloud Gateway (Free models) | External API | Free DeepSeek R1, Llama 3.2, Gemini Exp without API key cost |
| **Google Gemini**| Managed API Key | External API | Ultra-high context (1M+ tokens), rapid enterprise indexing |

### Reactive Persistence
- Clicking any provider card in Settings **instantly saves and persists** across the application.
- The **Desktop Titlebar Quick Switcher** updates active provider and model status in real time.
- The **Document Reader** features dedicated engine switchers on both the **Summary** tab and **Ask AI** tab, ensuring summaries are regenerated with your exact chosen engine.

---

## Library Management & Nuke Seed Data

Local Brain includes full life-cycle document catalog management:

- **Supported Formats**: Markdown (`.md`), PDF (`.pdf`), Word (`.docx`), Code (`.ts`, `.py`, `.go`), Spreadsheets (`.csv`, `.xlsx`), Email (`.eml`), and Text (`.txt`).
- **Multi-Level AI Summarization**:
  1. **1-Sentence Executive Takeaway**: High-level punchy overview.
  2. **Detailed Synthesis**: In-depth analytical methodology and findings.
  3. **Key Bullet Points**: 4–6 actionable takeaways.
- **Nuke Example Data**: A dedicated button in the Library toolbar and Settings Danger Zone allows users to completely wipe all sample documents and wiki articles with a single confirmation, providing a 100% clean, empty vault ready for private documents.
- **Restore Seed Documents**: Easily restore sample documents at any time from Settings or the empty library state.

---

## Living Personal Wiki

Local Brain turns isolated documents into an evolving knowledge encyclopedia:

- **Automated Article Synthesis**: Generates comprehensive structured articles with executive summaries, technical foundations, and cited sources.
- **Cross-Document Linking**: Automatically maps `[[wiki links]]` between related topics.
- **Discrepancy & Contradiction Detection**: Analyzes multiple documents covering the same topic and flags conflicting numbers, dates, or architectural claims.
- **Knowledge Gap Analysis**: Identifies missing references and suggests topics for deeper research.
- **Obsidian Vault Export**: Generates a complete `.zip` package with YAML frontmatter, backlinks, and `Index.md` for instant opening in Obsidian.

---

## Automated Test Suite

Local Brain includes a comprehensive automated test suite consisting of **7 suites** and **39 unit, integration, and E2E tests**:

```bash
npm test
```

```
=======================================================
   LOCAL BRAIN DESKTOP — COMPREHENSIVE TEST SUITE
=======================================================

[1/7] Running Backend API E2E Tests...
  ✔ OpenRouter free models catalog returns list
  ✔ Offline Engine deterministic response yields valid synthesized text
  ✔ executeLLM falls back to deterministic provider successfully

[2/7] Running Local Intelligence Engine & Hybrid Search Tests...
  ✔ generateLocalVector produces normalized vector with exact dimension
  ✔ generateLocalVector handles empty and whitespace strings gracefully
  ✔ cosineSimilarity calculates exact 1.0 for identical vectors
  ✔ cosineSimilarity ranks semantically related text higher than unrelated text
  ✔ chunkText splits long documents with overlap preservation
  ✔ hybridSearch finds and ranks relevant documents by query
  ✔ hybridSearch respects keyword vs semantic weighting adjustment

[3/7] Running Document Versioning & State Integrity Tests...
  ✔ updateDocumentWithVersion creates baseline v1 and incremented v2 revision
  ✔ updateDocumentWithVersion preserves author attribution and calculated metrics
  ✔ restoreDocumentVersion rolls back content to previous version without destroying history
  ✔ Safe JSON persistence prevents quota crashing

[4/7] Running UI/UX Formats & Workflow Verification Tests...
  ✔ formatFileSize formats byte quantities appropriately
  ✔ DEFAULT_SETTINGS configures local privacy-first defaults
  ✔ INITIAL_DOCUMENTS includes rich multi-format seed dataset
  ✔ Desktop shortcuts bindings adhere to specifications
  ✔ Navigation views map to accessible application tabs

[5/7] Running Living Personal Wiki & Knowledge Vault Tests...
  ✔ Document clustering groups items by category and semantic tags
  ✔ parseMarkdownSections parses ## and ### headings into structured sections
  ✔ detectContradictions flags known discrepancies between source texts
  ✔ detectKnowledgeGaps identifies missing areas and research recommendations
  ✔ regenerateWikiSection updates only targeted section content
  ✔ exportWikiToObsidian formats valid Obsidian YAML frontmatter and [[wiki links]]
  ✔ exportObsidianVaultZip packages complete vault with Index.md and article notes
  ✔ synthesizeWikiArticle generates a complete Living Wiki article with citations and links

[6/7] Running Offline SLM Engine & Transformers Embedder Tests...
  ✔ LocalTransformersEmbedder initializes with 384 dimensions
  ✔ LocalTransformersEmbedder batch embed returns matching row count
  ✔ createLanceDBSchemaWithEmbedder binds 384-dim vector column
  ✔ LocalSLMEngine singleton pattern and lifecycle disposal
  ✔ formatChatML correctly constructs ChatML delimiters
  ✔ getAllProvidersStatus exposes Local SLM while preserving existing providers
  ✔ routeLLM falls back gracefully with offline flag set to true
  ✔ Deterministic offline response handles JSON classification format

[7/7] Running Production Readiness & Crash Prevention Tests...
  ✔ Local SLM activates VRAM safe mode when GPU free memory is below model threshold
  ✔ Document summary regeneration with local-slm returns complete structured 3-tier summary
  ✔ Model selection persists state across UI provider transitions
  ✔ Library nuke completely purges documents and sets clean vault state

=======================================================
   TEST EXECUTION SUMMARY: 39 / 39 PASSED CLEANLY
=======================================================
```

---

## Installers & Quick Start

Open Windows PowerShell and run one of the automated one-line installation commands:

### 🪶 Minimal Edition (~85 MB — Bring Your Own GGUF)
Installs the complete desktop workstation, embeddings engine, LanceDB, and SQLite catalog. Drop any `.gguf` model into `models/llm/`:
```powershell
irm https://cambrianminds.github.io/local-brain/install-minimal.ps1 | iex
```

### ⚡ Full Edition (~3.6 GB — Bundled Gemma-4 E2B Weights)
Full standalone installer with fine-tuned Gemma-4 E2B weights bundled:
```powershell
irm https://cambrianminds.github.io/local-brain/install-full.ps1 | iex
```

### 🎯 Interactive Installer Selector
Presents an interactive menu to choose between editions:
```powershell
irm https://cambrianminds.github.io/local-brain/install.ps1 | iex
```

---

## Developer Guide & Building

### Prerequisites
- **Node.js**: v20 or higher ([nodejs.org](https://nodejs.org/))
- **Windows 10/11** (64-bit)

### Setup & Development
```bash
# Clone the repository
git clone https://github.com/CambrianMinds/local-brain.git
cd local-brain

# Install dependencies
npm install

# Start Electron in development mode
npm run dev
```

### Building Production Packages
```bash
# Type check TypeScript codebase (0 errors)
npm run lint

# Run all 39 automated tests
npm test

# Build production bundles
npm run build:main
npm run build:preload
npm run build:renderer

# Build standalone minimal installer (NSIS)
npm run build:dist:minimal
```

---

## License

MIT License. Copyright © 2026 CambrianMinds. Built for complete individual and organizational data sovereignty.
