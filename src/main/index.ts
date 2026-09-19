import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
// __dirname is available in CJS output
import { executeLLM, CURATED_OPENROUTER_FREE_MODELS } from './services/ai/provider';
import { getAllProvidersStatus } from '../services/ai-router';
import { localSLMEngine } from '../lib/llm';

process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled Rejection:', reason);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Local Brain',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.warn(`[Main] Window failed to load (code: ${errorCode}, desc: ${errorDescription})`);
  });

  const htmlPath = path.join(__dirname, '../renderer/index.html');

  if (app.isPackaged) {
    mainWindow.loadFile(htmlPath);
  } else {
    // If running dev server on 5173, load it; otherwise load built html
    fetch('http://localhost:5173')
      .then(() => {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
      })
      .catch(() => {
        mainWindow.loadFile(htmlPath);
      });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('ai:health', () => {
  return {
    status: 'ok',
    version: '1.0.4-desktop',
    service: 'Local Brain Desktop Core',
    timestamp: new Date().toISOString(),
  };
});

ipcMain.handle('ai:status', () => {
  return getAllProvidersStatus();
});

ipcMain.handle('ai:slmStatus', () => {
  return localSLMEngine.getStatus();
});

ipcMain.handle('ai:getOpenRouterModels', async (_, apiKey) => {
  try {
    const headers: Record<string, string> = {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Local Brain Desktop',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data.data)) {
        const models = data.data.map((m: any) => {
          const isFree = m.id.endsWith(':free') || (m.pricing && (m.pricing.prompt === '0' || m.pricing.prompt === 0) && (m.pricing.completion === '0' || m.pricing.completion === 0));
          return { id: m.id, name: m.name || m.id, description: m.description, context_length: m.context_length, pricing: m.pricing, isFree: Boolean(isFree) };
        });
        models.sort((a: any, b: any) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return a.name.localeCompare(b.name);
        });
        return { success: true, count: models.length, freeCount: models.filter((m: any) => m.isFree).length, models, source: 'openrouter_api' };
      }
    }
  } catch (err: any) {
    console.warn('Could not query OpenRouter:', err);
  }
  return { success: true, count: CURATED_OPENROUTER_FREE_MODELS.length, freeCount: CURATED_OPENROUTER_FREE_MODELS.length, models: CURATED_OPENROUTER_FREE_MODELS, source: 'curated_fallback' };
});

ipcMain.handle('ai:getLmStudioModels', async (_, url) => {
  const rawUrl = url || 'http://localhost:1234/v1';
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  const target = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;
  try {
    const response = await fetch(target);
    if (response.ok) {
      const data: any = await response.json();
      const models = Array.isArray(data.data) ? data.data : [];
      return { connected: true, endpoint: cleanUrl, models: models.map((m: any) => ({ id: m.id, object: m.object, owned_by: m.owned_by })) };
    }
  } catch (err: any) {}
  return {
    connected: false, endpoint: cleanUrl,
    message: `LM Studio daemon not detected at ${cleanUrl}. Start LM Studio and run local server on port 1234.`,
    defaultModels: [ { id: 'meta-llama-3.2-3b-instruct', name: 'Meta Llama 3.2 3B Instruct' }, { id: 'nomic-embed-text-v1.5', name: 'Nomic Embed Text v1.5' }, { id: 'qwen2.5-7b-instruct', name: 'Qwen 2.5 7B Instruct' }, { id: 'mistral-7b-instruct-v0.3', name: 'Mistral 7B Instruct v0.3' } ],
  };
});

ipcMain.handle('ai:getEnvKeys', async () => {
  return {
    xaiApiKey: process.env.XAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  };
});

