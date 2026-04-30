'use client'

import type { Dispatch, SetStateAction } from 'react'
import { MAX_EXPAND_COUNT, PREVIEW_COUNT } from '@/lib/constants'
import type { LightboxImage, SearchResult } from '@/types/search'

interface SearchInlineResultsProps {
  messageId: string
  results: Record<string, SearchResult[]>
  expandedSeries: Set<string>
  setExpandedSeries: Dispatch<SetStateAction<Set<string>>>
  getAllImages: (results: Record<string, SearchResult[]>) => LightboxImage[]
  onImageClick: (payload: {
    url: string
    fileName: string
    series: string
    index?: string
    allImages: LightboxImage[]
    currentIndex: number
  }) => void
}

export function SearchInlineResults({
  messageId,
  results,
  expandedSeries,
  setExpandedSeries,
  getAllImages,
  onImageClick,
}: SearchInlineResultsProps) {
  return (
    <>
      {Object.entries(results).map(([series, files]) => {
        const seriesKey = `${messageId}-${series}`
        const isExpanded = expandedSeries.has(seriesKey)
        const visibleFiles = isExpanded ? files.slice(0, MAX_EXPAND_COUNT) : files.slice(0, PREVIEW_COUNT)
        const hiddenCount = files.length - PREVIEW_COUNT
        return (
          <div key={series} className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-apple-near-black border border-[#d2d2d7]">
                {series}
              </span>
              <span className="text-xs text-black/60">{files.length} 种写法</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {visibleFiles.map((file, index) => {
                const allImages = getAllImages(results)
                const currentIndex = allImages.findIndex((image) => image.url === file.url)
                return (
                  <div
                    key={`${file.key}-${index}`}
                    className="relative min-h-[40px] min-w-0 bg-white rounded-lg overflow-hidden border border-[#e5e5e5] cursor-pointer active:opacity-90 hover:shadow-md hover:border-apple-blue transition-all group"
                    onClick={() =>
                      onImageClick({
                        url: file.url,
                        fileName: file.fileName,
                        series,
                        index: file.index,
                        allImages,
                        currentIndex,
                      })
                    }
                  >
                    <img
                      src={file.url}
                      alt={`${(file.fileName || `${series} 楚简字形`).trim()}｜何慧敏书法｜楚简书法`}
                      className="w-full aspect-square object-contain p-1 sm:p-1.5 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1">
                      <span className="text-[10px] text-white/90">#{file.index}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {files.length > PREVIEW_COUNT ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedSeries((previous) => {
                    const next = new Set(previous)
                    if (isExpanded) next.delete(seriesKey)
                    else next.add(seriesKey)
                    return next
                  })
                }
                className="mt-3 w-full min-h-[44px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5 transition-colors"
              >
                {isExpanded ? '收起' : `显示更多（还有 ${hiddenCount} 种）`}
              </button>
            ) : null}
          </div>
        )
      })}
    </>
  )
}
