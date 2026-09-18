#!/usr/bin/env python3
"""
Local Brain — Small Language Model (SLM) Fine-Tuning with Unsloth
Model: unsloth/Qwen2.5-3B-Instruct (4-bit QLoRA)
Target: Task-specialized local assistant for Summarization (RAG), Document Classification, and Agentic Routing
Export: GGUF q4_k_m for zero-cloud desktop inference via node-llama-cpp
"""

import os
import sys
import argparse
from pathlib import Path

# IMPORTANT: unsloth MUST be imported before transformers, trl, or peft
try:
    import unsloth
    from unsloth import FastLanguageModel, is_bfloat16_supported
    from unsloth.chat_templates import get_chat_template, train_on_responses_only
except ImportError:
    print("\n[!] Error: Unsloth is not installed in the current Python environment.")
    print("    To run this training script on a GPU instance (e.g. Google Colab, RunPod, Lambda Labs):")
    print("    pip install \"unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git\"")
    print("    pip install --no-deps \"xformers\" \"trl<0.9.0\" peft accelerate bitsandbytes\n")
    sys.exit(1)

from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments


def parse_args():
    parser.add_argument("--dataset", type=str, default="data/train.jsonl", help="Path to JSONL training dataset")
    parser.add_argument("--eval_dataset", type=str, default="data/eval.jsonl", help="Path to JSONL evaluation dataset")
    parser.add_argument("--model_name", type=str, default="unsloth/Qwen2.5-3B-Instruct", help="Base model identifier")
    parser.add_argument("--max_seq_length", type=int, default=2048, help="Maximum sequence length")
    parser.add_argument("--output_dir", type=str, default="models/llm/checkpoints", help="Output directory for checkpoints")
    parser.add_argument("--gguf_output", type=str, default="models/llm/local_brain_qwen_3b", help="Target path for GGUF export")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Per-device training batch size")
    parser.add_argument("--gradient_accumulation", type=int, default=4, help="Gradient accumulation steps")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Learning rate")
    return parser.parse_args()


def main():
    args = parse_args()
    print("=======================================================")
    print("   LOCAL BRAIN — SLM FINETUNING (UNSLOTH + QWEN-2.5-3B)")
    print("=======================================================")
    print(f"Base Model:             {args.model_name}")
    print(f"Max Sequence Length:    {args.max_seq_length}")
    print(f"Dataset Path:           {args.dataset}")
    print(f"GGUF Export Target:     {args.gguf_output}")
    print("-------------------------------------------------------")

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"[!] Dataset not found at: {dataset_path}")
        print("    Generate it first using: npm run data:generate")
        sys.exit(1)

    # 1. Load Model and Tokenizer in 4-bit quantization
    print("\n[1/5] Loading base model and tokenizer in 4-bit...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model_name,
        max_seq_length=args.max_seq_length,
        dtype=None,  # Auto-detects bf16 on Ampere/Ada/Hopper, fp16 on older GPUs
        load_in_4bit=True,
    )

    # 2. Add LoRA Adapters (Targeting all projection layers)
    print("\n[2/5] Initializing LoRA adapters (r=16, alpha=16)...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=16,
        lora_dropout=0.0,  # Optimized for Unsloth fast kernels
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
        use_rslora=False,
        loftq_config=None,
    )

    # 3. Apply ChatML Template & Format Dataset
    print("\n[3/5] Applying Qwen ChatML template and masking user prompts...")
    tokenizer = get_chat_template(tokenizer, chat_template="chatml")

    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return {"text": texts}

    raw_dataset = load_dataset("json", data_files=str(dataset_path), split="train")
    formatted_dataset = raw_dataset.map(formatting_prompts_func, batched=True)
    print(f"Loaded {len(formatted_dataset)} formatted training instances.")

    formatted_eval_dataset = None
    eval_path = Path(args.eval_dataset)
    if eval_path.exists():
        raw_eval = load_dataset("json", data_files=str(eval_path), split="train")
        formatted_eval_dataset = raw_eval.map(formatting_prompts_func, batched=True)
        print(f"Loaded {len(formatted_eval_dataset)} formatted evaluation instances.")

    # 4. Initialize SFTTrainer
    print("\n[4/5] Configuring SFTTrainer...")
    training_args = TrainingArguments(
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation,
        warmup_steps=10,
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=5,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir=args.output_dir,
        report_to="none",
        eval_strategy="steps" if formatted_eval_dataset else "no",
        eval_steps=20 if formatted_eval_dataset else None,
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=formatted_dataset,
        eval_dataset=formatted_eval_dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        dataset_num_proc=2,
        packing=False,  # Set to True for short sequences to speed up training
        args=training_args,
    )

    # Mask user prompt so loss is only calculated on assistant turns
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|im_start|>user\n",
        response_part="<|im_start|>assistant\n",
    )

    print("\nStarting LoRA fine-tuning...")
    trainer_stats = trainer.train()
    print(f"Training complete! Loss: {trainer_stats.training_loss:.4f}")

    # 5. Export to GGUF format (Q4_K_M)
    print("\n[5/5] Exporting fine-tuned model to 4-bit GGUF format for node-llama-cpp...")
    os.makedirs(os.path.dirname(args.gguf_output), exist_ok=True)
    model.save_pretrained_gguf(
        args.gguf_output,
        tokenizer,
        quantization_method="q4_k_m",
    )

    # Optional HF Hub push if token available
    hf_token = os.environ.get("HF_TOKEN")
    if hf_token:
        print("\n[Optional] HF_TOKEN detected. You can push the model to your HuggingFace repo using:")
        print("model.push_to_hub_gguf('your-username/local-brain-qwen-3b', tokenizer, quantization_method='q4_k_m', token=hf_token)")

    print("\n=======================================================")
    print(f"✔ SUCCESS: Model fine-tuned and exported to GGUF:")
    print(f"  {args.gguf_output}-unsloth.Q4_K_M.gguf")
    print("=======================================================")


if __name__ == "__main__":
    main()
