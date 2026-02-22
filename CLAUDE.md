# 印刷施工单跟踪系统

> Vue 3 + Django REST Framework 的印刷施工单跟踪管理系统（Web/桌面/Android 共用一套 Web 业务代码）

## Quick Facts

- **Stack**: Vue 3（Vite + TypeScript + Pinia + Element Plus + Vue Router 4）、Django 4.2、DRF 3.14
- **Web Dev**: `npm run web:dev`
- **Web Build**: `npm run web:build`
- **Backend Dev**: `cd backend && python manage.py runserver`
- **Desktop Dev (Tauri)**: `npm run desktop:dev`
- **Android Build (Capacitor)**: `npm run android:build`

## Key Directories

### Web (`apps/web/`)

- `src/main.ts` - 应用入口（`createApp` + Pinia + Router + Element Plus）
- `src/router/` - 路由与鉴权拦截
- `src/stores/` - Pinia 状态管理
- `src/views/` - 页面
- `src/lib/http.ts` / `src/utils/runtimeConfig.ts` - API/WS 地址与运行时配置

### Backend (`backend/`)

- `config/` - Django 配置
- `workorder/` - 施工单应用（主要业务逻辑）
- `entrypoint.sh` - 容器启动脚本（迁移、初始化数据、collectstatic）

## Env / Runtime Config

- 运行时配置存储：`localStorage["workorder.runtimeConfig"]`（登录页底部「服务器设置」）
- 可选环境变量：
  - `VITE_API_BASE_URL`（示例：`http://127.0.0.1:8000/api`）
  - `VITE_WS_BASE_URL`（示例：`ws://127.0.0.1:8001`）
