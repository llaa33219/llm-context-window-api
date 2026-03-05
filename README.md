# Context Window API

An API for querying AI model context window lengths. On the first request, it calls the OpenRouter API and stores the result in KV. Subsequent requests for the same model return the cached value from KV.

![Context Window API](./image.png)

## Base URL

```
https://lcw-api.blp.sh
```

## Endpoints

### 1. Get Context Window

Query context window by model name.

**GET** `/context-window?model={modelName}`

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | AI model name (e.g., `gpt-5.3-codex`, `claude-opus-4-5`, `gemini-2.0-flash`) |

**Example Request**

```bash
curl "https://lcw-api.blp.sh/context-window?model=gpt-4o"
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "name": "GPT-4o",
    "contextWindow": 128000,
    "slug": "openai/gpt-4o",
    "creator": "openai",
    "fromCache": false
  }
}
```

**Cached Response**

```json
{
  "success": true,
  "data": {
    "name": "gpt-4o",
    "contextWindow": 128000,
    "fromCache": true,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404)**

```json
{
  "success": false,
  "error": "Model not found: unknown-model"
}
```

---

### 2. Health Check

**GET** `/health`

**Response (200)**

```json
{
  "status": "ok"
}
```

---

### 3. Debug - List Available Models

**GET** `/debug`

Returns a sample of available models from the OpenRouter API (useful for debugging).

**Response (200)**

```json
{
  "count": 200,
  "sample": [
    { "name": "GPT-4o", "id": "openai/gpt-4o", "context_length": 128000 },
    { "name": "Claude 3.5 Sonnet", "id": "anthropic/claude-3.5-sonnet", "context_length": 200000 }
  ]
}
```

---

## Model Name Normalization

All of the following inputs are treated as the same model:

- `gpt-4o` = `gpt 4o` = `GPT-4O` = `gpt_4o`
- `claude-opus-4-5` = `claude opus 4 5` = `Claude-Opus-4-5`

---

## Deployment

```bash
# Create KV namespace
wrangler kv:namespace create MODEL_CACHE

# Update KV id in wrangler.toml, then deploy
wrangler deploy
```

### Custom Domain

The API uses a custom domain configured in `wrangler.toml`:

```toml
routes = [
  { pattern = "lcw-api.blp.sh", custom_domain = true }
]
```

With `custom_domain = true`, Cloudflare automatically:
- Creates the necessary DNS records
- Issues SSL certificates

Just run `wrangler deploy` and the domain will be set up automatically.
