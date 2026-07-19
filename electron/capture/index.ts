 import { EventEmitter } from 'events'
 import { Danmaku, ConnectionStatus, CaptureMethod, FilterRule } from '../types'
 import { WebSocketCapture } from './websocket-capture'
 import { PlaywrightCapture } from './playwright-capture'
 import { DanmakuFilter } from './filters'
 
 /**
  * 弹幕采集管理器
  * 
  * 统一管理两种采集方案，提供过滤链，对上层（AI 模块、UI）暴露一致的接口。
  * 支持在运行时切换采集方案而不影响弹幕流。
  */
 export class CaptureManager extends EventEmitter {
   private wsCapture: WebSocketCapture
   private pwCapture: PlaywrightCapture
   private filter: DanmakuFilter
   private currentMethod: CaptureMethod = 'playwright'
   private _status: ConnectionStatus = 'disconnected'
   private _roomId: string = ''
   private danmakuQueue: Danmaku[] = []
   private stats = {
     total: 0,
     filtered: 0,
     passed: 0,
   }
 
   constructor() {
     super()
     this.wsCapture = new WebSocketCapture()
     this.pwCapture = new PlaywrightCapture()
     this.filter = new DanmakuFilter()
 
     this.setupCaptureEvents(this.wsCapture)
     this.setupCaptureEvents(this.pwCapture)
   }
 
   get status() { return this._status }
   get roomId() { return this._roomId }
   get method() { return this.currentMethod }
   get filteredCount() { return this.stats.filtered }
   get totalCount() { return this.stats.total }
 
   private setupCaptureEvents(capture: WebSocketCapture | PlaywrightCapture) {
     capture.on('danmaku', (danmaku: Danmaku) => {
       this.stats.total++
       this.handleDanmaku(danmaku)
     })
 
     capture.on('status', (status: ConnectionStatus) => {
       this._status = status
       this.emit('status', status)
     })
 
     capture.on('error', (error: string) => {
       this.emit('error', error)
     })
   }
 
   private handleDanmaku(danmaku: Danmaku) {
     // 先过过滤链
     const result = this.filter.filter(danmaku)
     
     if (!result.passed) {
       danmaku.filtered = true
       danmaku.filterReason = result.reason
       this.stats.filtered++
       this.emit('danmaku-filtered', danmaku)
       return
     }
 
     this.stats.passed++
     danmaku.filtered = false
     
     // 加入队列，等待 AI 处理
     this.danmakuQueue.push(danmaku)
     // 限制队列大小
     if (this.danmakuQueue.length > 200) {
       this.danmakuQueue.splice(0, this.danmakuQueue.length - 200)
     }
 
     this.emit('danmaku', danmaku)
   }
 
     setMethod(method: CaptureMethod) { this.currentMethod = method }

  async connect(roomId: string) {
     this._roomId = roomId
     this.danmakuQueue = []
     this.stats = { total: 0, filtered: 0, passed: 0 }
     this.filter.reset()
 
     if (this.currentMethod === 'websocket') {
       await this.wsCapture.connect(roomId)
     } else {
       await this.pwCapture.connect(roomId)
     }
   }
 
   async disconnect() {
     await this.wsCapture.disconnect()
     await this.pwCapture.disconnect()
     this._status = 'disconnected'
     this.emit('status', 'disconnected')
   }
 
   async switchMethod(method: CaptureMethod) {
     const wasConnected = this._status === 'connected' || this._status === 'connecting'
     
     // 断开当前连接
     await this.wsCapture.disconnect()
     await this.pwCapture.disconnect()
 
     this.currentMethod = method
 
     // 如果之前是连接状态，用新方法重连
     if (wasConnected && this._roomId) {
       await this.connect(this._roomId)
     }
   }
 
   updateFilterRules(rules: FilterRule[]) {
     this.filter.updateRules(rules)
   }
 
   /** 获取当前队列中的弹幕并清空（供 AI 模块消费） */
   drainQueue(batchSize: number): Danmaku[] {
     const batch = this.danmakuQueue.splice(0, batchSize)
     return batch
   }
 
   /** 查看队列中的弹幕（不消费） */
   peekQueue(): Danmaku[] {
     return [...this.danmakuQueue]
   }
 }
