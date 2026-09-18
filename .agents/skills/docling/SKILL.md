Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/docling-project/docling/main/docling/.agents/skills/docling/SKILL.md

---

---
name: docling
description: >
  Use Docling to understand the content of documents in any supported format —
  PDF (born-digital or scanned), DOCX, PPTX, XLSX, HTML, Markdown, AsciiDoc,
  CSV, images, audio, and XML — by converting them into a unified
  DoclingDocument (Markdown or structured JSON). Use this skill whenever you
  need to read, parse, convert, extract, or chunk a document you cannot read
  directly: "what's in this PDF", "convert this to markdown", "extract the
  tables", "chunk this for RAG", "read this scanned document", "parse this
  DOCX/PPTX". Covers the `docling` CLI, the Python SDK (DocumentConverter +
  PipelineOptions), the remote Service Client (self-hosted or managed
  docling-serve), and the docling-slim install extras for a minimal dependency
  footprint.
license: MIT
compatibility: Requires Python 3.10+
metadata:
  author: docling-project
  version: "1.0"
  upstream: https://github.com/docling-project/docling
allowed-tools: Bash(docling:*) Bash(docling-tools:*) Bash(python3:*) Bash(python:*) Bash(uvx:*) Bash(uv:*) Bash(pip:*)
---

# Docling

Docling converts documents — PDF, DOCX, PPTX, XLSX, HTML, Markdown, AsciiDoc,
CSV, images, audio, and XML — into a single unified representation, the
**`DoclingDocument`**, which you can export as **Markdown** (human-readable) or
**JSON** (structured, lossless). Reach for Docling whenever you need to
understand the content of a file you cannot read directly, especially PDFs
(including scanned ones, via OCR or a vision-language model).

## The fastest thing that works: the CLI

If you just need to read a document's content, run the CLI. It is installed with
the `docling` package and accepts a local path **or** a URL:

```bash
docling report.pdf --to md --output /tmp/        # → /tmp/report.md
docling https://example.com/paper.pdf --to json --output /tmp/
```

Output files are named after the input (`report.pdf` → `report.md`). Default
output directory is the current directory. This handles the majority of
"what's in this file" req

