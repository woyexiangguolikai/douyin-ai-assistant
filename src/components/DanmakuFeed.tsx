import React, { useRef, useEffect } from 'react'
import { User, Clock } from 'lucide-react'

interface Props { items: any[] }

export function DanmakuFeed({ items }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [items.length])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <User size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm font-heading" style={{ color: 'rgba(255,255,255,0.4)' }}>等待弹幕接入...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-2 py-1.5 px-2.5 rounded-lg transition-all hover:bg-white/[0.02]">
            <span className="text-xs font-medium shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ccff00', minWidth: '70px' }}>
              {item.username}
            </span>
            <span className="text-sm flex-1 break-words" style={{ color: '#ebebeb' }}>
              {item.content}
            </span>
            <span className="text-[10px] shrink-0 font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {formatTime(item.timestamp)}
            </span>
          </div>
        ))}
      </div>
      <div className="px-3 py-1.5 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Clock size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
          共 {items.length} 条
        </span>
        <button onClick={() => autoScrollRef.current = true}
          className="ml-auto font-mono text-[10px] uppercase tracking-wider hover:text-lime transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          回到最新
        </button>
      </div>
    </div>
  )
}