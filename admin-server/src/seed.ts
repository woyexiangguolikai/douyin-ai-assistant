import bcrypt from 'bcryptjs'
import { getPool, initDb } from './db'

async function seed() {
  await initDb()
  const pool = getPool()
  const hash = bcrypt.hashSync('admin123', 10)
  await pool.execute("INSERT IGNORE INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)",
    ['admin', hash, '管理员', 'admin'])
  const opHash = bcrypt.hashSync('123456', 10)
  await pool.execute("INSERT IGNORE INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)",
    ['operator1', opHash, '运营小张', 'operator'])
  console.log('OK: admin/admin123, operator1/123456')
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })