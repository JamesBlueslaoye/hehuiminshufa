const express = require('express')

const app = express()
app.use(express.json({ limit: '64kb' }))

// 逗号分隔多个来源；浏览器请求会带 Origin，仅白名单内的才会通过 CORS
const DEFAULT_ALLOWED_ORIGINS =
  'https://hehuiminshufa.cn,http://localhost:3000,http://127.0.0.1:3000'
const ALLOWED_ORIGINS = (process.env.ALLOW_ORIGINS || process.env.ALLOW_ORIGIN || DEFAULT_ALLOWED_ORIGINS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function resolveCorsOrigin(req) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin
  // curl / Postman 无 Origin：默认允许第一个（通常为线上域名）
  if (!origin && ALLOWED_ORIGINS.length) return ALLOWED_ORIGINS[0]
  return null
}

app.use((req, res, next) => {
  const allowOrigin = resolveCorsOrigin(req)
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

function getArkConfig() {
  const apiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY
  const model = process.env.DOUBAO_MODEL || process.env.ARK_MODEL
  const base = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '')
  const maxTokens = Math.min(
    4096,
    Math.max(256, Number(process.env.ARK_MAX_TOKENS || 768)),
  )
  return { apiKey, model, base, maxTokens }
}

function buildMessages(userText) {
  return [
    {
      role: 'system',
      content:
        process.env.SYSTEM_PROMPT || '你是何慧敏书法工作室网站的助手，回答简洁、专业。',
    },
    { role: 'user', content: userText },
  ]
}

/**
 * 非流式：一次返回完整 JSON
 */
async function chatCompletions(userText) {
  const { apiKey, model, base, maxTokens } = getArkConfig()

  if (!apiKey || !model) {
    const err = new Error('缺少环境变量 DOUBAO_API_KEY / DOUBAO_MODEL')
    err.statusCode = 500
    throw err
  }

  const url = `${base}/chat/completions`
  const body = JSON.stringify({
    model,
    messages: buildMessages(userText),
    temperature: 0.7,
    max_tokens: maxTokens,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      data.error?.message ||
      data.message ||
      data.ResponseMetadata?.Error?.Message ||
      `方舟接口 HTTP ${res.status}`
    const err = new Error(msg)
    err.statusCode = res.status >= 400 && res.status < 600 ? res.status : 502
    err.detail = data
    throw err
  }

  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    const err = new Error('模型返回为空')
    err.statusCode = 502
    err.detail = data
    throw err
  }
  return text
}

/**
 * 流式：方舟 SSE 原样 pipe 给浏览器（OpenAI 兼容：data: {...}\\n\\n）
 */
async function pipeChatCompletionStream(userText, res) {
  const { apiKey, model, base, maxTokens } = getArkConfig()

  if (!apiKey || !model) {
    res.status(500).json({ error: '缺少环境变量 DOUBAO_API_KEY / DOUBAO_MODEL' })
    return
  }

  const url = `${base}/chat/completions`
  const body = JSON.stringify({
    model,
    messages: buildMessages(userText),
    temperature: 0.7,
    max_tokens: maxTokens,
    stream: true,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120000)

  let upstream
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    let msg = `方舟接口 HTTP ${upstream.status}`
    try {
      const j = JSON.parse(text)
      msg = j.error?.message || j.message || msg
    } catch {
      if (text) msg = text.slice(0, 500)
    }
    res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ error: msg })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const reader = upstream.body.getReader()

  try {
    let streamDone = false
    while (!streamDone) {
      const { done, value } = await reader.read()
      streamDone = done
      if (value && value.length) {
        res.write(Buffer.from(value))
      }
    }
  } catch (e) {
    console.error('stream pipe error', e)
    if (!res.writableEnded) {
      res.end()
    }
    return
  }

  res.end()
}

app.post('/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    const wantStream = req.body?.stream === true

    if (wantStream) {
      await pipeChatCompletionStream(message, res)
      return
    }

    const reply = await chatCompletions(message)
    return res.json({ reply })
  } catch (err) {
    console.error(err?.detail || err)
    const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500
    const msg = err.message || 'AI 服务异常'
    return res.status(status).json({ error: msg })
  }
})

const port = Number(process.env.PORT || 9000)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`本地服务：http://127.0.0.1:${port}`)
  })
}

module.exports = app
