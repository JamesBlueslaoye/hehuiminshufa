'use client'

import { useState, useEffect, useCallback } from 'react'
import { SiteNav } from '@/components/layout/site-nav'
import { WorkCard } from '@/components/features/home/work-card'
import { WORKS_COS_BASE_URL } from '@/lib/constants'
import type { WorkItem } from '@/types/work'

export default function Home() {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [zpzsWorks, setZpzsWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingZpzs, setLoadingZpzs] = useState(true)
  const [lightboxWork, setLightboxWork] = useState<WorkItem | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

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
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isZoomed) setIsZoomed(false)
        else if (lightboxWork) setLightboxWork(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isZoomed, lightboxWork])

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {works.map((work) => (
                <WorkCard key={work.key} work={work} onClick={() => setLightboxWork(work)} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {zpzsWorks.map((work) => (
                <WorkCard key={work.key} work={work} onClick={() => setLightboxWork(work)} />
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
                <li><a href="/search" className="text-apple-link-blue hover:underline no-underline">楚简查字</a></li>
                <li><a href="#works" className="text-apple-link-blue hover:underline no-underline">作品展示</a></li>
                <li><a href="#about" className="text-apple-link-blue hover:underline no-underline">关于楚简</a></li>
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
          onClick={() => setLightboxWork(null)}
        >
          <div className="min-h-screen flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md px-3 sm:px-4 py-3 flex items-center gap-2 border-b border-white/10">
              <button
                onClick={() => setLightboxWork(null)}
                className="text-white/80 hover:text-white transition-colors shrink-0 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
                aria-label="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-white text-sm sm:text-base font-medium tracking-tight min-w-0 flex-1 truncate text-center">
                {lightboxWork.title}
              </h1>
              <div className="w-10 shrink-0" aria-hidden />
            </div>

            <div className="flex-1 flex items-center justify-center bg-black/50 p-3 sm:p-4 md:p-8">
              <img
                src={lightboxWork.url}
                alt={lightboxWork.title}
                className="max-w-full max-h-[min(56vh,520px)] sm:max-h-[60vh] object-contain cursor-zoom-in rounded-lg"
                onClick={() => setIsZoomed(true)}
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
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center cursor-zoom-out p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <img src={lightboxWork.url} alt={lightboxWork.title} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  )
}
