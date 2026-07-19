import WebSocket from 'ws'
import { EventEmitter } from 'events'
import { Danmaku, ConnectionStatus } from '../types'
import crypto from 'crypto'
import http from 'http'

/**
 * 抖音 WebSocket 弹幕采集器
 * 
 * 协议说明：
 * 抖音直播间使用 WebSocket + Protobuf 协议推送弹幕。
 * 本模块实现完整的连接生命周期管理，包括：
 * - 通过 HTTP API 获取房间信息和 WS 连接参数
 * - WebSocket 连接建立和 PushFrame 认证
 * - protobuf 消息解析（含 gzip 解压）
 * - 断线自动重连（指数退避）
 * - 定时心跳保活
 * 
 * 参考开源项目：DouyinLiveRecorder, Douyin-Bot 等
 */
export class WebSocketCapture extends EventEmitter {
  private ws: WebSocket | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private roomId: string = ''
  private _status: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 20
  private baseReconnectDelay = 2000
  private serverParams: any = null

  get status() { return this._status }

  async connect(roomId: string) {
    if (this._status === 'connected' || this._status === 'connecting') {
      await this.disconnect()
    }

    this.roomId = roomId
    this._status = 'connecting'
    this.emit('status', this._status)

    try {
      // 第一步：获取房间信息和 WebSocket 参数
      this.serverParams = await this.fetchRoomInfo(roomId)
      
      // 第二步：建立 WebSocket 连接
      await this.establishConnection()
    } catch (err) {
      this._status = 'error'
      this.emit('status', this._status)
      this.emit('error', `连接失败: ${(err as Error).message}`)
      this.scheduleReconnect()
    }
  }

