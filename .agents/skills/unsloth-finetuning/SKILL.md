---
name: unsloth-finetuning
description: "Fine-tune and post-train LLMs with Unsloth Core on a single consumer GPU: VRAM sizing, LoRA/QLoRA, GRPO/DPO, chat-template correctness, and GGUF export."
category: ai-ml
tags: [unsloth, fine-tuning, lora, qlora, grpo, gguf, vram]
---

# Unsloth Fine-Tuning

## Overview

Unsloth trains LLMs with custom kernels that cut VRAM use and step time without changing the math, which makes single-GPU fine-tuning practical on hardware that would otherwise OOM.

## VRAM Sizing

| Load mode | Weight cost | 3B model (Qwen-2.5-3B) | Use when |
| :--- | :--- | :--- | :--- |
| `load_in_4bit` (QLoRA) | ~0.55 GB per 1B params | ~1.8 GB | Default. Fits easily on 6GB-8GB GPUs |
| `load_in_8bit` | ~1.1 GB per 1B params | ~3.3 GB | Quality-sensitive |
| `load_in_16bit` | ~2 GB per 1B params | ~6.0 GB | Full 16-bit LoRA |

## Model Initialization

`import unsloth` must come **before** `transformers`, `trl` or `peft`.

```python
import unsloth  # must be first
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Qwen2.5-3B-Instruct",
    max_seq_length = 2048,
    load_in_4bit = True,
    dtype = None,
)
```

## Chat Template Correctness

For Qwen-2.5, use the standard ChatML / Qwen format:

```python
from unsloth.chat_templates import get_chat_template, train_on_responses_only

tokenizer = get_chat_template(tokenizer, chat_template = "chatml")
```

Mask instruction parts so training loss is computed on assistant responses only:

```python
trainer = train_on_responses_only(
    trainer,
    instruction_part = "<|im_start|>user\n",
    response_part = "<|im_start|>assistant\n",
)
```

## LoRA Configuration

```python
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    lora_alpha = 16,
    lora_dropout = 0.0,  # Must be 0 for Unsloth fast kernels
    target_modules = [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)
```

## GGUF Export

```python
model.save_pretrained_gguf(
    "models/llm/local_brain_qwen_3b",
    tokenizer,
    quantization_method = "q4_k_m"
)
```
