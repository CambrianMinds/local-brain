---
name: fine-tuning
description: "Guidelines for fine-tuning LLMs: data preparation, task selection, quality curation, and evaluation."
category: ai-ml
tags: [fine-tuning, lora, training, dataset, evaluation]
---

# Fine-Tuning & Dataset Curation

## Purpose
Decide whether fine-tuning is warranted, and do it properly. Most fine-tuning projects fail on dataset quality rather than training mechanics.

## Dataset Construction & Quality Rules
1. **Consistency**: 500-1000 clean, consistent examples beat 50,000 noisy ones. Inconsistent labels teach the model to hallucinate or be inconsistent.
2. **Task Clarity**: Clearly delineate tasks (Summarization with citations, Strict JSON Classification, Agentic Tool Routing).
3. **Format Alignment**: Adhere strictly to the target chat template (ChatML: `<|im_start|>system\n...<|im_end|>\n<|im_start|>user\n...<|im_end|>\n<|im_start|>assistant\n...<|im_end|>`).
