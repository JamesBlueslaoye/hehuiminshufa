import { Suspense } from 'react'
import { HomeInner } from './home-inner'

function HomeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-bounce rounded-full bg-apple-blue" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-apple-blue [animation-delay:150ms]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-apple-blue [animation-delay:300ms]" />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeInner />
    </Suspense>
  )
}
