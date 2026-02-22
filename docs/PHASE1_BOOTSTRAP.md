# Phase 1 启动指南：桌面（Tauri）与 Android（Capacitor）

> 更新时间：2026-02-22  
> 目标：在不大重构的前提下，把现有 Web 前端“壳化”成可安装客户端，用于内测与早期交付。

## 0. 前置（必须完成）

1. Phase 0 已完成（本仓库已支持运行时配置 `API/WS`，并提供 OpenAPI 导出脚本）。
2. 后端允许跨域（生产环境请配置 `CORS_ALLOWED_ORIGINS`；开发环境已加入常见 Tauri/Capacitor origin）。
3. 明确服务端地址策略：
   - 内网部署：客户端需支持“服务器地址切换”
   - 公网部署：固定域名 + HTTPS

## 1. 桌面端（macOS / Windows）：Tauri 壳

### 1.1 建议的开发模式

- **开发期**：Tauri 直接加载 `http://localhost:5173`（自动启动 `apps/web` dev server）
- **打包期**：Tauri 使用 `apps/web` 构建产物（`apps/web/dist`）
- **环境切换**：通过登录页「服务器设置」配置 `API Base URL / WS Base URL`

代码位置：`apps/desktop/`

### 1.1.1 实际运行命令（最短路径）

```bash
# 1) 后端（另开终端）
cd backend
python manage.py runserver

# 2) 桌面壳（会自动启动 apps/web 的 dev server）
cd /path/to/work_order
npm install
npm run desktop:dev
```

### 1.2 本地工具链

- Node.js 18+
- Rust toolchain（Tauri 需要）
- 平台签名/打包工具（正式发布时再补齐）

### 1.3 最小验收（桌面 MVP）

- 登录/登出、token 过期跳转
- 施工单列表/详情/关键操作
- 任务操作（认领/开始/完成）
- 通知（WebSocket 可连接，断线重连）

## 2. Android：Capacitor 壳

### 2.1 建议的开发模式

- **开发期**：
  - 方式 A（推荐，稳定）：构建 Web → 同步到 `apps/mobile/www` → Android Studio 运行
  - 方式 B（更快迭代）：`CAP_SERVER_URL` 指向 Vite dev server（Live Reload）
- **打包期**：使用 Web 构建产物
- **环境切换**：通过登录页「服务器设置」配置 `API Base URL / WS Base URL`

代码位置：`apps/mobile/`

### 2.1.1 实际运行命令（最短路径）

```bash
# 1) 安装依赖（根目录）
cd /path/to/work_order
npm install

# 2) 初始化与生成 Android 工程（首次）
npm run android:init

# 3) 构建 Web 并同步到 Android 工程
npm run android:build

# 4) 打开 Android Studio
npm run android:open
```

#### 可选：Live Reload（dev server 模式）

```bash
# 1) 启动 Web dev server
cd /path/to/work_order
npm run web:dev

# 2) 设置 dev server 地址并同步（Android 模拟器访问宿主机用 10.0.2.2）
export CAP_SERVER_URL="http://10.0.2.2:5173"
npm run android:sync
```

### 2.2 本地工具链

- Node.js 18+
- Android Studio + Android SDK

### 2.3 最小验收（Android MVP）

- 登录/登出、token 过期跳转
- 触控可用（列表/详情/弹窗不溢出）
- 文件上传（如业务需要）
- 通知（WebSocket 可连接，断线重连）

## 3. 实施建议（先做什么）

优先顺序建议：

1. 先做 **Tauri 桌面壳**（依赖更少、调试更快）
2. 再做 **Capacitor Android 壳**（补齐权限/文件能力）
3. 两端都稳定后，再进入 Phase 2（Vue 3/Vite/TS 迁移）
