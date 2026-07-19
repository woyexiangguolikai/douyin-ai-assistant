 /** 从 preload 暴露的全局 API 类型 */
 export interface ElectronAPI {
   window: {
     minimize: () => Promise<void>
     maximize: () => Promise<void>
     close: () => Promise<void>
     isMaximized: () => Promise<boolean>
     onMaximizeChange: (callback: (maximized: boolean) => void) => void
   }
   capture: {
     connect: (roomId: string) => Promise<{ success: boolean; error?: string }>
     disconnect: () => Promise<{ success: boolean }>
     switchMethod: (method: 'websocket' | 'playwright') => Promise<{ success: boolean; method: string }>
     onDanmaku: (callback: (data: any) => void) => void
     onFiltered: (callback: (data: any) => void) => void
     onStatus: (callback: (status: string) => void) => void
     removeDanmakuListeners: () => void
   }
   ai: {
     toggle: (enabled: boolean) => Promise<{ success: boolean }>
     onReplies: (callback: (data: any) => void) => void
     removeRepliesListener: () => void
   }
   settings: {
     get: () => Promise<any>
     save: (settings: any) => Promise<{ success: boolean }>
   }
   personas: {
     list: () => Promise<any[]>
     save: (persona: any) => Promise<{ success: boolean }>
     delete: (id: string) => Promise<{ success: boolean }>
   }
   filters: {
     list: () => Promise<any[]>
     save: (rules: any[]) => Promise<{ success: boolean }>
   }
   history: {
     get: (roomId: string) => Promise<any>
     clear: (roomId?: string) => Promise<{ success: boolean }>
   }
 }
 
 declare global {
   interface Window {
     electronAPI: ElectronAPI
   }
 }
 
 /** 前端 UI 状态 */
 export interface ViewState {
   currentView: 'danmaku' | 'ai-suggestions' | 'settings' | 'persona' | 'filters'
 }
 
 /** 前端弹幕数据 */
 export interface DanmakuItem {
   id: string
   username: string
   content: string
   timestamp: number
   type: string
   filtered?: boolean
   filterReason?: string
 }
 
 /** 前端 AI 回复 */
 export interface AIReplyItem {
   id: string
   type: string
   originalContent: string
   suggestion: string
   reason: string
   confidence: number
   timestamp: number
   used: boolean
 }
 
 /** 连接状态 */
 export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
 
 /** 弹幕来源 */
 export type CaptureMethod = 'websocket' | 'playwright'
