import React, { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import ConnectionBar from './components/ConnectionBar'
import SettingsPanel from './components/SettingsPanel'
import { PersonaConfigPanel } from './components/PersonaConfigPanel'
import { FilterConfigPanel } from './components/FilterConfigPanel'
import { LiveFeed } from './components/LiveFeed'
import LoginPage from './LoginPage'
import { Radio, MessageSquare, Settings, User, Shield } from 'lucide-react'

type ViewType = 'live' | 'settings' | 'persona' | 'filters'
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
type CaptureMethod = 'websocket' | 'playwright'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('live')
  const [danmakuList, setDanmakuList] = useState<any[]>([])
  const [aiReplies, setAiReplies] = useState<any[]>([])
  const [completedHistory, setCompletedHistory] = useState<any[]>([])
  const [streamingReply, setStreamingReply] = useState<{text:string;danmaku:any[]}|null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>('playwright')
  const [roomId, setRoomId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [stats, setStats] = useState({ total: 0, filtered: 0, replied: 0 })

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api.capture.onDanmaku((data: any) => {
      setDanmakuList(prev => {
        const next = [...prev, { id: data.id, username: data.username, content: data.content, timestamp: data.timestamp, type: data.type }]
        return next.slice(-200)
      })
      setStats(s => ({ ...s, total: s.total + 1 }))
    })
    api.capture.onFiltered(() => setStats(s => ({ ...s, filtered: s.filtered + 1 })))
    api.capture.onStatus((status: string) => setConnectionStatus(status as ConnectionStatus))
    api.capture.onError((msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 8000) })
    api.ai.onReplies((data: any) => {
      setAiReplies(prev => [...(data.items || []), ...prev].slice(-50))
      if (data.summary) setAiSummary(data.summary)
      setStats(s => ({ ...s, replied: s.replied + (data.items?.length || 0) }))
    })
    api.ai.onReplyStart(() => { setAiGenerating(true) })
    api.ai.onReplyStream((data: any) => {
      if (!data.done) {
        setStreamingReply({ text: data.text, danmaku: data.danmaku || [] })
        return
      }
      const now = new Date()
      const ts = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0')
      setStreamingReply({ text: data.text, danmaku: data.danmaku || [] }); setAiGenerating(false); setCompletedHistory((prev: any[]) => [...prev, { id: data.id, text: data.text, danmaku: data.danmaku || [], time: ts }].slice(-200))
      setStreamingReply(null)
    })
    return () => { api.capture.removeDanmakuListeners(); api.ai.removeRepliesListener(); api.ai.removeStreamListener(); api.ai.removeStartListener() }
  }, [])

  useEffect(() => {
    window.electronAPI?.settings.get().then((s: any) => {
      if (s.roomId) setRoomId(s.roomId)
      if (s.captureMethod) setCaptureMethod(s.captureMethod)
    })
  }, [])

  const handleConnect = useCallback(async (rid: string) => {
    setRoomId(rid)
    const result = await window.electronAPI?.capture.connect(rid)
    if (result && !result.success) setErrorMessage(result.error || '连接失败')
  }, [])

  const handleDisconnect = useCallback(async () => { await window.electronAPI?.capture.disconnect() }, [])
  const handleSwitchMethod = useCallback(async (method: CaptureMethod) => {
    const result = await window.electronAPI?.capture.switchMethod(method)
    if (result?.success) setCaptureMethod(method)
  }, [])

  const handleExport = async () => {
    if (completedHistory.length === 0) return
    const text = completedHistory.map(r => '[' + r.time + '] ' + (r.danmaku?.[0]?.username || '') + ': ' + (r.danmaku?.[0]?.content || '') + '\nAI: ' + r.text).join('\n\n')
    await window.electronAPI?.export.save(text, 'ai-replies-' + new Date().toISOString().slice(0,10) + '.txt')
  }

  const handleLogin = (token: string, user: any) => setLoggedIn(true)

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />

  const navItems = [
    { id: 'live' as ViewType, label: '直播', icon: <MessageSquare size={16} /> },
    { id: 'persona' as ViewType, label: '人设', icon: <User size={16} /> },
    { id: 'filters' as ViewType, label: '过滤', icon: <Shield size={16} /> },
    { id: 'settings' as ViewType, label: '设置', icon: <Settings size={16} /> },
  ]

  return (
    <div className='h-screen bg-black flex flex-col relative overflow-hidden'>
      <div className='fixed inset-0 bg-grid pointer-events-none' />
      <div className='bg-noise' />
      <div className='glow-sphere fixed -top-40 -right-40' style={{ background: 'rgba(204,255,0,0.08)' }} />
      <div className='glow-sphere fixed -bottom-40 -left-40' style={{ background: 'rgba(16,185,129,0.08)' }} />

      <div className='relative z-10 flex flex-col h-full'>
        <TitleBar />
        <ConnectionBar status={connectionStatus} roomId={roomId} captureMethod={captureMethod}
          stats={stats} onConnect={handleConnect} onDisconnect={handleDisconnect}
          onSwitchMethod={handleSwitchMethod} />

        {errorMessage && (
          <div className='mx-4 mt-2 p-2.5 text-sm font-medium text-red-300' style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem'
          }}>{errorMessage}</div>
        )}

        <div className='flex items-center gap-1 px-4 py-2' style={{
          background: 'rgba(255,255,255,0.02)', margin: '0 12px', borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-medium rounded-pill transition-all ${currentView === item.id ? 'bg-lime text-black' : 'text-text-secondary hover:text-text-primary'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {item.icon} {item.label}
            </button>
          ))}
                              <button onClick={handleExport} className="px-2 py-1 bg-lime text-black font-bold text-[10px] rounded-pill hover:scale-105 transition-all font-mono uppercase tracking-wider">导出</button>
          <div className='ml-auto flex items-center gap-3 text-text-muted' style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>{stats.total} 条</span><span>过滤 {stats.filtered}</span><span>AI {stats.replied}</span>
          </div>
        </div>

        <main className='flex-1 overflow-hidden p-3' style={{ marginTop: '4px' }}>
          {currentView === 'live' && <LiveFeed danmaku={danmakuList} completedHistory={completedHistory} streamingReply={streamingReply} aiGenerating={aiGenerating} />}
          {currentView === 'settings' && <SettingsPanel />}
          {currentView === 'persona' && <PersonaConfigPanel />}
          {currentView === 'filters' && <FilterConfigPanel />}
        </main>
      </div>
    </div>
  )
}
