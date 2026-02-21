# Phase 1 启动指南：桌面（Tauri）与 Android（Capacitor）

> 更新时间：2026-02-21  
> 目标：在不大重构的前提下，把现有 Web 前端“壳化”成可安装客户端，用于内测与早期交付。

## 0. 前置（必须完成）

1. Phase 0 已完成（本仓库已支持运行时配置 `API/WS`，并提供 OpenAPI 导出脚本）。
2. 后端允许跨域（生产环境请配置 `CORS_ALLOWED_ORIGINS`；开发环境已加入常见 Tauri/Capacitor origin）。
3. 明确服务端地址策略：
   - 内网部署：客户端需支持“服务器地址切换”
   - 公网部署：固定域名 + HTTPS

## 1. 桌面端（macOS / Windows）：Tauri 壳

### 1.1 建议的开发模式

- **开发期**：Tauri 直接加载 `http://localhost:8080`（运行现有 `frontend` 的 dev server）
- **打包期**：Tauri 使用 `frontend` 构建产物（`frontend/dist`）
- **环境切换**：通过登录页「服务器设置」配置 `API Base URL / WS Base URL`

代码位置：`apps/desktop/`

### 1.1.1 实际运行命令（最短路径）

```bash
# 1) 后端
cd backend
python manage.py runserver

# 2) 前端（Vue2）
cd ../frontend
npm install
npm run serve

# 3) 桌面壳
cd ../apps/desktop
npm install
npm run tauri:dev
```

### 1.2 本地工具链

- Node.js（与当前前端一致）
- Rust toolchain（Tauri 需要）
- 平台签名/打包工具（正式发布时再补齐）

### 1.3 最小验收（桌面 MVP）

- 登录/登出、token 过期跳转
- 施工单列表/详情/关键操作
- 任务操作（认领/开始/完成）
- 通知（WebSocket 可连接，断线重连）

## 2. Android：Capacitor 壳

### 2.1 建议的开发模式

- **开发期**：Capacitor 使用本地 Web 资源（从 `frontend` 构建后拷贝/同步）或指向 dev server（按工具链选择）
- **打包期**：使用 Web 构建产物
- **环境切换**：通过登录页「服务器设置」配置 `API Base URL / WS Base URL`

代码位置：`apps/mobile/`

### 2.1.1 实际运行命令（最短路径）

```bash
# 1) 构建前端（Vue2）
cd frontend
npm install
npm run build

# 2) 初始化与生成 Android 工程（首次）
cd ../apps/mobile
npm install
npm run cap:init
npm run cap:add:android

# 3) 同步资源并打开 Android Studio
npm run cap:sync
npm run android:open
```

### 2.2 本地工具链

- Node.js
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
