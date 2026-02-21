# Desktop Client（Tauri）- macOS / Windows

本应用用于把仓库现有的 `frontend/`（Vue SPA）打包为桌面客户端。

## 开发（推荐）

1) 启动后端（任选一种方式）
- 本地运行 Django：`cd backend && python manage.py runserver`
- 或使用 Docker Compose（如你项目已配置好）

2) 启动前端 dev server

```bash
cd frontend
npm install
npm run serve
```

3) 启动 Tauri（加载 `http://localhost:8080`）

```bash
cd apps/desktop
npm install
npm run tauri:dev
```

首次进入桌面客户端后，在登录页底部点击「服务器设置」，配置：
- `API Base URL`：例如 `http://127.0.0.1:8000/api`
- `WS Base URL`：例如 `ws://127.0.0.1:8001`（如你单独启用了 ASGI/WS）

## 打包

```bash
cd frontend
npm run build

cd ../apps/desktop
npm run tauri:build
```

## 说明

- Tauri 默认在开发期加载 `http://localhost:8080`，打包期加载 `frontend/dist`。
- 桌面端通常是跨域运行，务必保证后端 `CORS_ALLOWED_ORIGINS` 包含常见 Tauri origin（开发环境已默认加入）。

