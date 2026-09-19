import { routeLLM } from '../src/services/ai-router';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const sampleDoc = `
# Project Antigravity Architecture Document
Antigravity is a high-performance vector retrieval engine built on LanceDB and SQLite.
In Q3 2024, our benchmark showed a 4.2x reduction in query latency and 99.98% recall accuracy across 50,000 embedded documents.
The system uses 384-dimensional MiniLM embeddings with DiskANN indexing.
Security auditing confirms zero network egress; all embeddings and weights reside on local disk.
`;

  console.log('\nTesting summarize with grok-4.20-non-reasoning...');
  const sumRes = await routeLLM({
    provider: 'xai',
    xaiApiKey: process.env.XAI_API_KEY,
    model: 'grok-4.20-non-reasoning',
    prompt: `Summarize "Project Antigravity Architecture Document".
Context: ${sampleDoc}

Respond in this exact JSON format:
{"brief":"1 punchy sentence","detailed":"2 concise sentences explaining findings","keyPoints":["point 1","point 2","point 3"]}
JSON:`,
    systemPrompt: 'You are an analytical document synthesis assistant. Output valid JSON only.',
    jsonMode: true,
    maxTokens: 300,
  });

  console.log('xAI Summarize Result:', sumRes.text);
}

main().catch(console.error);
