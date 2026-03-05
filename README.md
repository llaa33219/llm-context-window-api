# Context Window API

AI 모델의 컨텍스트 윈도우 길이를 조회하는 API입니다. 첫 요청 시 artificialanalysis.ai API를 호출하고, 결과를 KV에 저장합니다. 이후 동일한 모델에 대한 요청은 KV에서 캐시된 값을 반환합니다.

## Base URL

```
https://your-worker.your-account.workers.dev
```

## Endpoints

### 1. 컨텍스트 윈도우 조회

모델 이름을 기반으로 컨텍스트 윈도우를 조회합니다.

**GET** `/context-window?model={modelName}`

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | AI 모델 이름 (예: `gpt-4`, `claude-3-opus`) |

**Example Request**

```bash
curl "https://your-worker.your-account.workers.dev/context-window?model=gpt-4"
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "name": "GPT-4",
    "contextWindow": 8192,
    "slug": "openai-gpt-4",
    "creator": "OpenAI",
    "fromCache": false
  }
}
```

**Cached Response**

```json
{
  "success": true,
  "data": {
    "name": "gpt-4",
    "contextWindow": 8192,
    "fromCache": true,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404)**

```json
{
  "success": false,
  "error": "Model not found: gpt-4"
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

## 모델 이름 정규화

다음과 같은 입력 모두 동일한 모델로 처리됩니다:

- `gpt-4` = `gpt 4` = `GPT-4` = `gpt_4`
- `claude-3-opus` = `claude 3 opus` = `Claude-3-Opus`

---

## 배포

```bash
# KV 네임스페이스 생성
wrangler kv:namespace create MODEL_CACHE

# wrangler.toml의 KV id 업데이트 후 배포
wrangler deploy
```

---

## 환경 변수

| Variable | Required | Description |
|----------|----------|-------------|
| ARTIFICIAL_ANALYSIS_API_KEY | No | artificialanalysis.ai API 키 (Rate limit 증가) |
