import { contextBridge, ipcRenderer } from 'electron'

const IPC = {
  CONNECT_ROOM: 'connect-room', DISCONNECT_ROOM: 'disconnect-room',
  CONNECTION_STATUS: 'connection-status', SWITCH_CAPTURE_METHOD: 'switch-capture-method',
  DANMAKU_RECEIVED: 'danmaku-received', DANMAKU_FILTERED: 'danmaku-filtered',
  AI_REPLY_GENERATED: 'ai-reply-generated', TOGGLE_AI: 'toggle-ai',
  GET_SETTINGS: 'get-settings', SAVE_SETTINGS: 'save-settings',
  GET_PERSONAS: 'get-personas', SAVE_PERSONA: 'save-persona', DELETE_PERSONA: 'delete-persona',
  GET_FILTER_RULES: 'get-filter-rules', SAVE_FILTER_RULES: 'save-filter-rules',
  GET_SESSION_HISTORY: 'get-session-history', CLEAR_HISTORY: 'clear-history',
} as const

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },
  capture: {
    connect: (roomId: string) => ipcRenderer.invoke(IPC.CONNECT_ROOM, roomId),
    disconnect: () => ipcRenderer.invoke(IPC.DISCONNECT_ROOM),
    switchMethod: (method: string) => ipcRenderer.invoke(IPC.SWITCH_CAPTURE_METHOD, method),
    onDanmaku: (cb: (d: any) => void) => { ipcRenderer.on(IPC.DANMAKU_RECEIVED, (_e, d) => cb(d)) },
    onFiltered: (cb: (d: any) => void) => { ipcRenderer.on(IPC.DANMAKU_FILTERED, (_e, d) => cb(d)) },
    onStatus: (cb: (s: string) => void) => { ipcRenderer.on(IPC.CONNECTION_STATUS, (_e, s) => cb(s)) },
    onError: (cb: (m: string) => void) => { ipcRenderer.on('capture-error', (_e, m) => cb(m)) },
    removeDanmakuListeners: () => {
      ipcRenderer.removeAllListeners(IPC.DANMAKU_RECEIVED)
      ipcRenderer.removeAllListeners(IPC.DANMAKU_FILTERED)
      ipcRenderer.removeAllListeners(IPC.CONNECTION_STATUS)
    },
  },
  ai: {
    toggle: (enabled: boolean) => ipcRenderer.invoke(IPC.TOGGLE_AI, enabled),
    onReplies: (cb: (d: any) => void) => { ipcRenderer.on(IPC.AI_REPLY_GENERATED, (_e, d) => cb(d)) },
    removeRepliesListener: () => { ipcRenderer.removeAllListeners(IPC.AI_REPLY_GENERATED) },
    onReplyStream: (cb: (d: any) => void) => { ipcRenderer.on('ai-reply-stream', (_e, d) => cb(d)) },
    removeStreamListener: () => { ipcRenderer.removeAllListeners('ai-reply-stream') },
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
    save: (s: any) => ipcRenderer.invoke(IPC.SAVE_SETTINGS, s),
  },
  personas: {
    list: () => ipcRenderer.invoke(IPC.GET_PERSONAS),
    save: (p: any) => ipcRenderer.invoke(IPC.SAVE_PERSONA, p),
    delete: (id: string) => ipcRenderer.invoke(IPC.DELETE_PERSONA, id),
  },
  filters: {
    list: () => ipcRenderer.invoke(IPC.GET_FILTER_RULES),
    save: (r: any[]) => ipcRenderer.invoke(IPC.SAVE_FILTER_RULES, r),
  },
  history: {
    get: (roomId: string) => ipcRenderer.invoke(IPC.GET_SESSION_HISTORY, roomId),
    clear: (roomId?: string) => ipcRenderer.invoke(IPC.CLEAR_HISTORY, roomId),
  },
  misc: {
    setReplyMode: (m: string) => ipcRenderer.invoke('set-reply-mode', m),
  },

  auth: {
    login: (apiBase: string, username: string, password: string) =>
      ipcRenderer.invoke('api-login', apiBase, username, password),
    logout: () => ipcRenderer.invoke('api-logout'),
  },
  export: {
    save: (content: string, name: string) => ipcRenderer.invoke('export-text', content, name),
  },
})