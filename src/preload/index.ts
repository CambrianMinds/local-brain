import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getHealth: () => ipcRenderer.invoke('ai:health'),
  getAIStatus: () => ipcRenderer.invoke('ai:status'),
  getSLMStatus: () => ipcRenderer.invoke('ai:slmStatus'),
  getOpenRouterModels: (apiKey?: string) => ipcRenderer.invoke('ai:getOpenRouterModels', apiKey),
  getLmStudioModels: (url?: string) => ipcRenderer.invoke('ai:getLmStudioModels', url),
  askAI: (payload: any) => ipcRenderer.invoke('ai:ask', payload),
  summarizeAI: (payload: any) => ipcRenderer.invoke('ai:summarize', payload),
  categorizeAI: (payload: any) => ipcRenderer.invoke('ai:categorize', payload),
  wikiAI: (payload: any) => ipcRenderer.invoke('ai:wiki', payload),
  wikiSectionAI: (payload: any) => ipcRenderer.invoke('ai:wiki-section', payload),
  wikiBriefingAI: (payload: any) => ipcRenderer.invoke('ai:wiki-briefing', payload),
  testXAI: (apiKey?: string) => ipcRenderer.invoke('ai:testXAI', apiKey),
  parseDocument: (file: any) => ipcRenderer.invoke('fs:parseDocument', file),
});
