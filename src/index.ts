import { findModelContextWindow, fetchAllModels } from './api';
import { createCacheKey } from './utils';
import { CachedModel } from './types';

interface Env {
  MODEL_CACHE: KVNamespace;
  ARTIFICIAL_ANALYSIS_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/debug' && request.method === 'GET') {
      try {
        const apiKey = env.ARTIFICIAL_ANALYSIS_API_KEY;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        };

        const response = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', { headers });
        const status = response.status;
        const statusText = response.statusText;
        const data = await response.json();
        
        return new Response(JSON.stringify({ 
          status,
          statusText,
          isArray: Array.isArray(data),
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : null,
          count: Array.isArray(data) ? data.length : data.models?.length || 0,
          firstItem: Array.isArray(data) ? data[0] : data.models?.[0] || null
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/context-window' && request.method === 'GET') {
      const modelName = url.searchParams.get('model');
      
      if (!modelName) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'model query parameter is required' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const cacheKey = createCacheKey(modelName);
        
        const cached = await env.MODEL_CACHE.get(cacheKey, 'json') as CachedModel | null;
        
        if (cached) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              name: modelName,
              contextWindow: cached.contextWindow,
              fromCache: true,
              lastUpdated: cached.lastUpdated
            }
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await findModelContextWindow(modelName, env.ARTIFICIAL_ANALYSIS_API_KEY);
        
        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: `Model not found: ${modelName}`
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const cacheData: CachedModel = {
          contextWindow: result.contextWindow,
          lastUpdated: new Date().toISOString()
        };
        
        await env.MODEL_CACHE.put(cacheKey, JSON.stringify(cacheData));

        return new Response(JSON.stringify({
          success: true,
          data: {
            name: result.name,
            contextWindow: result.contextWindow,
            slug: result.slug,
            creator: result.creator,
            fromCache: false
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Internal error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Not found' 
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
