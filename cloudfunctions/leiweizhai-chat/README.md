# leiweizhai-chat 云函数

## 环境变量

| 变量 | 说明 |
|------|------|
| `DOUBAO_API_KEY` / `ARK_API_KEY` | 方舟 API Key |
| `DOUBAO_MODEL` / `ARK_MODEL` | 接入点 ID `ep-...` |
| `ARK_BASE_URL` | 可选，默认 `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_MAX_TOKENS` | 可选，**默认 768**（256～4096 之间） |
| `ALLOW_ORIGINS` | 逗号分隔的 CORS 白名单 |
| `SYSTEM_PROMPT` | 可选，系统提示词 |

## 接口

- `POST /chat` + `{"message":"...","stream":true}` → **`text/event-stream`**（流式，透传方舟 SSE）
- `POST /chat` + `{"message":"..."}` 或不传 `stream` → **`application/json`** `{ "reply": "..." }`（非流式）

## 部署

将本目录 `app.js`、`package.json` 上传后执行依赖安装；流式建议超时 **≥ 60s**（方舟 + 长文）。

前端已默认使用 `stream: true`；更新云函数后需**重新部署** `app.js` 才生效。
