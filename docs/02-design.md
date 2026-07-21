# 设计文档

## 1. 架构设计

### 1.1 系统架构

`
+---------------------------------------------------+
|                  桌面端 (Electron + React)          |
|  +------------------+  +------------------------+  |
|  | 主进程 (main.ts)   |  | 渲染进程 (React SPA)  |  |
|  | - CaptureManager  |  | - 直播视图 (LiveFeed)   |  |
|  | - AIService       |  | - 人设配置 (PersonaConfig)|  |
|  | - Store (sql.js)  |  | - 过滤规则 (FilterConfig)|  |
|  | - IPC Handlers    |  | - 设置 (Settings)          |  |
|  +--------+----------+  +--------+---------------+  |
|           |                       |                 |
|           +--------IPC------------+                 |
+---------------------------------------------------+
|  弹幕采集模块                      |
|  +------------------+  +------------------+        |
|  | Playwright方案  |  | WebSocket备用  |        |
|  +------------------+  +------------------+        |
+---------------------------------------------------+
|  管理后台 (Express + React)                 |
|  +------------------+  +------------------+        |
|  | admin-server     |  | admin-web        |        |
|  | - JWT 认证      |  | - 登录页        |        |
|  | - 直播间 CRUD |  | - 直播间列表   |        |
|  | - 用户管理   |  | - 直播间配置   |        |
|  +------------------+  +------------------+        |
+---------------------------------------------------+
`

### 1.2 数据流

`
直播间弹幕
  ↓ Playwright/WebSocket 采集
CaptureManager.过滤链
  ↓ 有效弹幕
IPC → 渲染进程显示弹幕
  ↓ 防抖 1.5s
processAIBatch()
  ↓ 获取人设、上下文
DeepSeek API 非流式调用
  ↓ 完整回复（单次返回）
emit('reply-start') → IPC → 前端「AI正在思考」动画
emit('reply-stream', done:true) → IPC → 前端淡入动画展示完整文本
`

### 1.3 IPC 通道

| 通道名 | 方向 | 用途 |
|--------|------|------|
| danmaku-received | 主进程→渲染进程 | 推送单条弹幕 |
| connection-status | 主进程→渲染进程 | 连接状态变更 |
| i-reply-start | 主进程→渲染进程 | AI开始生成（触发思考动画） |
| i-reply-stream | 主进程→渲染进程 | AI生成完成（done:true） |
| i-reply-generated | 主进程→渲染进程 | 历史回复数据 |
| capture-error | 主进程→渲染进程 | 采集异常 |

## 2. UI/UX 设计

### 2.1 色彩系统
- 主背景：#000000（纯黑）
- 表面色：#0c0c0c（观音石）
- 主色：#ccff00（银晶绿）
- 副色：#10b981（翡翠光辉）
- 主文字：#ebebeb
- 副文字：rgba(255,255,255,0.6)
- 禁用文字：rgba(255,255,255,0.3)

### 2.2 字体
- 标题：'Space Grotesk'（weight 300-700，tracking -0.06em）
- 正文：'Space Grotesk'（weight 400）
- 技术标签：'JetBrains Mono'（大写，间距拉开）

### 2.3 玻璃态规范
- 背景：rgba(255,255,255,0.03)
- 模糊：backdrop-filter: blur(16px)
- 边框：1px solid rgba(255,255,255,0.1)

### 2.4 动画效果

| 元素 | 动画 | 时长 | 曲线 |
|------|------|------|------|
| AI思考中指示器 | 三个圆点上下弹跳（stagger 150ms） | 持续 | ease-in-out |
| AI回复卡片 | 自下而上淡入（opacity 0→1, translateY 8→0） | 0.4s | ease-out |
| 弹幕进入 | 自上而下淡入（opacity 0→1, translateY -10→0） | 0.3s | ease-out |

### 2.5 布局结构
- **顶部**：自定义标题栏 + 连接状态栏
- **导航**：直播 / 人设 / 过滤 / 设置（底部标签栏）
- **主内容**：根据选中标签显示对应面板
- **直播视图**：左右分栏，左侧弹幕列表右侧 AI 回复，虚线连接

### 2.6 滚动行为
- 弹幕列表：倒序展示（最新在上），自动滚动至顶部
- AI回复面板：正序展示（最新在下），自动滚动至底部（scrollTop = scrollHeight）

## 3. 数据库设计

本地数据库：sql.js（SQLite浏览器实现）
路径：dmin-server/data.db（管理后台）/ Electron store 模块管理（桌面端本地）

### 表结构
- settings（key TEXT PK, value TEXT）— 应用设置
- personas（id TEXT PK, name TEXT, data TEXT, created_at, updated_at）— 人设配置
- ilter_rules（id TEXT PK, data TEXT）— 过滤规则
- danmaku_log — 弹幕日志（历史复盘用）
- i_replies — AI 回复日志（历史复盘用）
- users（管理后台）— 用户账号
- ooms（管理后台）— 直播间配置
- i_settings（管理后台）— AI参数配置