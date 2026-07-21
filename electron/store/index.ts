import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { AppSettings, PersonaConfig, FilterRule, Danmaku, AIReply } from '../types'
import { DEFAULT_SETTINGS, DEFAULT_FILTER_RULES, DEFAULT_PERSONA } from '../config/default-settings'

export class Store {
  private db: any = null
  private dbPath: string = ''

  async init() {
    this.dbPath = path.join(__dirname, '..', '..', 'data', 'douyin-assistant.db')
    const SQL = await initSqlJs()
    try {
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        this.db = new SQL.Database(buffer)
      } else {
        this.db = new SQL.Database()
      }
    } catch {
      this.db = new SQL.Database()
    }
    this.initSchema()
    this.seedDefaults()
  }

  private initSchema() {
    this.db.run("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    this.db.run("CREATE TABLE IF NOT EXISTS personas (id TEXT PRIMARY KEY, name TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)")
    this.db.run("CREATE TABLE IF NOT EXISTS filter_rules (id TEXT PRIMARY KEY, data TEXT NOT NULL)")
    this.db.run("CREATE TABLE IF NOT EXISTS danmaku_log (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, content TEXT NOT NULL, username TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'normal', filtered INTEGER NOT NULL DEFAULT 0, timestamp INTEGER NOT NULL)")
    this.db.run("CREATE TABLE IF NOT EXISTS ai_replies (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, type TEXT NOT NULL, suggestion TEXT NOT NULL, original_content TEXT NOT NULL, danmaku_ids TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, timestamp INTEGER NOT NULL)")
    this.db.run("CREATE INDEX IF NOT EXISTS idx_danmaku_room ON danmaku_log(room_id, timestamp)")
    this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_replies_room ON ai_replies(room_id, timestamp)")
    this.save()
  }

  private seedDefaults() {
    const versionRows = this.db.exec("SELECT value FROM settings WHERE key = 'db_version'")
    let dbVersion = 0
    if (versionRows.length > 0 && versionRows[0].values.length > 0) {
      dbVersion = parseInt(versionRows[0].values[0][0] as string, 10) || 0
    }
    if (dbVersion < 2) {
      this.saveFilterRules(DEFAULT_FILTER_RULES)
      this.db.run("DELETE FROM personas")
      this.savePersona(DEFAULT_PERSONA)
      this.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', '1')")
      this.save()
    }
    const existing = this.db.exec("SELECT key FROM settings WHERE key = 'app_settings'")
    if (existing.length === 0 || existing[0].values.length === 0) {
      this.saveSettings(DEFAULT_SETTINGS)
    }
  }

  getSettings(): AppSettings {
    const rows = this.db.exec("SELECT value FROM settings WHERE key = 'app_settings'")
    if (rows.length === 0 || rows[0].values.length === 0) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].values[0][0] as string) }
  }

  saveSettings(settings: AppSettings) {
    this.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['app_settings', JSON.stringify(settings)])
    this.save()
  }

  getPersonas(): PersonaConfig[] {
    const rows = this.db.exec("SELECT data FROM personas ORDER BY created_at ASC")
    if (rows.length === 0) return []
    return rows[0].values.map((r: any) => JSON.parse(r[0] as string))
  }

  getPersona(id: string): PersonaConfig | undefined {
    const rows = this.db.exec("SELECT data FROM personas WHERE id = ?", [id])
    if (rows.length === 0 || rows[0].values.length === 0) return undefined
    return JSON.parse(rows[0].values[0][0] as string)
  }

  savePersona(persona: PersonaConfig) {
    const now = Date.now()
    const existing = this.db.exec("SELECT id FROM personas WHERE id = ?", [persona.id])
    if (existing.length > 0 && existing[0].values.length > 0) {
      this.db.run("UPDATE personas SET name = ?, data = ?, updated_at = ? WHERE id = ?",
        [persona.name, JSON.stringify(persona), now, persona.id])
    } else {
      this.db.run("INSERT INTO personas (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [persona.id, persona.name, JSON.stringify(persona), now, now])
    }
    this.save()
  }

  deletePersona(id: string) {
    this.db.run("DELETE FROM personas WHERE id = ?", [id])
    this.save()
  }

  getFilterRules(): FilterRule[] {
    const rows = this.db.exec("SELECT data FROM filter_rules ORDER BY id ASC")
    if (rows.length === 0 || rows[0].values.length === 0) return DEFAULT_FILTER_RULES
    return rows[0].values.map((r: any) => JSON.parse(r[0] as string))
  }

  saveFilterRules(rules: FilterRule[]) {
    this.db.run("DELETE FROM filter_rules")
    const stmt = this.db.prepare("INSERT INTO filter_rules (id, data) VALUES (?, ?)")
    for (const rule of rules) {
      stmt.run([rule.id, JSON.stringify(rule)])
    }
    this.save()
  }

  getSessionHistory(roomId: string, limit = 500) {
    const safeId = roomId.replace(/'/g, "''")
    const danmakuRows = this.db.exec(
      `SELECT id, room_id, content, username, type, filtered, timestamp FROM danmaku_log WHERE room_id = '${safeId}' ORDER BY timestamp DESC LIMIT ${limit}`
    )
    const replyRows = this.db.exec(
      `SELECT id, room_id, type, suggestion, original_content, danmaku_ids, used, timestamp FROM ai_replies WHERE room_id = '${safeId}' ORDER BY timestamp DESC LIMIT ${Math.floor(limit / 5)}`
    )
    const mapDanmaku = (r: any) => ({
      id: r[0], roomId: r[1], content: r[2], username: r[3],
      type: r[4], filtered: !!r[5], timestamp: r[6],
    })
    const mapReply = (r: any) => ({
      id: r[0], roomId: r[1], type: r[2], suggestion: r[3],
      originalContent: r[4], danmakuIds: JSON.parse(r[5]), used: !!r[6],
      timestamp: r[7], reason: '', confidence: 0,
    })
    return {
      danmaku: danmakuRows.length > 0 ? danmakuRows[0].values.map(mapDanmaku) : [],
      replies: replyRows.length > 0 ? replyRows[0].values.map(mapReply) : [],
    }
  }

  logDanmaku(danmaku: Danmaku) {
    this.db.run(
      "INSERT OR IGNORE INTO danmaku_log (id, room_id, content, username, type, filtered, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [danmaku.id, danmaku.roomId, danmaku.content, danmaku.username, danmaku.type, danmaku.filtered ? 1 : 0, danmaku.timestamp]
    )
  }

  logAIReply(reply: AIReply, roomId: string) {
    this.db.run(
      "INSERT OR IGNORE INTO ai_replies (id, room_id, type, suggestion, original_content, danmaku_ids, used, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [reply.id, roomId, reply.type, reply.suggestion, reply.originalContent, JSON.stringify(reply.danmakuIds), reply.used ? 1 : 0, reply.timestamp]
    )
  }

  clearHistory(roomId?: string) {
    if (roomId) {
      const safeId = roomId.replace(/'/g, "''")
      this.db.run(`DELETE FROM danmaku_log WHERE room_id = '${safeId}'`)
      this.db.run(`DELETE FROM ai_replies WHERE room_id = '${safeId}'`)
    } else {
      this.db.run("DELETE FROM danmaku_log")
      this.db.run("DELETE FROM ai_replies")
    }
    this.save()
  }


  close() {
    try {
      if (this.db) {
        this.save()
        try { this.db.close() } catch (e) { console.error('[Store] close:', (e as Error).message) }
      }
    } catch (e) { console.error('[Store] shutdown:', (e as Error).message) }
  }

  private save() {
    try {
      if (this.db && this.dbPath) {
        const data = this.db.export()
        const buffer = Buffer.from(data)
        fs.writeFileSync(this.dbPath, buffer)
      }
    } catch (e) { try { console.error('[Store] save:', (e as Error).message) } catch {} }
  }
}
