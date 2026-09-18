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
  public findGGUFModel(preferredName?: string): string | null {
    if (!fs.existsSync(MODELS_LLM_DIR)) {
      return null;
    }
    const files = fs.readdirSync(MODELS_LLM_DIR);
    // Filter out multimodal projectors (*-mmproj.gguf) and obsolete models
    const validGgufFiles = files.filter(
      (f) => f.toLowerCase().endsWith('.gguf') && !f.toLowerCase().includes('mmproj') && !f.toLowerCase().includes('dolphin-phi')
    );
    if (validGgufFiles.length === 0) return null;

    // 1. Check if user-preferred model exists
    if (preferredName) {
      const match = validGgufFiles.find(
        (f) => f.toLowerCase() === preferredName.toLowerCase() || f.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (match) return path.join(MODELS_LLM_DIR, match);
    }

    // 2. Prioritize Gemma models
    const gemmaMatch = validGgufFiles.find((f) => f.toLowerCase().includes('gemma'));
    if (gemmaMatch) return path.join(MODELS_LLM_DIR, gemmaMatch);

    // 3. Fallback to first valid GGUF
    return path.join(MODELS_LLM_DIR, validGgufFiles[0]);
  }

  /**
   * Initializes getLlama, loads model and context with intelligent VRAM safety
   */
  public async initialize(modelPathOverride?: string): Promise<boolean> {
    const targetModelPath = modelPathOverride || this.findGGUFModel();
    if (!targetModelPath || !fs.existsSync(targetModelPath)) {
      console.log('[LocalSLM] No valid GGUF model found in', MODELS_LLM_DIR);
      return false;
    }

    // If already loaded with the same model, reuse session
    if (this.model && this.session) {
      if (this.activeModelPath === targetModelPath) {
        return true;
      }
      // Target model changed; dispose previous instance before reloading
      await this.dispose();
    }

    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      console.log(`[LocalSLM] Loading GGUF model from: ${targetModelPath}`);
      
      // Dynamic import of node-llama-cpp
      const { getLlama } = await import('node-llama-cpp');

      // Intelligent Hybrid GPU + CPU Hardware Offload
      let selectedGpu: 'vulkan' | 'auto' | false = false;
      let offloadLayers: number | undefined = undefined;
      const explicitBackend = process.env.LOCAL_BRAIN_SLM_BACKEND?.toLowerCase();

      if (explicitBackend === 'cpu') {
        selectedGpu = false;
      } else if (explicitBackend === 'cuda') {
        selectedGpu = 'auto';
      } else if (explicitBackend === 'vulkan') {
        selectedGpu = 'vulkan';
        offloadLayers = 16;
      } else {
        // Auto: Prefer Vulkan for stable hybrid GPU + CPU offloading (e.g. Pascal GTX 1050 Ti)
        try {
          const probeVulkan = await getLlama({ gpu: 'vulkan' });
          if (probeVulkan.gpu === 'vulkan') {
            selectedGpu = 'vulkan';
            offloadLayers = 16; // 16 GPU offload layers for optimal VRAM fit and fast inference
            console.log('[LocalSLM] Vulkan hybrid GPU + CPU engine enabled (16 GPU offload layers).');
          }
          await probeVulkan.dispose();
        } catch {
          // Probe CUDA VRAM capacity if Vulkan is unavailable
          try {
            const modelStats = fs.statSync(targetModelPath);
            const probeCuda = await getLlama();
            if (Boolean(probeCuda.gpu)) {
              const vram = await probeCuda.getVramState();
              const requiredVram = modelStats.size + 1.2 * 1024 * 1024 * 1024;
              if (vram.free >= requiredVram) {
                selectedGpu = 'auto';
              } else {
                selectedGpu = false;
              }
            }
            await probeCuda.dispose();
          } catch {
            selectedGpu = false;
          }
        }
      }

      this.llama = await getLlama({ gpu: selectedGpu });
      console.log(`[LocalSLM] Initialized backend: ${this.llama.gpu ? 'GPU (' + this.llama.gpu + ')' : 'CPU (AVX2 SIMD)'}`);
      
      this.model = await this.llama.loadModel({
        modelPath: targetModelPath,
        gpuLayers: offloadLayers,
      });

      this.context = await this.model.createContext({
        contextSize: 1024,
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
   * Generate completion with ChatML formatting and timeout safety
   */
  public async generate(
    prompt: string,
    options: GenerationOptions & { timeoutMs?: number; modelName?: string } = {}
  ): Promise<string> {
    const targetPath = options.modelName ? this.findGGUFModel(options.modelName) : undefined;
    const isReady = await this.initialize(targetPath ?? undefined);
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

      if (options.jsonMode && !finalPrompt.includes('JSON:')) {
        finalPrompt += '\n\nOutput valid raw JSON only with no markdown formatting.';
      }

      const timeoutMs = options.timeoutMs || 180000;
      const promptPromise = this.session.prompt(finalPrompt, {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 256,
        customStopTriggers: ['<end_of_turn>', '</s>', '<turn|>', '```\n', '\n}\n'],
      });

      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error(`Local SLM generation timed out after ${timeoutMs / 1000}s`)), timeoutMs);
      });

      const response = await Promise.race([promptPromise, timeoutPromise]);
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
