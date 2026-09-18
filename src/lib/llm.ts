import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Cross-platform path resolution for models/llm supporting both dev and packaged electron
const getModelsDir = (): string => {
  // 1. Packaged Electron executable (extraResources)
  if ((process as any).resourcesPath) {
    const packagedPath = path.join((process as any).resourcesPath, 'models', 'llm');
    if (fs.existsSync(packagedPath)) return packagedPath;
  }
  // 2. Working directory relative (dev mode)
  const cwdPath = path.resolve(process.cwd(), 'models', 'llm');
  if (fs.existsSync(cwdPath)) return cwdPath;

  // 3. CJS __dirname fallback
  if (typeof __dirname === 'string') {
    const relPath = path.resolve(__dirname, '..', '..', 'models', 'llm');
    if (fs.existsSync(relPath)) return relPath;
  }
  return cwdPath;
};

const MODELS_LLM_DIR = getModelsDir();

export interface LocalSLMStatus {
  available: boolean;
  modelLoaded: boolean;
  modelPath: string | null;
  modelName: string | null;
  contextSize?: number;
  message?: string;
}

export interface GenerationOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Singleton wrapper managing node-llama-cpp lifecycle, LlamaChatSession,
 * and memory context disposal.
 */
export class LocalSLMEngine {
  private static instance: LocalSLMEngine | null = null;
  private llama: any = null;
  private model: any = null;
  private context: any = null;
  private session: any = null;
  private activeModelPath: string | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): LocalSLMEngine {
    if (!LocalSLMEngine.instance) {
      LocalSLMEngine.instance = new LocalSLMEngine();
    }
    return LocalSLMEngine.instance;
  }

  /**
   * Discovers available .gguf files in models/llm
   */
  public findGGUFModel(): string | null {
    if (!fs.existsSync(MODELS_LLM_DIR)) {
      return null;
    }
    const files = fs.readdirSync(MODELS_LLM_DIR);
    // Filter out multimodal projectors (*-mmproj.gguf) which cannot be loaded as standalone base models
    const ggufFile = files.find((f) => f.toLowerCase().endsWith('.gguf') && !f.toLowerCase().includes('mmproj'));
    return ggufFile ? path.join(MODELS_LLM_DIR, ggufFile) : null;
  }

  /**
   * Initializes getLlama, loads model and context
   */
  public async initialize(modelPathOverride?: string): Promise<boolean> {
    if (this.model && this.session) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      const targetModelPath = modelPathOverride || this.findGGUFModel();
      if (!targetModelPath || !fs.existsSync(targetModelPath)) {
        console.log('[LocalSLM] No GGUF model found in', MODELS_LLM_DIR);
        this.isInitializing = false;
        return false;
      }

      console.log(`[LocalSLM] Loading GGUF model from: ${targetModelPath}`);
      
      // Dynamic import of node-llama-cpp
      const { getLlama } = await import('node-llama-cpp');
      this.llama = await getLlama();
      
      this.model = await this.llama.loadModel({
        modelPath: targetModelPath,
      });

      this.context = await this.model.createContext({
        contextSize: 2048,
      });

      const { LlamaChatSession } = await import('node-llama-cpp');
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
      });

      this.activeModelPath = targetModelPath;
      console.log(`[LocalSLM] ✔ Model successfully loaded and ready for inference.`);
      this.isInitializing = false;
      return true;
    } catch (err: any) {
      console.warn('[LocalSLM] Failed to initialize node-llama-cpp:', err?.message || err);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Generate completion with ChatML formatting
   */
  public async generate(prompt: string, options: GenerationOptions = {}): Promise<string> {
    const isReady = await this.initialize();
    if (!isReady || !this.session) {
      throw new Error('Local SLM is not ready. Ensure a .gguf model exists in models/llm');
    }

    try {
      let finalPrompt = prompt;
      if (options.systemPrompt) {
        this.session.setChatHistory([
          { type: 'system', text: options.systemPrompt },
        ]);
      }

      if (options.jsonMode) {
        finalPrompt += '\n\nOutput valid raw JSON only with no markdown formatting.';
      }

      const response = await this.session.prompt(finalPrompt, {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 1024,
      });

      return response;
    } catch (err: any) {
      console.error('[LocalSLM] Inference error:', err);
      throw err;
    }
  }

  /**
   * Free memory and dispose Llama model context
   */
  public async dispose(): Promise<void> {
    try {
      if (this.session) {
        this.session = null;
      }
      if (this.context) {
        await this.context.dispose();
        this.context = null;
      }
      if (this.model) {
        await this.model.dispose();
        this.model = null;
      }
      this.activeModelPath = null;
      console.log('[LocalSLM] Resources cleanly disposed.');
    } catch (err) {
      console.warn('[LocalSLM] Error disposing context/model:', err);
    }
  }

  /**
   * Status of local SLM engine
   */
  public getStatus(): LocalSLMStatus {
    const detectedPath = this.findGGUFModel();
    return {
      available: Boolean(detectedPath),
      modelLoaded: Boolean(this.model && this.session),
      modelPath: this.activeModelPath || detectedPath,
      modelName: (this.activeModelPath || detectedPath) ? path.basename(this.activeModelPath || detectedPath || '') : null,
      contextSize: 2048,
      message: (this.activeModelPath || detectedPath)
        ? 'Native GGUF model detected and ready'
        : 'No GGUF model found in models/llm (run train-slm.py or place a .gguf file)',
    };
  }
}

export const localSLMEngine = LocalSLMEngine.getInstance();
