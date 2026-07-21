# 开发文档

## 1. 技术栈

| 层 | 技术 |
|------|----------|
| 桌面框架 | Electron 33 + React 18 |
| 前端构建 | Vite 6 + TypeScript 5.7 |
| 样式 | Tailwind CSS 3 + 自定义 CSS（动画/玻璃态） |
| 弹幕采集 | Playwright 1.49（Edge） |
| AI | DeepSeek API（OpenAI SDK，非流式调用） |
| 本地数据库 | sql.js 1.11 |
| 管理后台前端 | React + Vite + Tailwind |
| 管理后台后端 | Express + sql.js + JWT |
| 图标 | lucide-react |

## 2. 项目结构

`
douyin-ai-assistant/
├── electron/                        # Electron 主进程 (TypeScript)
│   ├── main.ts                      # 主进程入口，IPC 处理器
│   ├── preload.ts                   # 预加载脚本，暴露安全 API
│   ├── capture/                     # 弹幕采集模块
│   │   ├── index.ts                 # 采集管理器
│   │   ├── playwright-capture.ts     # Playwright 方案
│   │   ├── websocket-capture.ts      # WebSocket 备用方案
│   │   └── filters/index.ts          # 过滤链
│   ├── ai/                          # AI 处理模块
│   │   ├── index.ts                 # DeepSeek API 服务（非流式）
│   │   └── prompt-templates.ts       # 提示词模板
│   ├── store/index.ts               # 本地数据库
│   ├── config/default-settings.ts    # 默认配置、过滤规则、人设模板
│   └── types.ts                     # TypeScript 类型定义
├── src/                             # React 前端（渲染进程）
│   ├── App.tsx                      # 主应用，状态管理
│   ├── LoginPage.tsx                # 登录页
│   ├── types.ts                     # 前端类型定义
│   └── components/
│       ├── AIPanel.tsx              # AI 回复面板（淡入动画 + 自动滚动到底部）
│       ├── DanmakuFeed.tsx          # 弹幕列表（倒序展示）
│       ├── LiveFeed.tsx             # 直播视图（左右分栏）
│       ├── ConnectionBar.tsx        # 连接状态栏
│       ├── TitleBar.tsx             # 自定义标题栏
│       ├── SettingsPanel.tsx        # 设置面板
│       ├── PersonaConfigPanel.tsx   # 人设配置
│       └── FilterConfigPanel.tsx    # 过滤规则
├── admin-server/                    # 管理后台 API
│   └── src/
│       ├── index.ts                 # Express 服务（端口3001）
│       ├── db.ts                    # SQLite 数据库
│       ├── seed.ts                  # 种子数据（admin/admin123, operator1/123456）
│       └── routes/
│           ├── auth.ts              # JWT 登录认证
│           ├── rooms.ts             # 直播间 CRUD + 心跳
│           └── users.ts             # 用户管理
├── admin-web/                       # 管理后台前端
│   └── src/
│       ├── App.tsx                  # 路由 + ProtectedRoute
│       ├── lib/api.ts               # API 封装
│       └── pages/
│           ├── Login.tsx            # 登录页
│           ├── Layout.tsx           # 管理后台布局
│           ├── Dashboard.tsx        # 直播间列表
│           ├── RoomDetail.tsx       # 直播间详情（人设+AI配置）
│           └── Users.tsx            # 运营人员管理
├── docs/                            # 项目文档
│   ├── 01-PRD.md                    # 产品需求文档
│   ├── 02-design.md                 # 设计文档
│   ├── 03-development.md            # 开发文档
│   └── 04-changelog.md              # 更新日志
├── dist/                            # Vite 构建输出（渲染进程）
├── dist-electron/                   # TypeScript 编译输出（主进程）
├── package.json
├── vite.config.ts                   # 端口5173
├── tsconfig.json / tsconfig.electron.json
└── electron-builder.yml             # 打包配置
`

## 3. 启动方式

### 桌面应用
`ash
npm install                             # 安装依赖
="https://npmmirror.com/mirrors/electron/"  # 国内镜像
npm run build:renderer                  # 构建渲染进程
npm run build:electron                  # 编译主进程
npx electron dist-electron/main.js      # 启动
`

### 管理后台
`ash
cd admin-server && npm install && npm run seed && npm run dev  # API（3001）
cd admin-web && npm install && npm run dev                     # 前端（3333）
`

## 4. 开发注意事项

### 4.1 AI 模块
- DeepSeek API 使用非流式调用（stream: false），完整回复一次性返回
- 回复生成前通过 eply-start IPC 事件通知前端展示「AI正在思考」动画
- 前端使用 CSS @keyframes fade-in（0.4s ease-out）展示完整回复

### 4.2 弹幕采集
- Playwright 通过注入 JS 脚本劫持 WebSocket 消息
- 弹幕数据使用 Protobuf 解码
- 过滤链：最短字数 → 纯表情检测 → 重复刷屏检测 → 广告关键词

### 4.3 数据库
- 管理后台种子数据：dmin/admin123（管理员）、operator1/123456（运营）
- 桌面端本地数据库由 electron/store 模块管理，自动建表

### 4.4 打包
- Windows 平台使用 electron-builder --win
- 打包前需确保 dist/ 和 dist-electron/ 均已构建