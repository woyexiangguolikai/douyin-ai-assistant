import React, { useState, useEffect } from 'react'
import { Save, Key, Radio, Eye } from 'lucide-react'

const g = (blur = true) => ({
  background: 'rgba(255,255,255,0.03)',
  ...(blur ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : {}),
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1.5rem'
})

const input = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1rem',
  color: '#ebebeb',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '14px',
  padding: '12px 16px',
  outline: 'none',
  width: '100%'
} as React.CSSProperties

const label = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.5)',
  display: 'block',
  marginBottom: '6px'
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<any>({
    deepseekApiKey: '', deepseekModel: 'deepseek-chat', aiEnabled: true,
    aiBatchInterval: 8, aiBatchSize: 15, windowOpacity: 1, alwaysOnTop: false
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => { window.electronAPI?.settings.get().then((s: any) => s && setSettings(s)) }, [])
  const handleSave = async () => { await window.electronAPI?.settings.save(settings); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const update = (k: string, v: any) => setSettings((p: any) => ({ ...p, [k]: v }))

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <div onClick={() => onChange(!value)} className="flex items-center gap-3 cursor-pointer" style={{ ...input, padding: '8px 16px', width: 'auto', display: 'inline-flex' }}>
      <div className={`w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-all ${value ? 'bg-lime justify-end' : 'justify-start'}`} style={{ background: value ? '#ccff00' : 'rgba(255,255,255,0.05)' }}>
        <div className="w-3.5 h-3.5 rounded-full bg-black" />
      </div>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px' }}>{value ? '已开启' : '已关闭'}</span>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-2 max-w-2xl mx-auto space-y-4">
      <h2 className="text-lg font-heading font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.04em', color: '#ebebeb' }}>设置</h2>

      <div style={g()}>
        <h3 className="flex items-center gap-2 font-heading font-semibold text-sm mb-4" style={{ color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif" }}>
          <Key size={14} style={{ color: '#ccff00' }} /> DeepSeek API
        </h3>
        <div className="space-y-3">
          <div>
            <label style={label}>API Key</label>
            <input type="password" value={settings.deepseekApiKey} onChange={e => update('deepseekApiKey', e.target.value)} placeholder="sk-xxxxxxxx" style={input} />
          </div>
          <div>
            <label style={label}>模型</label>
            <select value={settings.deepseekModel} onChange={e => update('deepseekModel', e.target.value)} style={input}>
              <option value="deepseek-chat">DeepSeek V3</option>
              <option value="deepseek-reasoner">DeepSeek R1</option>
            </select>
          </div>
        </div>
      </div>

      <div style={g()}>
        <h3 className="flex items-center gap-2 font-heading font-semibold text-sm mb-4" style={{ color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif" }}>
          <Radio size={14} style={{ color: '#ccff00' }} /> AI 处理
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>启用 AI</span>
            <Toggle value={settings.aiEnabled} onChange={v => update('aiEnabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={label}>批处理间隔（秒）</label>
              <input type="number" value={settings.aiBatchInterval} onChange={e => update('aiBatchInterval', Number(e.target.value))} min={3} max={30} style={input} />
            </div>
            <div>
              <label style={label}>每批弹幕数</label>
              <input type="number" value={settings.aiBatchSize} onChange={e => update('aiBatchSize', Number(e.target.value))} min={5} max={50} style={input} />
            </div>
          </div>
        </div>
      </div>

      <div style={g()}>
        <h3 className="flex items-center gap-2 font-heading font-semibold text-sm mb-4" style={{ color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif" }}>
          <Eye size={14} style={{ color: '#ccff00' }} /> 显示
        </h3>
        <div className="space-y-3">
          <div>
            <label style={label}>窗口透明度</label>
            <div className="flex items-center gap-3">
              <input type="range" value={settings.windowOpacity * 100} onChange={e => update('windowOpacity', Number(e.target.value) / 100)} min={30} max={100}
                className="flex-1 accent-lime" style={{ accentColor: '#ccff00' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.5)', minWidth: '40px', textAlign: 'right' }}>
                {Math.round(settings.windowOpacity * 100)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>窗口置顶</span>
            <Toggle value={settings.alwaysOnTop} onChange={v => update('alwaysOnTop', v)} />
          </div>
        </div>
      </div>

      <button onClick={handleSave}
        className="flex items-center gap-2 px-6 py-2.5 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-105"
        style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
        <Save size={16} /> {saved ? '已保存' : '保存设置'}
      </button>
    </div>
  )
}