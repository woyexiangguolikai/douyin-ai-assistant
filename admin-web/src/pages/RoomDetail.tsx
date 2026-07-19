import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Key, User, MessageCircle, AlertTriangle, Brain, Sliders } from 'lucide-react'
import { api } from '../lib/api'

export default function RoomDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const [room, setRoom] = useState<any>(null)
  const [persona, setPersona] = useState<any>(null)
  const [ai, setAi] = useState<any>(null)
  const [tab, setTab] = useState('persona')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getRooms().then(rooms => setRoom(rooms.find((r: any) => r.id == id)))
    api.getPersona(Number(id)).then(setPersona)
    api.getAiSettings(Number(id)).then(setAi)
  }, [id])

  const updatePersona = (f: string, v: any) => setPersona((p: any) => ({ ...p, [f]: v }))
  const updateAi = (f: string, v: any) => setAi((p: any) => ({ ...p, [f]: v }))
  const handleSavePersona = async () => { setSaving(true); try { await api.savePersona(Number(id), persona) } catch {}; setSaving(false) }
  const handleSaveAi = async () => { setSaving(true); try { await api.saveAiSettings(Number(id), ai) } catch {}; setSaving(false) }

  const inputBase = 'bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors w-full'
  const labelBase = 'block text-text-secondary text-xs mb-1.5 font-mono uppercase tracking-wider'

  const tabs = [
    { id: 'persona', label: '人设', icon: <User size={16} /> },
    { id: 'prompt', label: '提示词', icon: <MessageCircle size={16} /> },
    { id: 'ai', label: 'AI 设置', icon: <Brain size={16} /> },
  ]

  if (!room || !persona) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-lime border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/app/rooms')} className="flex items-center gap-2 text-text-secondary text-sm font-heading mb-4 hover:text-text-primary transition-all"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${room.status === 'online' ? 'bg-lime' : room.status === 'error' ? 'bg-red-500' : 'bg-text-muted'}`} />
          <h2 className="text-2xl font-heading font-bold tracking-tight text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.04em' }}>{room.name || room.room_id}</h2>
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">{room.status === 'online' ? '在线' : room.status === 'error' ? '异常' : '离线'}</span>
        </div>
        <p className="font-mono text-xs text-text-muted">ID: {room.room_id} {room.operator_name ? '| 运营: ' + room.operator_name : ''}</p>
        {room.status_message && <p className="text-xs text-red-300 mt-1"><AlertTriangle size={12} className="inline" /> {room.status_message}</p>}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-heading font-medium transition-all ${
              tab === t.id ? 'bg-lime text-black' : 'text-text-secondary border border-white/10 hover:text-text-primary'
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'persona' && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-text-primary text-lg mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>人设配置</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><label className={labelBase}>名称</label><input value={persona.name} onChange={e => updatePersona('name', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div><label className={labelBase}>粉丝称呼</label><input value={persona.fan_title} onChange={e => updatePersona('fan_title', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>性格标签</label><input value={(persona.personality || []).join('、')} onChange={e => updatePersona('personality', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>风格</label><input value={persona.style} onChange={e => updatePersona('style', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>语气</label><textarea value={persona.tone} onChange={e => updatePersona('tone', e.target.value)} rows={2} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>口头禅</label><input value={(persona.catchphrases || []).join('、')} onChange={e => updatePersona('catchphrases', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>禁忌话题</label><input value={(persona.forbidden_topics || []).join('、')} onChange={e => updatePersona('forbidden_topics', e.target.value.split('、').map((s: string) => s.trim()).filter(Boolean))} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div><label className={labelBase}>开场白</label><input value={persona.greeting_phrase} onChange={e => updatePersona('greeting_phrase', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div><label className={labelBase}>结束语</label><input value={persona.sign_off} onChange={e => updatePersona('sign_off', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div className="sm:col-span-2"><label className={labelBase}>背景</label><textarea value={persona.background} onChange={e => updatePersona('background', e.target.value)} rows={2} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
          </div>
          <button onClick={handleSavePersona} disabled={saving}
            className="px-6 py-3 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
            <Save size={16} className="inline mr-2" />{saving ? '保存中...' : '保存人设'}
          </button>
        </div>
      )}

      {tab === 'prompt' && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-text-primary text-lg mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>自定义提示词</h3>
          <div className="mb-4">
            <label className={labelBase}>提示词补充</label>
            <textarea value={persona.custom_prompt} onChange={e => updatePersona('custom_prompt', e.target.value)} rows={8} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <p className="text-text-muted text-xs mt-2 font-heading">附加到 AI 系统提示词中，用于精细化调教回复风格</p>
          </div>
          <button onClick={handleSavePersona} className="px-6 py-3 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
            <Save size={16} className="inline mr-2" />保存</button>
        </div>
      )}

      {tab === 'ai' && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-text-primary text-lg mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>AI 设置</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="sm:col-span-2"><label className={labelBase}>API Key</label><input value={ai.deepseek_api_key} onChange={e => updateAi('deepseek_api_key', e.target.value)} type="password" className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} /></div>
            <div><label className={labelBase}>模型</label><select value={ai.model} onChange={e => updateAi('model', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="deepseek-chat">DeepSeek V3</option><option value="deepseek-reasoner">DeepSeek R1</option></select></div>
            <div><label className={labelBase}>启用</label>
              <div onClick={() => updateAi('enabled', !ai.enabled)} className={`${inputBase} flex items-center gap-3 cursor-pointer ${ai.enabled ? 'border-lime/30' : ''}`} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
                <div className={`w-10 h-5 rounded-full border border-white/10 flex items-center px-0.5 transition-all ${ai.enabled ? 'bg-lime justify-end' : 'bg-glass-bg justify-start'}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-black" /></div>
                <span className="text-sm font-heading">{ai.enabled ? '已开启' : '已关闭'}</span></div></div>
            <div><label className={labelBase}>回复长度</label><select value={ai.reply_length} onChange={e => updateAi('reply_length', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="short">简短 (20字)</option><option value="medium">适中 (40字)</option><option value="long">详细 (60字)</option></select></div>
            <div><label className={labelBase}>语气</label><select value={ai.tone_style} onChange={e => updateAi('tone_style', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="natural">自然亲切</option><option value="humorous">幽默风趣</option><option value="gentle">温柔感性</option><option value="witty">机智毒舌</option></select></div>
            <div><label className={labelBase}>话题深度</label><select value={ai.topic_depth} onChange={e => updateAi('topic_depth', e.target.value)} className={inputBase} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="shallow">浅（简单回应）</option><option value="normal">适中（延展话题）</option><option value="deep">深入（展开讨论）</option></select></div>
          </div>
          <button onClick={handleSaveAi} disabled={saving}
            className="px-6 py-3 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
            <Save size={16} className="inline mr-2" />{saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      )}
    </div>
  )
}