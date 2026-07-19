import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { CaptureManager } from './capture'
import { AIService } from './ai'
import { Store } from './store'
import { IPC_CHANNELS, AppSettings, CaptureMethod, PersonaConfig, FilterRule, Danmaku } from './types'

let mainWindow: BrowserWindow | null = null
let capture: CaptureManager
let aiService: AIService
let store: Store

let roomContext = { currentTopic: '', atmosphere: 'normal', activeUsers: 0 }
let apiToken: string | null = null
let apiBaseUrl = 'http://localhost:3001'
let heartbeatInterval: NodeJS.Timeout | null = null
let pendingDanmaku: any[] = []
let recentContext: any[] = []
let aiDebounceTimer: NodeJS.Timeout | null = null
function startHeartbeat() {
  stopHeartbeat()
  heartbeatInterval = setInterval(async () => {
    if (!apiToken) return
    try {
      const settings = store.getSettings()
      const roomId = settings.roomId
      if (!roomId) return
      const aiOk = aiService?.isReady
      const status = aiOk ? 'online' : 'error'
      const msg = aiOk ? '' : 'DeepSeek API 未配置或 Key 无效'
      await fetch(apiBaseUrl + '/api/rooms/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
        body: JSON.stringify({ room_id: roomId, status, status_message: msg })
      })
    } catch {}
  }, 60000)
}
function stopHeartbeat() {
  if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    title: '抖音AI直播助手',
    backgroundColor: '#0f1117',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.argv.includes("--dev")) {
    mainWindow!.loadFile(path.join(__dirname, '../dist/index.html'))
    // devtools disabled
  } else {
    mainWindow!.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function initServices() {
  capture = new CaptureManager()
  aiService = new AIService()

  const settings = store.getSettings()
  aiService.configure(settings)
  if (settings.roomId) capture.updateFilterRules(store.getFilterRules())

  // 弹幕来了 → 实时入队 + 防抖推给 AI
  capture.on('danmaku', (danmaku: Danmaku) => {
//     console.log('[DEBUG] Danmaku from capture:', danmaku.username, danmaku.content.substring(0, 30))
//     console.log('[DEBUG] Sending to renderer, mainWindow exists:', !!mainWindow)
    if (mainWindow) mainWindow.webContents.send(IPC_CHANNELS.DANMAKU_RECEIVED, danmaku)
    // 保持上下文窗口（最近30条）
    recentContext.push(danmaku)
    if (recentContext.length > 30) recentContext.splice(0, recentContext.length - 30)

    // 防抖：1.5 秒内来的弹幕合并处理
    // 防抖：1.5 秒内来的弹幕合并处理
    if (danmaku.type !== 'gift' && danmaku.type !== 'enter' && danmaku.type !== 'system') {
      recentContext.push(danmaku)
      if (recentContext.length > 30) recentContext.splice(0, recentContext.length - 30)
      pendingDanmaku.push(danmaku)
      if (aiDebounceTimer) clearTimeout(aiDebounceTimer)
      aiDebounceTimer = setTimeout(() => processAIBatch(), 1500)
    }
  })

  capture.on('status', (status: string) => {
    mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, status)
  })

  capture.on('error', (error: string) => {
    console.error('[Capture Error]', error)
    mainWindow?.webContents?.send('connection-status', 'error')
    mainWindow?.webContents?.send('capture-error', error)
  })

  // AI 流式回复 → 转发给前端
  aiService.on('reply-stream', (data: any) => {
    mainWindow?.webContents.send('ai-reply-stream', data)
  })

  aiService.on('error', (err: string) => {
    console.error('[AI Error]', err)
  })
}

function processAIBatch() {
  const batch = pendingDanmaku.splice(0)
  if (batch.length === 0 || !aiService.isReady) return

  const settings = store.getSettings()
  const persona = store.getPersona(settings.personaId)
  if (!persona) return

  // 取当前批 + 最近几条约旦上下文
  const context = recentContext.slice(-8)
  aiService.processRealtime(context, persona)
}

