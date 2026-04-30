import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { SiteChatWidget } from '@/components/features/chat/site-chat-widget'

export const metadata: Metadata = {
  title: '何慧敏书法 — 楚简书法艺术',
  description: '何慧敏楚简书法作品展示，收录问道经典、楚简小品等系列作品',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-apple-near-black text-[15px] antialiased sm:text-[16px] md:text-[17px]">
        {children}
        <SiteChatWidget />
      </body>
    </html>
  )
}
