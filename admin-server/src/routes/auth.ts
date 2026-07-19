import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, saveDb } from '../db'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '请输入账号和密码' })
    }
    const db = await getDb()
    const r = db.exec('SELECT * FROM users WHERE username = ?', [username])
    if (r.length === 0 || r[0].values.length === 0) {
      return res.status(401).json({ error: '账号或密码错误' })
    }
    const user = r[0].values[0]
    const valid = bcrypt.compareSync(password, user[2] as string)
    if (!valid) {
      return res.status(401).json({ error: '账号或密码错误' })
    }
    const tokenData = { id: user[0] as number, username: user[1] as string, role: user[4] as string, nickname: user[3] as string }
    const token = generateToken(tokenData)
    res.json({ token, user: { id: user[0], username: user[1], nickname: user[3], role: user[4] } })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/register (admin setup - first run only)
router.post('/register', async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '请输入账号和密码' })
    }
    const db = await getDb()
    // 检查是否已有管理员
    const admins = db.exec("SELECT COUNT(*) FROM users WHERE role = 'admin'")
    if (isAdmin && admins.length > 0 && admins[0].values[0][0] > 0) {
      return res.status(400).json({ error: '管理员已存在' })
    }
    const hash = bcrypt.hashSync(password, 10)
    db.run('INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
      [username, hash, username, isAdmin ? 'admin' : 'operator'])
    saveDb()
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router