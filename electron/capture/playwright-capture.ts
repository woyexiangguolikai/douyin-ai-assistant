import { EventEmitter } from 'events'
import { Browser, Page, chromium } from 'playwright'
import { Danmaku, ConnectionStatus } from '../types'

/**
 * Playwright 弹幕采集器（备用方案）
 * 
 * 当 WebSocket 方案不可用时，通过浏览器自动化打开抖音直播间页面，
 * 监听 DOM 变化来捕获弹幕。
 * 
 * 抖音直播间弹幕 DOM 结构 (2024年7月实测):
 *   div.webcast-chatroom___item.webcast-chatroom___item_new
 *     div.webcast-chatroom___item-wrapper
 *       div.NkS2Invn
 *         span (empty)
 *         span[class*="v8LY0gZF"]  ← 用户名
 *         span[class*="cL385mHb"]  ← 弹幕内容
 * 
 * 系统消息包含: .webcast-chatroom__room-message (需要排除)
 * 点赞消息包含: .webcast-chatroom___bottom_message (可选排除)
 */
export class PlaywrightCapture extends EventEmitter {
  private browser: Browser | null = null
  private page: Page | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private roomId: string = ''
  private _status: ConnectionStatus = 'disconnected'
  private knownDanmakuContent: Set<string> = new Set()

  get status() { return this._status }

  async connect(roomId: string) {
    if (this._status === 'connected' || this._status === 'connecting') {
      await this.disconnect()
    }

    this.roomId = roomId
    this._status = 'connecting'
    this.emit('status', this._status)

    try {
      this.browser = await chromium.launch({
        channel: 'msedge',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--disable-extensions',
        ],
      })

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'zh-CN',
      })

      this.page = await context.newPage()

      // 导航到直播间
      await this.page.goto(`https://live.douyin.com/${roomId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // 等待弹幕容器加载
      await this.page.waitForSelector('.webcast-chatroom___item', {
        timeout: 15000,
      }).catch(() => {})

      this._status = 'connected'
      this.emit('status', this._status)

      // 开始轮询弹幕
      this.startPolling()
    } catch (err) {
      this._status = 'error'
      this.emit('status', this._status)
      this.emit('error', `Playwright 连接失败: ${(err as Error).message}`)
    }
  }

  private startPolling() {
    this.pollTimer = setInterval(async () => {
      if (!this.page || this.page.isClosed()) return

      try {
        await this.scanDanmaku()
      } catch (err) {
        this.emit('error', `弹幕扫描错误: ${(err as Error).message}`)
      }
    }, 1000)
  }

  private async scanDanmaku() {
    if (!this.page) return

    const danmakuItems = await this.page.evaluate(() => {
      const items: Array<{ content: string; username: string; id: string }> = []

      // 查找所有弹幕项，排除系统消息和点赞消息
      const chatItems = document.querySelectorAll('.webcast-chatroom___item')

      chatItems.forEach((el) => {
        // 排除系统消息
        if (el.querySelector('.webcast-chatroom__room-message')) return

        // 提取用户名和内容
        const userSpan = el.querySelector('[class*="v8LY0gZF"]') as HTMLSpanElement | null
        const contentSpan = el.querySelector('[class*="cL385mHb"]') as HTMLSpanElement | null

        let username = '匿名'
        let content = ''

        if (userSpan?.textContent) {
          username = userSpan.textContent.replace(/[：:]\s*$/, '').trim()
        }

        if (contentSpan?.textContent) {
          content = contentSpan.textContent.trim()
        } else {
          // 降级方案：从完整文本提取冒号后的内容
          const fullText = (el.textContent || '').trim()
          const colonIdx = fullText.indexOf('：')
          content = colonIdx > 0 ? fullText.substring(colonIdx + 1).trim() : fullText
        }

        if (content) {
          items.push({
            content,
            username,
            id: `pw_${Date.now()}_${items.length}`,
          })
        }
      })

      return items
    })

    for (const item of danmakuItems) {
      if (!this.knownDanmakuContent.has(item.username + ':' + item.content)) {
        this.knownDanmakuContent.add(item.username + ':' + item.content)
        
        if (this.knownDanmakuContent.size > 10000) {
          const arr = Array.from(this.knownDanmakuContent)
          this.knownDanmakuContent = new Set(arr.slice(arr.length - 5000))
        }

        const danmaku: Danmaku = {
          id: item.id,
          roomId: this.roomId,
          username: item.username,
          content: item.content,
          timestamp: Date.now(),
          type: 'normal',
          filtered: false,
        }

        this.emit('danmaku', danmaku)
      }
    }
  }

  async disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    this.knownDanmakuContent.clear()

    if (this.page) {
      await this.page.close().catch(() => {})
      this.page = null
    }
    if (this.browser) {
      await this.browser.close().catch(() => {})
      this.browser = null
    }

    this._status = 'disconnected'
    this.emit('status', this._status)
  }
}
