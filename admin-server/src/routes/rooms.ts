import { Router } from 'express'
import { getDb, saveDb } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// GET /api/rooms
router.get('/', async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    let r
    if (req.user?.role === 'admin') {
      r = db.exec(`SELECT r.*, u.nickname as operator_name
        FROM rooms r LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.updated_at DESC`)
    } else {
      r = db.exec(`SELECT r.*, u.nickname as operator_name
        FROM rooms r LEFT JOIN users u ON r.user_id = u.id
        WHERE r.user_id = ? ORDER BY r.updated_at DESC`, [req.user!.id])
    }
    if (r.length === 0) return res.json([])
    const rooms = r[0].values.map((row: any) => ({
      id: row[0], room_id: row[1], name: row[2], user_id: row[3],
      status: row[4], status_message: row[5], last_seen: row[6],
      created_at: row[7], updated_at: row[8],
      operator_name: row[9] || '',
    }))
    res.json(rooms)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/rooms
router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { room_id, name, user_id } = req.body
    if (!room_id) return res.status(400).json({ error: '请输入直播间ID' })
    const db = await getDb()
    db.run('INSERT INTO rooms (room_id, name, user_id) VALUES (?, ?, ?)', [room_id, name || '', user_id || null])
    // 自动创建关联的人设和 AI 设置
    const r = db.exec('SELECT id FROM rooms WHERE room_id = ?', [room_id])
    const roomDbId = r[0].values[0][0]
    db.run('INSERT INTO personas (room_id) VALUES (?)', [roomDbId])
    db.run('INSERT INTO ai_settings (room_id) VALUES (?)', [roomDbId])
    saveDb()
    res.json({ success: true, id: roomDbId })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// PUT /api/rooms/:id
router.put('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { name, user_id, room_id } = req.body
    const db = await getDb()
    db.run('UPDATE rooms SET name=?, user_id=?, room_id=?, updated_at=datetime(\'now\') WHERE id=?',
      [name || '', user_id || null, room_id, req.params.id])
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/rooms/:id
router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    db.run('DELETE FROM ai_settings WHERE room_id=?', [req.params.id])
    db.run('DELETE FROM personas WHERE room_id=?', [req.params.id])
    db.run('DELETE FROM rooms WHERE id=?', [req.params.id])
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/rooms/:id/persona
router.get('/:id/persona', async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    const r = db.exec('SELECT * FROM personas WHERE room_id = ?', [req.params.id])
    if (r.length === 0 || r[0].values.length === 0) return res.json(null)
    const row = r[0].values[0]
    res.json({
      id: row[0], room_id: row[1], name: row[2],
      personality: JSON.parse(row[3] as string || '[]'),
      style: row[4], tone: row[5],
      catchphrases: JSON.parse(row[6] as string || '[]'),
      forbidden_topics: JSON.parse(row[7] as string || '[]'),
      fan_title: row[8], background: row[9],
      strengths: JSON.parse(row[10] as string || '[]'),
      greeting_phrase: row[11], sign_off: row[12], custom_prompt: row[13],
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// PUT /api/rooms/:id/persona
router.put('/:id/persona', async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    const p = req.body
    db.run(`UPDATE personas SET name=?, personality=?, style=?, tone=?, catchphrases=?,
      forbidden_topics=?, fan_title=?, background=?, strengths=?, greeting_phrase=?,
      sign_off=?, custom_prompt=?, updated_at=datetime('now') WHERE room_id=?`,
      [p.name || '默认人设', JSON.stringify(p.personality || []), p.style || '', p.tone || '',
       JSON.stringify(p.catchphrases || []), JSON.stringify(p.forbidden_topics || []),
       p.fan_title || '', p.background || '', JSON.stringify(p.strengths || []),
       p.greeting_phrase || '', p.sign_off || '', p.custom_prompt || '', req.params.id])
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/rooms/:id/ai-settings
router.get('/:id/ai-settings', async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    const r = db.exec('SELECT * FROM ai_settings WHERE room_id = ?', [req.params.id])
    if (r.length === 0 || r[0].values.length === 0) return res.json(null)
    const row = r[0].values[0]
    res.json({
      id: row[0], room_id: row[1], deepseek_api_key: row[2], model: row[3],
      enabled: !!row[4], reply_length: row[5], tone_style: row[6],
      topic_depth: row[7], custom_prompt: row[8],
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// PUT /api/rooms/:id/ai-settings
router.put('/:id/ai-settings', async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    const s = req.body
    db.run(`UPDATE ai_settings SET deepseek_api_key=?, model=?, enabled=?, reply_length=?,
      tone_style=?, topic_depth=?, custom_prompt=?, updated_at=datetime('now') WHERE room_id=?`,
      [s.deepseek_api_key || '', s.model || 'deepseek-chat', s.enabled ? 1 : 0,
       s.reply_length || 'medium', s.tone_style || 'natural', s.topic_depth || 'normal',
       s.custom_prompt || '', req.params.id])
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/rooms/heartbeat - 桌面端上报状态
router.post('/heartbeat', async (req, res) => {
  try {
    const { room_id, status, status_message } = req.body
    if (!room_id) return res.status(400).json({ error: '缺少 room_id' })
    const db = await getDb()
    db.run("UPDATE rooms SET status=?, status_message=?, last_seen=datetime('now'), updated_at=datetime('now') WHERE room_id=?",
      [status || 'online', status_message || '', room_id])
    saveDb()
    // 返回该房间的配置
    const r = db.exec('SELECT id FROM rooms WHERE room_id = ?', [room_id])
    if (r.length === 0 || r[0].values.length === 0) return res.json({ configured: false })
    const roomDbId = r[0].values[0][0]
    const persona = db.exec('SELECT * FROM personas WHERE room_id = ?', [roomDbId])
    const ai = db.exec('SELECT * FROM ai_settings WHERE room_id = ?', [roomDbId])
    res.json({
      configured: true,
      persona: persona.length > 0 ? JSON.parse(JSON.stringify(persona[0].values[0])) : null,
      ai_settings: ai.length > 0 ? JSON.parse(JSON.stringify(ai[0].values[0])) : null,
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router