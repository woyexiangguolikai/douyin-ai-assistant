import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, User } from 'lucide-react'
import { api } from '../lib/api'

export default function Users() {
  const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false); const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ username: '', password: '', nickname: '', role: 'operator' })

  useEffect(() => { load() }, [])
  async function load() { try { setUsers(await api.getUsers()) } catch {} finally { setLoading(false) } }
  function openCreate() { setEditUser(null); setForm({ username: '', password: '', nickname: '', role: 'operator' }); setShowForm(true) }
  function openEdit(u: any) { setEditUser(u); setForm({ username: u.username, password: '', nickname: u.nickname, role: u.role }); setShowForm(true) }
  async function handleSave() {
    if (editUser) { const d: any = { nickname: form.nickname, role: form.role }; if (form.password) d.password = form.password; await api.updateUser(editUser.id, d) }
    else { await api.createUser(form) }
    setShowForm(false); load()
  }
  async function handleDelete(id: number) { if (!confirm('确定删除？')) return; await api.deleteUser(id); load() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-lime border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold tracking-tight text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.06em' }}>运营管理</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-105" style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
          <Plus size={18} /> 添加运营</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4"><div className="w-2 h-2 rounded-full bg-lime" /><h3 className="font-heading font-semibold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{editUser ? '编辑' : '添加运营'}</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} disabled={!!editUser} placeholder="账号"
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={editUser ? '新密码（留空不改）' : '密码'} type="password"
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <input value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} placeholder="昵称"
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="operator">运营</option><option value="admin">管理员</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-6 py-2 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all">保存</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-white/10 text-text-secondary rounded-pill text-sm hover:text-text-primary transition-all">取消</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {users.map(u => (
          <div key={u.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-glass-bg border border-white/10 flex items-center justify-center" 
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <User size={20} className="text-text-muted" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{u.nickname || u.username}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${u.role === 'admin' ? 'bg-lime/20 text-lime' : 'bg-lime/10 text-lime'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>{u.role}</span>
                </div>
                <p className="text-text-muted text-sm font-mono text-xs">@{u.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-white/5 transition-all"><Edit3 size={16} className="text-text-secondary" /></button>
              <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"><Trash2 size={16} className="text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}