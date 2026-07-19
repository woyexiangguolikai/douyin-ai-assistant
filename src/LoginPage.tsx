import React, { useState } from 'react'
import { Eye, EyeOff, Server } from 'lucide-react'

interface Props {
  onLogin: (token: string, user: any) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('http://localhost:3001')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const result = await window.electronAPI?.auth.login(apiUrl, username, password)
      if (!result?.success) setErr(result?.error || '登录失败')
      else onLogin(result.token, result.user)
    } catch (err: any) { setErr(err.message || '登录失败') }
    finally { setLoading(false) }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* 网格 */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="bg-noise" />
      <div className="glow-sphere fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(204,255,0,0.15)' }} />

      <form onSubmit={handleLogin} className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center mx-auto mb-3">
            <span className="text-black font-heading font-bold text-xl">D</span>
          </div>
          <h1 className="text-xl font-heading font-bold tracking-tight text-text-primary"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.06em' }}>
            抖音AI直播助手
          </h1>
        </div>

        {/* 玻璃登录卡片 */}
        <div className="p-6" style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem'
        }}>
          <h2 className="text-base font-heading font-semibold text-text-primary mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>
            登录
          </h2>

          {err && (
            <div className="mb-3 p-2.5 rounded-lg text-sm font-medium text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {err}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-text-muted text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              服务器地址
            </label>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              className="w-full px-4 py-2.5 text-text-primary text-sm focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px'
              }}
              placeholder="http://localhost:3001" />
          </div>

          <div className="mb-3">
            <label className="block text-text-muted text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              账号
            </label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-text-primary text-sm focus:outline-none transition-colors focus:border-lime/50"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
              placeholder="输入账号" autoFocus />
          </div>

          <div className="mb-5">
            <label className="block text-text-muted text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              密码
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-text-primary text-sm focus:outline-none transition-colors pr-10"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
                placeholder="输入密码" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 30px rgba(204,255,0,0.3)'
            }}>
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>

          <div className="mt-6 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.08)"}} />
              <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest">或</span>
              <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.08)"}} />
            </div>
            <button type="button" onClick={() => onLogin("", {role:"local"})}
              className="text-text-muted text-xs font-heading hover:text-text-primary transition-all"
              style={{fontFamily:"'Space Grotesk', sans-serif"}}>
              本地使用（无需服务器）
            </button>
          </div>
    </div>
  )
}