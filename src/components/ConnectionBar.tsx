import React, { useState } from 'react'
import { Plug, Wifi, Globe, RefreshCw } from 'lucide-react'

interface Props {
  status: string; roomId: string; captureMethod: string
  stats: { total: number; filtered: number; replied: number }
  onConnect: (roomId: string) => void; onDisconnect: () => void; onSwitchMethod: (method: string) => void
}

export default function ConnectionBar({ status, roomId, captureMethod, onConnect, onDisconnect, onSwitchMethod }: Props) {
  const [inputRoomId, setInputRoomId] = useState(roomId)
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const statusLabel = status === 'connected' ? '在线' : status === 'connecting' ? '连接中' : status === 'error' ? '失败' : '未连接'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mx-3 mt-2" style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '1.5rem'
    }}>
      {/* 状态灯 */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-lime' : status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-lime animate-pulse' : 'bg-text-muted'}`} />
        <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>
          {statusLabel}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-2">
        {!isConnected ? (
          <>
            <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value.replace(/^https?:\/\/[^\/]+\//, '').replace(/\?.*$/, ''))}
              placeholder="输入直播间 ID..."
              disabled={isConnecting}
              className="flex-1 px-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace"
              }}
              onKeyDown={e => e.key === 'Enter' && inputRoomId && onConnect(inputRoomId)} />
            <button onClick={() => inputRoomId && onConnect(inputRoomId)} disabled={isConnecting || !inputRoomId}
              className="flex items-center gap-1 px-3 py-1.5 bg-lime text-black font-bold text-xs rounded-pill transition-all hover:scale-105 disabled:opacity-50"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {isConnecting ? <RefreshCw size={12} className="animate-spin" /> : <Plug size={12} />}
              {isConnecting ? '连接中' : '连接'}
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-xs font-heading text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="font-mono text-text-muted text-[10px] uppercase tracking-wider">ID:</span>
              {roomId}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-text-muted uppercase tracking-wider ml-2">
              {captureMethod === 'websocket' ? <Wifi size={10} /> : <Globe size={10} />}
              {captureMethod}
            </span>
              <button onClick={onDisconnect}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-pill transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                断开
              </button>
          </>
        )}
      </div>
    </div>
  )
}