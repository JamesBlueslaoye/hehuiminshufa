const express = require('express')

const app = express()
app.use(express.json({ limit: '64kb' }))

// 与浏览器地址栏一致；本地测试可设环境变量 ALLOW_ORIGIN=http://localhost:3000
const MY_DOMAIN = process.env.ALLOW_ORIGIN || 'https://hehuiminshufa.cn'

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', MY_DOMAIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

/**
 * 使用 Node 18+ 内置 fetch，无需 axios（避免云函数未打包 node_modules 子依赖时报错）
 */
async function chatCompletions(userText) {
  const apiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY
  const model = process.env.DOUBAO_MODEL || process.env.ARK_MODEL
  const base = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(
    /\/$/,
    '',
  )

  if (!apiKey || !model) {
    const err = new Error('缺少环境变量 DOUBAO_API_KEY / DOUBAO_MODEL')
    err.statusCode = 500
    throw err
  }

  const url = `${base}/chat/completions`
  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content:
          process.env.SYSTEM_PROMPT || '你是何慧敏书法工作室网站的助手，回答简洁、专业。',
      },
      { role: 'user', content: userText },
    ],
    temperature: 0.7,
    max_tokens: 2048,
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

app.post('/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' })
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