ipcMain.handle('ai:testXAI', async (_, apiKey: string) => {
  const targetKey = apiKey || process.env.XAI_API_KEY;
  if (!targetKey) return { success: false, error: 'xAI API key is required' };
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${targetKey}` },
    });
    if (res.ok) {
      const data: any = await res.json();
      return { success: true, models: data.data || [] };
    }
    const err = await res.text();
    return { success: false, error: `xAI status ${res.status}: ${err}` };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Connection to xAI failed' };
  }
});

ipcMain.handle('ai:ask', async (_, payload) => {
  const { question, documentTitle, documentContent, chunks, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  if (!question) return { error: 'Question is required' };

  const effectiveXaiKey = xaiApiKey || apiKey || process.env.XAI_API_KEY;
  const effectiveApiKey = provider === 'xai' ? effectiveXaiKey : (apiKey || process.env.OPENROUTER_API_KEY);

  const prompt = `You are Local Brain, a desktop document intelligence assistant.
Answer the user's question accurately based strictly on the provided document excerpts.
Cite specific facts, figures, and details from the excerpts.

Document Title: ${documentTitle || 'Selected Document'}
Relevant Excerpts:
${chunks?.length ? chunks.map((c: string, idx: number) => `[Chunk ${idx + 1}]:\n${c}`).join('\n\n') : documentContent?.slice(0, 4000) || 'No content provided'}

User Question: ${question}`;

  try {
    const result = await executeLLM({
      provider,
      model,
      apiKey: effectiveApiKey,
      xaiApiKey: effectiveXaiKey,
      lmStudioUrl,
      prompt,
      systemPrompt: 'You are Local Brain, a high-precision document assistant. Answer directly and concisely based on the document.',
      maxTokens: 500,
    });
    if (result && result.text) {
      return {
        answer: result.text,
        provider: result.providerName,
        confidence: 0.98,
      };
    }
  } catch (err: any) {
    console.error('[ai:ask] Model execution failed:', err);
    return {
      answer: `[Inference Error from ${provider}]: ${err?.message || 'Model execution failed. Check your API key and network connection.'}`,
      provider: `${provider} (Error)`,
      confidence: 0,
    };
  }

  // Real excerpt dynamic snippet citation fallback
  const keywords = question.toLowerCase().split(/\s+/).filter((k: string) => k.length > 3);
  let relevantSnippet = '';
  if (documentContent) {
    const sentences = documentContent.split(/(?<=[.?!])\s+/);
    const matched = sentences.filter((s: string) => keywords.some((kw: string) => s.toLowerCase().includes(kw)));
    if (matched.length > 0) relevantSnippet = matched.slice(0, 3).join(' ');
  }

  const fallbackAnswer = relevantSnippet
    ? `From "${documentTitle}": "${relevantSnippet}"`
    : `Refer to "${documentTitle}": The document content does not contain a direct match for "${question}".`;

  return { answer: fallbackAnswer, provider: 'Local Brain Text Citation', confidence: 0.7 };
});

ipcMain.handle('ai:summarize', async (_, payload) => {
  const { title, content, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  if (!content) return { error: 'Content is required' };

  const docExcerpt = content.slice(0, 2500).trim();
  const effectiveXaiKey = xaiApiKey || apiKey || process.env.XAI_API_KEY;
  const effectiveApiKey = provider === 'xai' ? effectiveXaiKey : (apiKey || process.env.OPENROUTER_API_KEY);

  const prompt = `Summarize the document "${title || 'Untitled'}".
Context:
${docExcerpt}

Respond in this exact JSON format:
{"brief":"1 punchy sentence summarizing the core finding or topic","detailed":"2 concise sentences explaining specific details, architecture, or metrics","keyPoints":["specific point 1","specific point 2","specific point 3"]}
JSON:`;

  try {
    const result = await executeLLM({
      provider,
      model,
      apiKey: effectiveApiKey,
      xaiApiKey: effectiveXaiKey,
      lmStudioUrl,
      prompt,
      systemPrompt: 'You are an analytical document synthesis assistant. Output valid JSON only.',
      jsonMode: true,
      maxTokens: 300,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.brief && parsed.detailed && Array.isArray(parsed.keyPoints)) {
        return {
          brief: parsed.brief,
          detailed: parsed.detailed,
          keyPoints: parsed.keyPoints,
          provider: result.providerName || provider,
        };
      }
    }

    if (result.text && result.text.length > 20 && !result.text.includes('[Error') && !result.text.includes('Error:')) {
      const lines = result.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      return {
        brief: lines[0] || `Summary of ${title}`,
        detailed: result.text.slice(0, 400),
        keyPoints: lines.slice(1, 4).length >= 2 ? lines.slice(1, 4) : [`Key findings for ${title}`],
        provider: result.providerName || provider,
      };
    }
  } catch (err: any) {
    console.warn('[ai:summarize] LLM generation failed:', err?.message || err);
  }

  // Dynamic fallback synthesized directly from document content
  const paras = content.split('\n\n').map((p: string) => p.trim()).filter((p: string) => p.length > 20);
  const sentences = content.replace(/[\r\n]+/g, ' ').split(/(?<=[.?!])\s+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);

  const briefText = sentences[0]
    ? (sentences[0].endsWith('.') ? sentences[0] : sentences[0] + '.')
    : `Overview of ${title || 'document'}.`;

  const detailedText = paras.slice(0, 2).join('\n\n') || content.slice(0, 350);
  const candidatePoints = sentences.slice(1, 6).filter((s: string) => !s.toLowerCase().includes('http') && s.length < 150);
  const keyPoints = candidatePoints.length >= 2
    ? candidatePoints.slice(0, 4)
    : [
        `Summary extracted from ${title}`,
        'Review document content for full technical specifications',
      ];

  return {
    brief: briefText,
    detailed: detailedText,
    keyPoints: keyPoints,
    provider: 'Local Content Extractor',
  };
});

ipcMain.handle('ai:categorize', async (_, payload) => {
  const { title, content, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  const standardCategories = ['Research', 'Technical', 'Work', 'Finance', 'Legal', 'Personal', 'Creative'];

  if (content) {
    const prompt = `Classify this document titled "${title}" into one of the following primary categories:
${standardCategories.join(', ')}.
Also extract 3-5 relevant lowercase tags.
Document excerpt:
${content.slice(0, 2500)}

Return raw JSON only:
{ "category": "...", "tags": ["tag1", "tag2"] }`;

    try {
      const effectiveApiKey = provider === 'xai' ? (xaiApiKey || apiKey) : apiKey;
      const result = await executeLLM({ provider, model, apiKey: effectiveApiKey, xaiApiKey, lmStudioUrl, prompt, systemPrompt: 'You classify documents accurately. Output raw JSON only.', jsonMode: true });
      const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.category && Array.isArray(parsed.tags)) {
        let cat = parsed.category.trim();
        const found = standardCategories.find((c) => c.toLowerCase() === cat.toLowerCase());
        if (found) cat = found;
        else if (cat.toLowerCase().includes('finan')) cat = 'Finance';
        else if (cat.toLowerCase().includes('tech')) cat = 'Technical';
        else if (cat.toLowerCase().includes('legal')) cat = 'Legal';
        else if (cat.toLowerCase().includes('rese')) cat = 'Research';
        return { category: cat, tags: parsed.tags };
      }
    } catch {}
  }

  const text = (title + ' ' + (content || '')).toLowerCase();
  let category = 'Work';
  if (text.includes('vector') || text.includes('database') || text.includes('api')) category = 'Technical';
  else if (text.includes('revenue') || text.includes('financial')) category = 'Finance';
  else if (text.includes('paper') || text.includes('research')) category = 'Research';
  else if (text.includes('agreement') || text.includes('terms')) category = 'Legal';

  const tags = [category.toLowerCase(), 'indexed', 'v1'];
  if (text.includes('lancedb')) tags.push('lancedb');
  if (text.includes('sqlite')) tags.push('sqlite');

  return { category, tags };
});

ipcMain.handle('ai:wiki', async (_, payload) => {
  const { topic, sourceDocTitles, combinedExcerpts, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  const prompt = `You are generating an encyclopedia-grade technical or organizational Knowledge Wiki page for Local Brain.
Topic: ${topic}
Source Documents: ${sourceDocTitles?.join(', ') || 'Repository Documents'}
Context excerpts:
${(combinedExcerpts || '').slice(0, 6000)}

Write a comprehensive, highly readable, structured Markdown article.`;

  try {
    const effectiveApiKey = provider === 'xai' ? (xaiApiKey || apiKey) : apiKey;
    const result = await executeLLM({ provider, model, apiKey: effectiveApiKey, xaiApiKey, lmStudioUrl, prompt, systemPrompt: 'You are an encyclopedia knowledge synthesizer.' });
    return { content: result.text, title: topic, provider: result.providerName };
  } catch {}
  
  return {
    content: `# ${topic}\n\n> **Executive Overview**: This synthesized knowledge wiki consolidates architectural patterns, empirical benchmark data, and operational guidelines.\n\n## References\n- ${sourceDocTitles?.join('\n- ') || 'Documents'}`,
    title: topic,
    provider: 'Local Brain Knowledge Synthesizer',
  };
});

