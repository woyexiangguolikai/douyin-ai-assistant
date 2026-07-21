import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getPool } from '../db'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' })
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]) as any
    if (rows.length === 0) return res.status(401).json({ error: '账号或密码错误' })
    const user = rows[0]
    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: '账号或密码错误' })
    const token = generateToken({ id: user.id, username: user.username, role: user.role, nickname: user.nickname })
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role } })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  res.json({ user: req.user })
})

router.post('/register', async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' })
    const pool = getPool()
    const [admins] = await pool.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'") as any
    if (isAdmin && admins[0].cnt > 0) return res.status(400).json({ error: '管理员已存在' })
    const hash = bcrypt.hashSync(password, 10)
    await pool.execute('INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, username, isAdmin ? 'admin' : 'operator'])
    res.json({ success: true })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router