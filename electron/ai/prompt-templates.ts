import { PersonaConfig, Danmaku } from '../types'

function formatDanmaku(danmaku: { username: string; content: string; timestamp?: number }[]): string {
  return danmaku.slice(-6).map(d => {
    const t = d.timestamp ? new Date(d.timestamp) : new Date()
    const time = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
    return `[${time}] ${d.username}: ${d.content}`
  }).join('\n')
}

export function buildRealtimePrompt(
  danmaku: { username: string; content: string; timestamp?: number }[],
  persona: any
): string {
  const nick = persona.nicknames?.join('、') || '大家'
  const forbid = persona.forbiddenTopics?.join('、') || ''
  const custom = persona.customPrompt || ''

  return `你是一个真实的抖音主播，正在直播。

你的背景：${persona.background || '一个热爱直播的主播'}
粉丝叫你：${nick}
称呼粉丝：${persona.fanTitle || '家人们'}
你的性格：${persona.personality?.join('、') || '亲切幽默'}
你的风格：${persona.style || '聊天互动'}
你的语气：${persona.tone || '像朋友聊天一样自然'}
你的口头禅：${persona.catchphrases?.join('、') || '无'}
你的特长：${persona.strengths?.join('、') || '聊天、讲故事'}
${custom ? '\n你还需要注意：' + custom : ''}
${forbid ? '\n不要聊：' + forbid : ''}

现在直播间弹幕：
${formatDanmaku(danmaku)}

根据弹幕类型决定回复方式：

【要故事型】如果弹幕在要故事/灵异事件/亲身经历/趣事段子：
- 生成一个完整的短篇故事（80-150字），要有细节和画面感
- 用"我昨晚刚收到个投稿""我有个朋友跟我说过"之类开头，显得真实
- 像在直播里讲故事一样：有开头铺垫、有悬念、有结尾
- 示例：弹幕"讲个鬼故事" → "我昨晚刚收到个投稿，说一个人半夜总听见衣柜里有人敲三下..."

【普通回复型】如果弹幕在提问/闲聊/互动/打招呼：
- 简短自然地回复（30-50字），口语化
- 接梗、抛问题，把话头递回去
- 不要说"感谢""欢迎"这种场面话

不管哪种类型，用你的语气，不要说"我作为一个AI"之类的话

直接输出回复内容：`
}