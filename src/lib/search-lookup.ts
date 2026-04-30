import { SEARCH_COS_BASE_URL } from '@/lib/constants'
import type { SearchIndex, SearchResult } from '@/types/search'

export function getSearchImageUrl(key: string): string {
  return `${SEARCH_COS_BASE_URL}/${encodeURIComponent(key)}`
}

/** 在已加载的索引中查字，逻辑与 use-search-chat.searchChar 一致 */
export function lookupCharsInIndex(
  indexData: SearchIndex,
  chars: string,
  preferSeries?: string,
): { results: Record<string, SearchResult[]>; totalFiles: number } {
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
          allFilesForSeries.push({
            series,
            fileName: item.fileName,
            index: item.index,
            key: item.key,
            url: getSearchImageUrl(item.key),
          })
        }
      }
    }

    if (allFilesForSeries.length > 0) {
      results[series] = allFilesForSeries
      totalFiles += allFilesForSeries.length
    }
  }

  return { results, totalFiles }
}

export function getAllImagesFromResults(results: Record<string, SearchResult[]>) {
  return Object.entries(results).flatMap(([series, files]) =>
    files.map((file) => ({
      url: file.url,
      fileName: file.fileName,
      series,
      index: file.index,
    })),
  )
}
