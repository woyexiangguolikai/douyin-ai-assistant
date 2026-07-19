import React, { useState, useEffect } from 'react'
import { Save, ToggleLeft, ToggleRight, Info } from 'lucide-react'

interface FilterRule {
  id: string; name: string; type: string; enabled: boolean
  pattern?: string; minLength?: number; maxLength?: number; maxRepeat?: number; description: string
}

export function FilterConfigPanel() {
  const [rules, setRules] = useState<FilterRule[]>([])
  const [saved, setSaved] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { window.electronAPI?.filters.list().then(setRules) }, [])

  const handleSave = async () => { await window.electronAPI?.filters.save(rules); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  const updateRule = (id: string, field: string, value: any) => setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const selected = rules.find(r => r.id === selectedId)
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', padding: '12px 16px', outline: 'none', width: '100%' }

  if (rules.length === 0) return <div className="h-full flex items-center justify-center text-text-muted font-heading">加载中...</div>

  return (
    <div className="h-full flex gap-3">
      {/* 左侧规则列表 */}
      <div className="w-64 shrink-0 overflow-y-auto space-y-1 p-2" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-semibold text-sm text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>过滤规则</span>
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">{rules.filter(r => r.enabled).length}/{rules.length}</span>
        </div>
        {rules.map(rule => (
          <div key={rule.id} onClick={() => setSelectedId(rule.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedId === rule.id ? 'bg-glass-bg border border-white/10' : 'hover:bg-glass-bg border border-transparent'}`}
            style={selectedId === rule.id ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' } : {}}>
            <div onClick={(e) => { e.stopPropagation(); toggleRule(rule.id) }} className="text-text-muted hover:text-text-primary cursor-pointer">
              {rule.enabled ? <ToggleRight size={18} className="text-lime" /> : <ToggleLeft size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading text-text-primary truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{rule.name}</p>
              <p className="font-mono text-[10px] text-text-muted truncate">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 overflow-y-auto p-2">
        {selected ? (
          <div className="max-w-lg space-y-4">
            <h3 className="font-heading font-semibold text-text-primary text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{selected.name}</h3>
            <p className="font-mono text-xs text-text-muted">{selected.description}</p>
            
            <div className="flex items-center gap-2 p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem' }}>
              <Info size={14} className="text-lime shrink-0" />
              <p className="font-mono text-[10px] text-text-muted">启用/禁用此过滤规则</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-heading text-sm text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>启用规则</span>
              <div onClick={() => toggleRule(selected.id)} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-all ${selected.enabled ? 'bg-lime justify-end' : 'justify-start'}`}
                  style={{ background: selected.enabled ? '#ccff00' : 'rgba(255,255,255,0.05)' }}>
                  <div className="w-3.5 h-3.5 rounded-full bg-black" />
                </div>
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">{selected.enabled ? '已开' : '已关'}</span>
              </div>
            </div>

            {selected.type === 'length' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-1">最小字数</label>
                  <input type="number" value={selected.minLength || 1} onChange={e => updateRule(selected.id, 'minLength', Number(e.target.value))} min={1} max={50}
                    className="w-full" style={inputStyle} placeholder="例如: 2" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-1">最大字数</label>
                  <input type="number" value={selected.maxLength || 100} onChange={e => updateRule(selected.id, 'maxLength', Number(e.target.value))} min={10} max={500}
                    className="w-full" style={inputStyle} placeholder="例如: 100" />
                </div>
              </div>
            )}
            {selected.type === 'repeat' && (
              <div>
                <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-1">最大重复次数</label>
                <input type="number" value={selected.maxRepeat || 3} onChange={e => updateRule(selected.id, 'maxRepeat', Number(e.target.value))} min={2} max={20}
                  className="w-full" style={inputStyle} placeholder="例如: 3（5秒内）" />
              </div>
            )}
            {(selected.type === 'regex' || selected.type === 'ad') && (
              <div>
                <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-1">匹配模式</label>
                <textarea value={selected.pattern || ''} onChange={e => updateRule(selected.id, 'pattern', e.target.value)} rows={3}
                  className="w-full font-mono" style={inputStyle} placeholder='例如: 微信|兼职|扫码' />
                <p className="font-mono text-[10px] text-text-muted mt-1">用 | 分隔多个关键词</p>
              </div>
            )}

            <button onClick={handleSave}
              className="px-6 py-2.5 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all"
              style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
              <Save size={16} className="inline mr-2" />{saved ? '已保存' : '保存规则'}
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted font-heading text-sm">从左侧选择规则</div>
        )}
      </div>
    </div>
  )
}