# 抖音AI直播助手

一款专为抖音娱乐主播设计的 **弹幕抓取 + AI 智能提词** 桌面工具。实时抓取直播间弹幕，通过 AI 自动生成回复话术和故事内容，帮助主播轻松互动、活跃气氛。

## 功能特性

### 🎯 弹幕实时采集
- 通过 Playwright 浏览器自动化抓取抖音直播间弹幕
- 支持 WebSocket 直连方案（备用）
- 智能过滤：纯表情、重复刷屏、广告关键词等
- 弹幕去重，不重复抓取同一条

### 🤖 AI 智能回复
- 基于 DeepSeek API 实时生成回复话术
- **打字机逐字显示**，主播可边看边用
- 智能识别弹幕类型：
  - 提问/聊天 → 简短自然回复
  - 要故事/灵异事件 → 生成完整故事情节（80-150字）
- 支持主播人设配置（性格、语气、风格、口头禅等）
- 所有回复带触发弹幕来源标注

### 📺 左右分栏直播视图
- 左侧实时弹幕流
- 右侧 AI 回复（带虚线连接对应弹幕）
- 生成完成自动保存历史记录
- 支持导出 AI 话术（TXT文件），便于每周复盘

### 🌙 暗黑霓虹 UI
- 纯黑底色 + 霓虹 Lime 绿色主色调
- 玻璃态卡片设计（`backdrop-filter: blur(16px)`）
- 网格 + 噪点背景
- Space Grotesk + JetBrains Mono 字体

### 🔧 管理后台（Web）
- 管理员/运营商多角色管理
- 直播间统一配置（人设、提示词、AI 参数）
- 实时查看直播间状态（在线/离线/异常）
- 运营人员管理

## 技术栈

| 模块 | 技术 |
|------|------|
| 桌面端 | Electron + React + TypeScript |
| 管理后台前端 | React + Vite + Tailwind CSS |
| 后端 API | Express + SQLite (sql.js) |
| 弹幕采集 | Playwright (Edge) |
| AI | DeepSeek API (OpenAI 兼容) |
| 样式 | Tailwind CSS + 自定义 glassmorphism |

## 快速开始

### 前置要求
- Windows 10/11（需要 Edge 浏览器）
- Node.js 18+
- DeepSeek API Key（在 [platform.deepseek.com](https://platform.deepseek.com) 获取）

### 安装运行

```bash
# 克隆项目
git clone https://github.com/woyexiangguolikai/douyin-ai-assistant.git
cd douyin-ai-assistant

# 安装依赖
npm install

# 启动桌面应用
npm run build
npx electron .
```

启动后点击 **「本地使用（无需服务器）」** 即可进入主界面。

### 配置 AI

进入 **「设置」** 面板，填入你的 DeepSeek API Key，保存后连接直播间即可使用。

## 项目结构

```
douyin-ai-assistant/
├── electron/                          # Electron 主进程
│   ├── main.ts                        # 主进程入口
│   ├── preload.ts                     # 预加载脚本（IPC 桥接）
│   ├── capture/                       # 弹幕采集模块
│   │   ├── index.ts                   # 采集管理器
│   │   ├── playwright-capture.ts      # Playwright 浏览器方案
│   │   ├── websocket-capture.ts       # WebSocket 方案（备用）
│   │   └── filters/index.ts           # 过滤链
│   ├── ai/                            # AI 处理
│   │   ├── index.ts                   # DeepSeek API 服务
│   │   └── prompt-templates.ts        # 提示词模板
│   ├── store/index.ts                 # 本地数据库 (sql.js)
│   └── config/default-settings.ts     # 默认配置
├── src/                               # React 前端
│   ├── App.tsx                        # 主应用
│   ├── LoginPage.tsx                  # 登录页
│   └── components/
│       ├── LiveFeed.tsx               # 直播视图（左右分栏）
│       ├── ConnectionBar.tsx          # 连接栏
│       ├── TitleBar.tsx               # 自定义标题栏
│       ├── DanmakuFeed.tsx            # 弹幕列表
│       ├── AIPanel.tsx                # AI 建议面板
│       ├── SettingsPanel.tsx          # 设置面板
│       ├── PersonaConfigPanel.tsx     # 人设配置
│       └── FilterConfigPanel.tsx      # 过滤规则配置
├── admin-server/                      # 管理后台 API
│   └── src/
│       ├── index.ts                   # Express 服务
│       ├── db.ts                      # 数据库
│       ├── routes/auth.ts             # 登录认证
│       ├── routes/rooms.ts            # 直播间 CRUD
│       └── routes/users.ts            # 用户管理
├── admin-web/                         # 管理后台前端
│   └── src/pages/
│       ├── Login.tsx                  # 登录页
│       ├── Dashboard.tsx              # 直播间列表
│       ├── RoomDetail.tsx             # 直播间配置
│       └── Users.tsx                  # 运营管理
└── package.json
```

## 使用场景

### 电台/聊天主播
AI 能识别弹幕中的故事请求，自动生成完整的灵异/趣事故事，主播可以直接朗读，不用自己准备素材。

### 才艺主播
观众点歌、夸赞时，AI 生成自然互动话术，保持直播间气氛活跃。

### 多人协作
通过管理后台，管理员可以为多个主播配置不同的人设和 AI 参数，运营人员可以管理分配的直播间。

## License

MIT