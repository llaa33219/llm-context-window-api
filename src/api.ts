import { findBestMatch } from './utils';

const API_BASE_URL = 'https://openrouter.ai/api/v1/models';

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number;
  };
}

let modelsCache: OpenRouterModel[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchAllModels(): Promise<OpenRouterModel[]> {
  const now = Date.now();
  
  if (modelsCache && (now - cacheTime) < CACHE_TTL) {
    return modelsCache;
  }

  const response = await fetch(API_BASE_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  modelsCache = data.data || [];
  cacheTime = now;
  
  return modelsCache;
}

export async function findModelContextWindow(
  modelName: string
): Promise<{ contextWindow: number; maxOutputTokens?: number; name: string; slug: string; creator: string } | null> {
  const models = await fetchAllModels();
  
  const match = findBestMatch(modelName, models.map(m => ({ name: m.name, slug: m.id })));
  
  if (!match) {
    return null;
  }

  const model = models.find(m => m.id === match.slug);
  
  if (!model) {
    return null;
  }

  return {
    contextWindow: model.context_length,
    maxOutputTokens: model.top_provider?.max_completion_tokens,
    name: model.name,
    slug: model.id,
    creator: model.id.split('/')[0]
  };
}

export function clearCache(): void {
  modelsCache = null;
  cacheTime = 0;
}
