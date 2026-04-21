'use client'

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
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl backdrop-saturate-[180%]">
        <div className="max-w-[980px] mx-auto px-6 flex items-center justify-between h-12">
          <a href="/" className="text-white text-sm font-semibold tracking-tight no-underline">何慧敏书法</a>
          <div className="flex items-center gap-6">
            <span className="text-white text-sm font-medium">楚简查字</span>
            <a href="/" className="text-white/80 text-xs hover:text-white transition-colors no-underline">← 返回首页</a>
          </div>
        </div>
      </nav>

      <section className="bg-apple-light-gray py-16 md:py-20">
        <div className="max-w-[680px] mx-auto px-6 text-center">
          <h1 className="font-display text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-apple-near-black mb-3">楚简查字</h1>
          <p className="text-[17px] text-black/60 mb-8">输入汉字，查询郭店楚简、包山楚简、清华简、上博楚简中的写法</p>
          <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-[480px] mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
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

      <section className="max-w-[980px] mx-auto px-6 py-10">
        <div className="space-y-8">
          {messages.map((message) => (
            <div key={message.id} className={`animate-fade-in ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'bg-apple-blue text-white rounded-2xl rounded-br-sm px-5 py-3' : 'bg-apple-light-gray text-black rounded-2xl rounded-bl-sm px-5 py-3'}`}>
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</p>

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
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {visibleFiles.map((file, index) => {
                          const allImages = getAllImages(message.results!)
                          const currentIndex = allImages.findIndex((image) => image.url === file.url)
                          return (
                            <div key={`${file.key}-${index}`} className="relative bg-white rounded-lg overflow-hidden border border-[#e5e5e5] cursor-pointer hover:shadow-md hover:border-apple-blue transition-all group" onClick={() => setLightbox({ url: file.url, fileName: file.fileName, series, allImages, currentIndex })}>
                              <img src={file.url} alt={`${series} ${file.fileName}`} className="w-full aspect-square object-contain p-1 group-hover:scale-105 transition-transform" loading="lazy" />
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
                          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5 transition-colors"
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

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-[90vw] max-h-[90vh] p-5 flex flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.fileName} className="max-w-[70vw] max-h-[60vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
