# Web vNext（Vue 3 + Vite + TypeScript）

该目录用于逐步替换现有 `frontend/`（Vue 2.7 + Vue CLI），采用“绞杀者模式”迁移：

- 新功能/新页面优先在 `apps/web` 开发
- 旧页面按模块逐步迁移
- 迁移完成后再下线 `frontend/`

## 开发

```bash
cd apps/web
npm install
npm run dev
```

默认：
- Web：`http://localhost:5173`
- API 代理：`/api` -> `http://127.0.0.1:8000`（见 `vite.config.ts`）

首次进入后可在登录页设置服务器地址（运行时配置）。

可选：使用环境变量固定 API 地址

```bash
cp .env.example .env
```

### 路由模式（桌面/移动端打包建议）

默认使用 HTML5 history 路由（适合 Web 部署）。在 Tauri/Capacitor 的构建产物场景（`file://` 或静态资源目录）建议使用 hash 路由：

```bash
VITE_ROUTER_MODE=hash
```
