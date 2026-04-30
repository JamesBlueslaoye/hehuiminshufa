'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchInlineResults } from '@/components/features/search/search-inline-results'
import { CHAT_API_URL } from '@/lib/chat-config'
import { detectChatIntent } from '@/lib/chat-intent'
import { fetchSearchIndex } from '@/lib/api'
import { getAllImagesFromResults, lookupCharsInIndex } from '@/lib/search-lookup'
import type { SearchIndex, SearchResult } from '@/types/search'
import type { LightboxState } from '@/types/search'

type Role = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: Role
  content: string
  thinking?: string
  showThinking?: boolean
  results?: Record<string, SearchResult[]>
}

const MAX_THINKING_PREVIEW_CHARS = 160

function parseReply(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = data as Record<string, unknown>
  if (typeof d.reply === 'string' && d.reply.trim()) return d.reply
  if (typeof d.error === 'string') throw new Error(d.error)
  const choices = d.choices as Array<{ message?: { content?: string } }> | undefined
  const c0 = choices?.[0]?.message?.content
  if (typeof c0 === 'string' && c0.trim()) return c0
  return ''
}

async function parseChatSSE(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: { content?: string; reasoning?: string }) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let lineBuffer = ''

  let streamDone = false
  while (!streamDone) {
    const { done, value } = await reader.read()
    streamDone = done
    lineBuffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

    let idx: number
    while ((idx = lineBuffer.indexOf('\n')) >= 0) {
      const line = lineBuffer.slice(0, idx)
      lineBuffer = lineBuffer.slice(idx + 1)

      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trimStart()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{
            delta?: { content?: string; reasoning_content?: string }
          }>
        }
        const d0 = json.choices?.[0]?.delta
        const content = typeof d0?.content === 'string' ? d0.content : ''
        const reasoning = typeof d0?.reasoning_content === 'string' ? d0.reasoning_content : ''
        if (content || reasoning) onDelta({ content, reasoning })
      } catch {
        // 跳过非 JSON 行
      }
    }
  }
}

