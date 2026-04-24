'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSearchIndex } from '@/lib/api'
import { SEARCH_COS_BASE_URL } from '@/lib/constants'
import type { LightboxImage, LightboxState, Message, SearchIndex, SearchResult } from '@/types/search'

export function useSearchChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set())
  const [indexData, setIndexData] = useState<SearchIndex | null>(null)
  const [indexLoading, setIndexLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSearchIndex()
      .then((data) => {
        setIndexData(data)
        setIndexLoading(false)
      })
      .catch(() => setIndexLoading(false))
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!lightbox) return
    if (event.key === 'Escape') setLightbox(null)
    if (event.key === 'ArrowLeft') {
      setLightbox((previous) => {
        if (!previous) return null
        const index = (previous.currentIndex - 1 + previous.allImages.length) % previous.allImages.length
        return { ...previous, ...previous.allImages[index], currentIndex: index }
      })
    }
    if (event.key === 'ArrowRight') {
      setLightbox((previous) => {
        if (!previous) return null
        const index = (previous.currentIndex + 1) % previous.allImages.length
        return { ...previous, ...previous.allImages[index], currentIndex: index }
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
      content: '输入你想查询的字，我将为你展示楚简文字的写法',
      timestamp: new Date(),
    }])
  }, [])

  function extractQueryChars(textInput: string): { chars: string; series?: string } | null {
    const text = textInput.trim()
    if (!text) return null
    const semanticKeywords = ['楚简', '怎么写', '写法', '书写', '字形', '简帛', '字帖', '字库', '古文字', '篆书']
    const hasSemantic = semanticKeywords.some((keyword) => text.includes(keyword))
    if (!hasSemantic && /^[\u4e00-\u9fff]{1,3}$/.test(text)) return { chars: text }
    if (!hasSemantic) return null

    const seriesMatch = text.match(/(郭店楚简|包山楚简|清华简|上博楚简)/)
    const series = seriesMatch ? seriesMatch[1] : undefined
    const seriesChars = series ? series.replace(/[^\u4e00-\u9fff]/g, '').split('') : []
    const excludeChars = ['怎', '么', '写', '法', '字', '形', '书', '中', '在', '里', '的', '楚', '简']
    const allChineseChars = text.replace(/[^\u4e00-\u9fff]/g, '').split('')
      .filter((char) => !seriesChars.includes(char) && !excludeChars.includes(char))
      .join('')

    if (allChineseChars.length >= 1 && allChineseChars.length <= 5) return { chars: allChineseChars, series }
    if (allChineseChars.length > 5) return { chars: allChineseChars.slice(0, 5), series }
    return null
  }

  function getImageUrl(key: string): string {
    return `${SEARCH_COS_BASE_URL}/${encodeURIComponent(key)}`
  }

  async function searchChar(chars: string, preferSeries?: string) {
    if (!chars.trim() || !indexData) return
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date() }])
    setLoading(true)
    try {
      const searchSeriesList = preferSeries ? [preferSeries] : Object.keys(indexData.series)
      const results: Record<string, SearchResult[]> = {}
      let totalFiles = 0
      for (const series of searchSeriesList) {
        const seriesIndex = indexData.series[series]
        if (!seriesIndex) continue
        const seenKeys = new Set<string>()
        const allFilesForSeries: SearchResult[] = []
        for (const char of chars.trim().split('')) {
          const items = seriesIndex[char]
          if (!items) continue
          for (const item of items) {
            if (!seenKeys.has(item.key)) {
              seenKeys.add(item.key)
              allFilesForSeries.push({ series, fileName: item.fileName, index: item.index, key: item.key, url: getImageUrl(item.key) })
            }
          }
        }
        if (allFilesForSeries.length > 0) {
          results[series] = allFilesForSeries
          totalFiles += allFilesForSeries.length
        }
      }

      if (totalFiles === 0) {
        setMessages((previous) => [...previous, { id: `no-${Date.now()}`, role: 'assistant', content: `暂未收录「${chars.trim()}」的楚简字形。该字库持续更新中，欢迎提供补充。`, timestamp: new Date() }])
      } else {
        const summary = Object.keys(results).map((series) => `${series}（${results[series].length}种写法）`).join('、')
        setMessages((previous) => [...previous, { id: `reply-${Date.now()}`, role: 'assistant', content: `「${chars.trim()}」共找到 ${totalFiles} 种楚简写法：\n${summary}`, results, timestamp: new Date() }])
      }
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    if (indexLoading) {
      setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() }, { id: `wait-${Date.now()}`, role: 'assistant', content: '字库索引加载中，请稍候...', timestamp: new Date() }])
      setInput('')
      return
    }
    const extracted = extractQueryChars(text)
    if (extracted) {
      searchChar(extracted.chars, extracted.series)
      return
    }
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() }, { id: `hint-${Date.now()}`, role: 'assistant', content: '请输入要查询的汉字，例如「天」「学」「在楚简中怎么写」。', timestamp: new Date() }])
    setInput('')
  }

  function getAllImages(results: Record<string, SearchResult[]>): LightboxImage[] {
    return Object.entries(results).flatMap(([series, files]) => files.map((file) => ({ url: file.url, fileName: file.fileName, series })))
  }

  return {
    messages,
    input,
    loading,
    lightbox,
    expandedSeries,
    messagesEndRef,
    inputRef,
    setInput,
    setLightbox,
    setExpandedSeries,
    handleSubmit,
    getAllImages,
  }
}
