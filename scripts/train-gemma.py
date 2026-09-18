"""
Local Brain — Gemma E2B Fine-Tuning Script (Unsloth on Google Colab / Cloud GPU)

Hardware Target: Google Colab Free T4 GPU (16GB VRAM)
Base Model:      unsloth/gemma-4-E2B-it (or unsloth/gemma-2-2b-it)
Dataset:         JSONL formatted ChatML training dataset
Output:          GGUF Quantized (Q4_K_M) ready for offline inference on GTX 1050 Ti (4GB)
"""

import os
import json
import torch

# 1. Unsloth Import (Must precede transformers / trl / peft)
import unsloth
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only
from datasets import Dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Configuration
MAX_SEQ_LENGTH = 2048
DTYPE = None  # None for auto-detection (Float16 on T4)
LOAD_IN_4BIT = True
HF_TOKEN = os.environ.get("HF_TOKEN")

# Try Gemma 4 E2B first, fallback to Gemma 2 2B
MODEL_CANDIDATES = [
    "unsloth/gemma-4-E2B-it",
    "unsloth/gemma-2-2b-it",
]

model = None
tokenizer = None
chosen_model_name = None

print("=" * 60)
print("   LOCAL BRAIN — GEMMA SLM FINE-TUNING PIPELINE")
print("=" * 60)

for m_name in MODEL_CANDIDATES:
    try:
        print(f"[*] Attempting to load base model: {m_name}...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=m_name,
            max_seq_length=MAX_SEQ_LENGTH,
            dtype=DTYPE,
            load_in_4bit=LOAD_IN_4BIT,
            token=HF_TOKEN,
        )
        chosen_model_name = m_name
        print(f"[✔] Successfully loaded {chosen_model_name}!")
        break
    except Exception as e:
        print(f"[!] Warning: Could not load {m_name}: {e}")

if model is None or tokenizer is None:
    raise RuntimeError("Failed to load any Gemma model candidate. Check Hugging Face token or model availability.")

# 2. Configure Gemma Chat Template
print("[*] Setting up Gemma chat template...")
tokenizer = get_chat_template(tokenizer, chat_template="gemma")

# 3. Add LoRA Adapters
print("[*] Applying LoRA PEFT adapters...")
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
    lora_alpha=16,
    lora_dropout=0.0,  # Optimized for Unsloth fast kernels
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)

# 4. Load Training and Evaluation Datasets
def load_jsonl_dataset(file_path):
    print(f"[*] Loading dataset from {file_path}...")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    print(f"[✔] Loaded {len(records)} records from {file_path}")
    return records

def format_records_for_gemma(records, tokenizer):
    formatted = []
    for r in records:
        messages = r["messages"]
        # In Gemma template, system instructions are prepended to the first user message
        reformatted_messages = []
        system_content = ""
        for m in messages:
            if m["role"] == "system":
                system_content += m["content"] + "\n\n"
            elif m["role"] == "user":
                user_text = (system_content + m["content"]).strip()
                reformatted_messages.append({"role": "user", "content": user_text})
                system_content = ""
            elif m["role"] == "assistant":
                reformatted_messages.append({"role": "model", "content": m["content"]})
        
        text = tokenizer.apply_chat_template(reformatted_messages, tokenize=False, add_generation_prompt=False)
        formatted.append({"text": text})
    return Dataset.from_list(formatted)

train_path = os.environ.get("TRAIN_DATASET", "data/train.jsonl")
eval_path = os.environ.get("EVAL_DATASET", "data/eval.jsonl")

train_records = load_jsonl_dataset(train_path)
eval_records = load_jsonl_dataset(eval_path)

train_dataset = format_records_for_gemma(train_records, tokenizer)
eval_dataset = format_records_for_gemma(eval_records, tokenizer)

# 5. Initialize SFTTrainer with Response-Only Masking
print("[*] Initializing SFTTrainer with response-only loss masking...")
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        num_train_epochs=2,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="outputs",
        report_to="none",
        eval_strategy="steps",
        eval_steps=25,
        save_strategy="no",
    ),
)

# Mask instruction so training loss is calculated strictly on assistant answers
trainer = train_on_responses_only(
    trainer,
    instruction_part="<start_of_turn>user\n",
    response_part="<start_of_turn>model\n",
)

# 6. Execute Fine-Tuning
print("\n" + "=" * 60)
print("   STARTING SFT TRAINING (ESTIMATED ~10-15 MIN ON COLAB T4)")
print("=" * 60)
trainer_stats = trainer.train()
print("[✔] SFT Training complete!")

# 7. Export Directly to GGUF (q4_k_m) for GTX 1050 Ti Offline Inference
OUTPUT_DIR = "models/llm/local_brain_gemma_e2b"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("\n[*] Exporting fine-tuned weights to GGUF (Q4_K_M)...")
model.save_pretrained_gguf(
    OUTPUT_DIR,
    tokenizer,
    quantization_method="q4_k_m",
)

print("\n" + "=" * 60)
print(f"✔ GGUF EXPORT SUCCESSFUL!")
print(f"  Target directory: {OUTPUT_DIR}")
print(f"  File: local_brain_gemma_e2b-unsloth.Q4_K_M.gguf")
print("  Ready to drop into local-brain on your GTX 1050 Ti (4GB)!")
print("=" * 60)
