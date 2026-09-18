<div align="center">
  <h1>Local Brain</h1>
  <p><strong>Zero-Egress Desktop Document Intelligence & Embedded Fine-Tuned SLM Workstation.</strong></p>
  <p>
    <a href="#what-is-local-brain">Overview</a> ·
    <a href="#embedded-slm-engine">Embedded Gemma-4 Engine</a> ·
    <a href="#key-capabilities">Key Capabilities</a> ·
    <a href="#technical-architecture">Architecture</a> ·
    <a href="#packaging--distribution">Packaging & Installers</a> ·
    <a href="#getting-started">Getting Started</a> ·
    <a href="https://cambrianminds.github.io/local-brain/">Live Showcase</a>
  </p>
</div>

---

## What is Local Brain?

**Local Brain** is an air-gapped, zero-cloud desktop document intelligence platform designed for researchers, legal scholars, and enterprise teams handling sensitive intellectual property. It combines:

1. **Embedded On-Device SLM Inference**: A fine-tuned **Gemma-4 E2B** model executing locally in C++ via `node-llama-cpp` (v3). Zero Python, zero PyTorch, and zero external daemon servers required.
2. **Dense Vector Search**: Embedded **LanceDB** vector storage providing sub-5ms cosine retrieval across chunked document embeddings.
3. **Relational Document Catalog & Versioning**: **SQLite WAL** mode maintaining immutable revision history snapshots, tags, and category taxonomies.
4. **Autonomous Synthesis & Wikis**: Synthesizes cross-document concepts into structured, multi-section knowledge articles with cited snippet references.

**Official Showcase**: [https://cambrianminds.github.io/local-brain/](https://cambrianminds.github.io/local-brain/)

---

## Embedded SLM Engine

Local Brain includes native support for embedded Small Language Models (SLMs) running directly within the Electron Node.js main process.

```
┌──────────────────────────────────────────────────────────────┐
│                    Local Brain Desktop                       │
├──────────────────────────────┬───────────────────────────────┤
│    React UI (Renderer)       │    Node.js (Main Process)     │
│  - Document Reader & Chat    │  - SQLite (library.db)        │
│  - Settings & Model Select   │  - LanceDB (vector index)     │
│  - Titlebar Quick Switcher   │  - node-llama-cpp (llama.cpp) │
└──────────────┬───────────────┴───────────────┬───────────────┘
               │           IPC Bridge          │
               └───────────────────────────────┘
                               │
               ┌───────────────▼───────────────┐
               │ Native C++ In-Process Engine  │
               │   • node-llama-cpp (v3.21)    │
               │   • Direct mmap memory mapping│
               │   • AVX2 SIMD CPU / CUDA / VK │
               └───────────────┬───────────────┘
                               │
         ┌─────────────────────▼─────────────────────┐
         │ models/llm/gemma-4-e2b-it.Q4_K_M.gguf     │
         │ models/llm/gemma-4-e2b-it.F16-mmproj.gguf │
         └───────────────────────────────────────────┘
```

### Gemma-4 E2B Architecture & Fine-Tuning
The local SLM engine supports fine-tuning with **Unsloth Core** (QLoRA) or direct out-of-the-box GGUF inference across structured enterprise domains:
- **Enterprise Architecture**: Domain knowledge synthesis, API contracts, and distributed system topology analysis.
- **Compliance & Governance**: Automated regulatory verification, internal policy auditing, and institutional guidelines.
- **Technical Knowledge Synthesis**: Dense technical documentation parsing, cross-referencing, and contextual Q&A.

### Engine Telemetry
- **Model Format**: GGUF v3 (`Q4_K_M` 4-bit quantization, 3.42 GB)
- **Tensors**: 601 transformer weight tensors
- **Multimodal Projector**: `clip` / `mmproj` (1411 tensors, 985 MB)
- **Memory Management**: Zero-copy `mmap` memory mapping directly into system RAM.

---

## Packaging & Distribution

Local Brain supports two packaging targets via `electron-builder`:

### 1. Full Setup ("Batteries Included" — ~3.6 GB)
Bundles the fine-tuned Gemma-4 E2B weights and multimodal projector inside `extraResources`. Ideal for air-gapped enterprise environments where no post-installation internet access is allowed.

```bash
npm run build:dist:full
```
*Output*: `dist/installer-full/Local-Brain-Full-Setup-1.0.0.exe`

### 2. Minimal Setup ("Bring Your Own GGUF" — ~85 MB)
A lightweight standalone installer containing the Electron runtime, React UI, LanceDB, and SQLite catalog. Users can drop any `.gguf` model (Gemma, Llama, Qwen) into the `models/llm/` directory.

```bash
npm run build:dist:minimal
```
*Output*: `dist/installer-minimal/Local-Brain-Minimal-Setup-1.0.0.exe`

---

## Key Capabilities

- **Zero Cloud Egress**: Document parsing, chunking, embedding, vector search, and LLM text generation happen 100% on your machine.
- **Semantic & Hybrid Search**: Queries match conceptual intent, not just string keywords, using Xenova/all-MiniLM-L6-v2 embeddings.
- **Document Versioning**: Immutable timeline snapshots let you view diffs and restore previous revisions.
- **Multi-Provider AI Router**: Seamlessly toggle between:
  - **Local SLM**: Embedded Gemma-4 E2B GGUF
  - **Local LM Studio**: Localhost daemon on port 1234
  - **OpenRouter**: Access 100% free models (DeepSeek R1, Llama 3.2)
  - **Google Gemini**: Server-side Gemini 2.5 / 3.8 Flash

---

## Technical Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Lucide Icons, Vanilla CSS Design Tokens (Dark Theme / Glassmorphism) |
| **Desktop Shell** | Electron 30, Context Isolation, Typed Preload IPC Bridge |
| **Relational Metadata** | SQLite (better-sqlite3) with WAL Mode |
| **Vector Database** | LanceDB (embedded vector index, cosine similarity) |
| **Local SLM Engine** | `node-llama-cpp` (v3.21) with `llama.cpp` native bindings |
| **Document Parsing** | `pdf-parse`, raw UTF-8 text/markdown chunking engine |

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or higher ([nodejs.org](https://nodejs.org/))
- **Windows 10/11** (64-bit)

### Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/CambrianMinds/local-brain.git
   cd local-brain
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application in Development**:
   ```bash
   npm run dev
   ```

### Building & Testing

```bash
# Type check TypeScript codebase
npm run lint

# Run all test suites
npm test

# Build production bundles
npm run build:main
npm run build:preload
npm run build:renderer

# Package installers
npm run build:dist:minimal
npm run build:dist:full
```

---

## License

MIT License. Copyright © 2026 CambrianMinds. Built for complete individual and organizational data sovereignty.
