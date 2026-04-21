import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '何慧敏书法 — 楚简书法艺术',
  description: '何慧敏楚简书法作品展示，收录问道经典、楚简小品等系列作品',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-apple-near-black">{children}</body>
    </html>
  )
}
