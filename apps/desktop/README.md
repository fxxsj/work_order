# Desktop Client（Tauri）- macOS / Windows

本应用用于把仓库现有的 `apps/web/`（Vue 3 + Vite SPA）打包为桌面客户端。

## 开发（推荐）

1) 启动后端（任选一种方式）
- 本地运行 Django：`cd backend && python manage.py runserver`
- 或使用 Docker Compose（如你项目已配置好）

2) 启动 Tauri（加载 `http://localhost:5173`）

```bash
cd /path/to/work_order
npm install
npm run desktop:dev
```

> `desktop:dev` 会先启动 `apps/web` 的 dev server（见 `apps/desktop/src-tauri/tauri.conf.json` 的 `beforeDevCommand`）。

首次进入桌面客户端后，在登录页底部点击「服务器设置」，配置：
- `API Base URL`：例如 `http://127.0.0.1:8000/api`
- `WS Base URL`：例如 `ws://127.0.0.1:8001`（如你单独启用了 ASGI/WS）

## 打包

```bash
cd /path/to/work_order
npm install
npm run desktop:build
```

## 说明

- Tauri 默认在开发期加载 `http://localhost:5173`，打包期加载 `apps/web/dist`。
- 打包期默认使用 `hash` 路由（避免 `file://` 场景下刷新/深链路 404），见 `apps/desktop/src-tauri/tauri.conf.json` 的 `beforeBuildCommand`。
- 桌面端通常是跨域运行，务必保证后端 `CORS_ALLOWED_ORIGINS` 包含常见 Tauri origin（开发环境已默认加入）。
