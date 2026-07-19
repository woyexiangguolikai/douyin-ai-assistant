import React from 'react'
import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const handleMinimize = () => window.electronAPI?.window.minimize()
  const handleMaximize = () => window.electronAPI?.window.maximize()
  const handleClose = () => window.electronAPI?.window.close()

  return (
    <div className="flex items-center justify-between h-10 px-3 select-none shrink-0"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        WebkitAppRegion: 'drag' as any
      }}>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm bg-lime" style={{ boxShadow: '0 0 10px rgba(204,255,0,0.3)' }} />
        <span className="text-xs font-heading font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
          抖音AI直播助手
        </span>
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' as any }}>
        <button onClick={handleMinimize} className="p-1.5 hover:bg-white/5 rounded text-text-muted hover:text-text-primary transition-all"><Minus size={14} /></button>
        <button onClick={handleMaximize} className="p-1.5 hover:bg-white/5 rounded text-text-muted hover:text-text-primary transition-all"><Square size={12} /></button>
        <button onClick={handleClose} className="p-1.5 hover:bg-red-500/20 rounded text-text-muted hover:text-red-300 transition-all ml-0.5"><X size={14} /></button>
      </div>
    </div>
  )
}