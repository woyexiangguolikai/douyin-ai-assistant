import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Login({ onSetup }: { onSetup: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const data = await api.login(username, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/app/rooms')
    } catch (err: any) { setErr(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="bg-noise" />
      <div className="glow-sphere fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-lime/20" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-lime flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-heading font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-text-primary"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.06em' }}>
            抖音AI直播助手
          </h1>
          <p className="text-text-muted text-sm mt-1 font-heading">管理后台</p>
        </div>

        {/* 登录卡片 */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-heading font-semibold tracking-tight text-text-primary mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>
            登录
          </h2>

          {err && <div className="mb-4 p-3 rounded-card bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-300">{err}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-text-secondary text-xs mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>账号</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
                placeholder="输入账号" autoFocus
                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            </div>
            <div className="mb-6">
              <label className="block text-text-secondary text-xs mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
                placeholder="输入密码"
                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}