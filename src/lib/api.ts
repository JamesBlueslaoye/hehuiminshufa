import type { SearchIndex } from '@/types/search'

export async function fetchWorksMap(path: '/works.json' | '/zpzs/works.json'): Promise<Record<string, Record<string, string>>> {
  const response = await fetch(path)
  return response.json()
}

export async function fetchSearchIndex(): Promise<SearchIndex> {
  const response = await fetch('/search-index.json')
  return response.json()
}
