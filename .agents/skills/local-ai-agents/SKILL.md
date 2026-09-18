Title: Live Content

Description: Fetched live

Source: https://raw.githubusercontent.com/microsoft/ai-agents-for-beginners/main/.agents/skills/local-ai-agents/SKILL.md

---

---
name: local-ai-agents
description: >-
  Build local-first AI agents that run entirely on a developer workstation with
  Microsoft Foundry Local and Qwen function-calling models. Covers Small Language
  Models (SLMs), the OpenAI-compatible local endpoint, sandboxed local tools,
  local RAG with Chroma, local MCP servers, hybrid cloud/local routing, and the
  privacy/cost/offline trade-offs. Based on Lesson 17 of AI Agents for Beginners.
  USE FOR: run an agent locally, offline agent, on-device agent, Foundry Local,
  Qwen function calling, local tool calling, local RAG, Chroma vector database,
  local MCP server, privacy-preserving agent, hybrid local and cloud agent,
  small language model agent, engineering assistant on my machine.
  DO NOT USE FOR: deploying agents to the cloud at scale (use deploying-scalable-agents /
  Lesson 16), building your first agent concept (Lesson 01), Foundry (cloud) hosted
  agents, GPU cluster / server-side inference provisioning.
license: MIT
---

# Creating Local AI Agents with Foundry Local and Qwen

> Companion skill for [Lesson 17 – Creating Local AI Agents](../../../17-creating-local-ai-agents/README.md).
> Use it to help a learner build an agent that reasons, calls tools, and searches
> documentation entirely on their own machine — no cloud inference. Ground every
> recommendation in the lesson content and the runnable notebook.

## Triggers

Activate this skill when a learner wants to:
- Run an agent **fully on-device** for privacy, cost, or offline reasons.
- Serve a model locally with **Foundry Local** and connect via the OpenAI-compatible endpoint.
- Use a **Qwen function-calling** model to drive reliable local tool calls.
- Add **local RAG** (Chroma) or a **local MCP server**.
- Design a **hybrid** local/cloud routing strategy.

## Core mental model

An SLM trades breadth for privacy, cost, and offline operation. The winning
strategy: **let the SLM orchestrate and let tools do the heavy lifting.** The
model does not need to *know* the codebase — it needs to know when to call
`read_file` and `search_docs`. That plays to an SLM's strength (bounded decisions
like tool selection) and away from its weakness (broad knowledge, long multi-hop
reasoning).

## Why these specific pieces

- **Foundry Local** exposes an **OpenAI-compatible HTTP endpoint**, so cloud agent code tr

