'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/* ====== Types ====== */
interface IndexItem {
  key: string
  fileName: string
  index: string
}

interface SearchIndex {
  version: number
  updatedAt: string
  series: Record<string, Record<string, IndexItem[]>>
}

interface SearchResult {
  series: string
  fileName: string
  index: string
  key: string
  url: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  results?: Record<string, SearchResult[]>
  timestamp: Date
}

interface LightboxState {
  url: string
  fileName: string
  series: string
  allImages: { url: string; fileName: string; series: string }[]
  currentIndex: number
}

/* ====== Constants ====== */
const PREVIEW_COUNT = 6
const MAX_EXPAND_COUNT = 15
const COS_BASE = 'https://chujianwenzibian-1401656251.cos.ap-guangzhou.myqcloud.com'

/* ====== Main Page ====== */
export default function SearchPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [indexData, setIndexData] = useState<SearchIndex | null>(null)
  const [indexLoading, setIndexLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 加载索引
  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then((data: SearchIndex) => {
        setIndexData(data)
        setIndexLoading(false)
      })
      .catch(err => {
        console.error('加载索引失败:', err)
        setIndexLoading(false)
      })
  }, [])

  function getRandomItems<T>(array: T[], n: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, n)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightbox) return
    if (e.key === 'Escape') setLightbox(null)
    if (e.key === 'ArrowLeft') {
      setLightbox(prev => {
        if (!prev) return null
        const idx = (prev.currentIndex - 1 + prev.allImages.length) % prev.allImages.length
        return { ...prev, ...prev.allImages[idx], currentIndex: idx }
      })
    }
    if (e.key === 'ArrowRight') {
      setLightbox(prev => {
        if (!prev) return null
        const idx = (prev.currentIndex + 1) % prev.allImages.length
        return { ...prev, ...prev.allImages[idx], currentIndex: idx }
      })
    }
  }, [lightbox])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '欢迎使用楚简书法字库查询！\n\n请输入你想查询的汉字，我会为你展示各系列楚简中的写法。\n\n收录系列：郭店楚简、包山楚简、清华简、上博楚简',
      timestamp: new Date(),
    }])
  }, [])

  function extractQueryChars(input: string): { chars: string; series?: string } | null {
    const text = input.trim()
    if (!text) return null

    const semanticKeywords = [
      '楚简', '怎么写', '写法', '书写', '字形', '简帛',
      '字帖', '字库', '古文字', '篆书',
    ]
    const hasSemantic = semanticKeywords.some(kw => text.includes(kw))

    if (!hasSemantic && /^[\u4e00-\u9fff]{1,3}$/.test(text)) {
      return { chars: text }
    }

    if (!hasSemantic) return null

    const seriesMatch = text.match(/(郭店楚简|包山楚简|清华简|上博楚简)/)
    const series = seriesMatch ? seriesMatch[1] : undefined
    const seriesChars = series ? series.replace(/[^\u4e00-\u9fff]/g, '').split('') : []

    const excludeChars = ['怎', '么', '写', '法', '字', '形', '书', '中', '在', '里', '的', '楚', '简']

    const allChineseChars = text.replace(/[^\u4e00-\u9fff]/g, '').split('')
      .filter(ch => !seriesChars.includes(ch) && !excludeChars.includes(ch))
      .join('')

    const charBeforeZi = text.match(/([\u4e00-\u9fff])字/)
    if (charBeforeZi && !seriesChars.includes(charBeforeZi[1]) && !excludeChars.includes(charBeforeZi[1])) {
      return { chars: charBeforeZi[1], series }
    }

    const afterWrite = text.match(/怎么写([\u4e00-\u9fff])/)
    if (afterWrite && !seriesChars.includes(afterWrite[1]) && !excludeChars.includes(afterWrite[1])) {
      return { chars: afterWrite[1], series }
    }

    const beforeWrite = text.match(/([\u4e00-\u9fff]+)怎么写/)
    if (beforeWrite) {
      const chars = beforeWrite[1].split('').filter(ch => !seriesChars.includes(ch) && !excludeChars.includes(ch)).join('')
      if (chars.length >= 1 && chars.length <= 5) return { chars, series }
    }

    const beforeKeyword = text.match(/([\u4e00-\u9fff]+)(?:的)?(?:写法|字形|书写)/)
    if (beforeKeyword) {
      const chars = beforeKeyword[1].split('').filter(ch => !seriesChars.includes(ch) && !excludeChars.includes(ch)).join('')
      if (chars.length >= 1 && chars.length <= 5) return { chars, series }
    }

    if (allChineseChars.length >= 1 && allChineseChars.length <= 5) {
      return { chars: allChineseChars, series }
    }

    if (allChineseChars.length > 5) {
      return { chars: allChineseChars.slice(0, 5), series }
    }

    return null
  }

  function getImageUrl(key: string): string {
    return `${COS_BASE}/${encodeURIComponent(key)}`
  }

  async function searchChar(char: string, preferSeries?: string) {
    if (!char.trim() || !indexData) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const searchSeriesList = preferSeries
        ? [preferSeries]
        : Object.keys(indexData.series)

      const results: Record<string, SearchResult[]> = {}
      let totalFiles = 0

      // 对每个汉字、每个系列查询索引
      const chars = char.trim().split('')

      for (const series of searchSeriesList) {
        const seriesIndex = indexData.series[series]
        if (!seriesIndex) continue

        const seenKeys = new Set<string>()
        const allFilesForSeries: SearchResult[] = []

        for (const c of chars) {
          const items = seriesIndex[c]
          if (!items) continue

          for (const item of items) {
            if (!seenKeys.has(item.key)) {
              seenKeys.add(item.key)
              allFilesForSeries.push({
                series,
                fileName: item.fileName,
                index: item.index,
                key: item.key,
                url: getImageUrl(item.key),
              })
            }
          }
        }

        if (allFilesForSeries.length > 0) {
          results[series] = allFilesForSeries
          totalFiles += allFilesForSeries.length
        }
      }

      if (totalFiles === 0) {
        const noResult: Message = {
          id: `no-${Date.now()}`,
          role: 'assistant',
          content: `暂未收录「${char.trim()}」的楚简字形。该字库持续更新中，欢迎提供补充。`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, noResult])
        return
      }

      const seriesNames = Object.keys(results)
      const seriesSummary = seriesNames.map(s => `${s}（${results[s].length}种写法）`).join('、')

      const replyContent = `「${char.trim()}」共找到 ${totalFiles} 种楚简写法：\n${seriesSummary}`

      const replyMsg: Message = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        results,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, replyMsg])
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '查询出错，请稍后重试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    if (indexLoading) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])
      const waitMsg: Message = {
        id: `wait-${Date.now()}`,
        role: 'assistant',
        content: '字库索引加载中，请稍候...',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, waitMsg])
      setInput('')
      return
    }

    const extracted = extractQueryChars(text)
    if (extracted) {
      searchChar(extracted.chars, extracted.series)
    } else {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])
      const hintMsg: Message = {
        id: `hint-${Date.now()}`,
        role: 'assistant',
        content: '请输入要查询的汉字，例如「天」「学」「在楚简中怎么写」。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, hintMsg])
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Navigation ====== */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl backdrop-saturate-[180%]">
        <div className="max-w-[980px] mx-auto px-6 flex items-center justify-between h-12">
          <a href="/" className="text-white text-sm font-semibold tracking-tight no-underline">
            何慧敏书法
          </a>
          <div className="flex items-center gap-6">
            <span className="text-white text-sm font-medium">楚简查字</span>
            <a href="/" className="text-white/80 text-xs hover:text-white transition-colors no-underline">
              ← 返回首页
            </a>
          </div>
        </div>
      </nav>

      {/* ====== Hero Search ====== */}
      <section className="bg-apple-light-gray py-16 md:py-20">
        <div className="max-w-[680px] mx-auto px-6 text-center">
          <h1 className="font-display text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-apple-near-black mb-3">
            楚简查字
          </h1>
          <p className="text-[17px] text-black/60 mb-8">
            输入汉字，查询郭店楚简、包山楚简、清华简、上博楚简中的写法
          </p>
          <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-[480px] mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入要查询的汉字..."
              disabled={loading}
              maxLength={5}
              className="flex-1 px-5 py-3 rounded-full bg-white border border-[#d2d2d7] text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-full bg-apple-blue text-white text-sm font-medium hover:bg-[#0077ed] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </form>
        </div>
      </section>

      {/* ====== Results ====== */}
      <section className="max-w-[980px] mx-auto px-6 py-10">
        <div className="space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-apple-blue text-white rounded-2xl rounded-br-sm px-5 py-3'
                  : 'bg-apple-light-gray text-black rounded-2xl rounded-bl-sm px-5 py-3'
              }`}>
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {/* Search Results Images */}
                {msg.results && Object.entries(msg.results).map(([series, files]) => {
                  const seriesKey = `${msg.id}-${series}`
                  const isExpanded = expandedSeries.has(seriesKey)
                  const visibleFiles = isExpanded
                    ? (files.length > MAX_EXPAND_COUNT ? getRandomItems(files, MAX_EXPAND_COUNT) : files)
                    : files.slice(0, PREVIEW_COUNT)
                  const hiddenCount = files.length - PREVIEW_COUNT

                  return (
                    <div key={series} className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-apple-near-black border border-[#d2d2d7]">
                          {series}
                        </span>
                        <span className="text-xs text-black/60">
                          {files.length} 种写法
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {visibleFiles.map((file, i) => {
                          const allImages = Object.entries(msg.results!).flatMap(([s, fs]) =>
                            fs.map(f => ({ url: (f as any).proxyUrl || f.url, fileName: f.fileName, series: s }))
                          )
                          const globalIndex = allImages.findIndex(img => img.url === ((file as any).proxyUrl || file.url))
                          return (
                            <div
                              key={`${file.key}-${i}`}
                              className="relative bg-white rounded-lg overflow-hidden border border-[#e5e5e5] cursor-pointer hover:shadow-md hover:border-apple-blue transition-all group"
                              onClick={() => setLightbox({
                                url: (file as any).proxyUrl || file.url,
                                fileName: file.fileName,
                                series,
                                allImages,
                                currentIndex: globalIndex,
                              })}
                            >
                              <img
                                src={(file as any).proxyUrl || file.url}
                                alt={`${series} ${file.fileName}`}
                                className="w-full aspect-square object-contain p-1 group-hover:scale-105 transition-transform"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1">
                                <span className="text-[10px] text-white/90">#{file.index}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {files.length > PREVIEW_COUNT && (
                        <button
                          onClick={() => setExpandedSeries(prev => {
                            const next = new Set(prev)
                            if (isExpanded) next.delete(seriesKey)
                            else next.add(seriesKey)
                            return next
                          })}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5 transition-colors"
                        >
                          {isExpanded ? '收起' : `显示更多（还有 ${hiddenCount} 种）`}
                        </button>
                      )}
                    </div>
                  )
                })}

                <p className={`text-[11px] mt-2 ${
                  msg.role === 'user' ? 'text-white/60' : 'text-black/40'
                }`}>
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="animate-fade-in flex justify-start">
              <div className="bg-apple-light-gray rounded-2xl rounded-bl-sm px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* ====== Lightbox ====== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-[90vw] max-h-[90vh] p-5 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-apple-light-gray text-apple-near-black">
                  {lightbox.series}
                </span>
                <span className="text-xs text-black/60">
                  {lightbox.currentIndex + 1} / {lightbox.allImages.length}
                </span>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full bg-apple-light-gray flex items-center justify-center text-black hover:bg-[#e5e5e5] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <img
              src={lightbox.url}
              alt={lightbox.fileName}
              className="max-w-[70vw] max-h-[60vh] object-contain rounded-lg"
            />

            <p className="text-xs text-black/60 text-center">
              {lightbox.fileName}
            </p>

            {lightbox.allImages.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLightbox(prev => {
                    if (!prev) return null
                    const idx = (prev.currentIndex - 1 + prev.allImages.length) % prev.allImages.length
                    return { ...prev, ...prev.allImages[idx], currentIndex: idx }
                  })}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-apple-light-gray text-sm text-black hover:bg-[#e5e5e5] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  上一张
                </button>
                <button
                  onClick={() => setLightbox(prev => {
                    if (!prev) return null
                    const idx = (prev.currentIndex + 1) % prev.allImages.length
                    return { ...prev, ...prev.allImages[idx], currentIndex: idx }
                  })}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-apple-light-gray text-sm text-black hover:bg-[#e5e5e5] transition-colors"
                >
                  下一张
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