function registerIPC() {
  ipcMain.handle(IPC_CHANNELS.CONNECT_ROOM, async (_event, roomId: string) => {
    try {
      const settings = store.getSettings()
      settings.roomId = roomId
      store.saveSettings(settings)
      capture.updateFilterRules(store.getFilterRules())
      await capture.connect(roomId)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DISCONNECT_ROOM, async () => {
    await capture.disconnect()
    return { success: true }
  })

  // API 登录
  ipcMain.handle('api-login', async (_event, apiBase: string, username: string, password: string) => {
    try {
      const res = await fetch(apiBase + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || '登录失败' }
      apiToken = data.token
      apiBaseUrl = apiBase
      
      // 获取该账号的直播间配置
      const roomRes = await fetch(apiBase + '/api/rooms', {
        headers: { 'Authorization': 'Bearer ' + data.token }
      })
      const rooms = await roomRes.json()
      
      // 保存到本地
      const settings = store.getSettings()
      settings.deepseekApiKey = data.deepseek_api_key || settings.deepseekApiKey
      if (rooms && rooms.length > 0) {
        settings.roomId = rooms[0].room_id
      }
      store.saveSettings(settings)
      aiService.configure(settings)
      
      // 启动心跳
      startHeartbeat()
      
      return { success: true, user: data.user, rooms }
    } catch (e: any) {
      return { success: false, error: '无法连接服务器: ' + e.message }
    }
  })

  // 心跳
  ipcMain.handle('api-logout', async () => {
    apiToken = null; apiBaseUrl = 'http://localhost:3001'
    stopHeartbeat()
    return { success: true }
  })


  ipcMain.handle(IPC_CHANNELS.SWITCH_CAPTURE_METHOD, async (_event, method: CaptureMethod) => {
    await capture.switchMethod(method)
    const settings = store.getSettings()
    settings.captureMethod = method
    store.saveSettings(settings)
    return { success: true, method }
  })

  ipcMain.handle(IPC_CHANNELS.TOGGLE_AI, (_event, enabled: boolean) => {
    aiService.setEnabled(enabled)
    const settings = store.getSettings()
    settings.aiEnabled = enabled
    store.saveSettings(settings)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => store.getSettings())
  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, settings: AppSettings) => {
    store.saveSettings(settings)
    aiService.configure(settings)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.GET_PERSONAS, () => store.getPersonas())
  ipcMain.handle(IPC_CHANNELS.SAVE_PERSONA, (_event, persona: PersonaConfig) => {
    store.savePersona(persona)
    return { success: true }
  })
  ipcMain.handle(IPC_CHANNELS.DELETE_PERSONA, (_event, id: string) => {
    store.deletePersona(id)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.GET_FILTER_RULES, () => store.getFilterRules())
  ipcMain.handle(IPC_CHANNELS.SAVE_FILTER_RULES, (_event, rules: FilterRule[]) => {
    store.saveFilterRules(rules)
    capture.updateFilterRules(rules)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.GET_SESSION_HISTORY, (_event, roomId: string) => store.getSessionHistory(roomId))
  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, (_event, roomId?: string) => {
    store.clearHistory(roomId)
    return { success: true }
  })

  ipcMain.handle('window-minimize', () => mainWindow?.minimize())
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.handle('window-close', () => mainWindow?.close())
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() || false)

  // 导出文件
  ipcMain.handle('export-text', async (_event, content: string, defaultName: string) => {
    const fs = require('fs')
    const { dialog } = require('electron')
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true }
    }
    return { success: false }
  })
}

app.whenReady().then(async () => {
  store = new Store()
  await store.init()
  initServices()
  registerIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  capture?.disconnect()
  aiService?.destroy()
  store?.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  capture?.disconnect()
  aiService?.destroy()
  store?.close()
})
