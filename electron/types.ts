 /** 弹幕来源 */
 export type CaptureMethod = 'websocket' | 'playwright'
 
 /** 连接状态 */
 export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
 
 /** 弹幕消息 */
 export interface Danmaku {
   id: string
   roomId: string
   userId?: string
   username: string
   content: string
   timestamp: number
   type: 'normal' | 'gift' | 'enter' | 'system' | 'like'
   giftInfo?: {
     name: string
     count: number
     cost?: number
   }
   filtered: boolean
   filterReason?: string
 }
 
 /** AI 生成的回复建议 */
 export interface AIReply {
   id: string
   danmakuIds: string[]
   originalContent: string
   type: 'reply' | 'topic_expand' | 'question_answer' | 'story_material' | 'atmosphere_tip'
   suggestion: string
   reason: string
   confidence: number
   timestamp: number
   used: boolean
 }
 
 /** 主播人设配置 */
 export interface PersonaConfig {
   id: string
   name: string
   nicknames: string[]         // 粉丝对主播的称呼
   personality: string[]       // 性格标签
   style: string               // 直播风格
   tone: string                // 常用语气
   catchphrases: string[]      // 口头禅
   forbiddenTopics: string[]   // 禁忌话题
   fanTitle: string            // 粉丝称呼
   background: string          // 主播背景介绍
   strengths: string[]         // 擅长领域
   greetingPhrase: string      // 开场白
   signOff: string             // 结束语
   customPrompt: string        // 自定义提示词补充
 }
 
 /** 过滤规则配置 */
 export interface FilterRule {
   id: string
   name: string
   type: 'regex' | 'length' | 'repeat' | 'ad' | 'emoji_only' | 'custom'
   enabled: boolean
   pattern?: string
   minLength?: number
   maxLength?: number
   maxRepeat?: number
   description: string
 }
 
 /** 应用设置 */
 export interface AppSettings {
   deepseekApiKey: string
   deepseekModel: string
   roomId: string
   captureMethod: CaptureMethod
   aiEnabled: boolean
   aiBatchInterval: number       // AI 批处理间隔(秒)
   aiBatchSize: number           // 每批弹幕数量
   personaId: string
   displayMode: 'compact' | 'detailed'
   theme: 'dark' | 'light'
   windowOpacity: number
   alwaysOnTop: boolean
 }
 
 /** AI 批处理输入 */
 export interface AIBatchInput {
   danmaku: Danmaku[]
   persona: PersonaConfig
   recentReplies: string[]       // 最近回复记录，避免重复
   roomContext: {
     currentTopic?: string
     atmosphere?: string
     activeUsers?: number
   }
 }
 
 /** AI 批处理输出 */
 export interface AIBatchOutput {
   items: AIReply[]
   summary?: string
   atmosphereShift?: string
 }
 
 /** IPC 通道名 */
 export const IPC_CHANNELS = {
   // 连接管理
   CONNECT_ROOM: 'connect-room',
   DISCONNECT_ROOM: 'disconnect-room',
   CONNECTION_STATUS: 'connection-status',
   SWITCH_CAPTURE_METHOD: 'switch-capture-method',
   
   // 弹幕流
   DANMAKU_RECEIVED: 'danmaku-received',
   DANMAKU_FILTERED: 'danmaku-filtered',
   
   // AI
   AI_REPLY_GENERATED: 'ai-reply-generated',
   TOGGLE_AI: 'toggle-ai',
   
   // 配置
   GET_SETTINGS: 'get-settings',
   SAVE_SETTINGS: 'save-settings',
   GET_PERSONAS: 'get-personas',
   SAVE_PERSONA: 'save-persona',
   DELETE_PERSONA: 'delete-persona',
   GET_FILTER_RULES: 'get-filter-rules',
   SAVE_FILTER_RULES: 'save-filter-rules',
   
   // 会话历史
   GET_SESSION_HISTORY: 'get-session-history',
   CLEAR_HISTORY: 'clear-history',
 } as const
