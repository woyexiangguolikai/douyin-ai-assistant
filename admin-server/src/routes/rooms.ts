import { Router } from 'express'
import { getPool } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    let rows: any[]
    if (req.user?.role === 'admin') {
      [rows] = await pool.execute(
        'SELECT r.*, u.nickname as operator_name FROM rooms r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.updated_at DESC'
      ) as any
    } else {
      [rows] = await pool.execute(
        'SELECT r.*, u.nickname as operator_name FROM rooms r LEFT JOIN users u ON r.user_id = u.id WHERE r.user_id = ? ORDER BY r.updated_at DESC',
        [req.user!.id]
      ) as any
    }
    res.json(rows)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { room_id, name, user_id } = req.body
    if (!room_id) return res.status(400).json({ error: '请输入直播间ID' })
    const pool = getPool()
    const [result] = await pool.execute('INSERT INTO rooms (room_id, name, user_id) VALUES (?, ?, ?)',
      [room_id, name || '', user_id || null]) as any
    const roomDbId = result.insertId
    await pool.execute('INSERT IGNORE INTO personas (room_id) VALUES (?)', [roomDbId])
    await pool.execute('INSERT IGNORE INTO ai_settings (room_id) VALUES (?)', [roomDbId])
    res.json({ success: true, id: roomDbId })
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: '直播间ID已存在' })
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { name, user_id, room_id } = req.body
    const pool = getPool()
    await pool.execute('UPDATE rooms SET name=?, user_id=?, room_id=? WHERE id=?',
      [name || '', user_id || null, room_id, req.params.id])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    await pool.execute('DELETE FROM ai_settings WHERE room_id=?', [req.params.id])
    await pool.execute('DELETE FROM personas WHERE room_id=?', [req.params.id])
    await pool.execute('DELETE FROM rooms WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.get('/:id/persona', async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM personas WHERE room_id = ?', [req.params.id]) as any
    if (rows.length === 0) return res.json(null)
    const row = rows[0]
    res.json(mapPersona(row))
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.put('/:id/persona', async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    const p = req.body
    await pool.execute(
      'UPDATE personas SET name=?, personality=?, style=?, tone=?, catchphrases=?, forbidden_topics=?, fan_title=?, background=?, strengths=?, greeting_phrase=?, sign_off=?, custom_prompt=? WHERE room_id=?',
      [p.name || '默认人设', JSON.stringify(p.personality || []), p.style || '', p.tone || '',
       JSON.stringify(p.catchphrases || []), JSON.stringify(p.forbidden_topics || []),
       p.fan_title || '', p.background || '', JSON.stringify(p.strengths || []),
       p.greeting_phrase || '', p.sign_off || '', p.custom_prompt || '', req.params.id])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.get('/:id/ai-settings', async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM ai_settings WHERE room_id = ?', [req.params.id]) as any
    if (rows.length === 0) return res.json(null)
    const row = rows[0]
    res.json({
      id: row.id, room_id: row.room_id, deepseek_api_key: row.deepseek_api_key, model: row.model,
      enabled: !!row.enabled, reply_length: row.reply_length, tone_style: row.tone_style,
      topic_depth: row.topic_depth, custom_prompt: row.custom_prompt,
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.put('/:id/ai-settings', async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    const s = req.body
    await pool.execute(
      'UPDATE ai_settings SET deepseek_api_key=?, model=?, enabled=?, reply_length=?, tone_style=?, topic_depth=?, custom_prompt=? WHERE room_id=?',
      [s.deepseek_api_key || '', s.model || 'deepseek-chat', s.enabled ? 1 : 0,
       s.reply_length || 'medium', s.tone_style || 'natural', s.topic_depth || 'normal',
       s.custom_prompt || '', req.params.id])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.post('/heartbeat', async (req, res) => {
  try {
    const { room_id, status, status_message } = req.body
    if (!room_id) return res.status(400).json({ error: '缺少 room_id' })
    const pool = getPool()
    await pool.execute("UPDATE rooms SET status=?, status_message=?, last_seen=NOW() WHERE room_id=?",
      [status || 'online', status_message || '', room_id])
    const [roomRows] = await pool.execute('SELECT id FROM rooms WHERE room_id = ?', [room_id]) as any
    if (roomRows.length === 0) return res.json({ configured: false })
    const roomDbId = roomRows[0].id
    const [personaRows] = await pool.execute('SELECT * FROM personas WHERE room_id = ?', [roomDbId]) as any
    const [aiRows] = await pool.execute('SELECT * FROM ai_settings WHERE room_id = ?', [roomDbId]) as any
    res.json({
      configured: true,
      persona: personaRows.length > 0 ? mapPersona(personaRows[0]) : null,
      ai_settings: aiRows.length > 0 ? aiRows[0] : null,
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

function mapPersona(row: any) {
  return {
    id: row.id, room_id: row.room_id, name: row.name,
    personality: typeof row.personality === 'string' ? JSON.parse(row.personality) : (row.personality || []),
    style: row.style, tone: row.tone,
    catchphrases: typeof row.catchphrases === 'string' ? JSON.parse(row.catchphrases) : (row.catchphrases || []),
    forbidden_topics: typeof row.forbidden_topics === 'string' ? JSON.parse(row.forbidden_topics) : (row.forbidden_topics || []),
    fan_title: row.fan_title, background: row.background,
    strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : (row.strengths || []),
    greeting_phrase: row.greeting_phrase, sign_off: row.sign_off, custom_prompt: row.custom_prompt,
  }
}

export default router