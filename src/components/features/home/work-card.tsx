'use client'

import type { WorkItem } from '@/types/work'

interface WorkCardProps {
  work: WorkItem
  onClick: () => void
}

export function WorkCard({ work, onClick }: WorkCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] transition-shadow text-left group border-0 cursor-pointer w-full"
    >
      <div className="aspect-[4/3] bg-apple-light-gray flex items-center justify-center overflow-hidden">
        <img
          src={work.url}
          alt={`${work.title?.trim() || '楚简字形'}｜何慧敏书法｜楚简书法`}
          className="max-w-[90%] max-h-[90%] object-contain transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-display text-[15px] sm:text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-near-black mb-1 line-clamp-2">
          {work.title}
        </h3>
        {work.source && (
          <p className="text-[12px] sm:text-[14px] tracking-[-0.224px] text-black/48 line-clamp-1">
            {work.source}
          </p>
        )}
      </div>
    </button>
  )
}
