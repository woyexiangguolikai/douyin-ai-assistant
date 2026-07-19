# 开发文档

## 1. 技术栈

| 层 | 技术 |
|------|----------|
| 桌面框架 | Electron 33 + React 18 |
| 前端构建 | Vite 6 + TypeScript 5.7 |
| 样式 | Tailwind CSS 3 + 自定义 CSS |
| 弹幕采集 | Playwright 1.49 (Edge) |
| AI | DeepSeek API (OpenAI SDK) |
| 本地数据库 | sql.js 1.11 |
| 管理后台前端 | React + Vite + Tailwind |
| 管理后台后端 | Express + sql.js + JWT |
| 图标 | lucide-react |

## 2. 项目结构

```
douyin-ai-assistant/
├── electron/                    # Electron 主进程 (TypeScript)
│   ├── main.ts                # 主进程入口，IPC 处理器
│   ├── preload.ts             # 预加载脚本，暴露安全 API
│   ├── capture/               # 弹幕采集模块
│   │   ├── index.ts           # 采集管理器
│   │   ├── playwright-capture  # Playwright 方案
│   │   ├── websocket-capture   # WebSocket 备用方案
│   │   └── filters/index.ts    # 过滤链
│   ├── ai/                   # AI 处理模块
│   │   ├── index.ts           # DeepSeek API 服务
│   │   └── prompt-templates   # 提示词模板
│   ├── store/index.ts          # 本地数据库
│   ├── config/default-settings # 默认配置、过滤规则、人设模板
│   └── types.ts               # TypeScript 类型定义
├── src/                        # React 前端
│   ├── App.tsx                # 主应用，状态管理
│   ├── LoginPage.tsx           # 登录页
│   └── components/
│       ├── LiveFeed.tsx           # 直播视图（左右分栏）
│       ├── ConnectionBar.tsx      # 连接状态栏
│       ├── TitleBar.tsx            # 自定义标题栏
│       ├── SettingsPanel.tsx       # 设置面板
│       ├── PersonaConfigPanel.tsx  # 人设配置
│       ├── FilterConfigPanel.tsx   # 过滤规则
│       └── AIPanel.tsx             # AI 建议面板（已移除导航）
├── admin-server/               # 管理后台 API
├── admin-web/                  # 管理后台前端
├── docs/                       # 项目文档
├── data/                       # 本地数据库文件
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.electron.json
└── electron-builder.yml          # 打包配置
