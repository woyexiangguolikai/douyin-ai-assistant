import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Copy, Check, Radio } from 'lucide-react'

interface Props {
  danmaku: any[]
  completedHistory: any[]
  streamingReply: { text: string; danmaku: any[] } | null
}

export function LiveFeed({ danmaku, completedHistory, streamingReply }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState('')
  const typingTimerRef = useRef<any>(null)
  const typingIdxRef = useRef(0)

  // Typing animation effect
  useEffect(() => {
    if (!streamingReply) {
      setTypingText('')
      typingIdxRef.current = 0
      return
    }
    const fullText = streamingReply.text
    const typeStep = () => {
      if (typingIdxRef.current < fullText.length) {
        typingIdxRef.current += 2
        setTypingText(fullText.substring(0, typingIdxRef.current))
        if (typingIdxRef.current < fullText.length) {
          typingTimerRef.current = setTimeout(typeStep, 25)
        }
      }
    }
    if (typingIdxRef.current < fullText.length) {
      typingTimerRef.current = setTimeout(typeStep, 25)
    }
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current) }
  }, [streamingReply?.text])

  const connectionMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const reply of completedHistory) {
      for (const dm of (reply.danmaku || [])) {
        const key = dm.username + ':' + dm.content
        if (!map.has(key)) map.set(key, reply)
      }
    }
    return map
  }, [completedHistory.length])

  const rows = useMemo(() => {
    const items: Array<{ key: string; danmaku: any; aiReply: any }> = []
    for (const dm of danmaku) {
      const key = dm.username + ':' + dm.content
      items.push({
        key: dm.id || key + '_' + Date.now(),
        danmaku: dm,
        aiReply: connectionMap.get(key) || null,
      })
    }
    return items
  }, [danmaku.length, completedHistory.length, connectionMap])

  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [rows.length, streamingReply?.text])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
  }

  const handleCopy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) } catch {}
  }

  const hasContent = rows.length > 0 || streamingReply

  if (!hasContent) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <Radio size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm font-heading" style={{ color: 'rgba(255,255,255,0.4)' }}>连接直播间后显示弹幕和 AI 回复</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-stretch shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-1 py-2 px-3">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>弹幕</span>
        </div>
        <div className="w-8 shrink-0" />
        <div className="flex-1 py-2 px-3">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(204,255,0,0.5)' }}>AI 回复</span>
        </div>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {streamingReply && (
          <div className="flex items-stretch min-h-[60px]">
            <div className="flex-1 px-3 py-2 flex items-start">
              {streamingReply.danmaku && streamingReply.danmaku.length > 0 && (
                <div className="w-full">
                  {streamingReply.danmaku.slice(-2).map((dm: any, i: number) => (
                    <span key={i} className="block text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(255,255,255,0.5)' }}>
                      {dm.username}: {dm.content}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="w-8 shrink-0 flex justify-center pt-3 relative">
              <div className="w-px h-full" style={{ borderLeft: '2px dashed rgba(204,255,0,0.5)' }} />
            </div>
            <div className="flex-1 px-3 py-2 flex items-start">
              <div className="w-full" style={{
                background: 'rgba(204,255,0,0.06)',
                border: '1px solid rgba(204,255,0,0.2)',
                borderRadius: '1rem',
                padding: '10px 14px',
                position: 'relative',
              }}>
                <div className="flex items-center gap-1.5 mb-1" style={{animation: "fadeIn 0.3s ease-out"}}>
                  <Radio size={10} style={{ color: '#ccff00' }} className="animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'rgba(204,255,0,0.7)' }}>生成中...</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {typingText || streamingReply.text}
                  <span className="inline-block w-0.5 h-3.5 bg-lime ml-0.5 animate-pulse" />
                </p>
              </div>
            </div>
          </div>
        )}

        {rows.map((row) => {
          const aiReply = row.aiReply
          const isStreamingSource = streamingReply && streamingReply.danmaku?.some(
            (d: any) => d.username === row.danmaku.username && d.content === row.danmaku.content
          )
          const showConnector = aiReply || isStreamingSource

          return (
            <div key={row.key} className="flex items-stretch min-h-[36px] hover:bg-white/[0.01] transition-colors">
              <div className="flex-1 px-3 py-1.5 flex items-start">
                <span className="text-xs font-medium shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ccff00', minWidth: '70px' }}>
                  {row.danmaku.username}
                </span>
                <span className="text-sm break-words" style={{ color: '#ebebeb' }}>
                  {row.danmaku.content}
                </span>
              </div>

              <div className="w-8 shrink-0 flex justify-center pt-3 relative">
                {showConnector && (
                  <div className="w-px h-full" style={{ borderLeft: '2px dashed rgba(204,255,0,0.25)' }} />
                )}
              </div>

              <div className="flex-1 px-3 py-1.5 flex items-start">
                {aiReply && (
                  <div className="w-full" style={{
                    background: 'rgba(204,255,0,0.04)',
                    border: '1px solid rgba(204,255,0,0.12)',
                    borderRadius: '0.75rem',
                    padding: '8px 12px',
                  }}>
                    <p className="text-sm leading-relaxed" style={{ color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {aiReply.text}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{aiReply.time}</span>
                      <button onClick={() => handleCopy(aiReply.text, aiReply.id)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-pill text-[9px] font-mono uppercase tracking-wider transition-all hover:bg-white/5"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {copiedId === aiReply.id ? <Check size={9} /> : <Copy size={9} />}
                        {copiedId === aiReply.id ? '已复制' : '复制'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div className="h-2" />
      </div>

      <div className="flex items-center gap-3 px-3 py-1.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
          弹幕 {danmaku.length} 条 · AI {completedHistory.length} 条
        </span>
        <button onClick={() => autoScrollRef.current = true}
          className="font-mono text-[10px] uppercase tracking-wider hover:text-lime transition-all"
          style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
          最新
        </button>
      </div>
    </div>
  )
}
