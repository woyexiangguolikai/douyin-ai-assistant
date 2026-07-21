# 抖音AI直播助手

一款专为抖音娱乐主播设计的 **弹幕抓取 + AI 智能提词** 桌面工具 + 管理后台。

支持**本地独立运行**（Electron 桌面端）和**服务器集中管理**（PHP + MySQL 5.7）两种模式。

## 功能特性

### 弹幕实时采集
- 通过 Playwright 浏览器自动化抓取抖音直播间弹幕
- 支持 WebSocket 直连方案（备用）
- 智能过滤：纯表情、重复刷屏、广告关键词等
- 弹幕去重，不重复抓取同一条

### AI 智能回复
- 基于 DeepSeek API 实时生成回复话术
- **打字机逐字显示**，主播可边看边用
- 智能识别弹幕类型：提问/聊天 → 简短自然回答；要故事/灵异事件 → 生成故事情节
- 支持主播人设配置（性格、语气、风格、口头禅等）

### 左右分栏直播视图
- 左侧实时弹幕流，右侧 AI 回复，虚线连接对应弹幕
- 生成完成自动保存历史记录
- 支持导出 AI 话术（TXT文件），便于每周复盘

### 管理后台（Web）
- 管理员/运营商多角色管理
- 直播间统一配置（人设、提示词、AI 参数）
- 实时查看直播间状态（在线/离线/异常）

## 架构概览

### 本地模式（Electron 桌面端）
Electron 主进程 → CaptureManager（Playwright） + AIService（DeepSeek API） + Store（SQLite）
                  ↕ IPC 桥接
                  React 前端（左右分栏直播视图）

### 服务器模式（PHP + MySQL 5.7）
桌面端 / 浏览器 → Nginx → 静态文件（admin-web/dist）
                              ↕ /api/*
                              PHP-FPM（PHP 后端） → MySQL 5.7
                              JWT 认证 / 直播间 CRUD / 人设配置 / AI 设置 / 用户管理

可选：Node.js 采集守护进程（capture-worker/）用于服务器端弹幕采集

## 技术栈

| 模块 | 本地模式 | 服务器模式 |
|------|---------|-----------|
| 桌面端 | Electron + React + TypeScript | 同左（可选） |
| 后端 API | Node.js (Express) | PHP 7.4+ |
| 数据库 | SQLite (sql.js) | MySQL 5.7 |
| 认证 | 无（本地模式） | JWT（纯 PHP 实现） |
| 管理前端 | 无 | React + Vite + Tailwind |
| 弹幕采集 | Playwright (Edge) | Playwright（服务端/客户端） |

## 快速开始

### 本地桌面模式

**前置要求**：Windows 10/11、Node.js 18+、DeepSeek API Key

```bash
git clone https://github.com/woyexiangguolikai/douyin-ai-assistant.git
cd douyin-ai-assistant
npm install
npx playwright install chromium
npm run build
npx electron dist-electron/main.js
```

启动后点击 **「本地使用（无需服务器）」** 进入主界面。在 **「设置」** 中填入 DeepSeek API Key 后连接直播间即可。

### 服务器 PHP 模式（宝塔面板）

**前置要求**：宝塔面板（Nginx + PHP 7.4+ + MySQL 5.7）

```bash
# 1. 克隆项目
cd /www/wwwroot
git clone https://github.com/woyexiangguolikai/douyin-ai-assistant.git

# 2. 导入数据库
mysql -u root -p douyin_ai < server/schema.sql

# 3. 配置 PHP 后端
cd douyin-ai-assistant/server
cp .env.example .env
# 编辑 .env，填入数据库连接信息

# 4. 构建管理前端
cd ../admin-web
npm install && npx vite build

# 5. 配置 Nginx（参考 server/nginx-baota.conf）
```

默认管理员账号：`admin` / `admin123`

## 项目结构

```
douyin-ai-assistant/
├── electron/          # Electron 主进程（本地桌面端）
├── src/               # React 前端（桌面端 UI）
├── server/            # PHP 后端 API（服务器模式）
├── admin-web/         # 管理后台前端（服务器模式）
├── capture-worker/    # Node.js 弹幕采集守护进程（可选）
├── docs/              # 项目文档
│   ├── 01-PRD.md      # 产品需求文档
│   ├── 02-design.md   # 设计文档
│   ├── 03-development.md # 开发文档
│   └── 04-changelog.md # 更新日志
└── data/              # 本地数据库文件
```

## License

MIT