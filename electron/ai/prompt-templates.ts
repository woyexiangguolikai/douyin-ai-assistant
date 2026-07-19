import { PersonaConfig, Danmaku } from '../types'

function formatDanmaku(danmaku: { username: string; content: string; timestamp?: number }[]): string {
  return danmaku.slice(-6).map(d => {
    const t = d.timestamp ? new Date(d.timestamp) : new Date()
    const time = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
    return `[${time}] ${d.username}: ${d.content}`
  }).join('\n')
}

const MODE_PROMPTS: Record<string, string> = {
  auto: `根据弹幕内容自动选择最合适的回复方式：
- 要故事/灵异事件 → 生成80-150字完整故事
- 提问/闲聊 → 30-50字自然回复`,

  short: `用最简短的方式回复，20字以内，快速回应。
示例：
弹幕"这首歌好听" → "是吧！我也爱这首"
弹幕"主播好漂亮" → "谢谢宝贝~"`,

  story: `弹幕中有任何要故事、灵异、趣事的倾向，就生成一个完整的短篇故事（100-200字）。
要求有细节、有画面感、像在直播里讲故事。
用"我昨晚收到个投稿"或"我有个朋友说"开头。
如果弹幕明显不想要故事，则正常回复。`,

  funny: `用幽默风趣的风格回复，可以说俏皮话、抛梗、自黑。
示例：弹幕"主播你信鬼吗" → "我不怕鬼，我怕半夜手机突然没电"`,

  gentle: `用温柔感性的风格回复，适合情感/陪聊类直播。
语速放慢、带点温度、多共情少评价。
示例：弹幕"今天心情不好" → "怎么了？虽然隔着屏幕，但我听着呢。"`
}

export function buildRealtimePrompt(
  danmaku: { username: string; content: string; timestamp?: number }[],
  persona: any,
  replyMode?: string,
  recentReplies?: string[]
): string {
  const nick = persona.nicknames?.join('、') || '大家'
  const forbid = persona.forbiddenTopics?.join('、') || ''
  const custom = persona.customPrompt || ''
  const mode = replyMode || 'auto'
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.auto

  const recentText = recentReplies?.slice(-5).map(r => `- ${r.substring(0, 60)}`).join('\n') || ''

  return `你是一个真实的抖音主播，正在直播。

你的背景：${persona.background || '一个热爱直播的主播'}
粉丝叫你：${nick}
称呼粉丝：${persona.fanTitle || '家人们'}
你的性格：${persona.personality?.join('、') || '亲切幽默'}
你的风格：${persona.style || '聊天互动'}
你的语气：${persona.tone || '像朋友聊天一样自然'}
你的口头禅：${persona.catchphrases?.join('、') || '无'}
你的特长：${persona.strengths?.join('、') || '聊天、讲故事'}
${custom ? '\n额外注意：' + custom : ''}
${forbid ? '\n不要聊：' + forbid : ''}

现在直播间弹幕：
${formatDanmaku(danmaku)}

【模式说明】
${modePrompt}

【已回复过的内容（请避免重复）】
${recentText || '暂无已回复内容'}

直接输出回复内容：`
}