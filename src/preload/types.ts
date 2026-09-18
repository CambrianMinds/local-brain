export interface LocalBrainAPI {
  getHealth: () => Promise<any>;
  getAIStatus: () => Promise<any>;
  getSLMStatus?: () => Promise<any>;
  getOpenRouterModels: (apiKey?: string) => Promise<any>;
  getLmStudioModels: (url?: string) => Promise<any>;
  askAI: (payload: any) => Promise<any>;
  summarizeAI: (payload: any) => Promise<any>;
  categorizeAI: (payload: any) => Promise<any>;
  wikiAI: (payload: any) => Promise<any>;
  wikiSectionAI: (payload: any) => Promise<any>;
  wikiBriefingAI: (payload: any) => Promise<any>;
  parseDocument: (file: { name: string; buffer: ArrayBuffer }) => Promise<{ text: string; error?: string }>;
}

declare global {
  interface Window {
    api: LocalBrainAPI;
  }
}