export function SiteChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [indexData, setIndexData] = useState<SearchIndex | null>(null)
  const [indexLoading, setIndexLoading] = useState(true)
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '你好。输入单个汉字或「某字在楚简中怎么写」会先在本站字库展示字形（与搜索页相同，不调 AI）；其它问题再走 AI 助手。',
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSearchIndex()
      .then((data) => {
        setIndexData(data)
        setIndexLoading(false)
      })
      .catch(() => setIndexLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const goLightboxPrev = useCallback(() => {
    setLightbox((previous) => {
      if (!previous || previous.allImages.length === 0) return previous
      const index = (previous.currentIndex - 1 + previous.allImages.length) % previous.allImages.length
      return { ...previous, ...previous.allImages[index], currentIndex: index }
    })
  }, [])

  const goLightboxNext = useCallback(() => {
    setLightbox((previous) => {
      if (!previous || previous.allImages.length === 0) return previous
      const index = (previous.currentIndex + 1) % previous.allImages.length
      return { ...previous, ...previous.allImages[index], currentIndex: index }
    })
  }, [])

  useEffect(() => {
    if (!lightbox) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
      if (event.key === 'ArrowLeft') goLightboxPrev()
      if (event.key === 'ArrowRight') goLightboxNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox, goLightboxPrev, goLightboxNext])

  const getAllImages = useCallback((results: Record<string, SearchResult[]>) => {
    return getAllImagesFromResults(results)
  }, [])

  const runLookupPath = useCallback(
    (text: string, intent: { type: 'lookup'; chars: string; series?: string }) => {
      if (indexLoading) {
        setMessages((m) => [
          ...m,
          { id: `u-${Date.now()}`, role: 'user', content: text },
          {
            id: `wait-${Date.now()}`,
            role: 'assistant',
            content: '字库索引加载中，请稍候再试。',
          },
        ])
        setInput('')
        return
      }
      if (!indexData) {
        setMessages((m) => [
          ...m,
          { id: `u-${Date.now()}`, role: 'user', content: text },
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: '【错误】字库索引不可用。',
          },
        ])
        setInput('')
        return
      }

      const { chars, series } = intent
      const { results, totalFiles } = lookupCharsInIndex(indexData, chars, series)

      if (totalFiles === 0) {
        setMessages((m) => [
          ...m,
          { id: `u-${Date.now()}`, role: 'user', content: text },
          {
            id: `no-${Date.now()}`,
            role: 'assistant',
            content: `暂未收录「${chars.trim()}」的楚简字形。该字库持续更新中，欢迎提供补充。`,
          },
        ])
      } else {
        const summary = Object.keys(results)
          .map((s) => `${s}（${results[s].length}种写法）`)
          .join('、')
        setMessages((m) => [
          ...m,
          { id: `u-${Date.now()}`, role: 'user', content: text },
          {
            id: `lookup-${Date.now()}`,
            role: 'assistant',
            content: `「${chars.trim()}」共找到 ${totalFiles} 种楚简写法：\n${summary}`,
            results,
          },
        ])
      }
      setInput('')
    },
    [indexData, indexLoading],
  )

  const runAiPath = useCallback(
    async (text: string, assistantId: string) => {
      setLoading(true)
      setStreamingId(assistantId)

      try {
        const res = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, stream: true }),
        })

        const ct = res.headers.get('content-type') || ''

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errBody = data as { error?: string }
          throw new Error(errBody?.error || `请求失败 (${res.status})`)
        }

        if (ct.includes('application/json')) {
          const data = await res.json()
          const reply = parseReply(data)
          if (!reply) {
            throw new Error('接口返回格式无法识别')
          }
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: reply, showThinking: false, thinking: '' }
                : msg,
            ),
          )
          return
        }

        if (!res.body) {
          throw new Error('无响应流')
        }

        await parseChatSSE(res.body, ({ content, reasoning }) => {
          setMessages((m) =>
            m.map((msg) => {
              if (msg.id !== assistantId) return msg
              const hasAnswerDelta = Boolean(content)
              const nextContent = hasAnswerDelta ? msg.content + (content || '') : msg.content
              const nextThinkingRaw =
                !hasAnswerDelta && msg.showThinking && reasoning
                  ? (msg.thinking || '') + reasoning
                  : msg.thinking || ''
              const nextThinking = nextThinkingRaw.slice(0, MAX_THINKING_PREVIEW_CHARS)
              return {
                ...msg,
                content: nextContent,
                thinking: nextThinking,
                showThinking: hasAnswerDelta ? false : msg.showThinking,
              }
            }),
          )
        })

        setMessages((m) => {
          const last = m.find((x) => x.id === assistantId)
          if (last && last.role === 'assistant' && !last.content.trim()) {
            return m.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: '【错误】模型未返回有效内容' }
                : msg,
            )
          }
          return m
        })
      } catch (e) {
        const errText = e instanceof Error ? e.message : '网络或服务异常'
        setMessages((m) =>
          m.map((row) =>
            row.id === assistantId ? { ...row, content: `【错误】${errText}` } : row,
          ),
        )
      } finally {
        setLoading(false)
        setStreamingId(null)
      }
    },
    [],
  )

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const intent = detectChatIntent(text)

    if (intent.type === 'lookup_reject') {
      setMessages((m) => [
        ...m,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `reject-${Date.now()}`, role: 'assistant', content: intent.message },
      ])
      setInput('')
      return
    }

    if (intent.type === 'lookup') {
      runLookupPath(text, intent)
      return
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantId = `a-${Date.now()}`
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      thinking: '',
      showThinking: true,
    }

    setMessages((m) => [...m, userMsg, assistantPlaceholder])
    setInput('')
    await runAiPath(text, assistantId)
  }, [input, loading, runLookupPath, runAiPath])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-apple-blue text-white shadow-[0_8px_24px_rgba(0,122,255,0.35)] transition-transform hover:scale-105 active:scale-[0.98] md:bottom-6 md:right-6"
        aria-expanded={open}
        aria-label={open ? '关闭 AI 对话' : '打开 AI 对话'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {open ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[99] flex max-h-[min(85dvh,560px)] flex-col rounded-t-2xl border border-[#e5e5e5] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] md:right-6 md:bottom-[5.5rem] md:left-auto md:w-[min(100vw-2rem,420px)] md:rounded-2xl md:border"
          role="dialog"
          aria-label="AI 聊天与查字"
        >
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-apple-near-black">助手（查字 / AI）</p>
              <p className="text-[11px] text-black/45">如果你想查某个字在楚简中怎么写，可以直接问我“X字在楚简中怎么写”</p>
              <p className="text-[11px] text-black/45 truncate max-w-[260px] md:max-w-[340px]" title={CHAT_API_URL}>
                查字优先本地字库 · AI：{CHAT_API_URL}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-black/50 hover:bg-black/5"
              aria-label="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${
                    m.results ? 'max-w-full w-full' : 'max-w-[90%]'
                  } rounded-2xl px-3 py-2 text-[14px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-apple-blue text-white rounded-br-sm whitespace-pre-wrap'
                      : 'bg-apple-light-gray text-black rounded-bl-sm'
                  }`}
                >
                  {m.role === 'assistant' && m.showThinking && !m.content && m.thinking ? (
                    <div className="mb-2 whitespace-pre-wrap rounded-lg bg-black/5 px-2 py-1 text-[12px] leading-relaxed text-black/45">
                      {m.thinking}
                    </div>
                  ) : null}
                  <div className="whitespace-pre-wrap">
                    {m.content ||
                      (streamingId === m.id ? (
                        <span className="text-black/45">正在生成…</span>
                      ) : (
                        ''
                      ))}
                  </div>

                  {m.results && m.role === 'assistant' ? (
                    <SearchInlineResults
                      messageId={m.id}
                      results={m.results}
                      expandedSeries={expandedSeries}
                      setExpandedSeries={setExpandedSeries}
                      getAllImages={getAllImages}
                      onImageClick={(payload) =>
                        setLightbox({
                          url: payload.url,
                          fileName: payload.fileName,
                          series: payload.series,
                          index: payload.index,
                          allImages: payload.allImages,
                          currentIndex: payload.currentIndex,
                        })
                      }
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#e5e5e5] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="查字或提问…"
                disabled={loading}
                maxLength={2000}
                className="min-h-[44px] min-w-0 flex-1 rounded-full border border-[#d2d2d7] px-4 text-sm text-black placeholder:text-black/40 focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 min-h-[44px] rounded-full bg-apple-blue px-4 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
              >
                发送
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[98] bg-black/30 md:bg-transparent"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-5 sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[min(82vw,420px)] sm:max-w-[min(78vw,480px)] max-h-[82vh] min-h-0 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 text-center px-1">
              <p className="text-[13px] sm:text-sm font-semibold text-apple-near-black leading-snug">{lightbox.series}</p>
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img
                src={lightbox.url}
                alt={`${(lightbox.fileName || `${lightbox.series} 楚简字形`).trim()}｜何慧敏书法｜楚简书法`}
                className="max-w-full max-h-[min(48vh,360px)] sm:max-h-[min(46vh,400px)] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
              {lightbox.allImages.length > 1 ? (
                <div className="flex w-full items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      goLightboxPrev()
                    }}
                    className="min-h-[44px] min-w-[44px] rounded-full border border-[#d2d2d7] bg-white text-sm font-medium text-apple-near-black hover:bg-apple-light-gray active:scale-[0.98] transition-all"
                    aria-label="上一张"
                  >
                    ←
                  </button>
                  <span className="text-xs text-black/45 tabular-nums">
                    {lightbox.currentIndex + 1} / {lightbox.allImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      goLightboxNext()
                    }}
                    className="min-h-[44px] min-w-[44px] rounded-full border border-[#d2d2d7] bg-white text-sm font-medium text-apple-near-black hover:bg-apple-light-gray active:scale-[0.98] transition-all"
                    aria-label="下一张"
                  >
                    →
                  </button>
                </div>
              ) : null}
              <p className="text-[11px] sm:text-xs text-black/45 text-center px-2">点击周围暗区关闭</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