  /**
   * 获取抖音直播间信息和 WebSocket 连接参数
   * 
   * 通过抖音直播间 API 获取:
   * - room_id / live_id
   * - WebSocket URL 和 token
   * - 推流地址等
   * 
   * API 地址: https://live.douyin.com/webcast/room/get_info/
   * 需要携带 Cookie 和 User-Agent 模拟真实浏览器
   */
  private async fetchRoomInfo(roomId: string): Promise<any> {
    const url = `https://live.douyin.com/webcast/room/get_info/?room_id=${roomId}&live_id=1`
    
    return new Promise((resolve, reject) => {
      const req = http.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://live.douyin.com/${roomId}`,
          'Cookie': '',  // 需要传入有效的 Cookie
          'Accept': 'application/json, text/plain, */*',
        }
      }, (res) => {
        let body = ''
        res.on('data', (chunk: Buffer) => body += chunk.toString())
        res.on('end', () => {
          try {
            const data = JSON.parse(body)
            resolve(data.data || data)
          } catch {
            reject(new Error('解析房间信息失败'))
          }
        })
      })
      req.on('error', reject)
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('获取房间信息超时')) })
    })
  }

  /**
   * 建立 WebSocket 连接
   * 
   * 抖音 WebSocket 地址格式:
   * wss://webcast.douyin.com/webcast/im/push/v2/
   *   ?app_name=douyin_web
   *   &version_code=180800
   *   &webcast_sdk_version=1.0.0
   *   &build_number=180800
   *   &did_rule=3
   *   &fp={fingerprint}
   *   &did={device_id}
   *   &session_id={session_id}
   *   &live_id=1
   *   &room_id={room_id}
   *   &user_id=0
   *   &resp_content_type=protobuf
   *   &compress=gzip
   */
  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 构造 WebSocket URL
        const deviceId = this.generateDeviceId()
        const wsUrl = this.buildWebSocketUrl(this.roomId, deviceId)

        this.ws = new WebSocket(wsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': '',
          },
        })

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket 连接超时'))
        }, 10000)

        this.ws.on('open', () => {
          clearTimeout(timeout)
          this._status = 'connected'
          this.reconnectAttempts = 0
          this.emit('status', this._status)

          // 发送认证握手
          this.sendAuthHandshake()
          this.startHeartbeat()
          resolve()
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data)
        })

        this.ws.on('close', (code: number, reason: Buffer) => {
          this._status = 'disconnected'
          this.emit('status', this._status)
          this.stopHeartbeat()
          this.scheduleReconnect()
        })

        this.ws.on('error', (err: Error) => {
          clearTimeout(timeout)
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 构造 WebSocket URL
   * 
   * 抖音 WebSocket 需要携带多个查询参数，
   * 其中 fp (指纹) 和 did (设备ID) 是关键参数
   */
  private buildWebSocketUrl(roomId: string, deviceId: string): string {
    const baseUrl = 'wss://webcast.douyin.com/webcast/im/push/v2/'
    const params = new URLSearchParams({
      app_name: 'douyin_web',
      version_code: '180800',
      webcast_sdk_version: '1.0.0',
      build_number: '180800',
      did_rule: '3',
      fp: this.generateFingerprint(),
      did: deviceId,
      session_id: this.generateSessionId(),
      live_id: '1',
      room_id: roomId,
      user_id: '0',
      resp_content_type: 'protobuf',
      compress: 'gzip',
      device_platform: 'web',
      ac: 'wifi',
      identity: 'audience',
    })
    return baseUrl + '?' + params.toString()
  }

  /**
   * 发送认证握手消息
   * 
   * 连接建立后，需要发送 PushFrame 认证包进行握手。
   * 如果 serverParams 中含有 token，则携带 token 认证。
   */
  private sendAuthHandshake() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // 认证 PushFrame
    const authPayload = this.buildAuthPayload()
    this.ws.send(authPayload)
  }

  /**
   * 构建认证 PushFrame 负载
   * 
   * 抖音 WebSocket 使用二进制 PushFrame 协议，
   * 消息结构为自定义二进制格式 + protobuf 内容。
   * 
   * PushFrame 格式:
   * - 4 bytes: payload length
   * - 1 byte: log_id length
   * - N bytes: log_id string
   * - 2 bytes: payload_type length
   * - N bytes: payload_type string (如 "hb" 或 "msg")
   * - 4 bytes: sequence_id
   * - 4 bytes: sub_sequence_id
   * - N bytes: payload (protobuf 编码)
   * 
   * 注：具体二进制格式可能随抖音版本变化，
   * 实际使用时建议通过浏览器 DevTools 抓包确认最新格式
   */
  private buildAuthPayload(): Buffer {
    // 这是一个简化的实现，实际协议细节需要通过抓包确认
    // 握手消息通常是一个包含 token 和房间信息的认证包
    const logId = Buffer.from(Date.now().toString(36))
    const logIdLen = Buffer.alloc(1)
    logIdLen[0] = logId.length

    const payloadType = Buffer.from('hb')
    const payloadTypeLen = Buffer.alloc(2)
    payloadTypeLen.writeUInt16LE(payloadType.length, 0)

    const seqId = Buffer.alloc(4)
    seqId.writeUInt32LE(0, 0)

    const subSeqId = Buffer.alloc(4)
    subSeqId.writeUInt32LE(0, 0)

    const payload = Buffer.from(JSON.stringify({
      type: 'auth',
      room_id: this.roomId,
      token: this.serverParams?.token || '',
      live_id: 1,
    }))

    const payloadLen = Buffer.alloc(4)
    payloadLen.writeUInt32LE(payload.length, 0)

    return Buffer.concat([
      payloadLen, logIdLen, logId,
      payloadTypeLen, payloadType,
      seqId, subSeqId, payload,
    ])
  }

  /**
   * 处理收到的 WebSocket 消息
   * 
   * 抖音推送的消息通常为 PushFrame 格式，
   * 需要解析 frame 头部，解压 payload，解码 protobuf。
   */
  private handleMessage(data: WebSocket.Data) {
    try {
      const frames = this.parsePushFrames(data)
      for (const frame of frames) {
        this.handlePushFrame(frame)
      }
    } catch {
      // 解析失败的原始数据，尝试做 JSON 解析（某些旧版本可能使用 JSON）
      try {
        const str = data.toString()
        const json = JSON.parse(str)
        if (Array.isArray(json)) {
          for (const msg of json) {
            const danmaku = this.convertToDanmaku(msg)
            if (danmaku) this.emit('danmaku', danmaku)
          }
        }
      } catch {
        // 完全无法解析的数据，忽略
      }
    }
  }

  /**
   * 解析 PushFrame 消息
   * 
   * 一个 WebSocket 消息可能包含多个 PushFrame，
   * 每个 frame 由 header + payload 组成。
   * payload 部分通常是 protobuf 编码且可能经过 gzip 压缩。
   */
  private parsePushFrames(data: WebSocket.Data): Array<{ type: string; payload: Buffer }> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as string)
    const frames: Array<{ type: string; payload: Buffer }> = []
    let offset = 0

    while (offset < buffer.length) {
      try {
        // 解析 PushFrame header
        const payloadLen = buffer.readUInt32LE(offset); offset += 4
        const logIdLen = buffer[offset]; offset += 1
        offset += logIdLen  // skip log_id
        const payloadTypeLen = buffer.readUInt16LE(offset); offset += 2
        const payloadType = buffer.slice(offset, offset + payloadTypeLen).toString(); offset += payloadTypeLen
        offset += 4  // skip sequence_id
        offset += 4  // skip sub_sequence_id

        // 提取 payload
        let payload = buffer.slice(offset, offset + payloadLen)
        offset += payloadLen

        // 尝试 gzip 解压
        if (payload.length > 2 && (payload[0] === 0x1f && payload[1] === 0x8b)) {
          try {
            const zlib = require('zlib')
            payload = zlib.gunzipSync(payload)
          } catch {}
        }

        frames.push({ type: payloadType, payload })
      } catch {
        break  // 解析出错，跳出循环
      }
    }

    return frames
  }

  /**
   * 处理单个 PushFrame
   * 
   * 根据 payloadType 分发不同类型的消息。
   * 弹幕消息的 payload 是 protobuf 编码的 ChatMessage
   */
  private handlePushFrame(frame: { type: string; payload: Buffer }) {
    const { type, payload } = frame

    // 心跳响应或错误消息
    if (type === 'hb' || type === 'ack') {
      return
    }

    // 有实际消息内容
    if (type === 'msg' && payload.length > 0) {
      try {
        const messages = this.decodeProtobufMessages(payload)
        for (const msg of messages) {
          const danmaku = this.convertToDanmaku(msg)
          if (danmaku) this.emit('danmaku', danmaku)
        }
      } catch {
        // protobuf 解码失败
      }
    }
  }

  /**
   * 解码 protobuf 消息
   * 
   * 抖音使用 protobuf 编码所有消息。
   * 需要 protobuf 定义文件 (.proto) 来解码。
   * 
   * 由于 protobuf 定义会随版本更新，这里提供一个
   * 通用的解码框架。实际使用时建议：
   * 1. 从抖音页面 JS 中提取 protobuf 定义
   * 2. 使用 protobuf.js 库进行解码
   * 3. 或使用已知的 ChatMessage proto 定义
   * 
   * 这里实现一个基础解码器，处理常见弹幕格式。
   */
  private decodeProtobufMessages(buffer: Buffer): any[] {
    const messages: any[] = []
    
    // 抖音消息结构通常是：
    // messages 中包含多个 message，每个 message 有 method 和 payload
    // 这是一个简化的解析，完整实现需要 protobuf 库
    
    try {
      // 如果 protobuf.js 可用，使用它来解码
      // const protobuf = require('protobufjs')
      // const root = protobuf.Root.fromJSON(protoDefinition)
      // 解码 ChatMessage 等
      
      // 简化实现：检查是否包含可读的文本内容
      const str = buffer.toString('utf8')
      if (str.includes('content') || str.includes('nickname')) {
        try {
          const json = JSON.parse(str)
          messages.push(json)
        } catch {
          // 不是 JSON，尝试提取文本
          const match = str.match(/[\\u4e00-\\u9fff\\w]+/g)
          if (match) {
            messages.push({ content: match.join(' '), type: 'text' })
          }
        }
      }
    } catch {
      // 解码失败
    }

    return messages
  }

  /**
   * 将抖音消息转换为统一 Danmaku 格式
   * 
   * 处理不同类型的消息：
   * - WebcastChatMessage: 弹幕
   * - WebcastGiftMessage: 礼物
   * - WebcastMemberMessage: 进入房间
   */
  private convertToDanmaku(msg: any): Danmaku | null {
    if (!msg) return null

    const method = msg.method || msg.type || ''
    const content = msg.content || msg.message || msg.text || ''
    const user = msg.user || {}
    const nickname = user.nickname || user.nickName || msg.userName || msg.nickname || '匿名'
    const userId = (user.id || user.userId || '').toString()

    // 弹幕消息
    if (method.includes('ChatMessage') || method === 'chat' || content) {
      if (!content.trim()) return null
      return {
        id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roomId: this.roomId,
        userId,
        username: nickname,
        content: content.trim(),
        timestamp: Date.now(),
        type: 'normal',
        filtered: false,
      }
    }

    // 礼物消息
    if (method.includes('GiftMessage') || method === 'gift') {
      const gift = msg.gift || msg.common || {}
      return {
        id: `ws_gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roomId: this.roomId,
        userId,
        username: nickname,
        content: `送出了${gift.giftName || '礼物'}x${gift.giftCount || 1}`,
        timestamp: Date.now(),
        type: 'gift',
        giftInfo: {
          name: gift.giftName || '礼物',
          count: gift.giftCount || 1,
          cost: gift.giftCost,
        },
        filtered: false,
      }
    }

    // 进入房间消息（可以忽略或作为系统消息）
    if (method.includes('MemberMessage') || method === 'enter') {
      return {
        id: `ws_enter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roomId: this.roomId,
        userId,
        username: nickname,
        content: `${nickname} 进入了直播间`,
        timestamp: Date.now(),
        type: 'enter',
        filtered: false,
      }
    }

    return null
  }

  /**
   * 发送心跳
   * 
   * 抖音 WebSocket 需要定期发送心跳包维持连接，
   * 通常每 25-30 秒发送一次 PushFrame { type: "hb" }
   */
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const heartbeatPayload = this.buildHeartbeatPayload()
        this.ws.send(heartbeatPayload)
      }
    }, 25000)
  }

  private buildHeartbeatPayload(): Buffer {
    const logId = Buffer.from(Date.now().toString(36))
    const logIdLen = Buffer.alloc(1); logIdLen[0] = logId.length
    const payloadType = Buffer.from('hb')
    const payloadTypeLen = Buffer.alloc(2); payloadTypeLen.writeUInt16LE(payloadType.length, 0)
    const seqId = Buffer.alloc(4); seqId.writeUInt32LE(0, 0)
    const subSeqId = Buffer.alloc(4); subSeqId.writeUInt32LE(0, 0)
    const payload = Buffer.from(JSON.stringify({ type: 'ping', room_id: this.roomId }))
    const payloadLen = Buffer.alloc(4); payloadLen.writeUInt32LE(payload.length, 0)
    return Buffer.concat([payloadLen, logIdLen, logId, payloadTypeLen, payloadType, seqId, subSeqId, payload])
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 断线重连（指数退避）
   * 最多重试 20 次，间隔从 2s 逐步增加到 30s
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', '重连已达最大次数，请手动重新连接')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    )
    this.emit('status', 'connecting')

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.roomId).catch(() => {})
    }, delay)
  }

  async disconnect() {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts  // 阻止自动重连

    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close(1000, 'user disconnect')
      this.ws = null
    }
    this._status = 'disconnected'
    this.emit('status', this._status)
  }

  // ---- 辅助方法 ----

  private generateDeviceId(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private generateFingerprint(): string {
    // 模拟浏览器指纹
    const fp = [
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 10),
      Math.random().toString(36).slice(2, 6),
    ].join('')
    return fp
  }

  private generateSessionId(): string {
    return `web_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }
}