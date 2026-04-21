export interface WorkItem {
  key: string
  title: string
  url: string
  original?: string
  source?: string
  description?: string
  seriesSource?: 'wdjy' | 'zpzs'
}
