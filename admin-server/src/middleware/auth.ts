import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'douyin-ai-admin-secret-key-2024'

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; nickname: string }
}

export function generateToken(user: { id: number; username: string; role: string; nickname: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, JWT_SECRET) as any
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期' })
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '仅管理员可操作' })
  }
  next()
}