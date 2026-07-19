import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(__dirname, '..', 'data.db')

let db: any = null

export async function getDb() {
  if (db) return db
  const SQL = await initSqlJs()
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }
  } catch {
    db = new SQL.Database()
  }
  initSchema()
  return db
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'operator',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      user_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'offline',
      status_message TEXT DEFAULT '',
      last_seen TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER UNIQUE REFERENCES rooms(id),
      name TEXT DEFAULT '默认人设',
      personality TEXT DEFAULT '[]',
      style TEXT DEFAULT '闲聊互动',
      tone TEXT DEFAULT '轻松自然',
      catchphrases TEXT DEFAULT '[]',
      forbidden_topics TEXT DEFAULT '["政治","宗教","涉黄","人身攻击"]',
      fan_title TEXT DEFAULT '家人们',
      background TEXT DEFAULT '',
      strengths TEXT DEFAULT '[]',
      greeting_phrase TEXT DEFAULT '',
      sign_off TEXT DEFAULT '',
      custom_prompt TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER UNIQUE REFERENCES rooms(id),
      deepseek_api_key TEXT DEFAULT '',
      model TEXT DEFAULT 'deepseek-chat',
      enabled INTEGER DEFAULT 1,
      reply_length TEXT DEFAULT 'medium',
      tone_style TEXT DEFAULT 'natural',
      topic_depth TEXT DEFAULT 'normal',
      custom_prompt TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  save()
}

function save() {
  if (db && DB_PATH) {
    const data = db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  }
}

export function saveDb() { save() }