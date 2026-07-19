import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RoomDetail from './pages/RoomDetail'
import Users from './pages/Users'
import Layout from './pages/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const [setupMode, setSetupMode] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').catch(() => {
      // 如果获取失败，检查是否需要初始化
      fetch('/api/health').then(r => r.json()).then(() => {
        // 服务器在运行
      })
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login onSetup={() => setSetupMode(true)} />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="rooms" replace />} />
          <Route path="rooms" element={<Dashboard />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function SetupPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { api } = await import('./lib/api')
      await api.register(username, password, true)
      setDone(true)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (done) return <div className="min-h-screen flex items-center justify-center bg-brutal-bg">
    <div className="bg-white border-4 border-black p-8 rounded-xl shadow-brutal text-center">
      <h1 className="text-2xl font-black mb-4">初始化完成 🎉</h1>
      <a href="/" className="inline-block px-6 py-3 bg-black text-white font-black rounded-lg border-2 border-black shadow-brutal-sm hover:shadow-brutal transition-all">去登录</a>
    </div>
  </div>

  return <div className="min-h-screen flex items-center justify-center bg-brutal-bg p-4">
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border-4 border-black rounded-xl p-8 shadow-brutal">
      <h1 className="text-2xl font-black mb-2">初始化管理员</h1>
      <p className="text-sm text-brutal-muted mb-6">首次使用，创建管理员账号</p>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="管理员账号" className="w-full border-4 border-black rounded-lg px-4 py-3 mb-4 font-bold text-lg focus:outline-none focus:shadow-brutal-sm transition-all" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" className="w-full border-4 border-black rounded-lg px-4 py-3 mb-6 font-bold text-lg focus:outline-none focus:shadow-brutal-sm transition-all" />
      <button type="submit" className="w-full py-3 bg-black text-white font-black text-lg rounded-lg border-2 border-black shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-1 active:translate-y-1">创建管理员</button>
    </form>
  </div>
}