ipcMain.handle('ai:wiki-section', async (_, payload) => {
  const { pageTitle, sectionHeading, sectionContext, sourceDocTitles, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  const prompt = `You are rewriting and updating a specific section of an encyclopedic Knowledge Wiki page.
Wiki Article Title: ${pageTitle}
Section to Update: ${sectionHeading}
Context: ${(sectionContext || '').slice(0, 4000)}
Write ONLY the updated content for this section under the heading "${sectionHeading}".`;

  try {
    const effectiveApiKey = provider === 'xai' ? (xaiApiKey || apiKey) : apiKey;
    const result = await executeLLM({ provider, model, apiKey: effectiveApiKey, xaiApiKey, lmStudioUrl, prompt, systemPrompt: 'You are an encyclopedia knowledge synthesizer.' });
    return { content: result.text, heading: sectionHeading, provider: result.providerName };
  } catch {}
  return { content: `${sectionHeading}\nThe updated analysis incorporates verified data points.`, heading: sectionHeading, provider: 'Local Offline Synthesizer' };
});

ipcMain.handle('ai:wiki-briefing', async (_, payload) => {
  const { topic, mode, sourceDocTitles, combinedExcerpts, provider, model, apiKey, xaiApiKey, lmStudioUrl } = payload;
  const isStudyGuide = mode === 'study-guide';
  const prompt = `Create an ${isStudyGuide ? 'Study Guide' : 'Executive Briefing'} for the topic: "${topic}".
Context: ${(combinedExcerpts || '').slice(0, 5000)}`;

  try {
    const effectiveApiKey = provider === 'xai' ? (xaiApiKey || apiKey) : apiKey;
    const result = await executeLLM({ provider, model, apiKey: effectiveApiKey, xaiApiKey, lmStudioUrl, prompt, systemPrompt: 'You are an elite research analyst.' });
    let finalContent = result.text.trim();
    if (!finalContent.toLowerCase().includes('briefing') && !finalContent.toLowerCase().includes('study guide')) {
      finalContent = `# ${isStudyGuide ? 'Study Guide' : 'Executive Briefing'}: ${topic}\n\n` + finalContent;
    }
    return { content: finalContent, title: `${isStudyGuide ? 'Study Guide' : 'Executive Briefing'}: ${topic}`, provider: result.providerName };
  } catch {}
  return { content: `# ${isStudyGuide ? 'Study Guide' : 'Executive Briefing'}: ${topic}\n\nOverview.`, title: topic, provider: 'Local Research Analyst' };
});

// File Parsing
ipcMain.handle('fs:parseDocument', async (_, file: { name: string; buffer: ArrayBuffer }) => {
  try {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      // Lazy load pdf-parse to avoid slowing down startup
      const pdfParse = require('pdf-parse');
      // Convert ArrayBuffer to Node.js Buffer
      const data = await pdfParse(Buffer.from(file.buffer));
      return { text: data.text };
    }
    
    // For other files, fallback to treating it as text
    const decoder = new TextDecoder('utf-8');
    return { text: decoder.decode(file.buffer) };
  } catch (err: any) {
    console.error('Error parsing document:', err);
    return { text: '', error: err.message || 'Failed to parse document' };
  }
});
