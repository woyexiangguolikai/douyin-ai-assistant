import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Monitor, Wifi, WifiOff, AlertTriangle, ExternalLink, Trash2, Radio } from 'lucide-react'
import { api } from '../lib/api'

export default function Dashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoom, setNewRoom] = useState({ room_id: '', name: '', user_id: '' })
  const [users, setUsers] = useState<any[]>([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadRooms(); if (user.role === 'admin') loadUsers() }, [])

  async function loadRooms() { try { setRooms(await api.getRooms()) } catch {} finally { setLoading(false) } }
  async function loadUsers() { try { setUsers(await api.getUsers()) } catch {} }

  async function handleCreate() {
    if (!newRoom.room_id) return
    await api.createRoom({ room_id: newRoom.room_id, name: newRoom.name, user_id: newRoom.user_id || null })
    setShowCreate(false); setNewRoom({ room_id: '', name: '', user_id: '' }); loadRooms()
  }

  async function handleDelete(id: number) { if (!confirm('确定删除？')) return; await api.deleteRoom(id); loadRooms() }

  const statusConfig: Record<string, { icon: any; label: string }> = {
    online: { icon: Wifi, label: '在线' },
    offline: { icon: WifiOff, label: '离线' },
    error: { icon: AlertTriangle, label: '异常' },
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-lime border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold tracking-tight text-text-primary"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.06em' }}>
          直播间
        </h1>
        {user.role === 'admin' && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-lime text-black font-bold rounded-pill text-sm transition-all hover:scale-105"
            style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 30px rgba(204,255,0,0.3)' }}>
            <Plus size={18} /> 添加直播间
          </button>
        )}
      </div>

      {showCreate && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-lime" />
            <h3 className="font-heading font-semibold text-text-primary text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>添加直播间</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input value={newRoom.room_id} onChange={e => setNewRoom(p => ({ ...p, room_id: e.target.value }))} placeholder="抖音房间号"
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <input value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} placeholder="名称（选填）"
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }} />
            <select value={newRoom.user_id} onChange={e => setNewRoom(p => ({ ...p, user_id: e.target.value }))}
              className="bg-glass-bg border border-white/10 rounded-card px-4 py-3 text-text-primary font-heading text-sm focus:outline-none focus:border-lime/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
              <option value="">选择运营</option>
              {users.filter(u => u.role === 'operator').map(u => <option key={u.id} value={u.id}>{u.nickname}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-6 py-2 bg-lime text-black font-bold rounded-pill text-sm hover:scale-105 transition-all">确定</button>
            <button onClick={() => setShowCreate(false)} className="px-6 py-2 border border-white/10 text-text-secondary rounded-pill text-sm hover:text-text-primary transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>取消</button>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Radio size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary font-heading" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>暂无直播间</p>
          {user.role === 'admin' && <p className="text-text-muted text-sm mt-1 font-heading">点击上方「添加直播间」开始</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map(room => {
            const cfg = statusConfig[room.status] || statusConfig.offline
            const StatusIcon = cfg.icon
            return (
              <Link key={room.id} to={`/app/rooms/${room.id}`}
                className="glass-card p-5 block transition-all hover:border-lime/40 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-2 h-2 rounded-full ${room.status === 'online' ? 'bg-lime' : room.status === 'error' ? 'bg-red-500' : 'bg-text-muted'}`} />
                      <h3 className="font-heading font-semibold text-text-primary truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{room.name || room.room_id}</h3>
                      <span className="flex items-center gap-1 text-xs font-mono text-text-muted uppercase tracking-widest">
                        <StatusIcon size={12} /> {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-heading text-text-secondary">
                      <span className="font-mono text-xs uppercase tracking-wider">ID: {room.room_id}</span>
                      {room.operator_name && <span>运营: {room.operator_name}</span>}
                      {room.last_seen && <span className="font-mono text-xs">{room.last_seen}</span>}
                    </div>
                    {room.status_message && <p className="text-xs text-red-300 mt-1 font-medium">{room.status_message}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={18} className="text-text-muted" />
                    {user.role === 'admin' && (
                      <button onClick={e => { e.preventDefault(); handleDelete(room.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"><Trash2 size={16} className="text-red-400" /></button>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}