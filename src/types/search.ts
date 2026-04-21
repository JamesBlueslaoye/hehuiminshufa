export interface IndexItem {
  key: string
  fileName: string
  index: string
}

export interface SearchIndex {
  version: number
  updatedAt: string
  series: Record<string, Record<string, IndexItem[]>>
}

export interface SearchResult {
  series: string
  fileName: string
  index: string
  key: string
  url: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  results?: Record<string, SearchResult[]>
  timestamp: Date
}

export interface LightboxImage {
  url: string
  fileName: string
  series: string
}

export interface LightboxState extends LightboxImage {
  allImages: LightboxImage[]
  currentIndex: number
}
