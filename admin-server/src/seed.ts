import bcrypt from 'bcryptjs'
import { getDb, saveDb } from './db'

async function seed() {
  const db = await getDb()
  
  // 创建管理员账号
  const hash = bcrypt.hashSync('admin123', 10)
  db.run('INSERT OR IGNORE INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
    ['admin', hash, '管理员', 'admin'])
  
  // 创建运营测试账号
  const opHash = bcrypt.hashSync('123456', 10)
  db.run('INSERT OR IGNORE INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
    ['operator1', opHash, '运营小张', 'operator'])
  
  saveDb()
  console.log('✅ 初始数据已创建')
  console.log('   管理员: admin / admin123')
  console.log('   运营:   operator1 / 123456')
}

seed().catch(console.error)