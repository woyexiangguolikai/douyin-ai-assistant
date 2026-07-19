import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Radio, Monitor, Users, LogOut, Menu, X } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    navigate('/')
  }

  const navItems = [
    { path: '/app/rooms', label: '直播间', icon: <Monitor size={16} /> },
    ...(user.role === 'admin' ? [{ path: '/app/users', label: '运营', icon: <Users size={16} /> }] : []),
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 网格背景 */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      {/* 噪点 */}
      <div className="bg-noise" />
      {/* 辉光 */}
      <div className="glow-sphere fixed -top-40 -left-40 bg-lime/10" />
      <div className="glow-sphere fixed -bottom-40 -right-40 bg-emerald/10" />

      {/* 浮动容器 */}
      <div className="relative max-w-[1600px] mx-auto min-h-screen bg-obsidian-light rounded-shell ring-1 ring-white/10 shadow-2xl m-4 flex flex-col" style={{ borderRadius: '2.5rem' }}>

        {/* 顶部导航 */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          {/* Logo */}
          <Link to="/app/rooms" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime flex items-center justify-center">
              <span className="text-black font-heading font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>D</span>
            </div>
            <span className="text-text-primary font-heading font-semibold tracking-tight hidden sm:inline" 
              style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.06em' }}>
              抖音AI直播助手
            </span>
          </Link>

          {/* 导航 - 玻璃管状 */}
          <nav className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-pill" 
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm transition-all ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-lime text-black font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* 移动端菜单按钮 */}
          <MobileMenu navItems={navItems} currentPath={location.pathname} onLogout={handleLogout} user={user} />

          {/* 右侧状态 */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-lime" style={{ animation: 'pulse-lime 2s infinite' }} />
              <span className="text-text-muted">系统在线</span>
            </div>
            <span className="text-text-secondary text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{user.nickname || user.username}</span>
            <button onClick={handleLogout}
              className="bg-lime text-black font-bold rounded-pill px-5 py-2 text-sm transition-all hover:scale-105"
              style={{ boxShadow: '0 0 30px rgba(204,255,0,0.3)', fontFamily: "'Space Grotesk', sans-serif" }}>
              退出
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MobileMenu({ navItems, currentPath, onLogout, user }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div className="sm:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 text-text-primary">{open ? <X size={20} /> : <Menu size={20} />}</button>
      {open && (
        <div className="fixed inset-0 top-0 z-50 bg-obsidian flex flex-col p-6 gap-4" style={{ borderRadius: '2.5rem' }}>
          <button onClick={() => setOpen(false)} className="self-end p-2"><X size={24} /></button>
          <span className="text-text-muted text-sm">{user.nickname}</span>
          {navItems.map((item: any) => (
            <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-pill text-lg ${
                currentPath.startsWith(item.path) ? 'bg-lime text-black font-bold' : 'text-text-primary'
              }`}>
              {item.icon} {item.label}
            </Link>
          ))}
          <button onClick={onLogout} className="mt-auto px-6 py-3 bg-lime text-black font-bold rounded-pill text-center">退出</button>
        </div>
      )}
    </div>
  )
}