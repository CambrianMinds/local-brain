Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/K-Dense-AI/scientific-agent-skills/main/skills/liteparse/SKILL.md

---

---
name: liteparse
description: Local document and PDF parsing that returns spatial text with bounding boxes. Use for extracting text from PDFs, DOCX, Office files, and images; running OCR on scans; producing layout-preserved JSON for RAG; batch-ingesting folders of papers; or rendering pages to PNG for multimodal agents. Distinguishing capabilities are per-token bounding boxes, page raster output, and fully local processing with no cloud API.
license: Apache-2.0
allowed-tools: Read Write Edit Bash
compatibility: Python 3.10+. Optional LibreOffice (Office formats) and ImageMagick (images). Bundled Tesseract for OCR. All processing is local — no cloud API required.
metadata:
  version: "1.2"
  skill-author: K-Dense Inc.
---

# LiteParse — Local Document Parsing

## Overview

LiteParse is a fast, open-source document parser (Rust core, Python/Node bindings) focused on **local, layout-aware text extraction** with bounding boxes. It does not produce Markdown and does not call cloud LLMs. Outputs are **plain text** (layout-preserved) or **structured JSON** with per-page `text_items` (position, font metadata, optional confidence).

**Version note:** Examples target **liteparse 2.0.0** (PyPI, May 2026). The upstream V1 branch is legacy; this skill documents **V2 / main** only.

For parser selection vs MarkItDown, the `pdf` skill, or LlamaParse, see `references/choosing_a_parser.md`.

## When to Use This Skill

Use LiteParse when you need:

- **Fast local parsing** of PDFs or converted Office/image files without cloud dependencies
- **Spatial text** with bounding boxes for layout-aware RAG, citation grounding, or figure/table region logic
- **OCR** on scanned PDFs or images (bundled Tesseract, or a user-run HTTP OCR server)
- **Page screenshots** (PNG) for multimodal agents that must see charts, figures, or handwriting
- **Batch ingestion** of literature folders, supplementary PDFs, or protocol libraries
- **Page subsets** or **password-protected** PDFs

## When Not to Use

| Task | Use instead |
|------|-------------|
| Markdown for LLM ingestion (EPUB, audio, YouTube, HTML) | `markitdown` skill |
| Merge/split PDFs, forms, watermarks, rotation | `pdf` skill |
| Dense tables, handwriting, production cloud pipelines | [LlamaParse](https://docs.cloud.llamaindex.ai/llamaparse/overview) (cloud; sign up separately) |

## Installation

```bash
uv pip install "liteparse==2.0.0"
```

This installs the Python bindings and the **`lit`** CLI. Verify:

```bash
lit --help
python -c "import liteparse; print(liteparse.__version__)"
```

**Optional system tools** (for non-PDF inputs):

- **LibreOffice** — Word, Excel, PowerPoint, OpenDocument, CSV/TSV
- **ImageMagick** — PNG, JPEG, TIFF, WebP, SVG, etc.

Install commands are in `references/ocr_and_formats.md`.

**Node.js / TypeScript** (optional): `npm i @llamaindex/liteparse` — see `references/api_reference.md`.

---

## Quick Start

### Python

```python
from liteparse import LiteParse

parser = LiteParse(quiet=True)
result = parser.parse("paper.pdf")
print(result.text)

for page in result.pages:
    print(f"Page {page.page_num}: {len(page.text_items)} items")
```

### CLI

```bash
# Layout-preserved text (default)
lit parse paper.pdf

# Structured JSON with bounding boxes
lit parse paper.pdf --format json -o paper.json

# Disable OCR on text-native PDFs (faster)
lit parse paper.pdf --no-ocr
```

---

## Core Workflows

### 1. Parse to layout-preserved text

Best for quick full-document text or feeding chunkers that do not need coordinates.

```python
parser = LiteParse(ocr_enabled=True, quiet=True)
result = parser.parse("document.pdf")
full_text = result.text
```

```bash
lit parse document.pdf -o output.txt
```

### 2. Parse to structured JSON (bounding boxes)

Use when building layout-aware RAG, highlighting source regions, or joining text with screenshots.

```python
import json
from liteparse import LiteParse

parser = LiteParse(output_format="json", quiet=True)
result = parser.parse("document.pdf")

# Programmatic access
for page in result.pages:
    for item in page.text_items:
        bbox = (item.x, item.y, item.width, item.height)
        # item.text, item.confidence, item.font_name, item.font_size
```

```bash
lit parse document.pdf --format json -o document.json
```

JSON field layout: `references/output_formats.md`.

### 3. Parse specific pages

```python
parser = LiteParse(target_pag

