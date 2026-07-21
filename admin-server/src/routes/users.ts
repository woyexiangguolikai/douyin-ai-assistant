import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getPool } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT id, username, nickname, role, created_at, updated_at FROM users ORDER BY created_at') as any
    res.json(rows)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { username, password, nickname, role } = req.body
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' })
    const hash = bcrypt.hashSync(password, 10)
    const pool = getPool()
    await pool.execute('INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, nickname || username, role || 'operator'])
    res.json({ success: true })
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: '账号已存在' })
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const { nickname, password, role } = req.body
    const pool = getPool()
    if (password) {
      const hash = bcrypt.hashSync(password, 10)
      await pool.execute('UPDATE users SET nickname=?, role=?, password_hash=? WHERE id=?',
        [nickname || '', role || 'operator', hash, req.params.id])
    } else {
      await pool.execute('UPDATE users SET nickname=?, role=? WHERE id=?',
        [nickname || '', role || 'operator', req.params.id])
    }
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    await pool.execute('UPDATE rooms SET user_id=NULL WHERE user_id=?', [req.params.id])
    await pool.execute('DELETE FROM users WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router