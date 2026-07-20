import React, { useRef, useEffect, useState } from 'react'
import { Copy, Check, Sparkles, Trash2, Radio } from 'lucide-react'

interface Props { replies: any[]; summary?: string }

export function AIPanel({ replies, summary }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState<string | null>(null)
  const [streamingDone, setStreamingDone] = useState(true)
  const [streamingDanmaku, setStreamingDanmaku] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const api = window.electronAPI?.ai
    if (!api) return
    api.onReplyStart((data: any) => {
      setStreaming('generating'); setStreamingDone(false)
      if (data.danmaku) setStreamingDanmaku(data.danmaku)
    })

    api.onReplyStream((data: any) => {
      if (data.done) {
        setStreamingDone(true)
        const now = new Date()
        const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
        setHistory(prev => [...prev, { id: data.id || 'h_'+Date.now(), text: data.text, time: t, danmaku: data.danmaku || [] }])
        setStreaming(null); setStreamingDanmaku([])
      } else {
        setStreaming('generating'); setStreamingDone(false)
        if (data.danmaku) setStreamingDanmaku(data.danmaku)
      }
    })
    return () => { api.removeStartListener(); api.removeStreamListener() }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }, [history.length, streaming])

  const handleCopy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) } catch {}
  }

  const isEmpty = history.length === 0 && !streaming

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      {history.length > 0 && (
        <div className="flex items-center justify-end px-4 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setHistory([])} className="flex items-center gap-1 text-text-muted font-mono text-[10px] uppercase tracking-wider hover:text-text-primary transition-all">
            <Trash2 size={10} /> 清空
          </button>
        </div>
      )}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {isEmpty && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Sparkles size={32} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="text-sm font-heading" style={{ color: 'rgba(255,255,255,0.4)' }}>等待 AI 建议...</p>
            </div>
          </div>
        )}

        {streaming && (
          <div style={{
            background: 'rgba(204,255,0,0.05)', border: '1px solid rgba(204,255,0,0.2)',
            borderRadius: '1.5rem', padding: '1rem'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Radio size={12} className="text-lime" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-lime">{streamingDone ? 'AI 回复' : '正在生成...'}</span>
            </div>
            {streamingDanmaku.length > 0 && (
              <div className="mb-2 p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                {streamingDanmaku.slice(-3).map((d: any, i: number) => (
                  <span key={i} className="block font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {d.username}: {d.content}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm font-heading leading-relaxed" style={{ color: '#ebebeb' }}>
              AI 正在思考
              <span className="inline-flex gap-0.5 ml-1.5">
                <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-lime rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </p>
          </div>
        )}

        {history.map((item: any) => (
          <div key={item.id} className="animate-fade-in" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem', padding: '1rem'
          }}>
            {item.danmaku?.length > 0 && (
              <div className="mb-2 p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                {item.danmaku.slice(-3).map((d: any, i: number) => (
                  <span key={i} className="block font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {d.username}: {d.content}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm font-heading leading-relaxed mb-2" style={{ color: '#ebebeb' }}>{item.text}</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
              <button onClick={() => handleCopy(item.text, item.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-pill text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                {copiedId === item.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === item.id ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}