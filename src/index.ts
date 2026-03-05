import { findModelContextWindow, fetchAllModels } from './api';
import { createCacheKey } from './utils';
import { CachedModel } from './types';

interface Env {
  MODEL_CACHE: KVNamespace;
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
        const models = await fetchAllModels();
        return new Response(JSON.stringify({ 
          count: models.length,
          sample: models.slice(0, 5).map(m => ({ name: m.name, id: m.id, context_length: m.context_length }))
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

        const result = await findModelContextWindow(modelName);
        
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
