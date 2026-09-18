import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Determine base directory across ESM and CJS
const getBaseDir = (): string => {
  if (typeof __dirname === 'string') return __dirname;
  return process.cwd();
};

// Configuration for local Transformers.js environment
let transformersModule: any = null;
let pipelineInstance: any = null;

// Determine models directory across development and production
const MODELS_DIR = path.resolve(getBaseDir(), typeof __dirname === 'string' ? path.join('..', '..', 'models', 'embeddings') : path.join('models', 'embeddings'));

export async function getTransformersEnv(): Promise<any> {
  if (!transformersModule) {
    try {
      // Dynamic import to avoid bundling issues with esbuild native modules
      transformersModule = await import('@huggingface/transformers');
      if (transformersModule?.env) {
        transformersModule.env.localModelPath = MODELS_DIR;
        transformersModule.env.allowRemoteModels = false;
      }
    } catch (err) {
      console.warn('[Embedder] @huggingface/transformers not available, using fallback:', err);
    }
  }
  return transformersModule;
}

export interface LanceDBEmbeddingFunction {
  name: string;
  ndims: number;
  sourceColumn: string;
  vectorColumn: string;
  computeQueryEmbedding(query: string): Promise<number[]>;
  computeSourceEmbeddings(texts: string[]): Promise<number[][]>;
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Custom Embedding class compatible with LanceDB embedding function protocol
 * Powered by local Transformers.js with Xenova/all-MiniLM-L6-v2
 */
export class LocalTransformersEmbedder implements LanceDBEmbeddingFunction {
  public readonly name = 'transformers-all-MiniLM-L6-v2';
  public readonly ndims = 384;
  public readonly sourceColumn = 'text';
  public readonly vectorColumn = 'vector';
  private modelName = 'Xenova/all-MiniLM-L6-v2';
  private initialized = false;

  constructor(modelPathOverride?: string) {
    if (modelPathOverride) {
      this.modelName = modelPathOverride;
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized && pipelineInstance) return;

    const tf = await getTransformersEnv();
    if (!tf) {
      this.initialized = true;
      return;
    }

    try {
      const fullModelPath = path.join(MODELS_DIR, this.modelName);
      // Check if local model files exist
      if (fs.existsSync(fullModelPath)) {
        pipelineInstance = await tf.pipeline('feature-extraction', fullModelPath);
      } else {
        pipelineInstance = await tf.pipeline('feature-extraction', this.modelName);
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[Embedder] Could not initialize Transformers.js pipeline, will use deterministic local vectors:', err);
      this.initialized = true;
    }
  }

  /**
   * Generates a deterministic normalized 384-dimensional vector fallback
   */
  private generateDeterministicVector(text: string): number[] {
    const vector = new Array(this.ndims).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    
    for (const word of words) {
      if (!word) continue;
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % this.ndims;
      vector[idx] += 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map((val) => val / magnitude);
  }

  /**
   * Mean pooling helper for raw feature-extraction tensors
   */
  private meanPooling(output: any): number[] {
    if (!output) return new Array(this.ndims).fill(0);

    // If output is already 1D array of numbers
    if (Array.isArray(output) && typeof output[0] === 'number') {
      return output;
    }

    // If output has .data (Tensor)
    if (output.data && output.dims) {
      const data = Array.from(output.data) as number[];
      // dims: [batch_size, sequence_length, hidden_dim]
      const hiddenDim = output.dims[output.dims.length - 1] || this.ndims;
      const seqLen = output.dims[output.dims.length - 2] || 1;
      const pooled = new Array(hiddenDim).fill(0);

      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < hiddenDim; j++) {
          pooled[j] += data[i * hiddenDim + j];
        }
      }

      for (let j = 0; j < hiddenDim; j++) {
        pooled[j] /= seqLen;
      }

      // L2 normalize
      const norm = Math.sqrt(pooled.reduce((s, v) => s + v * v, 0)) || 1;
      return pooled.map((v) => v / norm);
    }

    return this.generateDeterministicVector(String(output));
  }

  public async computeQueryEmbedding(query: string): Promise<number[]> {
    await this.initialize();
    if (pipelineInstance) {
      try {
        const output = await pipelineInstance(query, { pooling: 'mean', normalize: true });
        if (output && output.data) {
          return Array.from(output.data);
        }
        return this.meanPooling(output);
      } catch (err) {
        console.warn('[Embedder] Pipeline query failed, using deterministic embedding:', err);
      }
    }
    return this.generateDeterministicVector(query);
  }

  public async computeSourceEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const emb = await this.computeQueryEmbedding(text);
      embeddings.push(emb);
    }
    return embeddings;
  }

  public async embed(texts: string[]): Promise<number[][]> {
    return this.computeSourceEmbeddings(texts);
  }
}

// Singleton embedder instance
export const localEmbedder = new LocalTransformersEmbedder();

/**
 * LanceDB Document Chunk Schema definition with local embedding function
 */
export interface DocumentChunkSchema {
  id: string;
  docId: string;
  title: string;
  text: string;
  chunkIndex: number;
  vector?: number[];
  category?: string;
  tags?: string[];
  createdAt?: string;
}

/**
 * Factory for creating LanceDB table definitions that bind the local embedder
 */
export function createLanceDBSchemaWithEmbedder(embedder: LanceDBEmbeddingFunction = localEmbedder) {
  return {
    tableName: 'documents_v1',
    embeddingFunction: embedder,
    schema: {
      id: 'string',
      docId: 'string',
      title: 'string',
      text: 'string',
      chunkIndex: 'int32',
      vector: { type: 'float32', dimensions: embedder.ndims },
      category: 'string',
      tags: 'list<string>',
      createdAt: 'string',
    },
  };
}
