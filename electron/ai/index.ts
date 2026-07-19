import OpenAI from 'openai'
import { EventEmitter } from 'events'
import { AppSettings } from '../types'
import { buildRealtimePrompt } from './prompt-templates'

export class AIService extends EventEmitter {
  private client: OpenAI | null = null
  private enabled = true
  private processing = false

  configure(settings: AppSettings) {
    if (settings.deepseekApiKey) {
      this.client = new OpenAI({
        apiKey: settings.deepseekApiKey,
        baseURL: 'https://api.deepseek.com/v1',
      })
      this.enabled = settings.aiEnabled
    } else {
      this.client = null
      this.enabled = false
    }
  }

  setEnabled(enabled: boolean) { this.enabled = enabled }
  get isReady(): boolean { return this.client !== null && this.enabled }

  async processRealtime(
    danmaku: { username: string; content: string }[],
    persona: any
  ) {
    if (!this.client || this.processing) return
    this.processing = true

    try {
      const prompt = buildRealtimePrompt(danmaku, persona)
      const stream = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: '你是主播，现在你在直播，直接说你会怎么回。' },
        ],
        temperature: 0.9,
        max_tokens: 500,
        stream: true,
      })

      let full = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        full += delta
        this.emit('reply-stream', { id: Date.now().toString(), text: full, done: false, danmaku })
      }

      this.emit('reply-stream', { id: Date.now().toString(), text: full, done: true, danmaku })
    } catch (err) {
      this.emit('error', `处理失败: ${(err as Error).message}`)
    } finally {
      this.processing = false
    }
  }

  destroy() {
    this.removeAllListeners()
    this.client = null
  }
}