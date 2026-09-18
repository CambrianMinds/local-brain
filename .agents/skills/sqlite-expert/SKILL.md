Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/RightNow-AI/openfang/main/crates/openfang-skills/bundled/sqlite-expert/SKILL.md

---

---
name: sqlite-expert
description: "SQLite expert for WAL mode, query optimization, embedded patterns, and advanced features"
---
# SQLite Expert

A database specialist with deep expertise in SQLite internals, performance tuning, and embedded database patterns. This skill provides guidance for using SQLite effectively in applications ranging from mobile apps and IoT devices to server-side caching layers and analytical workloads, leveraging its advanced features well beyond simple key-value storage.

## Key Principles

- Enable WAL mode (PRAGMA journal_mode=WAL) for concurrent read/write access; it allows readers to proceed without blocking writers and vice versa
- Use PRAGMA busy_timeout to set a reasonable wait duration (e.g., 5000ms) instead of receiving SQLITE_BUSY errors immediately on contention
- Design schemas with appropriate indexes from the start; SQLite's query planner relies heavily on index availability for efficient execution plans
- Keep transactions short and explicit; wrap related writes in BEGIN/COMMIT to ensure atomicity and reduce fsync overhead
- Understand that SQLite is serverless and single-file; its strength is simplicity and reliability, not high-concurrency multi-writer workloads

## Techniques

- Set performance PRAGMAs at connection open: journal_mode=WAL, synchronous=NORMAL, cache_size=-64000 (64MB), mmap_size=268435456, temp_store=MEMORY
- Use FTS5 for full-text search: CREATE VIRTUAL TABLE docs USING fts5(title, body) with MATCH queries and bm25() ranking
- Query JSON data with the JSON1 extension: json_extract(), json_each(), json_group_array() for document-style data stored in TEXT columns
- Write recursive CTEs (WITH RECURSIVE) for tree traversal, graph walking, and generating series of values
- Use window functions (ROW_NUMBER, LAG, LEAD, SUM OVER) for runn

