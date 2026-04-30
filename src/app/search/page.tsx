'use client'

import { SearchInlineResults } from '@/components/features/search/search-inline-results'
import { SiteNav } from '@/components/layout/site-nav'
import { useSearchChat } from '@/hooks/use-search-chat'

export default function SearchPage() {
  const {
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
  } = useSearchChat()

  return (
    <div className="relative min-h-[100dvh] min-h-screen bg-white">
      <SiteNav variant="search" />

      <div className="pb-[max(7.5rem,calc(env(safe-area-inset-bottom)+5.75rem))]">
        <section className="max-w-[980px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {messages.map((message) => (
            <div key={message.id} className={`animate-fade-in ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
              <div
                className={`max-w-[min(100%,92vw)] sm:max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'bg-apple-blue text-white rounded-2xl rounded-br-sm px-4 py-3 sm:px-5' : 'bg-apple-light-gray text-black rounded-2xl rounded-bl-sm px-4 py-3 sm:px-5'}`}
              >
                <p className="text-[14px] sm:text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {message.results ? (
                  <SearchInlineResults
                    messageId={message.id}
                    results={message.results}
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
          <div ref={messagesEndRef} />
        </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5e5] bg-white/95 backdrop-blur-xl pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_24px_rgba(0,0,0,0.06)]">
        <form
          onSubmit={handleSubmit}
          className="max-w-[680px] mx-auto px-4 sm:px-6 flex flex-row items-center gap-2 w-full min-w-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入要查询的汉字..."
            disabled={loading}
            maxLength={5}
            className="flex-1 min-w-0 min-h-[48px] px-4 sm:px-5 py-3 rounded-full bg-white border border-[#d2d2d7] text-base sm:text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 min-h-[48px] px-4 sm:px-5 py-3 rounded-full bg-apple-blue text-white text-sm sm:text-sm font-medium whitespace-nowrap hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </form>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-5 sm:p-8"
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
      )}
    </div>
  )
}
