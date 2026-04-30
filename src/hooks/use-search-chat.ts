'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSearchIndex } from '@/lib/api'
import { extractQueryChars } from '@/lib/search-query'
import { getAllImagesFromResults, lookupCharsInIndex } from '@/lib/search-lookup'
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!lightbox) return
      if (event.key === 'Escape') setLightbox(null)
      if (event.key === 'ArrowLeft') goLightboxPrev()
      if (event.key === 'ArrowRight') goLightboxNext()
    },
    [lightbox, goLightboxPrev, goLightboxNext],
  )

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

  async function searchChar(chars: string, preferSeries?: string) {
    if (!chars.trim() || !indexData) return
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date() }])
    setLoading(true)
    try {
      const { results, totalFiles } = lookupCharsInIndex(indexData, chars, preferSeries)

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
    return getAllImagesFromResults(results)
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
    goLightboxPrev,
    goLightboxNext,
  }
}
