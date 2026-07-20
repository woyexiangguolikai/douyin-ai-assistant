import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'douyin_admin',
  waitForConnections: true,
  connectionLimit: 10,
});

export function getPool() { return pool; }

export async function initDb() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(\x60
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(50) DEFAULT '',
        role ENUM('admin','operator') NOT NULL DEFAULT 'operator',
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      )
    \x60);
    await conn.execute(\x60
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) DEFAULT '',
        user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'offline',
        status_message VARCHAR(255) DEFAULT '',
        last_seen DATETIME NULL,
        created_at DATETIME DEFAULT NOW(),
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      )
    \x60);
    await conn.execute(\x60
      CREATE TABLE IF NOT EXISTS personas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT UNIQUE NULL REFERENCES rooms(id) ON DELETE CASCADE,
        name VARCHAR(50) DEFAULT '默认人设',
        personality JSON DEFAULT ('[]'),
        style VARCHAR(20) DEFAULT '闲聊互动',
        tone VARCHAR(20) DEFAULT '轻松自然',
        catchphrases JSON DEFAULT ('[]'),
        forbidden_topics JSON DEFAULT ('["政治","宗教","涉黄","人身攻击"]'),
        fan_title VARCHAR(20) DEFAULT '家人们',
        background TEXT,
        strengths JSON DEFAULT ('[]'),
        greeting_phrase VARCHAR(100) DEFAULT '',
        sign_off VARCHAR(100) DEFAULT '',
        custom_prompt TEXT DEFAULT '',
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      )
    \x60);
    await conn.execute(\x60
      CREATE TABLE IF NOT EXISTS ai_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT UNIQUE NULL REFERENCES rooms(id) ON DELETE CASCADE,
        deepseek_api_key VARCHAR(255) DEFAULT '',
        model VARCHAR(50) DEFAULT 'deepseek-chat',
        enabled TINYINT DEFAULT 1,
        reply_length VARCHAR(20) DEFAULT 'medium',
        tone_style VARCHAR(20) DEFAULT 'natural',
        topic_depth VARCHAR(20) DEFAULT 'normal',
        custom_prompt TEXT DEFAULT '',
        updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
      )
    \x60);
    console.log('MySQL schema initialized');
  } finally { conn.release(); }
}