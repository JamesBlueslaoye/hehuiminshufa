'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SiteNav } from '@/components/layout/site-nav'
import { WorkCard } from '@/components/features/home/work-card'
import { WORKS_COS_BASE_URL } from '@/lib/constants'
import type { WorkItem } from '@/types/work'

function buildWorkQuery(workKey: string, zoomed: boolean) {
  const params = new URLSearchParams()
  params.set('work', workKey)
  if (zoomed) params.set('zoom', '1')
  return `?${params.toString()}`
}

export function HomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [works, setWorks] = useState<WorkItem[]>([])
  const [zpzsWorks, setZpzsWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingZpzs, setLoadingZpzs] = useState(true)
  const [shareHint, setShareHint] = useState<'idle' | 'copied'>('idle')

  const workParam = searchParams.get('work')
  const zoomParam = searchParams.get('zoom') === '1'

  const lightboxWork = useMemo(() => {
    if (!workParam) return null
    let decoded: string
    try {
      decoded = decodeURIComponent(workParam)
    } catch {
      return null
    }
    const all = [...works, ...zpzsWorks]
    return all.find((w) => w.key === decoded) ?? null
  }, [workParam, works, zpzsWorks])

  const isZoomed = Boolean(lightboxWork && zoomParam)

  const openWork = useCallback(
    (work: WorkItem) => {
      router.push(buildWorkQuery(work.key, false), { scroll: false })
    },
    [router],
  )

  const openZoom = useCallback(() => {
    if (!lightboxWork) return
    router.replace(buildWorkQuery(lightboxWork.key, true), { scroll: false })
  }, [router, lightboxWork])

  const closeLightbox = useCallback(() => {
    router.replace('/', { scroll: false })
  }, [router])

  const exitZoomOnly = useCallback(() => {
    if (!lightboxWork) return
    router.replace(buildWorkQuery(lightboxWork.key, false), { scroll: false })
  }, [router, lightboxWork])

  const getAbsoluteShareUrl = useCallback(
    (work: WorkItem, zoomed: boolean) => {
      if (typeof window === 'undefined') return ''
      const { origin, pathname } = window.location
      return `${origin}${pathname}${buildWorkQuery(work.key, zoomed)}`
    },
    [],
  )

  const shareCurrentWork = useCallback(async () => {
    if (!lightboxWork) return
    const url = getAbsoluteShareUrl(lightboxWork, isZoomed)
    const title = `${lightboxWork.title} — 何慧敏书法`
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareHint('copied')
      window.setTimeout(() => setShareHint('idle'), 2000)
    } catch {
      setShareHint('idle')
    }
  }, [lightboxWork, isZoomed, getAbsoluteShareUrl])

  const loadWorks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/shufacards/wdjd/works.json')
      const worksMap: Record<string, Record<string, string>> = await res.json()
      const items: WorkItem[] = []
      for (let i = 1; i <= 50; i++) {
        const fileName = `问道经典-${String(i).padStart(3, '0')}.jpg`
        const detail = worksMap[fileName]
        if (detail) {
          items.push({
            key: `wdjd/${fileName}`,
            title: detail.title || fileName.replace(/\.jpg$/, ''),
            url: `${WORKS_COS_BASE_URL}/wdjd/${encodeURIComponent(fileName)}`,
            original: detail.original,
            source: detail.source,
            description: detail.description,
            seriesSource: 'wdjy',
          })
        }
      }
      setWorks(items.slice(0, 20))
    } catch (error) {
      console.error('加载作品失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadZpzsWorks = useCallback(async () => {
    setLoadingZpzs(true)
    try {
      const res = await fetch('/shufacards/zpzs/works.json')
      const worksMap: Record<string, Record<string, string>> = await res.json()
      const items: WorkItem[] = Object.entries(worksMap).map(([fileName, detail]) => ({
        key: `zpzs/${fileName}`,
        title: detail.title || fileName.replace(/\.(jpg|png|gif)$/i, ''),
        url: `${WORKS_COS_BASE_URL}/zpzs/${encodeURIComponent(fileName)}`,
        original: detail.original,
        source: detail.source,
        description: detail.description,
        seriesSource: 'zpzs',
      }))
      setZpzsWorks(items)
    } catch (error) {
      console.error('加载普通作品失败', error)
    } finally {
      setLoadingZpzs(false)
    }
  }, [])

  useEffect(() => {
    loadWorks()
    loadZpzsWorks()
  }, [loadWorks, loadZpzsWorks])

  useEffect(() => {
    if (!lightboxWork) setShareHint('idle')
  }, [lightboxWork])

  const listsReady = !loading && !loadingZpzs
  useEffect(() => {
    if (!workParam || !listsReady) return
    if (!lightboxWork) {
      router.replace('/', { scroll: false })
    }
  }, [workParam, lightboxWork, listsReady, router])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isZoomed) exitZoomOnly()
      else if (lightboxWork) closeLightbox()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isZoomed, lightboxWork, exitZoomOnly, closeLightbox])

  return (
    <div className="min-h-screen">
      <SiteNav variant="home" />

      <section className="bg-apple-light-gray py-14 sm:py-20 md:py-28">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-[32px] leading-[1.08] sm:text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] text-apple-near-black mb-3 sm:mb-4">
            楚简书法艺术
          </h1>
          <p className="text-[15px] sm:text-[17px] md:text-[21px] font-display font-normal leading-[1.35] sm:leading-[1.19] tracking-[0.231px] text-black/80 max-w-[600px] mx-auto mb-8 sm:mb-10 px-1">
            收录郭店楚简、包山楚简、清华简、上博楚简等珍贵文献，以及何慧敏老师的书法创作作品
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <a
              href="/search"
              className="inline-flex justify-center bg-apple-blue text-white px-6 py-3 sm:py-2 rounded-pill text-[16px] sm:text-[17px] font-normal no-underline hover:opacity-90 transition-opacity min-h-[44px] sm:min-h-0 items-center"
            >
              楚简查字
            </a>
            <a
              href="#works"
              className="inline-flex justify-center bg-transparent text-apple-blue px-6 py-3 sm:py-2 rounded-pill text-[16px] sm:text-[17px] font-normal no-underline border border-apple-blue hover:bg-apple-blue/5 transition-colors min-h-[44px] sm:min-h-0 items-center"
            >
              浏览作品
            </a>
          </div>
        </div>
      </section>

      <section id="works" className="bg-black py-12 sm:py-16 md:py-24">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <p className="text-white/48 text-xs font-semibold uppercase tracking-[0.5px] mb-2">作品集</p>
          <h2 className="font-display text-[28px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-white mb-3 sm:mb-4">
            问道经典
          </h2>
          <p className="text-white/80 text-[15px] sm:text-[17px] mb-8 sm:mb-12 max-w-[500px]">
            何慧敏楚简小品书法集，以楚简书写经典篇章
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          ) : works.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {works.map((work) => (
                <WorkCard key={work.key} work={work} onClick={() => openWork(work)} />
              ))}
            </div>
          ) : (
            <p className="text-white/48 text-center py-20">暂无作品</p>
          )}
        </div>
      </section>

      <section className="bg-apple-light-gray py-12 sm:py-16 md:py-24">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <p className="text-black/48 text-xs font-semibold uppercase tracking-[0.5px] mb-2">作品集</p>
          <h2 className="font-display text-[28px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-apple-near-black mb-3 sm:mb-4">
            书法创作
          </h2>
          <p className="text-black/80 text-[15px] sm:text-[17px] mb-8 sm:mb-12 max-w-[500px]">
            何慧敏老师的楚简书法创作与探索
          </p>

          {loadingZpzs ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-apple-blue animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          ) : zpzsWorks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {zpzsWorks.map((work) => (
                <WorkCard key={work.key} work={work} onClick={() => openWork(work)} />
              ))}
            </div>
          ) : (
            <p className="text-black/48 text-center py-20">暂无作品</p>
          )}
        </div>
      </section>

      <section id="about" className="bg-black py-12 sm:py-16 md:py-24">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <p className="text-white/48 text-xs font-semibold uppercase tracking-[0.5px] mb-2">关于</p>
          <h2 className="font-display text-[28px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.28px] text-white mb-8 sm:mb-12">
            楚简书法
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: '郭店楚简',
                desc: '1993年出土于湖北省荆门市郭店村，内容以儒家、道家文献为主，是研究先秦思想的重要资料。',
              },
              {
                title: '包山楚简',
                desc: '1987年出土于湖北省荆门市，包含丰富的司法、卜筮记录，为研究楚国社会制度提供珍贵资料。',
              },
              {
                title: '清华简',
                desc: '2008年入藏清华大学，内容涵盖历史、文学、数学等领域，是近年来最重要的楚简发现之一。',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-apple-dark-surface rounded-lg p-6 transition-shadow hover:shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px]"
              >
                <h3 className="font-display text-[21px] font-bold leading-[1.19] tracking-[0.231px] text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-[14px] leading-[1.43] tracking-[-0.224px] text-white/70">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-apple-light-gray py-8 sm:py-10">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-3">关于我们</h4>
              <p className="text-[14px] leading-[1.43] tracking-[-0.224px] text-black/80">
                何慧敏书法工作室致力于楚简书法的教学与创作，传承中华优秀传统文化。
              </p>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-3">快速链接</h4>
              <ul className="space-y-2 text-[14px] tracking-[-0.224px]">
                <li>
                  <a href="/search" className="text-apple-link-blue hover:underline no-underline">
                    楚简查字
                  </a>
                </li>
                <li>
                  <a href="#works" className="text-apple-link-blue hover:underline no-underline">
                    作品展示
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-apple-link-blue hover:underline no-underline">
                    关于楚简
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-3">联系方式</h4>
              <p className="text-[14px] leading-[1.43] tracking-[-0.224px] text-black/80">
                广东省深圳市
                <br />
                hehuimin@example.com
              </p>
            </div>
          </div>
          <div className="border-t border-[#d2d2d7] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] tracking-[-0.12px] text-black/48">
            <p>© 2026 何慧敏书法工作室 · 楚简书法字库 版权所有</p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black/48 hover:text-apple-link-blue no-underline transition-colors"
            >
              粤ICP备2026044664号
            </a>
          </div>
        </div>
      </footer>

      {lightboxWork && !isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={closeLightbox}
        >
          <div className="min-h-screen flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md px-3 sm:px-4 py-3 flex items-center gap-2 border-b border-white/10">
              <button
                type="button"
                onClick={closeLightbox}
                className="text-white/80 hover:text-white transition-colors shrink-0 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
                aria-label="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-white text-sm sm:text-base font-medium tracking-tight min-w-0 flex-1 truncate text-center px-1">
                {lightboxWork.title}
              </h1>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void shareCurrentWork()
                  }}
                  className="flex h-10 min-w-[44px] items-center justify-center rounded-lg px-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="分享"
                >
                  分享
                </button>
                {shareHint === 'copied' ? (
                  <span className="text-[10px] text-white/60">已复制链接</span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-black/50 p-3 sm:p-4 md:p-8">
              <img
                src={lightboxWork.url}
                alt={`${lightboxWork.title?.trim() || '楚简字形'}｜何慧敏书法｜楚简书法`}
                className="max-w-full max-h-[min(56vh,520px)] sm:max-h-[60vh] object-contain cursor-zoom-in rounded-lg"
                onClick={openZoom}
              />
            </div>

            <div className="bg-apple-light-gray px-4 py-6 sm:px-6 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-[22px] sm:text-[26px] md:text-[28px] font-semibold leading-[1.2] tracking-[0.196px] text-apple-near-black mb-4 sm:mb-6">
                  {lightboxWork.title}
                </h2>

                {lightboxWork.original && (
                  <div className="mb-5">
                    <h3 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-2">释文</h3>
                    <p className="text-[15px] sm:text-[17px] leading-[1.47] tracking-[-0.374px] text-black/80">
                      {lightboxWork.original}
                    </p>
                  </div>
                )}

                {lightboxWork.source && (
                  <div className="mb-5">
                    <h3 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-2">出处</h3>
                    <p className="text-[15px] sm:text-[17px] leading-[1.47] tracking-[-0.374px] text-apple-link-blue">
                      {lightboxWork.source}
                    </p>
                  </div>
                )}

                {lightboxWork.description && (
                  <div className="mb-6">
                    <h3 className="text-[14px] font-semibold tracking-[-0.224px] text-apple-near-black mb-2">解读</h3>
                    <p className="text-[15px] sm:text-[17px] leading-[1.47] tracking-[-0.374px] text-black/80">
                      {lightboxWork.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs rounded-pill bg-apple-light-gray border border-[#d2d2d7] text-black/80">
                    #书法
                  </span>
                  <span className="px-3 py-1 text-xs rounded-pill bg-apple-light-gray border border-[#d2d2d7] text-black/80">
                    {lightboxWork.seriesSource === 'wdjy' ? '#问道经典' : '#书法创作'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isZoomed && lightboxWork && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-5 sm:p-8 animate-fade-in"
          onClick={exitZoomOnly}
        >
          <div
            className="relative flex max-h-[88vh] w-full max-w-[min(82vw,420px)] sm:max-w-[min(78vw,480px)] flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 space-y-1 px-1 pt-1 text-center">
              {lightboxWork.source ? (
                <p className="text-sm text-white/90 leading-snug">{lightboxWork.source}</p>
              ) : (
                <p className="text-sm text-white/70 leading-snug">{lightboxWork.title}</p>
              )}
            </div>
            <div className="flex min-h-0 flex-1 cursor-zoom-out items-center justify-center" onClick={exitZoomOnly}>
              <img
                src={lightboxWork.url}
                alt={`${lightboxWork.title?.trim() || '楚简字形'}｜何慧敏书法｜楚简书法`}
                className="max-h-[min(52vh,420px)] sm:max-h-[min(50vh,480px)] max-w-full object-contain"
              />
            </div>
            <p className="shrink-0 text-center text-[11px] text-white/45">点击图片或空白处退出放大</p>
          </div>
        </div>
      )}
    </div>
  )
}
