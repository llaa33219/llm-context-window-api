import { ArtificialAnalysisModel } from './types';
import { findBestMatch } from './utils';

const API_BASE_URL = 'https://api.artificialanalysis.ai/data/llms/models';

let modelsCache: ArtificialAnalysisModel[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchAllModels(apiKey?: string): Promise<ArtificialAnalysisModel[]> {
  const now = Date.now();
  
  if (modelsCache && (now - cacheTime) < CACHE_TTL) {
    return modelsCache;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(API_BASE_URL, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  modelsCache = data.models || data || [];
  cacheTime = now;
  
  return modelsCache;
}

export async function findModelContextWindow(
  modelName: string,
  apiKey?: string
): Promise<{ contextWindow: number; name: string; slug: string; creator: string } | null> {
  const models = await fetchAllModels(apiKey);
  
  const match = findBestMatch(modelName, models.map(m => ({ name: m.name, slug: m.slug })));
  
  if (!match) {
    return null;
  }

  const model = models.find(m => m.slug === match.slug);
  
  if (!model) {
    return null;
  }

  return {
    contextWindow: model.context_window,
    name: model.name,
    slug: model.slug,
    creator: model.model_creator
  };
}

export function clearCache(): void {
  modelsCache = null;
  cacheTime = 0;
}
