import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, saveDb } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// GET /api/users
router.get('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    const r = db.exec('SELECT id, username, nickname, role, created_at, updated_at FROM users ORDER BY created_at')
    if (r.length === 0) return res.json([])
    const users = r[0].values.map((row: any) => ({
      id: row[0], username: row[1], nickname: row[2], role: row[3],
      created_at: row[4], updated_at: row[5],
    }))
    res.json(users)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/users
router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { username, password, nickname, role } = req.body
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' })
    const hash = bcrypt.hashSync(password, 10)
    const db = await getDb()
    db.run('INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, nickname || username, role || 'operator'])
    saveDb()
    res.json({ success: true })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: '账号已存在' })
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/users/:id
router.put('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { nickname, password, role } = req.body
    const db = await getDb()
    if (password) {
      const hash = bcrypt.hashSync(password, 10)
      db.run('UPDATE users SET nickname=?, role=?, password_hash=?, updated_at=datetime(\'now\') WHERE id=?',
        [nickname || '', role || 'operator', hash, req.params.id])
    } else {
      db.run('UPDATE users SET nickname=?, role=?, updated_at=datetime(\'now\') WHERE id=?',
        [nickname || '', role || 'operator', req.params.id])
    }
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/users/:id
router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const db = await getDb()
    db.run('UPDATE rooms SET user_id=NULL WHERE user_id=?', [req.params.id])
    db.run('DELETE FROM users WHERE id=?', [req.params.id])
    saveDb()
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router