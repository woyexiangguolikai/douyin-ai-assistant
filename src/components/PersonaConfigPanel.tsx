import React, { useState, useEffect } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'

interface Persona {
  id: string; name: string; nicknames: string[]; personality: string[]; style: string
  tone: string; catchphrases: string[]; forbiddenTopics: string[]; fanTitle: string
  background: string; strengths: string[]; greetingPhrase: string; signOff: string; customPrompt: string
}

export function PersonaConfigPanel() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState<string>('default')
  const [saved, setSaved] = useState(false)
  const selected = personas.find(p => p.id === selectedId) || personas[0]

  useEffect(() => { loadPersonas() }, [])
  const loadPersonas = async () => {
    const list = await window.electronAPI?.personas.list()
    if (list && list.length > 0) { setPersonas(list); setSelectedId(list[0].id) }
  }
  const handleSave = async () => {
    if (!selected) return; await window.electronAPI?.personas.save(selected)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  const handleDelete = async () => {
    if (!selected || selected.id === 'default') return
    await window.electronAPI?.personas.delete(selected.id); await loadPersonas()
  }
  const handleNew = () => {
    const p: Persona = { id: 'p_' + Date.now(), name: '新人设', nicknames: ['主播'], personality: ['亲切', '幽默'], style: '闲聊互动', tone: '轻松自然', catchphrases: [], forbiddenTopics: [], fanTitle: '家人们', background: '', strengths: [], greetingPhrase: '', signOff: '', customPrompt: '' }
    setPersonas(prev => [...prev, p]); setSelectedId(p.id)
  }
  const updateField = (field: keyof Persona, value: any) => {
    setPersonas(prev => prev.map(p => p.id === selectedId ? { ...p, [field]: value } : p))
  }

  const ipt: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#ebebeb', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', padding: '12px 16px', outline: 'none', width: '100%' }
  const lbl: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }

  if (!selected) return <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-lime border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="h-full overflow-y-auto p-2 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold tracking-tight text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>人设配置</h2>
        <div className="flex gap-2">
          <button onClick={handleNew} className="flex items-center gap-1 px-4 py-1.5 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Plus size={14} /> 新人设</button>
          {selected.id !== 'default' && (
            <button onClick={handleDelete} className="px-4 py-1.5 border border-white/10 text-text-secondary rounded-pill text-sm hover:text-red-300 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Trash2 size={14} className="inline mr-1" />删除</button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {personas.map(p => (
          <button key={p.id} onClick={() => setSelectedId(p.id)}
            className={`px-3 py-1.5 rounded-pill text-sm font-heading font-medium transition-all ${p.id === selectedId ? 'bg-lime text-black' : 'text-text-secondary border border-white/10 hover:text-text-primary'}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</button>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label style={lbl}>名称</label><input value={selected.name} onChange={e => updateField('name', e.target.value)} className="w-full" style={ipt} placeholder="例如: 电台主播" /></div>
          <div><label style={lbl}>粉丝称呼</label><input value={selected.fanTitle} onChange={e => updateField('fanTitle', e.target.value)} className="w-full" style={ipt} placeholder="例如: 家人们、宝贝们" /></div>
          <div className="col-span-2"><label style={lbl}>性格标签（逗号分隔）</label><input value={selected.personality.join('、')} onChange={e => updateField('personality', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className="w-full" style={ipt} placeholder="例如: 亲切、幽默、真诚" /></div>
          <div className="col-span-2"><label style={lbl}>直播风格</label><input value={selected.style} onChange={e => updateField('style', e.target.value)} className="w-full" style={ipt} placeholder="例如: 闲聊互动 / 音乐电台 / 才艺展示" /></div>
          <div className="col-span-2"><label style={lbl}>语气风格</label><textarea value={selected.tone} onChange={e => updateField('tone', e.target.value)} rows={2} className="w-full resize-none" style={ipt} placeholder="例如: 轻松自然，像朋友聊天一样" /></div>
          <div className="col-span-2"><label style={lbl}>口头禅（逗号分隔）</label><input value={selected.catchphrases.join('、')} onChange={e => updateField('catchphrases', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className="w-full" style={ipt} placeholder="例如: 感谢老铁、安排上了" /></div>
          <div className="col-span-2"><label style={lbl}>禁忌话题（逗号分隔）</label><input value={selected.forbiddenTopics.join('、')} onChange={e => updateField('forbiddenTopics', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className="w-full" style={ipt} placeholder="例如: 政治、宗教、涉黄" /></div>
          <div><label style={lbl}>开场白</label><input value={selected.greetingPhrase} onChange={e => updateField('greetingPhrase', e.target.value)} className="w-full" style={ipt} placeholder="欢迎家人们来到直播间" /></div>
          <div><label style={lbl}>结束语</label><input value={selected.signOff} onChange={e => updateField('signOff', e.target.value)} className="w-full" style={ipt} placeholder="感谢大家的陪伴，明天见" /></div>
          <div className="col-span-2"><label style={lbl}>主播背景</label><textarea value={selected.background} onChange={e => updateField('background', e.target.value)} rows={2} className="w-full resize-none" style={ipt} placeholder="介绍主播的背景故事、特长等信息" /></div>
          <div className="col-span-2"><label style={lbl}>擅长领域（逗号分隔）</label><input value={selected.strengths.join('、')} onChange={e => updateField('strengths', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className="w-full" style={ipt} placeholder="例如: 聊天互动、讲故事、接梗" /></div>
          <div className="col-span-2"><label style={lbl}>自定义提示词</label><textarea value={selected.customPrompt} onChange={e => updateField('customPrompt', e.target.value)} rows={4} className="w-full resize-none" style={ipt} placeholder="补充额外的 AI 行为指导，比如擅长用方言互动、讲故事要注重细节描写等" /></div>
        </div>
        <button onClick={handleSave} className="mt-4 px-6 py-2.5 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
          <Save size={16} className="inline mr-2" />{saved ? '已保存' : '保存人设'}
        </button>
      </div>
    </div>
  )
}