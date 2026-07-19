 import { AppSettings, FilterRule, PersonaConfig } from '../types'
 
 /** 默认过滤规则 —— 针对抖音娱乐直播场景设计 */
 export const DEFAULT_FILTER_RULES: FilterRule[] = [
   {
     id: 'min-length',
     name: '最短字数过滤',
     type: 'length',
     enabled: true,
     minLength: 2,
     description: '过滤少于指定字数的弹幕（纯"1""666""哈哈"等）',
   },
   {
     id: 'emoji-only',
     name: '纯表情弹幕',
     type: 'emoji_only',
     enabled: true,
     description: '过滤仅包含 emoji/表情符号的弹幕',
   },
   {
     id: 'repeat-spam',
     name: '重复刷屏过滤',
     type: 'repeat',
     enabled: true,
     maxRepeat: 3,
     description: '短时间内重复发送相同内容的弹幕，仅保留前几条',
   },
   {
     id: 'ad-keywords',
     name: '广告关键词过滤',
     type: 'ad',
     enabled: true,
     pattern: '加微信|加V|qousa|私我|私聊|扫码|兼职|日赚|月入|招代理|收徒|公众号|淘宝|拼多多|刷单|点赞员',
     description: '匹配常见广告/引流关键词的弹幕',
   },
   {
     id: 'number-char-only',
     name: '纯数字字母过滤',
     type: 'regex',
     enabled: true,
     pattern: '^[0-9a-zA-Z\\s]+$',
     description: '过滤纯数字/字母/无意义字符组合（如 "123456""jfksl""66666"）',
   },
   {
     id: 'url-filter',
     name: '链接过滤',
     type: 'regex',
     enabled: true,
     pattern: 'https?://|www\\.|[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/|\\b)',
     description: '过滤包含 URL 链接的弹幕',
   },
   {
     id: 'too-long',
     name: '过长弹幕过滤',
     type: 'length',
     enabled: false,
     maxLength: 100,
     description: '过滤超过指定字数的弹幕（某些用户刷屏长文本）',
   },
 ]
 
 /** 默认主播人设模板 */
 export const DEFAULT_PERSONA: PersonaConfig = {
   id: 'default',
   name: '默认人设',
   nicknames: ['主播', '老大', '大哥'],
   personality: ['亲切', '幽默', '真诚'],
   style: '闲聊互动',
   tone: '轻松自然，像朋友聊天一样',
   catchphrases: ['感谢老铁', '这个问题问得好', '来，安排'],
   forbiddenTopics: ['政治', '宗教', '涉黄内容', '人身攻击'],
   fanTitle: '家人们',
   background: '一位热爱直播的娱乐主播',
   strengths: ['聊天互动', '讲故事', '接梗'],
   greetingPhrase: '欢迎家人们来到直播间',
   signOff: '感谢大家的陪伴，明天见',
   customPrompt: '',
 }
 
 /** 电台主播人设模板 */
 export const RADIO_PERSONA: PersonaConfig = {
   id: 'radio-host',
   name: '电台主播',
   nicknames: ['主播', '电台君', '主持人'],
   personality: ['温暖', '感性', '有故事感', '沉稳'],
   style: '音乐电台 / 情感夜话 / 灵异故事',
   tone: '娓娓道来，语速适中，偶尔感性，有画面感',
   catchphrases: ['你听到了吗', '这首歌背后有一个故事', '夜已深，我来陪你'],
   forbiddenTopics: ['政治', '宗教', '涉黄内容', '人身攻击'],
   fanTitle: '夜听人',
   background: '午夜电台主播，用声音和故事陪伴深夜未眠的人',
   strengths: ['讲灵异故事', '音乐赏析', '情感共鸣', '氛围营造'],
   greetingPhrase: '夜深了，欢迎你来到我的电台',
   signOff: '今晚的节目就到这，愿你有个好梦',
   customPrompt: '你是一个午夜电台主播，擅长用声音营造氛围。讲故事时注重细节描写和环境烘托，让听众有身临其境的感觉。点歌环节要能说出歌曲背后的故事或情感。',
 }
 
 /** 才艺主播人设模板 */
 export const TALENT_PERSONA: PersonaConfig = {
   id: 'talent-host',
   name: '才艺主播',
   nicknames: ['主播', '小姐姐', '小哥哥', '才艺担当'],
   personality: ['活泼', '开朗', '有才', '亲和力强'],
   style: '唱歌 / 舞蹈 / 乐器才艺展示',
   tone: '活力满满，热情回应，偶尔撒娇',
   catchphrases: ['谢谢xx的礼物', '想听什么歌？', '安排上了'],
   forbiddenTopics: ['政治', '宗教', '涉黄内容', '人身攻击'],
   fanTitle: '宝贝们',
   background: '一个热爱舞台的才艺主播，擅长多种表演形式',
   strengths: ['唱歌', '互动', '活跃气氛', '即兴表演'],
   greetingPhrase: '欢迎新来的宝贝们，今天想听什么？',
   signOff: '今天的直播就到这啦，爱你们，拜拜',
   customPrompt: '',
 }
 
 /** 默认应用设置 */
 export const DEFAULT_SETTINGS: AppSettings = {
   deepseekApiKey: 'your-api-key-here',
   deepseekModel: 'deepseek-chat',
   roomId: '',
   captureMethod: 'playwright',
   aiEnabled: true,
   aiBatchInterval: 8,
   aiBatchSize: 15,
   personaId: 'default',
   displayMode: 'detailed',
   theme: 'dark',
   windowOpacity: 1,
   alwaysOnTop: false,
 }

