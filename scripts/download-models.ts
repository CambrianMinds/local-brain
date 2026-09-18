import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_REPO = 'Xenova/all-MiniLM-L6-v2';
const TARGET_DIR = path.resolve(__dirname, '..', 'models', 'embeddings', 'Xenova', 'all-MiniLM-L6-v2');

const REQUIRED_FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'special_tokens_map.json',
  'onnx/model_quantized.onnx',
];

async function downloadFile(repo: string, fileRelPath: string, destPath: string, token?: string): Promise<void> {
  const url = `https://huggingface.co/${repo}/resolve/main/${fileRelPath}`;
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`[download-models] Fetching ${fileRelPath} from ${repo}...`);

  const headers: Record<string, string> = {
    'User-Agent': 'LocalBrain-ModelDownloader/1.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  console.log(`[download-models] Saved ${fileRelPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

export async function downloadEmbeddingModels(): Promise<void> {
  console.log('=======================================================');
  console.log('   LOCAL BRAIN — OFFLINE EMBEDDING MODEL CHECK');
  console.log('=======================================================');
  console.log(`Target Directory: ${TARGET_DIR}`);

  const token = process.env.HF_TOKEN;
  if (token) {
    console.log('[download-models] HuggingFace token detected.');
  }

  let allExist = true;
  for (const file of REQUIRED_FILES) {
    const dest = path.join(TARGET_DIR, file);
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      allExist = false;
      break;
    }
  }

  const quantPath = path.join(TARGET_DIR, 'onnx', 'model_quantized.onnx');
  const modelPath = path.join(TARGET_DIR, 'onnx', 'model.onnx');
  if (fs.existsSync(quantPath) && !fs.existsSync(modelPath)) {
    fs.copyFileSync(quantPath, modelPath);
    console.log('[download-models] Linked model_quantized.onnx -> model.onnx');
  }

  if (allExist) {
    console.log(`[download-models] ✔ Model ${MODEL_REPO} is already fully downloaded.`);
    return;
  }

  console.log(`[download-models] Downloading ${MODEL_REPO} for offline embeddings...`);
  for (const file of REQUIRED_FILES) {
    const dest = path.join(TARGET_DIR, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`[download-models] Already exists: ${file}`);
      continue;
    }
    await downloadFile(MODEL_REPO, file, dest, token);
  }

  // Ensure onnx/model.onnx is also available
  if (fs.existsSync(quantPath) && !fs.existsSync(modelPath)) {
    fs.copyFileSync(quantPath, modelPath);
    console.log('[download-models] Linked model_quantized.onnx -> model.onnx');
  }

  console.log(`[download-models] ✔ All model assets successfully downloaded to: ${TARGET_DIR}`);
}

// Execute if run directly
downloadEmbeddingModels().catch((err) => {
  console.error('[download-models] Error downloading models:', err);
  process.exit(1);
});
