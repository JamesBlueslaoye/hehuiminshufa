'use client'

import { useEffect, useState } from 'react'

export type SiteNavVariant = 'home' | 'search'

export function SiteNav({ variant }: { variant: SiteNavVariant }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const linkClass =
    'block py-3 text-[15px] text-white/90 border-b border-white/10 no-underline hover:text-white active:bg-white/5 md:border-0 md:py-0 md:inline md:text-xs md:text-white/80 md:hover:text-white'

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl backdrop-saturate-[180%]">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 flex items-center justify-between min-h-12 py-2 md:py-0 md:h-12">
        <a
          href="/"
          className="text-white text-sm font-semibold tracking-tight no-underline shrink-0 min-w-0 truncate max-w-[55vw] sm:max-w-none"
          onClick={close}
        >
          何慧敏书法
        </a>

        {variant === 'home' && (
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            <a href="/search" className="text-white/80 text-xs hover:text-white transition-colors no-underline">
              楚简查字
            </a>
            <a href="#works" className="text-white/80 text-xs hover:text-white transition-colors no-underline">
              作品展示
            </a>
            <a href="#about" className="text-white/80 text-xs hover:text-white transition-colors no-underline">
              关于楚简
            </a>
          </div>
        )}

        {variant === 'search' && (
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            <span className="text-white text-sm font-medium">楚简查字</span>
            <a href="/" className="text-white/80 text-xs hover:text-white transition-colors no-underline">
              ← 返回首页
            </a>
          </div>
        )}

        <button
          type="button"
          className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10 active:bg-white/15"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-menu"
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/50 md:hidden"
            aria-label="关闭菜单"
            onClick={close}
          />
          <div
            id="site-mobile-menu"
            className="relative z-[60] border-t border-white/10 bg-black/95 px-4 pb-4 pt-1 md:hidden"
          >
            {variant === 'home' ? (
              <>
                <a href="/search" className={linkClass} onClick={close}>
                  楚简查字
                </a>
                <a href="#works" className={linkClass} onClick={close}>
                  作品展示
                </a>
                <a href="#about" className={linkClass} onClick={close}>
                  关于楚简
                </a>
              </>
            ) : (
              <>
                <p className="py-2 text-[13px] font-medium text-white/60">楚简查字</p>
                <a href="/" className={linkClass} onClick={close}>
                  ← 返回首页
                </a>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  )
}
