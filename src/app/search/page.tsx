'use client'

import { SiteNav } from '@/components/layout/site-nav'
import { MAX_EXPAND_COUNT, PREVIEW_COUNT } from '@/lib/constants'
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

                {message.results && Object.entries(message.results).map(([series, files]) => {
                  const seriesKey = `${message.id}-${series}`
                  const isExpanded = expandedSeries.has(seriesKey)
                  const visibleFiles = isExpanded ? files.slice(0, MAX_EXPAND_COUNT) : files.slice(0, PREVIEW_COUNT)
                  const hiddenCount = files.length - PREVIEW_COUNT
                  return (
                    <div key={series} className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-apple-near-black border border-[#d2d2d7]">{series}</span>
                        <span className="text-xs text-black/60">{files.length} 种写法</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-2">
                        {visibleFiles.map((file, index) => {
                          const allImages = getAllImages(message.results!)
                          const currentIndex = allImages.findIndex((image) => image.url === file.url)
                          return (
                            <div
                              key={`${file.key}-${index}`}
                              className="relative min-h-[44px] min-w-0 bg-white rounded-lg overflow-hidden border border-[#e5e5e5] cursor-pointer active:opacity-90 hover:shadow-md hover:border-apple-blue transition-all group"
                              onClick={() => setLightbox({ url: file.url, fileName: file.fileName, series, allImages, currentIndex })}
                            >
                              <img src={file.url} alt={`${series} ${file.fileName}`} className="w-full aspect-square object-contain p-1.5 sm:p-1 group-hover:scale-105 transition-transform" loading="lazy" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1">
                                <span className="text-[10px] text-white/90">#{file.index}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {files.length > PREVIEW_COUNT && (
                        <button
                          onClick={() => setExpandedSeries((previous) => {
                            const next = new Set(previous)
                            if (isExpanded) next.delete(seriesKey)
                            else next.add(seriesKey)
                            return next
                          })}
                          className="mt-3 w-full min-h-[44px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5 transition-colors"
                        >
                          {isExpanded ? '收起' : `显示更多（还有 ${hiddenCount} 种）`}
                        </button>
                      )}
                    </div>
                  )
                })}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[min(92vw,640px)] max-h-[88vh] p-3 sm:p-5 flex flex-col items-center gap-3 sm:gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.fileName}
              className="max-w-full max-h-[min(68vh,520px)] sm:max-h-[60vh] object-contain rounded-lg"
            />
            <p className="text-xs text-black/50 text-center px-2">点击周围暗区关闭</p>
          </div>
        </div>
      )}
    </div>
  )
}
